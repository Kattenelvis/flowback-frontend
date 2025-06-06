<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import PollThumbnail from './PollThumbnail.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import PollFiltering from './PollFiltering.svelte';
	import type { Filter, poll as Poll } from './interface';
	import Loader from '$lib/Generic/Loader.svelte';
	import { pollThumbnails as pollThumbnailsLimit } from '../Generic/APILimits.json';
	import Pagination from '$lib/Generic/Pagination.svelte';
	import Poppup from '$lib/Generic/Poppup.svelte';
	import type { poppup } from '$lib/Generic/Poppup';
	import type { DelegateMinimal } from '$lib/Group/interface';
	import type { WorkGroup } from '$lib/Group/WorkingGroups/interface';

	export let Class = '',
		infoToGet: 'group' | 'home' | 'public' | 'delegate' | 'user',
		delegate: DelegateMinimal = { id: 0, pool_id: 0, profile_image: '', tags: [], username: '' };

	let polls: Poll[] = [],
		workGroups: WorkGroup[] = [],
		filter: Filter = {
			search: '',
			finishedSelection: 'all',
			public: false,
			order_by: 'start_date_desc',
			tag: null,
			workgroup: null
		},
		loading = false,
		next = '',
		prev = '',
		poppup: poppup;

	const getAPI = async () => {
		let API = '';
		// console.log(delegate, {}, delegate === {});

		if (infoToGet === 'home') API += `home/polls?`;
		else if (infoToGet === 'group') API += `group/${$page.params.groupId}/poll/list?`;
		else if (infoToGet === 'delegate') API += `group/poll/pool/${delegate.pool_id}/votes`;
		// else if (infoToGet === 'user') API += `user/home?`;
		else if (infoToGet === 'user') API += `home/polls?`;
		//TODO remove public
		else if (infoToGet === 'public') API += `home/polls?public=true`;

		if (filter.order_by) API += `&order_by=pinned,${filter.order_by}`;
		else API += `&order_by=pinned`;

		// API += `&limit=${pollThumbnailsLimit}`
		API += `&limit=${pollThumbnailsLimit}`;

		if (filter.search.length > 0) API += `&title__icontains=${filter.search}`;

		if (filter.finishedSelection !== 'all')
			API += `&end_date${
				filter.finishedSelection === 'finished' ? '__lt' : '__gt'
			}=${new Date().toISOString()}`;

		// API += '&pinned=false';

		if (filter.tag) API += `&tag_id=${filter.tag}`;

		if (filter.workgroup) API += `&work_group_ids=${filter.workgroup}`;

		return API;
	};

	const getPolls = async () => {
		loading = true;
		polls = [];

		const { json, res } = await fetchRequest('GET', await getAPI());

		loading = false;

		if (!res.ok) {
			poppup = { message: 'Could not get polls', success: false };
			return;
		}

		polls = json.results;
		next = json.next;
		prev = json.previous;
	};

	const sharedThreadPollFixing = async () => {
		const pollIds = polls
			//@ts-ignore
			.map((poll) => (poll.related_model === 'poll' ? poll.id : undefined))
			.filter((id) => id !== undefined);
		//@ts-ignore
		const threadIds = polls
			//@ts-ignore
			.map((poll) => (poll.related_model === 'group_thread' ? poll.id : undefined))
			.filter((id) => id !== undefined);
		//@ts-ignore

		{
			console.log(pollIds, 'pollz');
			const { res, json } = await fetchRequest(
				'GET',
				`group/${$page.params.groupId}/poll/list?id_list=${pollIds.concat()}`
			);
		}

		{
			console.log(threadIds, 'Threads');

			const { res, json } = await fetchRequest(
				'GET',
				`group/thread/list?group_id=${
					$page.params.groupId
				}limit=1000&order_by=pinned,created_at_desc&id_list=${threadIds.concat()}`
			);
		}
	};

	onMount(async () => {
		await getPolls();
		sharedThreadPollFixing();
	});
</script>

<div class={`${Class} dark:text-darkmodeText`}>
	<Loader bind:loading>
		<div class={`flex flex-col gap-6 w-full`}>
			<PollFiltering
				tagFiltering={infoToGet === 'group'}
				handleSearch={async () => {
					await getPolls();
					// amendWithPinnedPolls();
					return {};
				}}
				bind:filter
			/>
			{#if polls.length === 0 && !loading}
				<div class="bg-white dark:bg-darkobject rounded shadow p-8 mt-6">
					{$_('No polls currently here')}
				</div>
			{:else}
				<!-- <h1 class="text-3xl text-left">Flow</h1> -->
				{#key polls}
					{#if polls && polls?.length > 0}
						{#each polls as poll}
							<PollThumbnail {poll} />
						{/each}
					{:else if !loading}
						<div class="bg-white rounded shadow p-8 dark:bg-darkobject">
							{$_('No polls currently here')}
						</div>
					{/if}
				{/key}
			{/if}
		</div>
		<Pagination
			bind:next
			bind:prev
			bind:iterable={polls}
			Class={'flex gap-2 justify-around w-full mt-6'}
		/>
	</Loader>
</div>

<Poppup bind:poppup />
