<script lang="ts">
	import { _ } from 'svelte-i18n';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { channelTitle } from './format';
	import { acceptInvite, declineInvite } from './store';
	import type { Channel } from './types';

	let { channel }: { channel: Channel } = $props();

	let busy = $state(false);

	const respond = async (accept: boolean) => {
		busy = true;
		await (accept ? acceptInvite(channel.id) : declineInvite(channel.id));
		busy = false;
	};
</script>

<div
	class="px-3 py-2.5 mb-1 rounded-xl border border-gray-200 dark:border-gray-700"
>
	<div class="flex items-center gap-3">
		<ProfilePicture profilePicture={channel.other_user?.profile_image} />
		<div class="min-w-0 flex-1">
			<p class="font-medium text-sm truncate">{channelTitle(channel)}</p>
			<p class="text-xs text-gray-400 truncate">
				{#if channel.kind === 'user'}
					{$_('Wants to send you messages')}
				{:else if channel.invited_by}
					{$_('Invited by')} {channel.invited_by.username}
				{:else}
					{$_('Group chat invite')}
				{/if}
			</p>
		</div>
	</div>
	<div class="flex justify-end gap-2 mt-2">
		<button
			type="button"
			disabled={busy}
			class="rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
			onclick={() => respond(false)}
		>
			{$_('Decline')}
		</button>
		<button
			type="button"
			disabled={busy}
			class="rounded-full px-3 py-1.5 text-sm font-medium text-white bg-primary hover:brightness-90 disabled:opacity-50"
			onclick={() => respond(true)}
		>
			{$_('Accept')}
		</button>
	</div>
</div>
