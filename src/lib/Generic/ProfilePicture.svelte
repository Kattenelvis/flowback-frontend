<script lang="ts">
	import DefaultPFP from '$lib/assets/abstract-user-flat-4.svg';
	import { env } from '$env/dynamic/public';

	export let username = '',
		profilePicture: string | null | undefined = null,
		//TODO: Always display username, replace all instance of username with this file
		displayName = false,
		Class = '',
		//TODO: Fix so one can use size
		size: number = 40,
		userId: null | string | number = null;

	// TODO: Fix this bad hardcoded solution and general solution for decreasing reliance on hardcoded solutions to API in urls
	$: if (profilePicture?.includes('api/api')) {
		profilePicture = profilePicture.replace('api/api', 'api');
	}
</script>

{#if userId}
	<a href={`/user?id=${userId}`} class={`flex gap-4 items-center ${Class}`}>
		{#if !profilePicture || profilePicture === '' || profilePicture === 'null'}
			<img src={DefaultPFP} alt="avatar" class={`w-[${size}px] h-[${size}px] rounded-full`} />
		{:else}
			<img
				src={`${env.PUBLIC_API_URL}${profilePicture}`}
				alt="avatar"
				class={`w-[${size}px] h-[${size}px] rounded-full`}
			/>
		{/if}
		{#if displayName}
			<span class="max-w-[150px] overflow-hidden whitespace-nowrap overflow-ellipsis"
				>{username}</span
			>
		{/if}
	</a>
{:else}
	<div class={`flex gap-2 items-center ${Class}`}>
		{#if !profilePicture || profilePicture === '' || profilePicture === 'null'}
			<img src={DefaultPFP} alt="avatar" class={`w-[${size}px] h-[${size}px] rounded-full`} />
		{:else}
			<img
				src={`${env.PUBLIC_API_URL}${profilePicture}`}
				alt="avatar"
				class={`w-[${size}px] h-[${size}px] rounded-full`}
			/>
		{/if}
		{#if displayName}
			<span class="max-w-[150px] overflow-hidden whitespace-nowrap overflow-ellipsis"
				>{username}</span
			>
		{/if}
	</div>
{/if}
