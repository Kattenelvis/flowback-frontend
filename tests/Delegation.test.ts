import { test, chromium, expect } from '@playwright/test';
import { login } from './generic';
import { createPoll, createProposal, delegateVote, fastForward, goToPost } from './poll';
import { createGroup, deleteGroup, gotoGroup, joinGroup } from './group';
import { becomeDelegate } from './delegation';
import { assignPermission, createPermission } from './permission';

test('Become-Delegate', async ({ page }) => {
    await login(page);

    const group = { name: "Test Group Delegation", public: true }

    await createGroup(page, group);

    await becomeDelegate(page, group);

})

test('Delegation-Poll', async ({ page }) => {
    await login(page);

    const rand = Math.random().toString(36).slice(2, 10);
    const group = { name: "Test Group Delegation" + rand, public: true }

    await createGroup(page, group);

    await page.waitForTimeout(300);

    await becomeDelegate(page, group);

    const browser = await chromium.launch();
    const bContext = await browser.newContext();
    const bPage = await bContext.newPage();

    await login(bPage, { email: 'b@b.se', password: 'b' });
    await joinGroup(bPage, group);


    await page.waitForTimeout(1000)
    await bPage.getByRole('link', { name: 'Delegations' }).click();
    await bPage.locator('#delegate-group-select').selectOption({ label: group.name });
    await page.waitForTimeout(300)
    await bPage.getByRole('button', { name: 'Uncategorised' }).click();
    await page.waitForTimeout(300)
    await bPage.getByRole('radio').first().check();
    await page.waitForTimeout(300)

    await gotoGroup(page, group);
    await page.getByRole('button', { name: 'Edit Group' }).dispatchEvent('click');
    //Give b voting rights
    await createPermission(page, group, [2]);
    await assignPermission(page, group)

    await gotoGroup(page, group);

    const title = `Test Poll for Delegation ${Math.floor(Math.random() * 10000)}`;
    await createPoll(page, { title, phase_time: 1 });

    await fastForward(page, 1);

    await createProposal(page);

    await fastForward(page, 3);

    await delegateVote(page);

    await goToPost(bPage, { title });

    await expect(page.getByText('Vote Failed').first()).not.toBeVisible();

    await expect(bPage.locator('#track-container-0')).toContainClass('disabled')
    await expect(page.locator('#track-container-0')).not.toContainClass('disabled')

    await gotoGroup(page, group)
    await deleteGroup(page, group)

});