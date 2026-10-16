<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faCheck, faUserPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/Generic/Button.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import UserSearch from '$lib/Generic/UserSearch.svelte';
	import type { User } from '$lib/User/interfaces';
	import { ChatApiError } from './api';
	import { createGroupChat } from './store';

	let { creatingGroup = $bindable() }: { creatingGroup: boolean } = $props();

	let title = $state(''),
		members: User[] = $state([]),
		showUsers = $state(false),
		submitting = $state(false);

	const create = async () => {
		if (members.length === 0) {
			ErrorHandlerStore.set({
				message: 'Add at least one other person to the group chat',
				success: false
			});
			return;
		}

		submitting = true;
		try {
			await createGroupChat(
				title,
				members.map((m) => m.id)
			);
			creatingGroup = false;
			ErrorHandlerStore.set({
				message: 'Successfully created group chat',
				success: true
			});
		} catch (error) {
			ErrorHandlerStore.set({
				message:
					error instanceof ChatApiError
						? error.message
						: 'Failed to create group chat',
				success: false
			});
		} finally {
			submitting = false;
		}
	};

	const addMember = (user: User) => {
		if (!members.some((m) => m.id === user.id)) members = [...members, user];
	};

	const removeMember = (id: number) => {
		members = members.filter((member) => member.id !== id);
	};
</script>

<form
	class="flex flex-col flex-1 min-h-0"
	onsubmit={(e) => {
		e.preventDefault();
		create();
	}}
>
	<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
		<h3 class="font-semibold">{$_('New group chat')}</h3>
	</div>

	<div class="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-6">
		<TextInput autofocus required bind:value={title} label="Chatgroup Name" max={255} />

		<div>
			<div class="flex items-center justify-between gap-3 mb-3">
				<p>
					{$_('Members')}
					<span class="text-gray-400">({members.length})</span>
				</p>
				<button
					type="button"
					class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors bg-blue-50 text-primary hover:bg-blue-100 active:bg-blue-200 dark:bg-gray-700 dark:text-secondary dark:hover:bg-gray-600"
					onclick={() => (showUsers = true)}
				>
					<Fa icon={faUserPlus} />
					{$_('Add members')}
				</button>
			</div>

			{#if members.length === 0}
				<p
					class="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center text-sm text-gray-500 dark:text-gray-400"
				>
					{$_('Add the people you want in this group chat.')}
				</p>
			{:else}
				<ul class="flex flex-wrap gap-2">
					{#each members as member (member.id)}
						<li
							class="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-darkbackground py-1 pl-1 pr-2"
						>
							<ProfilePicture profilePicture={member.profile_image} size={1} />
							<span class="text-sm">{member.username}</span>
							<button
								type="button"
								class="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
								aria-label={`${$_('Remove')} ${member.username}`}
								onclick={() => removeMember(member.id)}
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
			onClick={() => (creatingGroup = false)}>{$_('Cancel')}</Button
		>
		<Button type="submit" Class="!rounded-full px-5" disabled={submitting}
			>{$_('Create group')}</Button
		>
	</div>
</form>

<UserSearch bind:showUsers showTrigger={false} showSelf={false} title="Add members">
	<div slot="action" let:item>
		{#if members.some((member) => member.id === item.id)}
			<span class="flex items-center gap-1 text-sm text-gray-400">
				<Fa icon={faCheck} />
				{$_('Added')}
			</span>
		{:else}
			<Button type="button" Class="!rounded-full px-4" onClick={() => addMember(item)}
				>{$_('Add')}</Button
			>
		{/if}
	</div>
</UserSearch>
