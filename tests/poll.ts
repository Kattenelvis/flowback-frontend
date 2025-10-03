import { idfy } from '$lib/Generic/GenericFunctions2';
import { expect } from '@playwright/test';

export async function fastForward(page: any, times = 1) {
    expect(await page.locator('#poll-header-multiple-choices')).toBeVisible();
    await page.locator('#poll-header-multiple-choices').click();
    for (let i = 0; i < times; i++) {
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: 'Fast Forward' }).click();
    }
}

export async function createPoll(page: any, {
    title = 'Test Poll', date = false, phase_time = 0 } = {}) {
    //Create a Poll
    await page.getByRole('button', { name: 'Create a post' }).click();
    await page.waitForTimeout(300);
    expect(await page.getByText('PollThread')).toBeVisible();
    await page.getByLabel('Title * 0/').click();
    await page.getByLabel('Title * 0/').fill(title);
    await page.getByLabel('Description  0/').fill('Test Description');

    if (date) await page.getByLabel('Date Poll').check();

    await page.getByRole('button', { name: 'Display advanced time settings' }).click();
    await page.locator('fieldset').filter({ hasText: 'Public? Yes No' }).getByLabel('Yes').check();
    await page.locator('fieldset').filter({ hasText: 'Fast Forward? Yes No' }).getByLabel('Yes').check();

    await page.getByRole('spinbutton').fill(phase_time.toString());

    await page.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByText('Could not create Poll')).not.toBeVisible();
    await expect(page.getByText('Poll Created')).toBeVisible();

    await page.waitForTimeout(500);
    expect(await page.getByRole('heading', { name: title })).toBeVisible();
}

export async function goToPost(page: any, {
    title = 'Test Poll'
}) {
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByPlaceholder('Search polls').click();
    await page.getByPlaceholder('Search polls').fill(title);
    expect(await page.locator('#thumbnails > div').getByRole('link', { name: title, exact: true }).first()).toBeVisible();
    await page.locator('#thumbnails > div').getByRole('link', { name: title, exact: true }).first().click();
    expect(await page.getByRole('heading', { name: title })).toBeVisible();

    // expect(await page.locator('#poll-thumbnail-140').getByRole('link', { name: 'Test Poll' })).toBeVisible();
}

export async function areaVote(page: any, {
    area = 'Default',
} = {}) {
    await page.locator(`[id="tag-${area}"]`).getByRole('radio').check();
    await page.getByRole('button', { name: 'Submit' }).click();
    expect(await page.getByText('Successfully voted for area')).toBeVisible();
}

//Only works in proposal phase
export async function createProposal(page: any, {
    title = 'Test Proposal',
    description = 'Test Description',
} = {}) {

    if (!await page.getByRole('button', { name: 'Add Proposal' }).isDisabled())
        await page.getByRole('button', { name: 'Add Proposal' }).click();

    await page.getByRole('textbox', { name: 'Title * 0/' }).click();
    await page.getByRole('textbox', { name: 'Title * 0/' }).fill(title);
    await page.getByLabel('Description  0/').click();
    await page.getByLabel('Description  0/').fill(title);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Add Proposal' }).click();
    await page.getByRole('textbox', { name: 'Title * 0/' }).click();
    await page.getByRole('textbox', { name: 'Title * 0/' }).fill(title);
    await page.getByText('Description 0/').click();
    await page.getByLabel('Description  0/').click();
    await page.getByLabel('Description  0/').fill(description);
    await page.getByRole('button', { name: 'Confirm' }).click();
    expect(await page.getByText('Successfully added proposal').first()).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();
    expect(await page.getByText('Successfully added proposal').first()).toBeVisible();
}

export async function predictionStatementCreate(page: any, proposal = { title: "Proposal Title" }, prediction = { title: "Prediction Title" }) {
    expect(await page.locator('#poll-timeline').filter({ hasText: 'Phase 3. Prediction statements creation' }))
    await page.waitForTimeout(300);
    if (await page.locator(`#${idfy(proposal.title)}-selection`).first().isVisible())
        await page.locator(`#${idfy(proposal.title)}-selection`).first().click();

    expect(await page.getByText('To make a consequence, please')).not.toBeVisible()

    await page.getByRole('textbox', { name: 'Title * 0/' }).fill(prediction.title);
    await page.getByLabel('Description  0/').fill('Prediction 1');
    await page.locator('.date-time-field > input').nth(0).fill('2000-01-01 00:00:00');
    await page.locator('#poll-structure').click();
    await page.getByRole('button', { name: 'Submit' }).click();

    expect(await page.getByText('Successfully created').first()).toBeVisible();
}

//Prediction Betting
export async function predictionProbability(page: any, proposal = { title: "Proposal Title" },
    prediction = { title: "Prediction Title", vote: 1 }) {

    expect(await page.locator('#poll-timeline').filter({ hasText: 'Current: Phase 4. Consequence' }))
    await page.locator(`#${idfy(proposal.title)}`).first().locator('button', { hasText: "See More" }).click();
    await page.locator(`#track-container- > div:nth-child(${2 + prediction.vote})`).click();
    expect(await page.getByText('Probability successfully sent').nth(0)).toBeVisible();

}

export async function delegateVote(page: any) {
    // Delegate Voting Phase
    await page.locator('div').filter({ hasText: 'Current: Phase 5. Delegate' }).nth(2).click();
    await page.getByRole('button', { name: 'See more' }).nth(0).click();
    await page.getByText('Successfully voted').isVisible();


    await page.locator('#track-container-0 > div:nth-child(4)').click();
    await page.locator('#track-container-1 > div:nth-child(6)').click();

    await page.getByRole('button', { name: 'See More' }).nth(0).click();
    // expect(await page.getByText('Probability: 80%')).toBeVisible();
    await page.getByRole('button', { name: 'See More' }).nth(1).click();
    // expect(await page.getByText('Probability: 40%')).toBeVisible();
}

export async function vote(page: any) {
    // Delegate Voting Phase
    expect(await page.locator('div').filter({ hasText: 'Phase 6. Voting for non-delegates' }).nth(2)).toBeVisible();
    await page.getByRole('button', { name: 'See more' }).nth(0).click();
    await page.getByText('Successfully voted').isVisible();


    await page.locator('#track-container-0 > div:nth-child(3)').first().click();
    await page.locator('#track-container-1 > div:nth-child(7)').first().click();

    await page.getByRole('button', { name: 'See More' }).nth(0).click();
    // expect(await page.getByText('Probability: 80%')).toBeVisible();
    await page.getByRole('button', { name: 'See More' }).nth(1).click();
    // expect(await page.getByText('Probability: 40%')).toBeVisible();

    // await page.locator("#proposals-section").screenshot({ path: 'tests/voting.png', fullPage: true });
    // expect(await page.locator("#proposals-section")).toHaveScreenshot('tests/voting.png');

    // await page.reload();
    // await page.waitForLoadState('networkidle');

    // expect(await page.locator("#proposals-section")).toHaveScreenshot('tests/voting.png');

}

export async function results(page: any) {
    expect(await page.getByText('Results', { exact: true })).toBeVisible();

    expect(await page.locator('canvas')).toBeVisible();

    await page.locator('canvas').click({
        position: {
            x: 43,
            y: 92
        }
    });
    expect(await page.getByText('Current: Phase 7. Results and')).toBeVisible();
}