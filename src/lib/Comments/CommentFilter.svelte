<script lang="ts">
	import FilterSelect from '$lib/Generic/FilterSelect.svelte';
	import type { proposal } from '$lib/Poll/interface';
	import { _ } from 'svelte-i18n';
	import { commentsStore, filterByTags } from './commentStore';
	import Modal from '$lib/Generic/Modal.svelte';
	import Fa from 'svelte-fa';
	import {
		faFilter,
		faMagnifyingGlass,
		faXmark
	} from '@fortawesome/free-solid-svg-icons';
	import { page } from '$app/stores';

	export let sortBy: string | null = null,
		Class = '',
		searchString: string = '',
		proposals: proposal[] = [],
		selectedProposals: number[] = [];

	let displayProposalsModal = false;

	$: if (selectedProposals.length === 0)
		commentsStore.update((store) => ({
			allComments: store.allComments,
			filterByProposal: null,
			filteredComments: store.allComments
		}));
	else {
		filterByTags(proposals, selectedProposals, $page.params.pollId ?? '');
	}

	$: selected = proposals?.filter((p) => selectedProposals.includes(p.id)) ?? [];

	const unselect = (id: number) => {
		selectedProposals = selectedProposals.filter((p) => p !== id);
	};
</script>

<div class={Class}>
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
		<label class="relative flex-1 min-w-0">
			<span class="sr-only">{$_('Search comments')}</span>
			<Fa
				icon={faMagnifyingGlass}
				class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
			/>
			<input
				type="search"
				bind:value={searchString}
				placeholder={$_('Search comments')}
				autocomplete="off"
				class="w-full rounded-full border-0 bg-gray-100 py-1.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-500 outline-none transition-shadow focus:ring-2 focus:ring-primary dark:bg-darkbackground dark:text-darkmodeText dark:placeholder-gray-400 dark:focus:ring-secondary"
			/>
		</label>

		<div class="flex flex-wrap items-center gap-2">
			<FilterSelect
				label="Sort"
				values={['created_at_asc', 'created_at_desc', 'score_asc', 'score_desc', null]}
				labels={[
					$_('Recent'),
					$_('Oldest'),
					$_('Top'),
					$_('Controversial'),
					$_('Hot')
				]}
				bind:value={sortBy}
			/>

			{#if proposals?.length > 0}
				<button
					type="button"
					class="inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-3 pr-3 text-sm font-semibold transition-colors {selected.length >
					0
						? 'bg-primary text-white hover:brightness-110 dark:bg-secondary'
						: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-darkbackground dark:text-darkmodeText dark:hover:bg-gray-700'}"
					on:click={() => (displayProposalsModal = true)}
				>
					<Fa icon={faFilter} class="text-xs" />
					{$_('Filter by Proposal')}
					{#if selected.length > 0}
						<span
							class="min-w-[1.25rem] rounded-full bg-white px-1.5 text-xs leading-5 text-primary"
							>{selected.length}</span
						>
					{/if}
				</button>
			{/if}
		</div>
	</div>

	<!-- The proposals being filtered on, each removable on its own -->
	{#if selected.length > 0}
		<ul class="mt-2 flex flex-wrap gap-2">
			{#each selected as proposal (proposal.id)}
				<li
					class="flex max-w-full items-center gap-1 rounded-full border border-primary py-0.5 pl-3 pr-1 text-sm text-primary dark:border-secondary dark:text-secondary"
				>
					<span class="truncate">{proposal.title}</span>
					<button
						type="button"
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-blue-50 dark:hover:bg-gray-700"
						aria-label={`${$_('Remove')} ${proposal.title}`}
						on:click={() => unselect(proposal.id)}
					>
						<Fa icon={faXmark} class="text-xs" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

{#if proposals}
	<Modal
		bind:open={displayProposalsModal}
		buttons={[
			{
				label: 'Clear filter',
				type: 'secondary',
				onClick: () => (selectedProposals = [])
			},
			{
				label: 'Show comments',
				type: 'primary',
				onClick: () => (displayProposalsModal = false)
			}
		]}
	>
		<div slot="header">{$_('Filter by Proposal')}</div>
		<div slot="body" class="flex flex-col gap-2 text-left">
			<p class="mb-1 text-sm text-gray-500 dark:text-gray-400">
				{$_('Only show discussions that mention these proposals.')}
			</p>
			{#each proposals as proposal (proposal.id)}
				<label
					class="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 transition-colors hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:has-[:checked]:border-secondary dark:has-[:checked]:bg-gray-700"
				>
					<input
						type="checkbox"
						name="proposals"
						value={proposal.id}
						bind:group={selectedProposals}
						class="h-4 w-4 shrink-0 accent-primary"
					/>
					<span class="min-w-0 break-words">{proposal.title}</span>
				</label>
			{/each}
		</div>
	</Modal>
{/if}
