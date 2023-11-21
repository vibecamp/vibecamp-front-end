/**
 * NOTE: This file is generated automatically by generate-db-types.ts, it
 * should not be modified manually!
 */
        
export type Tables = {
  account: {
    account_id: string,
    account_notes: string,
    email_address: string,
    is_application_accepted: boolean | null,
    is_seed_account: boolean,
    password_hash: string | null,
    password_salt: string | null,
  },
  attendee: {
    age: number | null,
    associated_account_id: Tables['account']['account_id'],
    attendee_id: string,
    diet: Tables['diet']['diet_id'] | null,
    discord_handle: string | null,
    festival_id: Tables['festival']['festival_id'],
    has_allergy_eggs: boolean | null,
    has_allergy_fish: boolean | null,
    has_allergy_milk: boolean | null,
    has_allergy_peanuts: boolean | null,
    has_allergy_shellfish: boolean | null,
    has_allergy_soy: boolean | null,
    has_allergy_tree_nuts: boolean | null,
    has_allergy_wheat: boolean | null,
    interested_in_pre_call: boolean,
    interested_in_volunteering_as: Tables['volunteer_type']['volunteer_type_id'] | null,
    is_primary_for_account: boolean,
    medical_training: string | null,
    name: string,
    notes: string,
    planning_to_camp: boolean,
    twitter_handle: string | null,
  },
  diet: (typeof TABLE_ROWS)['diet'][number]
  event: {
    created_by_account_id: Tables['account']['account_id'],
    description: string,
    end: unknown | null,
    event_id: string,
    location: string | null,
    name: string,
    start: unknown,
  },
  festival: {
    end_date: Date,
    festival_id: string,
    festival_name: string,
    festival_site_id: Tables['festival_site']['festival_site_id'],
    info_url: string | null,
    start_date: Date,
  },
  festival_site: {
    festival_site_id: string,
    festival_site_name: string,
    location: unknown,
  },
  invite_code: {
    code: string,
    created_by_account_id: Tables['account']['account_id'],
    festival_id: Tables['attendee']['festival_id'],
    used_by_account_id: Tables['account']['account_id'] | null,
  },
  next_festival: {
    end_date: Date | null,
    festival_id: string | null,
    festival_name: string | null,
    festival_site_id: string | null,
    info_url: string | null,
    start_date: Date | null,
  },
  purchase: {
    owned_by_account_id: Tables['account']['account_id'] | null,
    purchase_id: string,
    purchase_type_id: Tables['purchase_type']['purchase_type_id'],
    purchased_on: unknown,
  },
  purchase_type: (typeof TABLE_ROWS)['purchase_type'][number]
  volunteer_type: (typeof TABLE_ROWS)['volunteer_type'][number]
}

export type TableName = keyof Tables

export const TABLE_ROWS = {
  purchase_type: [
    {"purchase_type_id":"SLEEPING_BAG_VIBECLIPSE_2024","price_in_cents":3500,"max_available":null,"description":"Sleeping bag","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"PILLOW_WITH_CASE_VIBECLIPSE_2024","price_in_cents":2000,"max_available":null,"description":"Pillow (with pillowcase)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_330PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":null,"description":"Bus leaving AUS at 3:30 PM CST (meet at 3:00)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_730PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":50,"description":"Bus leaving AUS at 7:30 PM CST (meet at 7:15, 50 available)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_430PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":null,"description":"Bus leaving AUS at 4:30 PM CST (meet at 4:00)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_830PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":50,"description":"Bus leaving AUS at 8:30 PM CST (meet at 8:15, 50 available)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_OVER_16","price_in_cents":55000,"max_available":600,"description":"Ticket","max_per_account":2,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_10_TO_16","price_in_cents":33000,"max_available":null,"description":"Ticket (ages 10 to 16)","max_per_account":5,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_5_TO_10","price_in_cents":20000,"max_available":null,"description":"Ticket (ages 5 to 10)","max_per_account":5,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_2_TO_5","price_in_cents":10000,"max_available":null,"description":"Ticket (ages 2 to 5)","max_per_account":5,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
  ],
  volunteer_type: [
    {"volunteer_type_id":"FAE","description":"Fae"},
    {"volunteer_type_id":"GENERAL","description":"General volunteer"},
  ],
  diet: [
    {"diet_id":"VEGETARIAN","description":"Vegetarian"},
    {"diet_id":"VEGAN","description":"Vegan"},
    {"diet_id":"NO_RESTRICTIONS","description":"No restrictions"},
  ],
} as const