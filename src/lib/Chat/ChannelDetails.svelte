<script lang="ts">
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faCheck, faUserPlus } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/Generic/Button.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import UserSearch from '$lib/Generic/UserSearch.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { chatApi } from './api';
	import LeaveChannelModal from './LeaveChannelModal.svelte';
	import { inviteToChannel, renameChannel } from './store';
	import type { Channel, ChannelMember } from './types';

	type Props = {
		channel: Channel;
		open: boolean;
	};

	let { channel, open = $bindable() }: Props = $props();

	let members: ChannelMember[] = $state([]),
		title = $state(''),
		showUserSearch = $state(false),
		invitedIds: number[] = $state([]),
		leaving: Channel | null = $state(null);

	const loadMembers = async () => {
		try {
			members = (await chatApi.listMembers(channel.id)).results;
		} catch {
			members = [];
		}
	};

	// The channel object changes with every new message, so only react to what matters here
	let memberCount = $derived(channel.member_count);
	let channelId = $derived(channel.id);

	// Refresh whenever the modal opens, or people join or leave while it's open
	$effect(() => {
		if (!open) return;
		memberCount;
		untrack(loadMembers);
	});

	// Fill in the current name when the modal opens, without overwriting what the user types
	$effect(() => {
		if (!open) return;
		channelId;
		untrack(() => (title = channel.title ?? ''));
	});

	const rename = async () => {
		if (!title.trim()) return;
		if (await renameChannel(channel.id, title))
			ErrorHandlerStore.set({ message: 'Chat renamed', success: true });
	};

	const invite = async (userId: number) => {
		if (await inviteToChannel(channel.id, [userId])) {
			invitedIds = [...invitedIds, userId];
			loadMembers();
		}
	};

	const isMember = (userId: number) =>
		invitedIds.includes(userId) || members.some((m) => m.user.id === userId);
</script>

<Modal bind:open Class="max-w-sm">
	<div slot="header">{$_('Participants')}</div>
	<div slot="body" class="flex flex-col gap-4 text-left">
		{#if members.length > 0}
			<ul class="flex flex-col gap-2 max-h-64 overflow-y-auto">
				{#each members as member (member.user.id)}
					<li class="flex items-center justify-between gap-2">
						<ProfilePicture
							displayName
							username={member.user.username}
							profilePicture={member.user.profile_image}
						/>
						{#if member.status === 'invited'}
							<span class="text-xs text-gray-400">{$_('Invited')}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p>{$_('No participants found.')}</p>
		{/if}

		{#if channel.can_invite}
			<Button
				Class="flex items-center justify-center gap-2 !rounded-full"
				buttonStyle="secondary"
				onClick={() => {
					invitedIds = [];
					open = false;
					showUserSearch = true;
				}}
			>
				<Fa icon={faUserPlus} />
				{$_('Add members')}
			</Button>
		{/if}

		{#if channel.can_rename}
			<!-- Not a <form>: the modal already wraps its body in one -->
			<div class="flex flex-col gap-2">
				<TextInput bind:value={title} label="Chatgroup Name" max={255} />
				<Button type="button" disabled={!title.trim()} onClick={rename}
					>{$_('Save')}</Button
				>
			</div>
		{/if}

		{#if channel.can_leave}
			<Button
				buttonStyle="warning-light"
				onClick={() => {
					open = false;
					leaving = channel;
				}}>{$_('Leave group')}</Button
			>
		{/if}
	</div>
</Modal>

<UserSearch bind:showUsers={showUserSearch} showTrigger={false} showSelf={false} title="Add members">
	<div slot="action" let:item>
		{#if isMember(item.id)}
			<span class="flex items-center gap-1 text-sm text-gray-400">
				<Fa icon={faCheck} />
				{$_('Added')}
			</span>
		{:else}
			<Button type="button" Class="!rounded-full px-4" onClick={() => invite(item.id)}
				>{$_('Add')}</Button
			>
		{/if}
	</div>
</UserSearch>

<LeaveChannelModal bind:channel={leaving} />
