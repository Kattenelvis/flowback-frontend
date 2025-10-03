import test, { expect } from "@playwright/test";
import { createGroup, deleteGroup, gotoGroup, joinGroup } from "./group";
import { login, newWindow } from "./generic";
import { assignPermission, createPermission } from "./permission";

test('Create-Permission-Full', async ({ page }) => {
    await login(page);

    const rand = Math.random().toString(36).slice(2, 10);
    const group = { name: 'Test Group Permissions ' + rand, public: true };
    await createGroup(page, group);

    await expect(page.locator('#group-header-title')).toHaveText(group.name);
    await page.getByRole('button', { name: 'Edit Group' }).dispatchEvent('click');

    await createPermission(page, group, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const bPage = await newWindow();

    await login(bPage, { email: 'b@b.se', password: 'b' });
    await joinGroup(bPage, group);
    await page.waitForTimeout(400);

    await assignPermission(page, group);

    await page.waitForTimeout(300);

    await gotoGroup(bPage, group);
    await bPage.locator('#create-a-post-sidebar-button').waitFor();
    expect(await bPage.locator('#create-a-post-sidebar-button').isDisabled()).not

    // await expect(bPage.locator('#create-a-post-sidebar-button').isDisabled())

    await deleteGroup(page, group);

});

test('Create-Permission-None', async ({ page }) => {
    await login(page);

    const rand = Math.random().toString(36).slice(2, 10);
    const group = { name: 'Test Group Permissions ' + rand, public: true };
    await createGroup(page, group);

    await expect(page.locator('#group-header-title')).toHaveText(group.name);

    const bPage = await newWindow();

    await login(bPage, { email: 'b@b.se', password: 'b' });
    await joinGroup(bPage, group);

    await page.getByRole('button', { name: 'Edit Group' }).dispatchEvent('click')

    await createPermission(page, group, []);

    await page.waitForTimeout(1000);
    await assignPermission(page, group)

    await page.waitForTimeout(500);
    await gotoGroup(bPage, group);

    await bPage.locator('#create-a-post-sidebar-button').waitFor();
    await expect(bPage.locator('#create-a-post-sidebar-button').isDisabled()).toBeTruthy();

    await deleteGroup(page, group);
});