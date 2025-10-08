import { test, expect } from '@playwright/test';
import { login, logout } from './generic';

test('Edit User', async ({ page }) => {
    await register(page);
    await page.getByRole('button', { name: 'default pfp' }).click();
    await page.getByRole('button', { name: 'User Profile', exact: true }).click();
    await page.getByRole('button').nth(3).click();
    await page.getByRole('button', { name: 'default pfp' }).click();
    await expect(page.getByText('Contact Information')).toBeVisible();
    await page.locator("#edit-profile-button").click();
    await page.getByLabel('Name').fill('a edited');
    await page.getByLabel('Website').click();
    await page.getByLabel('Website').fill('http://www.google.com');
    await page.getByLabel('Mail').click();
    await page.getByLabel('Mail').fill('email@email.com');
    await page.getByLabel('Bio').click();
    await page.getByLabel('Bio').fill('I like pancakes :3');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.getByLabel('Name').click();
    await page.getByLabel('Name').press('Control+ArrowLeft');
    await page.getByLabel('Name').fill('a_edited');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Profile successfully updated').nth(0)).toBeVisible();
    await expect(page.getByText('a_edited').nth(-1)).toBeVisible();
    await expect(page.getByText('I like pancakes :')).toBeVisible();
    await logout(page);

});