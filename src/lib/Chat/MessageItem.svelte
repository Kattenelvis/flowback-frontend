<script lang="ts">
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
	import { userStore } from '$lib/User/interfaces';
	import { infoText } from './format';
	import { discardMessage, editMessage, retryMessage } from './store';
	import type { ChatMessage } from './types';

	type Props = {
		message: ChatMessage;
		// Show who wrote it; not needed in a direct message
		showAuthor: boolean;
		// Only one message is edited at a time, so the parent keeps track of which
		editing: boolean;
		onEditChange: (editing: boolean) => void;
		onDelete: () => void;
	};

	let { message, showAuthor, editing, onEditChange, onDelete }: Props =
		$props();

	let editText = $state('');

	let ownMessage = $derived(message.user.id === $userStore?.id);
	let sentAt = $derived(new Date(message.created_at));
	// Messages still being sent have no id on the server to edit or delete yet
	let canChange = $derived(
		ownMessage && message.type === 'message' && !message.pending
	);
	// created_at and updated_at are set a few microseconds apart when a message is created
	let edited = $derived(
		new Date(message.updated_at).getTime() - sentAt.getTime() > 1000
	);

	// Start from the current text when editing begins, without resetting it while typing
	$effect(() => {
		if (editing) untrack(() => (editText = message.message));
	});

	const saveEdit = () => {
		const text = editText.trim();
		if (!text) return;
		if (text === message.message || editMessage(message.channel_id, message.id, text))
			onEditChange(false);
	};

	const onEditKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') onEditChange(false);
		else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			saveEdit();
		}
	};

	const focus = (node: HTMLTextAreaElement) => {
		node.focus();
		node.setSelectionRange(node.value.length, node.value.length);
	};
</script>

{#if message.type === 'info'}
	<li class="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
		{infoText(message, $_)}
	</li>
{:else}
	<li
		class="group px-4 py-1.5 max-w-[80%]"
		class:w-fit={!editing}
		class:w-full={editing}
		class:ml-auto={ownMessage}
	>
		<div class="flex items-center gap-2">
			{#if showAuthor && !ownMessage}
				<span class="text-sm">{message.user.username}</span>
			{/if}
			{#if canChange && !editing}
				<!-- Shown on hover where there's a mouse, always on touch screens -->
				<div
					class="ml-auto flex gap-1 text-gray-400 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-within:opacity-100"
				>
					<button
						type="button"
						class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700 dark:hover:text-secondary"
						title={$_('Edit message')}
						aria-label={$_('Edit message')}
						onclick={() => onEditChange(true)}
					>
						<Fa icon={faPen} size="xs" />
					</button>
					<button
						type="button"
						class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
						title={$_('Delete message')}
						aria-label={$_('Delete message')}
						onclick={onDelete}
					>
						<Fa icon={faTrash} size="xs" />
					</button>
				</div>
			{/if}
		</div>

		{#if editing}
			<div class="flex flex-col gap-1">
				<textarea
					class="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-darkobject resize-none"
					rows="2"
					maxlength="2000"
					aria-label={$_('Edit message')}
					bind:value={editText}
					onkeydown={onEditKeydown}
					use:focus
				></textarea>
				<div class="flex justify-end gap-2 text-sm">
					<button
						type="button"
						class="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
						onclick={() => onEditChange(false)}
					>
						{$_('Cancel')}
					</button>
					<button
						type="button"
						class="px-2 py-1 rounded bg-primary text-white disabled:opacity-50"
						disabled={!editText.trim()}
						onclick={saveEdit}
					>
						{$_('Save')}
					</button>
				</div>
			</div>
		{:else}
			<p
				class="p-2 rounded-xl break-words whitespace-pre-wrap"
				class:bg-primary={ownMessage}
				class:text-white={ownMessage}
				class:dark:bg-gray-600={ownMessage}
				class:bg-gray-300={!ownMessage}
				class:dark:bg-gray-500={!ownMessage}
				class:opacity-60={message.pending === 'sending'}
			>
				{message.message}
			</p>
		{/if}

		<div class="flex gap-2 justify-end text-xs text-gray-400 mt-0.5 px-1">
			{#if message.pending === 'sending'}
				<span>{$_('Sending...')}</span>
			{:else if message.pending === 'failed' && message.client_id}
				{@const clientId = message.client_id}
				<span class="text-red-500">{$_('Not sent')}</span>
				<button
					type="button"
					class="underline hover:text-primary"
					onclick={() => retryMessage(message.channel_id, clientId)}
				>
					{$_('Retry')}
				</button>
				<button
					type="button"
					class="underline hover:text-red-500"
					onclick={() => discardMessage(message.channel_id, clientId)}
				>
					{$_('Discard')}
				</button>
			{:else}
				{#if edited}
					<span>{$_('(edited)')}</span>
				{/if}
				<time datetime={message.created_at} title={sentAt.toLocaleString()}>
					{sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
				</time>
			{/if}
		</div>
	</li>
{/if}
