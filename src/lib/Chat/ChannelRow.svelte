<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { userStore } from '$lib/User/interfaces';
	import { channelTitle, previewText } from './format';
	import type { Channel } from './types';

	type Props = {
		channel: Channel;
		selected: boolean;
		onSelect: () => void;
		onLeave: () => void;
	};

	let { channel, selected, onSelect, onLeave }: Props = $props();
</script>

<div
	class={`flex items-center mt-1 rounded-xl transition-colors duration-150 cursor-pointer ${
		selected
			? 'bg-gray-100 dark:bg-gray-700 border-l-[3px] border-primary rounded-l-none'
			: 'hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600'
	}`}
>
	<button
		type="button"
		class="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left"
		onclick={onSelect}
	>
		<ProfilePicture profilePicture={channel.other_user?.profile_image} />
		<div class="min-w-0 flex-1">
			<div
				class="text-sm truncate"
				class:font-medium={!channel.unread_count}
				class:font-bold={channel.unread_count}
			>
				{channelTitle(channel)}
			</div>
			<div class="text-gray-400 text-xs truncate mt-0.5">
				{previewText(channel, $userStore?.id, $_)}
			</div>
		</div>
		{#if channel.unread_count > 0}
			<span
				class="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-purple-400 text-white text-xs font-semibold flex items-center justify-center"
				title={$_('Unread messages')}
			>
				{channel.unread_count > 99 ? '99+' : channel.unread_count}
			</span>
		{/if}
	</button>
	{#if channel.can_leave}
		<button
			type="button"
			class="shrink-0 mr-2 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-600"
			title={$_('Leave Group')}
			aria-label={$_('Leave Group')}
			onclick={onLeave}
		>
			<Fa icon={faArrowRightFromBracket} />
		</button>
	{/if}
</div>
