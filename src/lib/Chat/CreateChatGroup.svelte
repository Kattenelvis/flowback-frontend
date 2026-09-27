<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import { _ } from 'svelte-i18n';
	import type { GroupMembers } from './interfaces';
	import { userStore, type User } from '$lib/User/interfaces';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import UserSearch from '$lib/Generic/UserSearch.svelte';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { chatPartnerStore } from './functions';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import Fa from 'svelte-fa';
	import { faCheck, faUserPlus, faXmark } from '@fortawesome/free-solid-svg-icons';

	export let creatingGroup: boolean,
		groupMembers: GroupMembers[] = [];

	let title = '',
		showUsers = false;

	const groupChatCreate = async () => {
		const { res, json } = await fetchRequest(
			'GET',
			`user/chat?is_group=true&title=${encodeURIComponent(title)}&target_user_ids=${$userStore?.id || -1}&${groupMembers
				.map((member) => `target_user_ids=${member.id}`)
				.join('&')}`
		);

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Failed to created group chat',
				success: false
			});
			return;
		}

		//Poppup doesn't work because this goes to false
		//TODO: Redo the poppup system to have a poppup queue that's always rendered and which is accessed via svelte store
		creatingGroup = false;
		groupMembers = [];
		ErrorHandlerStore.set({
			message: 'Successfully created group chat',
			success: true
		});

		chatPartnerStore.set(json.id);
	};

	const cancelGroupChatCreate = () => {
		creatingGroup = false;
		groupMembers = [];
	};

	// Only id, username and profile_image are used from a member
	const addMember = (user: User) => {
		if (groupMembers.some((m) => m.id === user.id)) return;
		groupMembers = [...groupMembers, user as unknown as GroupMembers];
	};

	const removeMember = (id: number) => {
		groupMembers = groupMembers.filter((member) => member.id !== id);
	};
</script>

<form
	class="flex flex-col flex-1 min-h-0"
	on:submit|preventDefault={groupChatCreate}
>
	<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
		<h3 class="font-semibold">{$_('New group chat')}</h3>
	</div>

	<div class="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-6">
		<TextInput autofocus required bind:value={title} label="Chatgroup Name" />

		<div>
			<div class="flex items-center justify-between gap-3 mb-3">
				<p>
					{$_('Members')}
					<span class="text-gray-400">({groupMembers.length})</span>
				</p>
				<button
					type="button"
					class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors bg-blue-50 text-primary hover:bg-blue-100 active:bg-blue-200 dark:bg-gray-700 dark:text-secondary dark:hover:bg-gray-600"
					on:click={() => (showUsers = true)}
				>
					<Fa icon={faUserPlus} />
					{$_('Add members')}
				</button>
			</div>

			{#if groupMembers.length === 0}
				<p
					class="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center text-sm text-gray-500 dark:text-gray-400"
				>
					{$_('Add the people you want in this group chat.')}
				</p>
			{:else}
				<ul class="flex flex-wrap gap-2">
					{#each groupMembers as member (member.id)}
						<li
							class="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-darkbackground py-1 pl-1 pr-2"
						>
							<ProfilePicture profilePicture={member.profile_image} size={1} />
							<span class="text-sm">{member.username}</span>
							<button
								type="button"
								class="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
								aria-label={`${$_('Remove')} ${member.username}`}
								on:click={() => removeMember(member.id)}
							>
								<Fa icon={faXmark} class="text-xs" />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<div
		class="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700"
	>
		<Button
			buttonStyle="warning-light"
			Class="!rounded-full px-5"
			onClick={cancelGroupChatCreate}>{$_('Cancel')}</Button
		>
		<Button type="submit" Class="!rounded-full px-5">{$_('Create group')}</Button>
	</div>
</form>

<UserSearch bind:showUsers showTrigger={false} showSelf={false} title="Add members">
	<div slot="action" let:item>
		{#if groupMembers.some((member) => member.id === item.id)}
			<span class="flex items-center gap-1 text-sm text-gray-400">
				<Fa icon={faCheck} />
				{$_('Added')}
			</span>
		{:else}
			<Button
				type="button"
				Class="!rounded-full px-4"
				onClick={() => addMember(item)}>{$_('Add')}</Button
			>
		{/if}
	</div>
</UserSearch>
