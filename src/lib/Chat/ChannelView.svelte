<script lang="ts">
	import { tick } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faComments, faUsers } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/Generic/Button.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import TextSend from '$lib/Generic/TextSend.svelte';
	import ChannelDetails from './ChannelDetails.svelte';
	import MessageItem from './MessageItem.svelte';
	import { channelTitle } from './format';
	import {
		acceptInvite,
		chatState,
		declineInvite,
		deleteMessage,
		loadOlderMessages,
		selectedChannel,
		selectedMessages,
		sendMessage
	} from './store';

	// Whether the conversation is on screen, so it can scroll to the newest message when shown
	let { visible }: { visible: boolean } = $props();

	let draft = $state(''),
		detailsOpen = $state(false),
		loadingOlder = $state(false),
		listElement: HTMLUListElement | undefined = $state(),
		editingId: number | null = $state(null),
		// The message to confirm deleting
		deletingId: number | null = $state(null),
		deleteModalOpen = $state(false),
		// Follow new messages unless the user has scrolled up to read older ones
		followNewest = true;

	let channel = $derived($selectedChannel);
	let messages = $derived($selectedMessages?.items ?? []);

	const scrollToNewest = async () => {
		await tick();
		if (listElement) listElement.scrollTop = listElement.scrollHeight;
	};

	const onScroll = () => {
		if (!listElement) return;
		const { scrollTop, clientHeight, scrollHeight } = listElement;
		followNewest = scrollHeight - scrollTop - clientHeight < 80;
	};

	// Opening another chat starts at its newest message
	let channelId = $derived(channel?.id);
	$effect(() => {
		channelId;
		followNewest = true;
		draft = '';
		editingId = null;
		scrollToNewest();
	});

	$effect(() => {
		messages;
		if (visible && followNewest) scrollToNewest();
	});

	const showOlder = async () => {
		if (!channel || !listElement || loadingOlder) return;
		loadingOlder = true;

		// Keep the messages the user is looking at in place as older ones are added above
		const fromBottom = listElement.scrollHeight - listElement.scrollTop;
		try {
			await loadOlderMessages(channel.id);
			await tick();
			if (listElement) listElement.scrollTop = listElement.scrollHeight - fromBottom;
		} catch {
			// The button stays, so the user can try again
		} finally {
			loadingOlder = false;
		}
	};

	const confirmDelete = () => {
		if (channel && deletingId !== null) deleteMessage(channel.id, deletingId);
		deleteModalOpen = false;
	};

	const send = () => {
		if (!channel || !draft.trim()) return;
		followNewest = true;
		sendMessage(channel.id, draft);
		draft = '';
	};
</script>

{#if channel}
	<div class="flex flex-col flex-1 min-h-0">
		<div
			class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
		>
			<div class="min-w-0 flex-1">
				<h3 class="font-semibold truncate">{channelTitle(channel)}</h3>
				{#if channel.kind !== 'user'}
					<p class="text-xs text-gray-400">
						{channel.member_count}
						{channel.member_count === 1 ? $_('participant') : $_('participants')}
					</p>
				{/if}
			</div>
			{#if !$chatState.connected}
				<span class="text-xs text-gray-400">{$_('Reconnecting...')}</span>
			{/if}
			<button
				type="button"
				class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-gray-100 active:bg-gray-200 dark:text-secondary dark:hover:bg-gray-700"
				title={$_('Participants')}
				aria-label={$_('Participants')}
				onclick={() => (detailsOpen = true)}
			>
				<Fa icon={faUsers} class="text-lg" />
			</button>
		</div>

		{#if channel.status === 'invited'}
			<div
				class="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center"
			>
				<p>
					{#if channel.invited_by}
						{$_('Invited by')} {channel.invited_by.username}
					{:else}
						{$_('Group chat invite')}
					{/if}
				</p>
				<div class="flex gap-2">
					<Button onClick={() => acceptInvite(channel.id)}>{$_('Accept')}</Button>
					<Button buttonStyle="warning-light" onClick={() => declineInvite(channel.id)}
						>{$_('Decline')}</Button
					>
				</div>
			</div>
		{:else}
			<ul
				class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-3 break-word"
				id="chat-window"
				bind:this={listElement}
				onscroll={onScroll}
			>
				{#if $selectedMessages?.hasOlder}
					<li class="text-center my-4">
						<Button onClick={showOlder} disabled={loadingOlder}
							>{$_('Show older messages')}</Button
						>
					</li>
				{/if}
				{#if $selectedMessages?.loaded && messages.length === 0}
					<li class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
						{$_('Chat is currently empty, maybe say hello?')}
					</li>
				{/if}
				{#each messages as message (message.pending ? `draft-${message.client_id}` : message.id)}
					<MessageItem
						{message}
						showAuthor={channel.kind !== 'user'}
						editing={editingId === message.id && !message.pending}
						onEditChange={(editing) => (editingId = editing ? message.id : null)}
						onDelete={() => {
							deletingId = message.id;
							deleteModalOpen = true;
						}}
					/>
				{/each}
			</ul>
			<div class="border-t border-gray-200 dark:border-gray-700 w-full p-2">
				<TextSend
					bind:value={draft}
					autofocus
					sendOnEnter
					max={2000}
					maxHeight={120}
					placeholder="Write a message..."
					onSend={send}
				/>
			</div>
		{/if}
	</div>

	<ChannelDetails {channel} bind:open={detailsOpen} />

	<!-- stopAtPropagation off: clicking the dialog's text shouldn't dismiss it -->
	<Modal
		bind:open={deleteModalOpen}
		stopAtPropagation={false}
		onClose={() => (deletingId = null)}
		buttons={[
			{ label: 'Cancel', type: 'default', onClick: () => (deleteModalOpen = false) },
			{ label: 'Delete', type: 'warning', onClick: confirmDelete }
		]}
	>
		<span slot="header">{$_('Delete message')}</span>
		<span slot="body">{$_('Are you sure you want to delete this message?')}</span>
	</Modal>
{:else}
	<div
		class="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-500 dark:text-gray-400"
	>
		<Fa icon={faComments} class="text-4xl text-gray-300 dark:text-gray-600" />
		<p class="font-medium text-gray-700 dark:text-darkmodeText">
			{$_('No chat selected')}
		</p>
		<p class="text-sm">{$_('Pick a conversation or start a new one.')}</p>
	</div>
{/if}
