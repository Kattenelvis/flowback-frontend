import test, { expect } from "@playwright/test";
import { login, newWindow, randomString } from "./generic";
import { createArea, createGroup, gotoGroup, joinGroup } from "./group";
import { areaVote, createPoll, createProposal, fastForward, goToPost, predictionProbability, predictionStatementCreate } from "./poll";
import { assignPermission, createPermission } from "./permission";

test('Imac-Test', async ({ page }) => {
    test.setTimeout(90000);

    await login(page);

    let group = { name: "Test Group Imac", public: true }

    await createGroup(page, group)

    const area = "Tag imact test " + Math.random().toString(36).slice(2, 10);
    await createArea(page, group, area)

    await gotoGroup(page, group);

    //TODO: Make this test faster by decreasing time between phases more
    await createPoll(page, { phase_time: 0 });

    await areaVote(page, { area });

    await fastForward(page, 1);

    const proposal = { title: "Test 1" }
    await createProposal(page, proposal);

    await fastForward(page, 1);

    await predictionStatementCreate(page, proposal);

    await fastForward(page, 1);

    await predictionProbability(page, proposal);

    await fastForward(page, 3);

    // //TODO Make the test shorter. There's a way to do this in pollCreate with all of the phase times being identical.
    await page.waitForTimeout(70000);

    await page.reload();

    await page.locator('.text-center.dark\\:saturate-\\[60\\%\\].transition-colors.duration-50.w-12').first().click();
    await expect(page.getByText('Successfully evaluated')).toBeVisible();

    await page.waitForTimeout(5000);
    expect(page.locator('#poll-tag-imac').getByText("20%")).toBe({ timeout: 10000 });

    // await page.locator('.text-center.dark\\:saturate-\\[60\\%\\].transition-colors.duration-50.w-12.px-4.py-1.ml-2').nth(1).click();
    // await expect(page.getByText('Successfully evaluated')).toBeVisible();

})

test('Imac-Test-2-Users', async ({ page }) => {
    // test.setTimeout(100000);
    test.setTimeout(100000);

    await login(page);

    let group = { name: "Test Group 2 Imac", public: true }

    await createGroup(page, group)

    const area = "Tag imact test " + randomString();
    await createArea(page, group, area)

    const bPage = await newWindow();

    await login(bPage, { email: "b@b.se", password: "b" })
    await joinGroup(bPage, group)

    const permission_name = "Consequence voting " + randomString()
    await createPermission(page, group, [14], permission_name);
    await assignPermission(page, group, permission_name);

    await gotoGroup(page, group);
    await gotoGroup(bPage, group);
    //TODO: Make this test faster by decreasing time between phases more
    const poll = { phase_time: 0, title: "Test Poll Imac 2 Users " + randomString() }
    await createPoll(page, poll);
    await goToPost(bPage, poll);

    await areaVote(page, { area });

    await fastForward(page, 1);

    const proposal = { title: "Test 1" }
    await createProposal(page, proposal);

    await fastForward(page, 1);

    await predictionStatementCreate(page, proposal);

    await fastForward(page, 1);

    await predictionProbability(page, proposal);
    await predictionProbability(bPage, proposal, { title: "Prediction Title", vote: 2 });

    await fastForward(page, 3);

    // //TODO Make the test shorter. There's a way to do this in pollCreate with all of the phase times being identical.
    await page.waitForTimeout(70000);

    await page.reload();

    await page.locator('.text-center.dark\\:saturate-\\[60\\%\\].transition-colors.duration-50.w-12').first().click();
    await expect(page.getByText('Successfully evaluated')).toBeVisible();

    await page.waitForTimeout(5000);
    expect(page.locator('#poll-tag-imac').getByText("20%")).toBe({ timeout: 10000 });

    // await page.locator('.text-center.dark\\:saturate-\\[60\\%\\].transition-colors.duration-50.w-12.px-4.py-1.ml-2').nth(1).click();
    // await expect(page.getByText('Successfully evaluated')).toBeVisible();

})
