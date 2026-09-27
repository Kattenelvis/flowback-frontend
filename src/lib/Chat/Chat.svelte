<script lang="ts">
	import ChatWindow from './ChatWindow.svelte';
	import Preview from './Preview.svelte';
	import { onMount, tick } from 'svelte';
	import type { GroupMembers } from './interfaces';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faCog, faXmark } from '@fortawesome/free-solid-svg-icons';
	import ChatIcon from '$lib/assets/Chat_fill.svg';
	import { darkModeStore, getIconFilter } from '$lib/Generic/DarkMode';
	import { chatOpenStore, chatPartnerStore, previewStore } from './functions';
	import { goto } from '$app/navigation';
	import CreateChatGroup from '$lib/Chat/CreateChatGroup.svelte';
	import { isMobile } from '$lib/utils/isMobile';

	let chatOpen = false,
		selectedPage: 'direct' | 'group' = 'direct',
		isLookingAtOlderMessages = false,
		creatingGroup = false,
		groupMembers: GroupMembers[] = [],
		notification = false,
		headerHeight = 0,
		conversationTitle = '',
		// On small screens the chat list and the open conversation are tabs
		// instead of two columns side by side.
		tab: 'chats' | 'conversation' = 'chats';

	const iconButtonClass =
		'w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors';

	const tabClass = (active: boolean) =>
		`flex items-center justify-center gap-2 min-w-0 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
			active
				? 'bg-white text-primary shadow dark:bg-darkbackground dark:text-secondary'
				: 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
		}`;

	// On desktop the header is at the top, so the chat opens below it. On mobile
	// the chat covers the whole screen, bottom navigation bar included.
	const measureHeader = () => {
		headerHeight =
			document.querySelector('#header')?.getBoundingClientRect().height ?? 0;
	};

	const closeChat = () => {
		chatOpen = false;
		chatOpenStore.set(false);
	};

	// Show whatever was just opened: a conversation or the new group form.
	const syncTab = (creating: boolean, partner: number | null) => {
		tab = creating || partner ? 'conversation' : 'chats';
	};

	// A hidden tab can't keep its scroll position, so jump to the latest message
	// whenever the conversation tab is shown.
	const scrollToLatest = async () => {
		if (isLookingAtOlderMessages) return;
		await tick();
		document.querySelector('#chat-window')?.scroll(0, 100000);
	};

	onMount(() => {
		measureHeader();

		chatOpenStore.subscribe((open) => {
			chatOpen = open;
			if (open) measureHeader();
		});
	});

	$: syncTab(creatingGroup, $chatPartnerStore);
	$: if (tab === 'conversation') scrollToLatest();

	// Display purple notification circle whenever there is a message that hasn't been seen.
	$: notification = $previewStore.some(
		(p) => p.recent_message?.notified === false
	);
</script>

<svelte:head>
	<title>
		{`${notification ? '🟣' : ''}`}
	</title>
</svelte:head>

<svelte:window on:resize={measureHeader} />

<div
	class:invisible={!chatOpen}
	class="fixed inset-x-0 bottom-0 z-[115] md:z-50 flex flex-col bg-background dark:bg-darkbackground dark:text-darkmodeText"
	style:top={$isMobile ? '0px' : `${headerHeight}px`}
>
	<div
		class="w-full max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-6 pt-3 pb-2"
	>
		<h2 class="text-xl font-semibold text-primary dark:text-secondary">
			{$_('Chat')}
		</h2>
		<div class="flex items-center gap-1">
			<button
				type="button"
				class={iconButtonClass}
				title={$_('Chat settings')}
				aria-label={$_('Chat settings')}
				on:click={() => {
					closeChat();
					goto('/user/settings');
				}}
			>
				<Fa icon={faCog} />
			</button>
			<button
				type="button"
				class={iconButtonClass}
				title={$_('Close chat')}
				aria-label={$_('Close chat')}
				on:click={closeChat}
			>
				<Fa icon={faXmark} class="text-lg" />
			</button>
		</div>
	</div>

	{#if $isMobile}
		<div
			role="tablist"
			aria-label={$_('Chat')}
			class="mx-4 mb-3 grid grid-cols-2 gap-1 p-1 rounded-full bg-gray-200 dark:bg-darkobject"
		>
			<button
				type="button"
				role="tab"
				aria-selected={tab === 'chats'}
				class={tabClass(tab === 'chats')}
				on:click={() => (tab = 'chats')}
			>
				{$_('Chats')}
				{#if notification}
					<span class="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
				{/if}
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={tab === 'conversation'}
				disabled={!creatingGroup && !$chatPartnerStore}
				class={tabClass(tab === 'conversation')}
				on:click={() => (tab = 'conversation')}
			>
				<span class="truncate">
					{creatingGroup
						? $_('New group')
						: conversationTitle || $_('Conversation')}
				</span>
			</button>
		</div>
	{/if}

	<div
		class="flex-1 min-h-0 w-full max-w-[1200px] mx-auto flex md:gap-6 md:px-6 md:pb-6"
	>
		<section
			class="w-full md:w-80 md:shrink-0 min-h-0 flex flex-col bg-white dark:bg-darkobject md:rounded-2xl md:shadow"
			class:hidden={$isMobile && tab !== 'chats'}
		>
			{#key creatingGroup}
				<Preview
					bind:creatingGroup
					bind:groupMembers
					onSelect={() => (tab = 'conversation')}
				/>
			{/key}
		</section>
		<section
			class="flex-1 min-w-0 min-h-0 flex flex-col bg-white dark:bg-darkobject md:rounded-2xl md:shadow"
			class:hidden={$isMobile && tab !== 'conversation'}
		>
			{#if creatingGroup}
				<CreateChatGroup bind:creatingGroup bind:groupMembers />
			{:else}
				<ChatWindow
					bind:selectedPage
					bind:isLookingAtOlderMessages
					bind:conversationTitle
				/>
			{/if}
		</section>
	</div>
</div>

<button
	on:click={() => {
		chatOpen = !chatOpen;
		chatOpenStore.set(chatOpen);
	}}
	class:small-notification={notification}
	class:hidden={chatOpen}
	class="dark:text-white transition-all fixed z-[105] md:z-50 bg-white dark:bg-darkobject shadow-md border p-5 bottom-24 md:bottom-6 ml-5 rounded-full cursor-pointer hover:shadow-xl hover:border-gray-400 active:shadow-2xl active:p-6"
>
	<img
		src={ChatIcon}
		class="text-white"
		style="filter: {getIconFilter(true, 'white', $darkModeStore)}"
		alt={chatOpen ? 'close chat' : 'open chat'}
	/>
</button>

<style>
	.small-notification:before {
		position: absolute;
		content: '';
		top: 0;
		right: 0;
		background-color: rgb(167, 139, 250);
		border-radius: 100%;
		padding: 10px;
		z-index: 10;
	}
</style>
