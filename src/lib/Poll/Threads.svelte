<script lang="ts">
	import { page } from '$app/stores';
	import { fetchRequest } from '$lib/FetchRequest';
	import { onMount } from 'svelte';
	import Pagination from '$lib/Generic/Pagination.svelte';
	import Poppup from '$lib/Generic/Poppup.svelte';
	import type { poppup } from '$lib/Generic/Poppup';
	import { threads as threadsLimit } from '$lib/Generic/APILimits.json';
	import { _ } from 'svelte-i18n';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import ThreadThumbnail from './Thread.svelte';
	import type { Thread } from '$lib/Group/interface';

	let threads: Thread[] = [],
		prev = '',
		next = '',
		poppup: poppup,
		searchQuery = '',
		searched = true,
		workGroups: any[] = [];

	const getThreads = async () => {
		let url = `group/thread/list?group_ids=${$page.params.groupId}&limit=${threadsLimit}&order_by=pinned,created_at_desc`;
		if (searchQuery) {
			url += `&title__icontains=${searchQuery}`;
		}

		const { res, json } = await fetchRequest('GET', url);

		if (!res.ok) {
			poppup = { message: 'Could not get threads', success: false };
			return;
		}

		next = json.next;
		prev = json.previous;
		threads = json.results;
	};

	const handleSearch = () => {
		searched = true;
		getThreads();
	};

	onMount(() => {
		getThreads();
	});
</script>

<div>
	<form
		class="bg-white dark:bg-darkobject dark:text-darkmodeText shadow rounded p-4 flex items-end w-full gap-4 mb-6"
		on:submit|preventDefault={handleSearch}
	>
		<TextInput
			Class="w-4/5"
			onInput={() => (searched = false)}
			label={$_('Search')}
			bind:value={searchQuery}
		/>

		<!-- <Button
			Class={`w-8 h-8 ml-4 !p-1 flex justify-center items-center ${
				searched ? 'bg-blue-300' : 'bg-blue-600'
			}`}
			type="submit"
		>
			<Fa icon={faMagnifyingGlass} />
		</Button> -->
	</form>

	{#if threads.length === 0}
		<div
			class="bg-white dark:bg-darkobject dark:text-darkmodeText p-6 shadow-lg rounded-md mb-6 text-center"
		>
			{$_('There are currently no threads in this group')}
		</div>
	{/if}
	{#each threads as thread}
		<ThreadThumbnail {thread} />
	{/each}
	<Pagination bind:prev bind:next bind:iterable={threads} />
</div>

<Poppup bind:poppup />
