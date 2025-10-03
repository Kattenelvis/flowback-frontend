import { test, expect, firefox, chromium } from '@playwright/test';
import { login, logout } from './generic';
import { createGroup, deleteGroup, gotoGroup, joinGroup } from './group';

test('Group-Chat', async ({ page }) => {
    await login(page);

    const rand = Math.random().toString(36).slice(2, 10);
    const group = { name: "Test Group Chat" + rand, public: true }

    await createGroup(page, group);

    const browser = await chromium.launch();
    const bContext = await browser.newContext();
    const bPage = await bContext.newPage();

    await login(bPage, { email: 'b@b.se', password: 'b' });
    await joinGroup(bPage, group);

    await page.reload();
    await bPage.reload();

    await page.getByRole('button', { name: 'open chat' }).click();
    await page.getByPlaceholder('Search chatters').click();
    await page.getByPlaceholder('Search chatters').fill(group.name);
    await page.getByRole('button', { name: `avatar ${group.name}` }).first().click();

    await page.getByPlaceholder('Write a message...').click();
    await page.getByPlaceholder('Write a message...').fill('Hello!! :D');
    await page.waitForTimeout(300)
    await page.locator('form > button:nth-child(2)').click();
    await page.getByPlaceholder('Write a message...').click();
    await page.waitForTimeout(300)

    await bPage.getByRole('button', { name: 'open chat' }).click();
    await bPage.getByPlaceholder('Search chatters').click();
    await bPage.getByPlaceholder('Search chatters').fill(group.name);
    await bPage.getByRole('button', { name: group.name }).click();
    await page.waitForTimeout(300)
    await bPage.getByPlaceholder('Write a message...').fill('Hello!! :D');
    await bPage.getByPlaceholder('Write a message...').press('Enter');
    await page.waitForTimeout(300)

    expect(page.getByText('Hello!! :D').nth(1)).toBeVisible();
    expect(page.getByText('Hello!! :D').nth(2)).toBeVisible();

    expect(bPage.getByText('Hello!! :D').nth(1)).toBeVisible();
    expect(bPage.getByText('Hello!! :D').nth(2)).toBeVisible();

    await gotoGroup(page, group)
    await deleteGroup(page, group);

});

test('Direct-Chat-Via-Group', async ({ page }) => {
    await login(page);

    const rand = Math.random().toString(36).slice(2, 10);
    const group = { name: "Test Group Chat 2" + rand, public: true }

    await createGroup(page, group);

    const browser = await chromium.launch();
    const bContext = await browser.newContext();
    const bPage = await bContext.newPage();

    await login(bPage, { email: 'b@b.se', password: 'b' });
    await joinGroup(bPage, group);
    await gotoGroup(bPage, group);

    await page.getByRole('button', { name: 'Members', exact: true }).click();
    await page.locator('.text-primary').click();

    await page.getByPlaceholder('Write a message...').click();
    await page.getByPlaceholder('Write a message...').fill('Hello!! :D');
    await page.locator('form > button:nth-child(2)').click();
    await page.getByPlaceholder('Write a message...').click();

    await bPage.getByRole('button', { name: 'Members', exact: true }).click();
    await bPage.locator('.text-primary').click();
    await bPage.getByPlaceholder('Write a message...').fill('Hello!! :D');
    await bPage.getByPlaceholder('Write a message...').press('Enter');

    await expect(page.getByText('Hello!! :D').nth(1)).toBeVisible();
    await expect(page.getByText('Hello!! :D').nth(2)).toBeVisible();

    await expect(bPage.getByText('Hello!! :D').nth(1)).toBeVisible();
    await expect(bPage.getByText('Hello!! :D').nth(2)).toBeVisible();

    await page.getByRole('button', { name: 'Close modal' }).click();

    await deleteGroup(page, group);

});
