<script lang="ts">
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import {
		faPaperPlane,
		faPenToSquare,
		faUserGroup
	} from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/Generic/Button.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import UserSearch from '$lib/Generic/UserSearch.svelte';
	import ChannelRow from './ChannelRow.svelte';
	import InviteRow from './InviteRow.svelte';
	import LeaveChannelModal from './LeaveChannelModal.svelte';
	import {
		channelList,
		chatState,
		invites,
		loadMoreChannels,
		openDirectChat,
		searchChannels,
		selectChannel
	} from './store';
	import type { Channel } from './types';

	type Props = {
		creatingGroup: boolean;
		// Called when the user picks a chat, so the parent can show it
		onSelect?: () => void;
	};

	let { creatingGroup = $bindable(), onSelect = () => {} }: Props = $props();

	let search = $state(''),
		// Ids of the chats matching the search, looked up on the server
		searchResultIds = $state<number[] | null>(null),
		openUserSearch = $state(false),
		leaving = $state<Channel | null>(null),
		listElement = $state<HTMLDivElement>();

	const startButtonClass =
		'flex items-center justify-center gap-2 min-w-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors bg-blue-50 text-primary hover:bg-blue-100 active:bg-blue-200 dark:bg-gray-700 dark:text-secondary dark:hover:bg-gray-600';

	// Search results are read from the store so they stay live
	let searchResults = $derived(
		searchResultIds
			?.map((id) => $chatState.channels[id])
			.filter((c): c is Channel => !!c) ?? []
	);
	let shownChannels = $derived(
		searchResultIds ? searchResults.filter((c) => c.status === 'active') : $channelList
	);
	let shownInvites = $derived(
		searchResultIds ? searchResults.filter((c) => c.status === 'invited') : $invites
	);

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	// Runs on typing and when the search box's clear button empties it
	$effect(() => {
		search;
		untrack(onSearch);
	});

	function onSearch() {
		clearTimeout(searchTimer);
		const query = search.trim();
		if (!query) {
			searchResultIds = null;
			return;
		}

		searchTimer = setTimeout(async () => {
			const results = await searchChannels(query).catch(() => []);
			// Ignore answers to searches the user has typed past
			if (search.trim() === query) searchResultIds = results.map((c) => c.id);
		}, 250);
	}

	const pick = (channelId: number) => {
		selectChannel(channelId);
		onSelect();
	};

	const startDirectMessage = async (userId: number) => {
		openUserSearch = false;
		await openDirectChat(userId);
		onSelect();
	};

	const onScroll = () => {
		if (!listElement || searchResultIds) return;
		const { scrollTop, clientHeight, scrollHeight } = listElement;
		if (scrollTop + clientHeight >= scrollHeight - 40) loadMoreChannels();
	};
</script>

<div class="flex flex-col h-full min-h-0">
	<div
		class="p-3 flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700"
	>
		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				class={startButtonClass}
				onclick={() => (openUserSearch = true)}
			>
				<Fa icon={faPenToSquare} />
				<span class="truncate">{$_('New message')}</span>
			</button>
			<button
				type="button"
				class={startButtonClass}
				onclick={() => (creatingGroup = true)}
			>
				<Fa icon={faUserGroup} />
				<span class="truncate">{$_('New group')}</span>
			</button>
		</div>

		<TextInput
			search
			placeholder={'Search chatters'}
			label=""
			max={null}
			bind:value={search}
			inputClass="py-2 rounded-full border-0 bg-gray-100 placeholder-gray-500 dark:bg-darkbackground"
		/>
	</div>

	<div
		bind:this={listElement}
		class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2"
		onscroll={onScroll}
	>
		{#if shownInvites.length > 0}
			<p
				class="text-xs font-medium uppercase tracking-wide text-gray-400 px-3 pt-1 pb-2"
			>
				{$_('Invites')}
			</p>
			{#each shownInvites as channel (channel.id)}
				<InviteRow {channel} />
			{/each}
		{/if}

		{#each shownChannels as channel (channel.id)}
			<ChannelRow
				{channel}
				selected={$chatState.selectedId === channel.id}
				onSelect={() => pick(channel.id)}
				onLeave={() => (leaving = channel)}
			/>
		{/each}

		{#if shownChannels.length === 0 && shownInvites.length === 0 && ($chatState.channelsLoaded || searchResultIds)}
			<div
				class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
			>
				{#if searchResultIds}
					{$_('No chats match your search')}
				{:else}
					<p class="font-medium text-gray-700 dark:text-darkmodeText">
						{$_('No conversations yet')}
					</p>
					<p class="mt-1">{$_('Start one with New message or New group.')}</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<UserSearch
	bind:showUsers={openUserSearch}
	showTrigger={false}
	title="New message"
	label="Find a user"
>
	<div slot="action" let:item>
		<Button
			Class="flex items-center gap-2 !rounded-full px-4"
			onClick={() => startDirectMessage(item.id)}
		>
			<Fa icon={faPaperPlane} />
			{$_('Message')}
		</Button>
	</div>
</UserSearch>

<LeaveChannelModal bind:channel={leaving} />
