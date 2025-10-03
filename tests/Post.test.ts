import { test, expect } from '@playwright/test';
import { areaVote, createPoll, createProposal, delegateVote, fastForward, goToPost, predictionProbability, predictionStatementCreate, results, vote } from './poll';
import { login, randomString } from './generic';
import { gotoGroup, createArea, createGroup, deleteGroup } from './group';
import { idfy } from '$lib/Generic/GenericFunctions2';

test('Go-To-Post', async ({ page }) => {
    await login(page);

    const group = { name: "Test Group Poll", public: false }
    await gotoGroup(page, group)

    //Random poll name
    const pollTitle = "Test Poll " + randomString();
    const poll = { title: pollTitle, date: false }
    await createPoll(page, poll);
    await goToPost(page, poll);
})

test('Area Vote', async ({ page }) => {
    await login(page);

    const group = { name: "Test Poll Area " + randomString(), public: false }

    await createGroup(page, group)

    const area = "Test Tag " + randomString();
    await createArea(page, group, area)

    await gotoGroup(page, group);

    await createPoll(page, { phase_time: 1 });

    // Testing reduntant voting i.e canceling a vote and voting multiple times
    await page.getByRole('radio').nth(0).check();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Successfully voted for area')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Vote cancelled')).toBeVisible();
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Successfully voted for area')).toBeVisible();

    // Voting for a specified area
    await areaVote(page, { area });

    await fastForward(page, 1);

    await page.waitForTimeout(1000)
    await expect(page.getByRole('button', { name: area })).toBeVisible();

    // await page.waitForTimeout(8000)
    // await page.mouse.wheel(0, -250000)
    // await page.screenshot({ path: 'tests/screenshots/area.png', fullPage: true });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // await expect(page).toHaveScreenshot('tests/screenshots/area.png');
    await expect(page.getByRole('button', { name: area })).toBeVisible();
})

test('Proposal-Test', async ({ page }) => {
    await login(page);

    const group = { name: "Test Group Poll", public: false }

    await createGroup(page, group)

    await createArea(page, group, "Tag 1")

    await gotoGroup(page, group);

    await createPoll(page, { phase_time: 1 });

    await areaVote(page, { area: "Tag 1" });

    await fastForward(page, 1);

    await createProposal(page, { title: "Lol", description: "Description funny" });
})

test('Proposal-Spam-Test', async ({ page }) => {
    test.setTimeout(120000)
    await login(page);

    const rand = randomString();
    const group = { name: "Test Group Proposals " + rand, public: false }

    await createGroup(page, group)

    await createArea(page, group, "Tag 1")

    await gotoGroup(page, group);

    await createPoll(page, { phase_time: 1 });

    await areaVote(page, { area: "Tag 1" });

    await fastForward(page, 1);

    for (let i = 0; i < 10; i++) {
        await createProposal(page, { title: `Title ${i}`, description: `Description ${i}` });
    }

    expect(await expect(page.getByText('Title 9 Description 9 0')).toBeVisible())
    expect(await expect(page.getByText('Title 0 Description 0 0')).toBeVisible())

    // Wait for all of the "Successfully added proposal" to go away before screenshotting, since they don't remain on reload 
    await page.waitForTimeout(8000)
    await page.mouse.wheel(0, -20000)
    await page.screenshot({ path: 'tests/screenshots/proposals.png', fullPage: true });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('tests/screenshots/proposals.png');
})


test('Prediction Creation', async ({ page }) => {
    await login(page);

    const group = { name: "Test Poll Prediction " + randomString(), public: false }

    await createGroup(page, group)

    const area = "Test Tag " + randomString();
    await createArea(page, group, area)

    await gotoGroup(page, group);

    await createPoll(page, { phase_time: 1 });

    await areaVote(page, { area });

    await fastForward(page, 1);

    const proposal = { title: "Test Proposal" }
    await createProposal(page, proposal);

    await fastForward(page, 1);

    const prediction = { title: "Test Prediction" }
    await predictionStatementCreate(page, proposal, prediction);
    await predictionStatementCreate(page, proposal, prediction);
    await predictionStatementCreate(page, proposal, prediction);
    await predictionStatementCreate(page, proposal, prediction);

})

test('Prediction-Statements', async ({ page }) => {
    // test.setTimeout(520000);

    await login(page);

    const group = { name: "Test Prediction Statement " + randomString(), public: true }

    await createGroup(page, group)

    const area = "Tag imact test " + Math.random().toString(36).slice(2, 10);
    await createArea(page, group, area)

    await gotoGroup(page, group);

    //TODO: Make this test faster by decreasing time between phases more
    await createPoll(page, { phase_time: 0 });

    await areaVote(page, { area });

    await fastForward(page, 1);

    const proposal = { title: "Test 1" }
    const proposal2 = { title: "Test 2" }
    await createProposal(page, proposal);
    await createProposal(page, proposal2);

    await fastForward(page, 1);

    await predictionStatementCreate(page, proposal);
    await predictionStatementCreate(page, proposal);
    await predictionStatementCreate(page, proposal);
    await predictionStatementCreate(page, proposal2);
    await predictionStatementCreate(page, proposal2);

    //TODO Screenshot tests
})

test('Prediction-Probability', async ({ page }) => {
    test.setTimeout(50000);
    // await page.waitForTimeout(12000)
    await login(page);

    const group = { name: "Test Group Probability Voting", public: true }

    await createGroup(page, group)

    const area = "Tag imact test " + randomString()
    await createArea(page, group, area)

    await gotoGroup(page, group);

    await createPoll(page, { phase_time: 1 });

    await areaVote(page, { area });

    await fastForward(page, 1);

    const proposal = { title: "Test " + randomString() }
    await createProposal(page, proposal);
    await createProposal(page, proposal);

    await fastForward(page, 1);

    const prediction = { title: "Test Pred " + randomString(), vote: 2 }
    await predictionStatementCreate(page, proposal);

    await fastForward(page, 1);

    await predictionProbability(page, proposal, prediction)

    await fastForward(page, 1);

    await page.waitForTimeout(400)
    await page.reload();
    await page.locator(`#${idfy(proposal.title)}`).first().locator('button', { hasText: "See More" }).click();
    expect(await page.getByText('Probability: 40%').click());
})

test('Prediction-Probabilities', async ({ page }) => {
    test.setTimeout(50000);
    await page.waitForTimeout(12000)
    await login(page);

    const group = { name: "Test Group Probability Voting", public: true }
    const area = "Tag imact test " + randomString()
    const proposal = { title: "Test " + randomString() }
    const prediction = { title: "Test Pred " + randomString(), vote: 2 }

    for (let i = 0; i < 3; i++) {

        await createGroup(page, group)

        await createArea(page, group, area)

        await gotoGroup(page, group);

        await createPoll(page, { phase_time: 1 });

        await areaVote(page, { area });

        await fastForward(page, 1);

        await createProposal(page, proposal);
        await createProposal(page, proposal);

        await fastForward(page, 1);

        await predictionStatementCreate(page, proposal);

        await fastForward(page, 1);

        await predictionProbability(page, proposal, prediction)

        await fastForward(page, 1);
        
        await page.waitForTimeout(400)
        await page.reload();
        await page.locator(`#${idfy(proposal.title)}`).first().locator('button', { hasText: "See More" }).click();

        expect(await page.getByText('Probability: 40%').click());

        await fastForward(page, 2);
    }
})


test('Poll-Start-To-Finish', async ({ page }) => {
    await login(page);

    const group = { name: "Test Group Poll", public: false }

    try {
        await gotoGroup(page, group)
    }
    catch {
        await createGroup(page, group)
    }

    await createArea(page, group, "Tag 1")

    await createArea(page, group, "Tag 2")

    await gotoGroup(page, group);

    await createPoll(page, { phase_time: 1 });

    await areaVote(page, { area: "Tag 1" });

    await fastForward(page, 1);

    await createProposal(page);

    await fastForward(page, 1);

    await predictionStatementCreate(page);

    await fastForward(page, 1);

    await predictionProbability(page);

    await fastForward(page, 2);

    await vote(page);

    await fastForward(page, 1);

    await results(page);

});

test('Date-Poll', async ({ page }) => {
    await login(page);

    const group = { name: "Test Group Poll", public: false }
    const poll = { title: "Test Group Poll", date: true }

    try {
        await createGroup(page, group)
    }
    catch {
        await gotoGroup(page, group)
    }

    await gotoGroup(page, group);

    await createPoll(page, poll);

    await page.locator('button:nth-child(45)').click();
    await page.locator('button:nth-child(46)').click();
    await page.locator('button:nth-child(55)').click();
    await page.locator('button:nth-child(64)').click();
    await page.getByRole('button', { name: 'Submit' }).click();

    await fastForward(page, 1);

    await expect(page.getByText('Results', { exact: true })).toBeVisible();
});

test('Thread-Create-Report-Deconste', async ({ page }) => {

    await login(page);

    const group = { name: "Test Group Thread", public: false }

    await createGroup(page, group)

    await gotoGroup(page, group);

    await page.getByRole('button', { name: 'Create a post' }).click();
    await page.getByText('Poll Thread Poll Content Text')
    await page.getByRole('button', { name: 'Thread' }).click();

    await page.getByLabel('Title * 0/').click();
    await page.getByLabel('Title * 0/').fill('Test Thread');
    await page.getByLabel('Description  0/').click();
    await page.getByLabel('Description  0/').fill('Test Description');

    await page.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByRole('heading', { name: 'Thread' })).toBeVisible();
    await page.getByPlaceholder('Write a comment...').click();
    await page.getByPlaceholder('Write a comment...').fill('Test Comment');
    await page.locator('#comments').getByRole('button').nth(1).click();
    await page.locator('div:nth-child(4) > div > button:nth-child(2)').click();
    await page.locator('div:nth-child(4) > div > button').first().click();
    await page.getByRole('button', { name: 'Reply' }).click();
    await page.getByPlaceholder('Write a comment...').nth(1).click();
    await page.getByPlaceholder('Write a comment...').nth(1).fill('Test Reply with file');
    await page.locator('.flex > form > div:nth-child(2) > div:nth-child(2) > .content-center > div > input').setInputFiles('./tests/forward-facing-niko-oneshot-isnt-real-it-cant-hurt-you-v0-3ggf23q4ijcf1.webp');
    await page.locator('form').filter({ hasText: 'forward-facing-niko-oneshot-' }).getByRole('button').nth(2).click();
    await expect(page.getByRole('img', { name: 'Attachment to the comment' })).toBeVisible();
    await page.locator('#multiple-choices').getByRole('button').click();
    await page.getByRole('button', { name: 'Report Thread' }).click();
    await page.getByRole('textbox', { name: 'Title * 0/' }).click();
    await page.getByRole('textbox', { name: 'Title * 0/' }).fill('Report Test');
    await page.locator("#report-description").click();
    await page.locator("#report-description").fill('This is a test report');
    await page.getByRole('button', { name: 'Report', exact: true }).click();
    await page.getByRole('button', { name: 'Deconste Thread' }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Deconste Thread' }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByText('Successfully deconsted thread')).toBeVisible();

    await deleteGroup(page, group);
});