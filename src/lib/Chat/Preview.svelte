<script lang="ts">
	import { type GroupMembers, type invite, type PreviewMessage } from './interfaces';
	import { fetchRequest } from '$lib/FetchRequest';
	import type { Group } from '$lib/Group/interface';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { onMount } from 'svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import { chatPartnerStore } from './functions';
	import Button from '$lib/Generic/Button.svelte';
	import { _ } from 'svelte-i18n';

	let chatSearch = '';

	export let selectedChat: number | null,
		selectedChatChannelId: number | null,
		creatingGroup: boolean,
		previewDirect: PreviewMessage[] = [],
		inviteList: invite[] = [],
		groupMembers: GroupMembers[] = [];

	// Handle chat selection and clear notifications
	const clickedChatter = async (chatterId: any) => {
		let message = previewDirect.find((message) => message.channel_id === chatterId);
		if (message) {
			message.timestamp = new Date().toString();
			message.notified = false;
			previewDirect = previewDirect;
		}

		selectedChat = chatterId;
		chatPartnerStore.set(chatterId);
		selectedChatChannelId = chatterId;
	};

	// Sort chats by notification status
	const sort = (chatter: Group[] | any[], preview: PreviewMessage[]) => {
		return chatter.sort((a, b) => {
			let notifiedMsgA = preview.find(
				(notified) => notified.channel_id === (a.chat_id || a.channel_id)
			);
			let notifiedMsgB = preview.find(
				(notified) => notified.channel_id === (b.chat_id || b.channel_id)
			);
			let notifiedA = notifiedMsgA?.notified || false;
			let notifiedB = notifiedMsgB?.notified || false;
			if (notifiedA === notifiedB) return 0;
			return notifiedA ? -1 : 1;
		});
	};

	// Fetch chat invites
	const UserChatInviteList = async () => {
		const { res, json } = await fetchRequest('GET', `user/chat/invite/list`);
		if (!res.ok) return;
		inviteList = json?.results;
	};

	// Accept or reject chat invites
	const UserChatInvite = async (accept: boolean, invite_id: number) => {
		const { res, json } = await fetchRequest('POST', `user/chat/invite`, {
			invite_id,
			accept
		});
		if (!res.ok) return;
		inviteList = inviteList.map((invitee) => {
			if (invitee.id === invite_id) invitee.rejected = !accept;
			return invitee;
		});
	};

	// Update chat title
	const updateChatTitle = async () => {
		// if (selectedChatChannelId) {
		// 	await fetchRequest('POST', 'user/chat/update', {
		// 		channel_id: selectedChatChannelId,
		// 		title: 'chat example'
		// 	});
		// }
	};

	onMount(async () => {
		await UserChatInviteList();

		chatPartnerStore.subscribe((partner) => {
			if (partner === null) return;
			// selectedPage = 'direct';
			selectedChat = partner;
			selectedChatChannelId = partner;
			clickedChatter(partner);
		});
	});

	$: if (selectedChatChannelId) updateChatTitle();

</script>

<div class="max-h-[100%] pb-2">
	<div class="border-b-2 w-full">
		<TextInput
			placeholder={'Search chatters'}
			label=""
			max={null}
			bind:value={chatSearch}
			inputClass="mt-4 mb-2 placeholder-gray-600 py-1 pl-2 text-gray-500 border-0 bg-gray-100 dark:bg-darkobject"
		/>
	</div>

	<div class="flex justify-center">
		<Button
			Class="my-2"
			onClick={() => {
				creatingGroup = true;
				groupMembers = []; // Reset groupMembers
			}}
		>
			{$_('+ New Group')}
		</Button>
	</div>

	{#if inviteList}
		{#each inviteList as groupChat}
			{#if !groupChat.rejected && groupChat?.title?.split(',')?.length > 2}
				{#if groupChat.rejected === null}
					<span>{$_("You've been invited to this chat:")}</span>
					<Button onClick={() => UserChatInvite(true, groupChat.id)}>{$_('Accept')}</Button>
					<Button onClick={() => UserChatInvite(false, groupChat.id)}>{$_('Deny')}</Button>
				{/if}
				<button
					class="w-full transition transition-color p-3 flex items-center gap-3 cursor-pointer dark:bg-darkobject"
					class:dark:bg-gray-700={selectedChat === groupChat.message_channel_id}
					class:dark:hover:bg-darkbackground={groupChat.rejected === false}
					class:hover:bg-gray-200={groupChat.rejected === false}
					class:active:bg-gray-500={groupChat.rejected === false}
					class:bg-gray-200={selectedChat === groupChat.message_channel_id}
					on:click={() => {
						if (groupChat.rejected === false) clickedChatter(groupChat.message_channel_id);
					}}
					disabled={groupChat.rejected === null}
				>
					<ProfilePicture username={groupChat.message_channel_name} profilePicture={null} />
					<div class="flex flex-col max-w-[40%]">
						<span class="max-w-full text-left overflow-x-hidden overflow-ellipsis">
							{groupChat.message_channel_name}
						</span>
						<span class="text-gray-400 text-sm truncate h-[20px] overflow-x-hidden max-w-[10%]" />
					</div>
				</button>
			{/if}
		{/each}
	{/if}
	{#each previewDirect as chatter}
		{#if chatter.channel_title?.includes(chatSearch) || (chatter.channel_origin_name === 'user' && creatingGroup)}
			<button
				class="w-full transition transition-color p-3 flex items-center gap-3 hover:bg-gray-200 active:bg-gray-500 cursor-pointer dark:bg-darkobject dark:hover:bg-darkbackground"
				class:bg-gray-200={selectedChat === chatter.channel_id}
				class:dark:bg-gray-700={selectedChat === chatter.channel_id}
				on:click={() => clickedChatter(chatter.channel_id)}
			>
				{#if chatter?.notified}
					<div class="p-1 rounded-full bg-purple-300" />
				{/if}

				<ProfilePicture profilePicture={chatter?.profile_image} />
				<div class="flex flex-col max-w-[40%]">
					<span class="max-w-full text-left overflow-x-hidden overflow-ellipsis">
						<!-- {chatter?.user.username} -->
						{chatter.channel_title || 'Name not found'}
					</span>
					<span class="text-gray-400 text-sm h-[20px]">
						{chatter?.message || ''}
					</span>
				</div>
			</button>
			{#if creatingGroup}
				<div>
					<Button
						onClick={() => {
							if (groupMembers.some((member) => member.id === chatter.id)) {
								return;
							}
							const newMember = {
								id: chatter.id,
								username: chatter.target_username || 'Unknown',
								profile_image: chatter.profile_image || null
							};
							//@ts-ignore
							groupMembers = [...groupMembers, newMember];
						}}
					>
						{$_('Add User')}
					</Button>
				</div>
			{/if}
		{/if}
	{/each}
</div>
