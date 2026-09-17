<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { type Thread } from '$lib/Group/interface';
	import ThreadVoting from './ThreadVoting.svelte';
	import PostThumbnail from '$lib/Generic/PostThumbnail.svelte';
	import { faGlobe, faLock } from '@fortawesome/free-solid-svg-icons';
	import HeaderIcon from '$lib/Header/HeaderIcon.svelte';

	export let thread: Thread;
</script>

{#if thread}
	<PostThumbnail post={thread} api="thread">
		{#snippet icons()}
			{#if thread?.public}
				<HeaderIcon
					Class="!p-0 !cursor-default"
					icon={faGlobe}
					text={'Public Thread'}
				/>
			{:else}
				<HeaderIcon
					Class="!p-0 !cursor-default"
					icon={faLock}
					text={'Private Thread'}
				/>
			{/if}
		{/snippet}

		{#if thread.group_joined}
			<ThreadVoting bind:thread />
		{/if}
	</PostThumbnail>
{/if}
