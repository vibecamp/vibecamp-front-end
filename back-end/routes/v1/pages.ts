import { Page } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data/pages.ts";
import { getAllPages, updatePage } from "../../db-access/pages.ts";
import { Router } from "../../deps/oak.ts";
import { API_BASE } from "./constants.ts";

export default function register(router: Router) {

    router.get(API_BASE + '/pages', async (ctx) => {
        const pages = await getAllPages()
        ctx.response.body = JSON.stringify(pages)
    })

    router.post(API_BASE + '/page', async (ctx) => {
        const newPage = await ctx.request.body({ type: 'json' }).value as Page
        await updatePage(newPage)
        ctx.response.body = JSON.stringify({ success: true })
    })
}