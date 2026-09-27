<script lang="ts">
	import CommentPost from './CommentPost.svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { proposal } from '../Poll/interface';
	import Comment from './Comment.svelte';
	import { getCommentDepth, getComments } from './functions';
	import { pollComments as pollCommentsLimit } from '../Generic/APILimits.json';
	import CommentFilter from './CommentFilter.svelte';
	import { commentsStore } from './commentStore';
	import type { Comment as comment } from '$lib/Poll/interface';
	import Fa from 'svelte-fa';
	import { faComments } from '@fortawesome/free-solid-svg-icons';

	export let proposals: proposal[] = [],
		api: 'poll' | 'thread' | 'delegate-history',
		delegate_pool_id: null | number = null,
		Class = '';

	let offset = 0,
		showReadMore = true,
		sortBy: null | string = null,
		searchString: string = '',
		selectedProposals: number[] = [];

	const setUpComments = async () => {
		const { comments, next } = await getComments(getId(), api, offset, sortBy, searchString);

		comments?.forEach((comment: comment) => {
			comment.reply_depth = getCommentDepth(comment, comments);
		});

		commentsStore.setAll(comments);
		showReadMore = next !== null;
	};

	const readMore = async () => {
		offset += pollCommentsLimit;
		const { comments, next } = await getComments(getId(), api, offset, sortBy);
		commentsStore.setAll([...$commentsStore.allComments, ...comments]);
		showReadMore = next !== null;
	};

	const getId = () => {
		if (api === 'poll') return $page.params.pollId;
		else if (api === 'thread') return $page.params.threadId;
		else if (api === 'delegate-history') return delegate_pool_id;
	};

	onMount(async () => {
		await setUpComments();
	});

	$: if (sortBy || searchString || selectedProposals) setUpComments();
</script>

<div class={`dark:text-darkmodeText min-h-[200px] ${Class}`} id="comments">
	<CommentPost bind:proposals {api} {delegate_pool_id} />

	<CommentFilter
		Class="mt-4 pb-3 border-b border-gray-200 dark:border-gray-700"
		bind:sortBy
		bind:searchString
		bind:proposals
		bind:selectedProposals
	/>

	<div class="flex flex-col">
		{#each $commentsStore?.filteredComments ?? [] as comment (comment.id)}
			<Comment {delegate_pool_id} {comment} {api} {proposals} />
		{/each}
	</div>

	{#if showReadMore}
		<div class="flex justify-center pt-2">
			<button
				type="button"
				class="rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-blue-50 dark:text-secondary dark:hover:bg-gray-700"
				on:click={readMore}>{$_('Read more')}</button
			>
		</div>
	{/if}

	{#if $commentsStore?.filteredComments?.length === 0}
		<div
			class="flex flex-col items-center gap-2 px-4 py-10 text-center text-gray-500 dark:text-gray-400"
		>
			<Fa icon={faComments} class="text-3xl text-gray-300 dark:text-gray-600" />
			<p class="font-medium text-gray-700 dark:text-darkmodeText">
				{$_('There are currently no comments')}
			</p>
			<p class="text-sm">{$_('Be the first to share your thoughts.')}</p>
		</div>
	{/if}
</div>
