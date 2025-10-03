import test from "@playwright/test"
import { login } from "./generic"
import { deleteGroup, gotoFirstGroup } from "./group"

test('Delete Many Group', async ({ page }) => {
    await login(page)

    for (let i = 0; i < 10; i++) {
        await gotoFirstGroup(page)
        await deleteGroup(page)
    }
})