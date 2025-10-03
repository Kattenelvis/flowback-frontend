import { expect } from "@playwright/test";

export type group = {
    name: string,
    public?: boolean,
    invite?: boolean
}

export async function createGroup(page: any, group: group = { name: 'Test Group', public: false, invite: false }) {
    await page.locator("#groups").click();
    await page.getByPlaceholder('Search groups').click();
    await page.getByPlaceholder('Search groups').fill(group.name);
    await page.waitForTimeout(500);

    // await expect(page.getByRole('heading', { name: group.name, exact: true }).first()).toBeVisible();
    const button = await page.getByRole('heading', { name: group.name, exact: true }).first()
    await page.waitForTimeout(500);

    if (await button.isVisible()) {
        await button.click();
    }
    else {
        await page.getByRole('link', { name: 'Groups' }).click();
        await page.getByRole('button', { name: 'Create Group' }).click();
        await page.getByLabel('Title * 0/').click();
        await page.getByLabel('Title * 0/').fill(group.name);
        await page.getByLabel('Description  0/').click();
        await page.getByLabel('Description  0/').fill('Test Group Description');
        await page.locator(".image-upload > input").nth(0).setInputFiles('./tests/forward-facing-niko-oneshot-isnt-real-it-cant-hurt-you-v0-3ggf23q4ijcf1.webp');
        await page.getByRole('button', { name: 'Confirm' }).click();
        await page.waitForTimeout(500);
        await page.locator(".image-upload > input").nth(1).setInputFiles('./tests/forward-facing-niko-oneshot-isnt-real-it-cant-hurt-you-v0-3ggf23q4ijcf1.webp');
        await page.locator("#cropper-confirm").first().click();
        await page.locator('fieldset').filter({ hasText: 'Public? Yes No' }).getByLabel(group.public ? 'Yes' : 'No').check();
        if (group.public)
            await page.locator('fieldset').filter({ hasText: 'Invitation Required? Yes No' }).getByLabel(group.invite ? 'Yes' : 'No').check();
        await page.locator('fieldset').filter({ hasText: 'Hide creators? Yes No' }).getByLabel('No').check();
        await page.getByRole('button', { name: 'Create' }).click();
        try {
            await expect(page.getByRole('button', { name: group.name })).toBeVisible();
        }
        catch {
            await page.getByRole('button', { name: 'Cancel' }).click();
        }
    }
}

export async function gotoGroup(page: any, group = { name: 'Test Group' }) {
    await page.locator("#groups").click();
    await page.getByPlaceholder('Search groups').click();
    await page.getByPlaceholder('Search groups').fill(group.name);
    await expect(page.getByRole('heading', { name: group.name, exact: true })).toBeVisible();
    await page.waitForTimeout(400)
    await page.getByRole('heading', { name: group.name, exact: true }).click();
}

export async function gotoFirstGroup(page: any) {
    await page.locator("#groups").click();
    await page.locator("#groups-list > div").first().click();
}

export async function joinGroup(page: any, group = { name: 'Test Group' }) {
    await page.locator("#groups").click();
    await page.getByPlaceholder('Search groups').click();
    await page.getByPlaceholder('Search groups').fill(group.name);
    await page.getByRole('heading', { name: group.name, exact: true });
    const joinButton = await page.locator('#groups-list div').filter({ hasText: group.name }).locator('#group-join-button');
    await expect(joinButton).toBeVisible();
    if ((await joinButton.innerText()).trim() === "Join" || (await joinButton.innerText()).trim() === "Ask to join")
        await joinButton.click();
}

export async function deleteGroup(page: any, group = { name: 'Test Group', public: false }) {
    // Deleting Group
    await page.getByRole('button', { name: 'Edit Group' }).click();
    await page.getByRole('button', { name: 'Delete Group' }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Delete Group' }).click();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(page).toHaveURL('/groups');
}

export async function createArea(page: any, group = { name: 'Test Group', public: false }, tag = "Test Tag") {
    await page.getByRole('button', { name: 'Edit Group' }).dispatchEvent('click')
    await expect(page.getByRole('button', { name: 'Areas' })).toBeVisible();
    await page.getByRole('button', { name: 'Areas' }).click();
    await page.getByLabel('Tag * 0/').click();
    await page.getByLabel('Tag * 0/').fill(tag);
    await page.getByLabel('Description  0/').click();
    await page.getByLabel('Description  0/').fill('Tag description');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('div:nth-child(3) > div').filter({ hasText: tag })).toHaveText(tag);
}