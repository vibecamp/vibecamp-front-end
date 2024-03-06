import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { stripe } from '../../utils/stripe.ts'
import {
  accountReferralStatus,
  withDBConnection,
  withDBTransaction,
} from '../../utils/db.ts'
import { exists, objectEntries, objectFromEntries, purchaseBreakdown, sum } from '../../utils/misc.ts'
import { TABLE_ROWS, Tables } from "../../types/db-types.ts"
import { Purchases } from '../../types/route-types.ts'
import { PURCHASE_TYPES_BY_TYPE } from '../../types/misc.ts'
import { sendMail, receiptEmail } from '../../utils/mailgun.ts'
import env from '../../env.ts'

export default function register(router: Router) {
  defineRoute(router, {
    endpoint: '/purchase/create-attendees',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { attendees, festival_id } }) => {
      await withDBTransaction(async db => {
        for (const attendee of attendees) {
          await db.insertTable('attendee', {
            ...attendee,
            festival_id,
            associated_account_id: account_id,
          })
        }
      })

      return [null, Status.OK]
    }
  })

  defineRoute(router, {
    endpoint: '/purchase/create-intent',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { purchases, discount_codes } }) => {
      const { allowedToPurchase } = await withDBConnection(db => accountReferralStatus(db, account_id))
      if (!allowedToPurchase) {
        return [null, Status.Unauthorized]
      }

      const alreadyPurchased = await withDBConnection(async db =>
        (await db.queryObject<{ purchase_type_id: Tables['purchase_type']['purchase_type_id'], count: bigint }>`
          SELECT purchase.purchase_type_id, COUNT(*)
          FROM purchase, purchase_type
          WHERE purchase_type.purchase_type_id = purchase.purchase_type_id AND purchase.owned_by_account_id = ${account_id}
          group by purchase.purchase_type_id
        `).rows.map(row => ({
          ...row,
          // `count` comes back from the client as a BigInt, which causes problems if not converted
          count: Number(row.count)
        })))

      for (const [purchaseTypeId, toPurchaseCount] of objectEntries(purchases)) {
        const purchaseType = PURCHASE_TYPES_BY_TYPE[purchaseTypeId]
        if (purchaseType == null) {
          throw Error(`Can't create purchase intent with invalid purchase type: ${purchaseTypeId}`)
        }

        const { festival_id, max_available, max_per_account } = purchaseType
        const festival = TABLE_ROWS.festival.find(f => f.festival_id === festival_id)!

        // if festival is in the past, don't allow purchases
        if (new Date(festival.start_date).valueOf() < Date.now()) {
          return [null, Status.Unauthorized]
        }

        // if festival hasn't started sales, don't allow purchases
        if (!festival.sales_are_open) {
          return [null, Status.Unauthorized]
        }

        const allPurchased = await withDBConnection(async db => Number(
          (await db.queryObject<{ count: bigint }>`SELECT COUNT(*) FROM purchase WHERE purchase_type_id = ${purchaseTypeId}`).rows[0]!.count
        ))
        if (max_available != null && allPurchased + toPurchaseCount! > max_available) {
          throw [null, Status.Unauthorized]
        }

        const alreadyPurchasedCount = alreadyPurchased.find(p => p.purchase_type_id === purchaseTypeId)?.count ?? 0

        if (max_per_account != null && alreadyPurchasedCount + toPurchaseCount! > max_per_account) {
          return [null, Status.Unauthorized]
        }
      }

      const discounts = Array.from(new Set(discount_codes.map(c => c.toLocaleUpperCase()))).map(code => TABLE_ROWS.discount.filter(d => d.discount_code.toLocaleUpperCase() === code)).flat()

      const sanitizedPurchases = objectFromEntries(objectEntries(purchases).map(
        ([purchaseType, count]) => {
          const nonNullCount = count ?? 0
          const nonNegativeCount = Math.max(nonNullCount, 0)
          const integerCount = Math.floor(nonNegativeCount)
          return [purchaseType, integerCount]
        }))

      const purchaseInfo = purchaseBreakdown(sanitizedPurchases, discounts)

      const amount = purchaseInfo
        .map(({ discountedPrice }) => discountedPrice)
        .reduce(sum, 0)

      const metadata: PurchaseMetadata = {
        accountId: account_id,
        discount_ids: discounts.map(d => d.discount_id).join(','),
        ...objectFromEntries(objectEntries(sanitizedPurchases).map(([key, value]) => [key, String(value)]))
      }

      const { client_secret } = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata
      })

      if (client_secret == null) {
        return [null, Status.InternalServerError]
      }

      return [{ stripe_client_secret: client_secret }, Status.OK]
    },
  })

  type PurchaseMetadata =
    & { accountId: string, discount_ids?: string }
    & Record<(typeof TABLE_ROWS)['purchase_type'][number]['purchase_type_id'], string> // stripe converts numbers to strings for some reason

  router.post('/purchase/record', async ctx => {
    const rawBody = await ctx.request.body({ type: 'bytes' }).value
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      ctx.request.headers.get('stripe-signature'),
      env.STRIPE_SIGNING_SECRET
    )

    switch (event.type) {
      case 'charge.succeeded': {
        console.info(`\tHandled Stripe event type ${event.type}`);

        const { accountId, discount_ids, ...purchasesRaw } = event.data.object.metadata as PurchaseMetadata

        const purchases: Purchases = objectFromEntries(objectEntries(purchasesRaw)
          .map(([key, value]) => [key, Number(value)])) // convert counts back to numbers

        const stripe_payment_intent = (
          typeof event.data.object.payment_intent === 'object'
            ? event.data.object.payment_intent?.id
            : event.data.object.payment_intent
        )

        await withDBTransaction(async (db) => {
          for (const [purchaseType, count] of objectEntries(purchases)) {
            for (let i = 0; i < count!; i++) {
              await db.insertTable('purchase', {
                owned_by_account_id: accountId ?? null,
                purchase_type_id: purchaseType,
                stripe_payment_intent
              })
            }
          }

          const account = (await db.queryTable('account', { where: ['account_id', '=', accountId] }))[0]!

          const discountsArray = discount_ids?.split(',').map(id => TABLE_ROWS.discount.find(d => d.discount_id === id)).filter(exists) ?? []
          await sendMail(receiptEmail(account, purchases, discountsArray))
        })

        ctx.response.status = Status.OK
      } break;
      default: {
        console.warn(`\tUnhandled Stripe event type ${event.type}`)
        ctx.response.status = Status.BadRequest
      }
    }
  })
}
