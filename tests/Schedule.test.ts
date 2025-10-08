import { test, expect } from '@playwright/test';
import { login } from './generic';

test('Create-Delete-Schedule-Event', async ({ page }) => {
    await register(page);

    await page.getByRole('link', { name: 'Schedule' }).click();
    await page.getByRole('button', { name: '15' }).dblclick();
    await page.getByLabel('Title').fill('Event at 15:th');
    await page.getByLabel('Description').fill('This is a test event at 15:th');
    await page.getByLabel('End Date').click();
    await page.getByLabel('End Date').fill('2026-08-18T00:01');
    await page.getByLabel('Meeting Link').click();
    await page.getByLabel('Meeting Link').fill('hshshsh');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('Failed to create event')).toBeVisible();
    await page.getByLabel('Meeting Link').click();
    await page.getByLabel('Meeting Link').fill('https://example.com');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('Successfully created event')).toBeVisible();

    await page.getByRole('button', { name: 'Event at 15:th', exact: true }).nth(0).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Title').click();
    await page.getByLabel('Title').press('Control+a');
    await page.getByLabel('Title').fill('newly edited title');
    await page.locator('form').filter({ hasText: 'Close modal Edit Event Title' }).locator('#popup-modal').click();
    await page.getByLabel('End Date').click();
    await page.getByLabel('End Date').click();
    await page.getByLabel('End Date').press('Tab');
    await page.getByLabel('End Date').press('Shift+Tab');
    await page.getByLabel('End Date').fill('2027-08-16T00:01');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Event deleted')).toBeVisible();
    await expect(page.getByText('Failed to update event')).toBeHidden();
    // await page.getByRole('button', { name: 'Create', exact: true }).click();
});