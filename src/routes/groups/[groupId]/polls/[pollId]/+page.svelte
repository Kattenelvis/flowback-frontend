<script lang="ts">
	import Comments from '$lib/Comments/Comments.svelte';
	import { groupUserPermissionStore } from '$lib/Group/interface';
	import { onMount } from 'svelte';
	import { fetchRequest } from '$lib/FetchRequest';
	import { page } from '$app/stores';
	import type { Comment, Phase, poll, proposal } from '$lib/Poll/interface';
	import Button from '$lib/Generic/Button.svelte';
	import { _ } from 'svelte-i18n';
	import Results from '$lib/Poll/Results.svelte';
	import { checkForLinks } from '$lib/Generic/GenericFunctions';
	import ProposalSubmition from '$lib/Poll/ProposalSubmition.svelte';
	import Predictions from '$lib/Poll/PredictionMarket/CreatePrediction.svelte';
	import PollHeader from '$lib/Poll/PollHeader.svelte';
	import { getPhase } from '$lib/Poll/functions';
	import AreaVote from '$lib/Poll/AreaVote.svelte';
	import ProposalScoreVoting from '$lib/Poll/ProposalScoreVoting.svelte';
	import DatePoll from '$lib/Poll/DatePoll.svelte';
	import Structure from '$lib/Poll/NewDesign/Structure.svelte';
	import Layout from '$lib/Generic/Layout.svelte';
	import PredictionStatements from '$lib/Poll/PredictionStatements.svelte';
	import { env } from '$env/dynamic/public';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import NewDescription from '$lib/Poll/NewDescription.svelte';
	import { formatDate } from '$lib/Generic/DateFormatter';
	import { predictionStatementsStore } from '$lib/Poll/PredictionMarket/interfaces';
	import Fa from 'svelte-fa';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

	let poll: poll,
		pollType = 1,
		finished: boolean,
		phase: Phase = 'pre_start',
		proposals: proposal[],
		selectedProposal: proposal | null,
		proposalsToPredictionMarket: proposal[] = [],
		height = "400",
		displayForm: boolean,
		comments: Comment[] = [],
		loading = true;

	onMount(async () => {
		await getPollData();
		phase = getPhase(poll);
		scrollToSection();
		checkForLinks(poll?.description, 'poll-description');
		document.title = poll?.title;
		getDisplayForm();
		setUpPredictionStore();
	});

	const getPollData = async () => {
		if (!$page.params) return;
		loading = true;

		const { res, json } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/poll/list?id=${$page.params.pollId}`
		);

		loading = false;

		if (!res.ok) {
			ErrorHandlerStore.set({ message: json.detail[0], success: false });
			return;
		}

		poll = json?.results[0];
		pollType = json?.results[0]?.poll_type;
		finished = new Date(json?.results[0]?.end_date) < new Date();
	};

	const scrollToSection = () => {
		const section = $page.url.searchParams.get('section');
		if (!section) return;
		setTimeout(() => {
			const scrollTo = document.getElementById(section);
			scrollTo?.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'nearest' });
		}, 200);
	};

	const getDisplayForm = () => {
		const display = $page.url.searchParams.get('display');
		console.log(display, 'IDS');

		if (display === null || display === undefined || display === '0') displayForm = false;
		if (display === '1') displayForm = true;
	};

	const setUpPredictionStore = async () => {
		const { json, res } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/poll/prediction/statement/list?poll_id=${$page.params.pollId}`
		);

		if (!res.ok) {
			return;
		}

		predictionStatementsStore.set(json?.results);
	};

	// When fast forwarding from area phase to proposal phase, get tag info in real time
	$: if (phase === 'proposal') {
		const a = setTimeout(() => {
			getPollData();
			clearTimeout(a);
		}, 2000);
	}
</script>

<Layout centered>
	{#if poll}
		{#if pollType === 4}
			<PollHeader {poll} bind:phase displayTag={phase !== 'area_vote' && phase !== 'pre_start'} />
		{:else}
			<PollHeader {poll} bind:phase displayTag={false} />
		{/if}

		<!-- Normal Poll -->
		{#if pollType === 4}
			<!-- PHASE 0: PRE-START -->
			{#if phase === 'pre_start'}
				<div class="bg-white shadow rounded mt-6 p-6">
					{$_('This poll will start at')}
					{formatDate(poll.start_date)}
				</div>
				<div class="bg-white p-6 mt-6">
					<Comments bind:proposals api={'poll'} />
				</div>

				<!-- PHASE 1: AREA VOTE -->
			{:else if phase === 'area_vote'}
				<Structure bind:phase bind:poll>
					<div slot="left"><AreaVote /></div>
					<div slot="right" class="!p-0">
						<Comments bind:proposals api={'poll'} />
					</div>
				</Structure>

				<!-- PHASE 2: PROPOSAL CREATION -->
			{:else if phase === 'proposal'}
				<Structure bind:phase bind:poll>
					<div slot="left" class="h-[460px] relative">
						<span class="text-xl font-semibold mb-4 ml-3 text-primary dark:text-secondary"
							>{$_('Proposals')} ({proposals?.length})</span
						>
						<div class="max-h-[80%] overflow-y-auto">
							<ProposalScoreVoting bind:selectedProposal bind:proposals bind:comments bind:phase />
						</div>
						<Button
							Class="w-full absolute bottom-0 mb-2"
							buttonStyle="primary-light"
							disabled={displayForm && !selectedProposal}
							onClick={() => {
								selectedProposal = null;
								displayForm = true;
							}}>{$_('Add Proposal')}</Button
						>
					</div>
					<div slot="right" class="relative h-[460px]">
						{#if selectedProposal}
							<div class="flex flex-col space-y-2 p-2">
								<span
									class="text-primary text-lg dark:text-secondary font-semibold block break-words"
								>
									{selectedProposal.title}</span
								>
								<span class="break-words">
									{selectedProposal.description}
								</span>
							</div>
							{#if selectedProposal.attachments}
								<div>
									{#each selectedProposal.attachments as file}
										<img alt="attachment" src={`${env.PUBLIC_API_URL}/media/${file.file}`} />
									{/each}
								</div>
							{/if}
						{:else if displayForm}
							<ProposalSubmition {poll} bind:proposals bind:displayForm />
						{/if}
					</div>
					<div slot="bottom">
						<Comments bind:proposals api={'poll'} />
					</div>
				</Structure>

				<!-- PHASE 3: PREDICTION STATEMENT CREATION -->
			{:else if phase === 'prediction_statement'}
				<Structure bind:phase bind:poll>
					<div slot="left" class="h-[460px] relative">
						<span class="text-xl font-semibold mb-4 ml-3 text-primary dark:text-secondary"
							>{$_('Proposals')} ({proposals?.length})</span
						>
						<div class="max-h-[80%] overflow-y-auto">
							<ProposalScoreVoting
								bind:comments
								bind:proposals
								bind:phase
								bind:selectedProposal
								bind:proposalsToPredictionMarket
							/>
						</div>
						<Button
							Class="w-full absolute bottom-0 mt-2"
							buttonStyle="primary-light"
							disabled={displayForm && !selectedProposal}
							onClick={() => {
								selectedProposal = null;
								displayForm = true;
							}}>{$_('Create Consequence')}</Button
						>
					</div>
					<div slot="right" class="relative h-[460px] overflow-hidden">
						{#if selectedProposal}
							<div class="flex flex-col space-y-2 p-2">
								<div class="font-semibold text-primary dark:text-secondary text-lg">
									{selectedProposal.title}
								</div>
								<NewDescription
									description={selectedProposal.description}
									limit={2}
									lengthLimit={130}
								/>
								<PredictionStatements bind:selectedProposal bind:phase bind:poll />
							</div>
						{:else if proposalsToPredictionMarket.length === 0}
							<span class="text-center block text-primary dark:text-secondary font-semibold pt-4">
								{$_('To make a consequence, please select at least one proposal')}
							</span>
						{:else if displayForm}
							<Predictions bind:proposals bind:poll bind:proposalsToPredictionMarket />
						{/if}
					</div>
					<div slot="bottom">
						<Comments bind:proposals api={'poll'} />
					</div>
				</Structure>

				<!-- PHASE 4: PREDICTION BETTING -->
			{:else if phase === 'prediction_bet'}
				<Structure bind:phase bind:poll>
					<div slot="left" class="h-[460px]">
						<span class="text-xl font-semibold mb-4 ml-3 text-primary dark:text-secondary"
							>{$_('Proposals')} ({proposals?.length})</span
						>
						<div class="max-h-[460px] overflow-y-auto">
							<ProposalScoreVoting bind:comments bind:phase bind:proposals bind:selectedProposal />
						</div>
					</div>
					<div slot="right">
						{#if selectedProposal}
							<div class="flex flex-col space-y-2 p-2">
								<div class="font-semibold text-primary dark:text-secondary text-lg">
									{selectedProposal.title}
								</div>
								<NewDescription
									description={selectedProposal.description}
									limit={2}
									lengthLimit={130}
								/>
								<PredictionStatements bind:selectedProposal bind:phase bind:poll />
							</div>
						{/if}
					</div>
					<div slot="bottom">
						<Comments bind:proposals api={'poll'} />
					</div>
				</Structure>

				<!-- PHASE 5: DELEGATE VOTING -->
			{:else if phase === 'delegate_vote'}
				<Structure bind:phase bind:poll>
					<div slot="left" class="h-[460px]">
						<span class="text-xl font-semibold mb-4 ml-3 text-primary dark:text-secondary"
							>{$_('Proposals')} ({proposals?.length})</span
						>
						<div class="max-h-[90%] overflow-y-auto">
							<ProposalScoreVoting bind:comments bind:proposals bind:phase bind:selectedProposal />
						</div>
					</div>
					<div slot="right">
						{#if selectedProposal}
							<div class="flex flex-col space-y-2 p-2">
								<div class="font-semibold text-primary dark:text-secondary text-lg">
									{selectedProposal.title}
								</div>
								<NewDescription
									description={selectedProposal.description}
									limit={2}
									lengthLimit={130}
								/>
								<PredictionStatements bind:selectedProposal bind:phase bind:poll />
							</div>
						{/if}
					</div>
					<div slot="bottom">
						<Comments bind:proposals api={'poll'} />
					</div>
				</Structure>
				<!-- PHASE 6: NON-DELEGATE VOTING -->
			{:else if phase === 'vote'}
				<Structure bind:phase bind:poll>
					<div slot="left" class="h-[460px]" id="proposals-section">
						<span class="text-xl font-semibold mb-4 ml-3 text-primary dark:text-secondary"
							>{$_('Proposals')} ({proposals?.length})</span
						>
						<div>{$_('Allowed to vote: ')}{$groupUserPermissionStore?.allow_vote}</div>
						<div class="max-h-[90%] overflow-y-auto">
							<ProposalScoreVoting bind:comments bind:proposals bind:selectedProposal bind:phase />
						</div>
					</div>
					<div slot="right">
						{#if selectedProposal}
							<div class="flex flex-col space-y-2 p-2">
								<div class="font-semibold text-primary dark:text-secondary text-lg">
									{selectedProposal.title}
								</div>
								<NewDescription
									description={selectedProposal.description}
									limit={2}
									lengthLimit={130}
								/>
								<PredictionStatements bind:selectedProposal bind:phase bind:poll />
							</div>
						{/if}
					</div>
					<div slot="bottom">
						<Comments bind:proposals api={'poll'} />
					</div>
				</Structure>
				<!-- PHASE 7: RESULTS AND EVALUATION -->
			{:else if phase === 'result' || phase === 'prediction_vote'}
				<Structure bind:phase bind:poll>
					<div slot="left" class="h-[460px] overflow-y-auto">
						{#if proposals}
							<PredictionStatements
								bind:phase
								bind:poll
								selectedProposal={proposals.sort((_proposal) => _proposal.score)[0]}
							/>
						{/if}
					</div>
					<div slot="right"><Results bind:poll {getPollData} {pollType} /></div>
					<div slot="bottom">
						<Comments bind:proposals api={'poll'} />
					</div>
				</Structure>
			{/if}

			<!-- Date Poll -->
		{:else if pollType === 3}
			{#if phase === 'area_vote' || phase === 'pre_start'}
				<DatePoll />
			{:else}
				<Structure bind:phase bind:poll>
					<div slot="left" class="w-[600px]">
						<Results bind:poll {getPollData} {pollType} />
					</div>

					<div slot="right"><Comments api="poll" /></div>
				</Structure>
			{/if}
		{/if}
	{:else if !loading}
		<div class="p-4 bg-white dark:bg-darkobject dark:text-darkmodeText mt-4 rounded shadow">
			<p>{$_('No poll found, it might have been deleted')}</p>
			<Button onClick={() => history.back()}><Fa icon={faArrowLeft} /></Button>
		</div>
	{/if}
</Layout>
