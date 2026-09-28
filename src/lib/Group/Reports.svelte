<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faWarning } from '@fortawesome/free-solid-svg-icons';
	import Modal from '$lib/Generic/Modal.svelte';
	import Button from '$lib/Generic/Button.svelte';
	import Loader from '$lib/Generic/Loader.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { linkToPost } from '$lib/Generic/GenericFunctions';
	import type { report } from '$lib/Generic/interfaces';

	let reports: report[] = $state([]),
		loading = $state(false),
		open = $state(false),
		selectedReport: report | null = $state(null);

	const getReportList = async () => {
		loading = true;
		const { res, json } = await fetchRequest(
			'GET',
			`server/reports?group_id=${page.params.groupId}`
		);
		loading = false;

		if (!res.ok) {
			ErrorHandlerStore.set({ message: 'Could not get reports', success: false });
			return;
		}

		reports = json?.results ?? [];
	};

	onMount(() => {
		getReportList();
	});
</script>

<Loader bind:loading>
	<span class="block text-lg text-primary dark:text-secondary font-semibold mb-3"
		>{$_('Reports')}</span
	>
	{#if reports.length > 0}
		<div class="flex flex-col gap-2 mt-2">
			{#each reports as report}
				<button
					onclick={() => {
						selectedReport = report;
						open = true;
					}}
					class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors w-full"
				>
					<Fa icon={faWarning} class="text-yellow-500 mt-0.5 flex-shrink-0" />
					<div class="min-w-0">
						<div class="font-medium text-gray-800 dark:text-darkmodeText truncate">
							{report.title}
						</div>
						<div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
							{report.description}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{:else if !loading}
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
			{$_('There are currently no reports')}
		</p>
	{/if}
</Loader>

<Modal bind:open Class="max-w-[520px]" id="report-details-modal">
	<div slot="header" class="flex items-center gap-2">
		<Fa icon={faWarning} class="text-yellow-500" />
		<span>{$_('Report Details')}</span>
	</div>
	<div slot="body" class="flex flex-col gap-4 text-left">
		{#if selectedReport}
			<!-- Report info -->
			<div
				class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800"
			>
				<div
					class="text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-400 mb-2"
				>
					{$_('Report')}
				</div>
				<div class="font-semibold text-gray-800 dark:text-darkmodeText">
					{selectedReport.title || $_('No title')}
				</div>
				{#if selectedReport.description}
					<div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
						{selectedReport.description}
					</div>
				{/if}
			</div>

			<!-- Post type badge -->
			<div class="flex items-center gap-2">
				<span
					class="px-2 py-0.5 text-xs rounded-full font-medium"
					class:bg-blue-100={selectedReport.post_type === 'poll'}
					class:text-blue-700={selectedReport.post_type === 'poll'}
					class:bg-purple-100={selectedReport.post_type === 'thread'}
					class:text-purple-700={selectedReport.post_type === 'thread'}
				>
					{selectedReport.post_type === 'poll' ? $_('Poll') : $_('Thread')}
				</span>
			</div>

			<div
				class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
			>
				<div
					class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2"
				>
					{$_('Admin Action')}
				</div>
				{selectedReport.admin_action}
			</div>

			<!-- Reported post details -->
			{#await fetchRequest('GET', selectedReport.post_type === 'poll' ? `home/polls?group_ids=${selectedReport.group_id}&id=${selectedReport.post_id}` : `group/thread/list?group_ids=${selectedReport.group_id}&id=${selectedReport.post_id}`) then { res, json }}
				{#if res.ok}
					{@const post = json?.results[0]}
					{#if post}
						<div
							class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
						>
							<div
								class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2"
							>
								{$_('Reported Post')}
							</div>
							<div class="font-medium text-gray-800 dark:text-darkmodeText">
								{post?.title}
							</div>
							{#if post?.description}
								<div class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-3">
									{post.description}
								</div>
							{/if}
						</div>
					{/if}
				{/if}
			{/await}

			<Button
				Class="w-full"
				onClick={() =>
					selectedReport &&
					goto(
						linkToPost(selectedReport.post_id, selectedReport.group_id, selectedReport.post_type)
					)}
			>
				{$_('View Post')}
			</Button>
		{/if}
	</div>
</Modal>
