<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import Loader from '$lib/Generic/Loader.svelte';
	import { onMount } from 'svelte';
	import type { VoteHistory } from './interfaces';
	import { _ } from 'svelte-i18n';
	import Comments from '$lib/Comments/Comments.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import type { PredictionStatement } from '$lib/Poll/PredictionMarket/interfaces';
	import Fa from 'svelte-fa';
	import {
		faArrowUpRightFromSquare,
		faClockRotateLeft,
		faComments
	} from '@fortawesome/free-solid-svg-icons';

	export let history: null | number,
		groupId = 0,
		delegateName = '';

	let loading = false,
		votingHistory: VoteHistory[] = [],
		filteredVotingHistory: VoteHistory[] = [],
		searchVoteQuery = '',
		sortOrder: 'a-z' | 'z-a' = 'a-z',
		predictions: PredictionStatement[] = [];

	const getDelegateHistory = async () => {
		loading = true;
		const { json, res } = await fetchRequest(
			'GET',
			`group/poll/pool/votes?group_id=${groupId}&include_details=true`
		);
		loading = false;
		if (!res.ok) return;

		votingHistory = json?.results ?? [];
	};

	$: filteredVotingHistory = [...votingHistory]
		.filter((entry) =>
			entry.poll.title?.toLowerCase().includes(searchVoteQuery.trim().toLowerCase())
		)
		.sort((a, b) =>
			sortOrder === 'a-z'
				? (a.poll.title || '').localeCompare(b.poll.title || '')
				: (b.poll.title || '').localeCompare(a.poll.title || '')
		);

	const getPredictionStatements = async () => {
		const { res, json } = await fetchRequest(
			'GET',
			`group/${groupId}/poll/prediction/statement/list`
		);

		if (!res.ok) return;

		predictions = json?.results ?? [];
	};

	const resetFilter = () => {
		searchVoteQuery = '';
		sortOrder = 'a-z';
	};

	onMount(async () => {
		await getDelegateHistory();
		await getPredictionStatements();
	});
</script>

<Loader bind:loading>
	<section class="w-full bg-gray-50/70 px-4 py-6 dark:bg-darkbackground sm:px-6 sm:py-8">
		<div class="mx-auto max-w-6xl">
			<header class="mb-6 flex items-start gap-4 border-b border-gray-200 pb-5 dark:border-gray-700">
				<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary">
					<Fa icon={faClockRotateLeft} />
				</div>
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
						{$_('History')}
					</p>
					<h2 class="mt-1 break-words text-2xl font-semibold leading-tight text-gray-900 dark:text-darkmodeText">
						{$_('Delegate history for')} {delegateName}
					</h2>
				</div>
			</header>

			<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
				<section class="min-w-0">
					<div class="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-darkobject sm:flex-row sm:items-center">
						<div class="min-w-0 flex-1">
							<TextInput
								Class="w-full"
								inputClass="!rounded-lg !border-gray-200 !px-3 !py-2 dark:!border-gray-600"
								label=""
								max={null}
								search={true}
								placeholder={$_('Search polls')}
								bind:value={searchVoteQuery}
							/>
						</div>
						<div class="flex items-center gap-2 sm:shrink-0">
							<label for="delegate-history-sort" class="text-sm text-gray-500 dark:text-gray-400">
								{$_('Sort')}
							</label>
							<select
								id="delegate-history-sort"
								bind:value={sortOrder}
								class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-darkbackground dark:text-darkmodeText"
							>
								<option value="a-z">{$_('A - Z')}</option>
								<option value="z-a">{$_('Z - A')}</option>
							</select>
							<button
								type="button"
								on:click={resetFilter}
								class="ml-auto rounded-lg px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 dark:text-secondary dark:hover:bg-primary/10"
							>
								{$_('Reset Filter')}
							</button>
						</div>
					</div>

					{#if filteredVotingHistory.length > 0}
						<ul class="space-y-4">
							{#each filteredVotingHistory as voteHistory}
								<li class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-darkobject">
									<div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
										<a
											class="flex items-start justify-between gap-3 break-words text-lg font-semibold text-gray-900 hover:text-primary dark:text-darkmodeText dark:hover:text-secondary"
											href={`/groups/${groupId}/polls/${voteHistory.poll.id}?source=delegate-history`}
										>
											<span>{voteHistory.poll.title || $_('No title')}</span>
											<Fa icon={faArrowUpRightFromSquare} class="mt-1 shrink-0 text-xs text-gray-400" />
										</a>
										{#if voteHistory.poll.description}
											<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
												{voteHistory.poll.description}
											</p>
										{/if}
									</div>
									{#if voteHistory.vote?.length}
										<ul class="divide-y divide-gray-100 px-5 dark:divide-gray-700">
											{#each voteHistory.vote as vote}
												{@const predictionsForProp = predictions.filter((p) =>
													p.poll_id === voteHistory.poll.id &&
													p.segments?.some((s) => s.proposal_id === vote.proposal_id)
												)}
												<li class="py-4">
													<div class="flex items-start justify-between gap-4">
												<div class="min-w-0">
													<p class="text-sm font-semibold text-gray-800 dark:text-darkmodeText">
														{vote.proposal_title}
													</p>
													{#if vote.proposal_description}
														<p class="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
															{vote.proposal_description}
														</p>
													{/if}
														</div>
														<div class="shrink-0 rounded-lg bg-primary/5 px-3 py-2 text-center dark:bg-primary/15">
													<span class="block text-[11px] text-gray-500 dark:text-gray-400">
														{$_('Delegate voted:')}
													</span>
													<span class="block text-lg font-semibold leading-tight text-primary dark:text-secondary">
														{vote.raw_score ?? '—'}
													</span>
														</div>
													</div>
													{#if predictionsForProp.length}
														<div class="mt-3 space-y-2 border-l-2 border-primary/20 pl-3 dark:border-secondary/30">
															{#each predictionsForProp as prediction}
																<div class="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
																	<span class="font-medium text-gray-700 dark:text-gray-300">{prediction.title}</span>
															{#if prediction.description}
																<span class="block">{prediction.description}</span>
															{/if}
																	{#if prediction.combined_bet !== null}
																		<span class="block">{$_('Prediction')}: {prediction.combined_bet}</span>
																	{/if}
																</div>
															{/each}
														</div>
													{/if}
												</li>
											{/each}
										</ul>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<div class="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-darkobject dark:text-gray-400">
							{searchVoteQuery.trim()
								? $_('No polls match your search criteria')
								: $_('No delegate history')}
						</div>
					{/if}
				</section>

				<aside class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-darkobject sm:p-5">
					<div class="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4 text-gray-900 dark:border-gray-700 dark:text-darkmodeText">
						<Fa icon={faComments} class="text-primary dark:text-secondary" />
						<h3 class="font-semibold">{$_('Discussion')}</h3>
					</div>
					<Comments
						Class="dark:text-darkmodeText"
						api="delegate-history"
						delegate_pool_id={history}
					/>
				</aside>
			</div>
		</div>
	</section>
</Loader>
