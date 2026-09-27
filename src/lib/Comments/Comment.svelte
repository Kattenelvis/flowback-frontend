<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import type { Comment, proposal } from '$lib/Poll/interface';
	import { faThumbsUp, faThumbsDown, faPaperclip } from '@fortawesome/free-solid-svg-icons';
	import { userStore } from '$lib/User/interfaces';
	import Fa from 'svelte-fa';
	import { _, locale } from 'svelte-i18n';
	import { page } from '$app/stores';
	import CommentPost from './CommentPost.svelte';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import Modal from '$lib/Generic/Modal.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import TextArea from '$lib/Generic/TextArea.svelte';
	import { commentsStore } from './commentStore';
	import { splitTags, timeSince } from './functions';
	import { isMobile } from '$lib/utils/isMobile';

	export let comment: Comment,
		api: 'poll' | 'thread' | 'delegate-history',
		proposals: proposal[] = [], // Give it a default empty array
		delegate_pool_id: number | null = null;

	let userUpVote: -1 | 0 | 1 = 0,
		comments: Comment[],
		isVoting = false,
		ReportCommentModalShow = false,
		reportTitle: string,
		reportDescription: string,
		images: File[] = [];

	const actionClass =
		'rounded-full px-2.5 py-1.5 font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white';

	// A reply's thread line sits under the avatar of the comment it answers. On
	// phones replies step in less, and deep threads stop stepping in after a few
	// levels so they keep enough room for their text.
	$: indent = (depth: number) =>
		depth === 0 ? 0 : 15 + (Math.min(depth, $isMobile ? 4 : 8) - 1) * ($isMobile ? 12 : 29);

	const commentDelete = async (id: number) => {
		let _api = `group/`;

		if (api === 'poll') _api += `poll/${$page.params.pollId}/`;
		else if (api === 'thread') _api += `thread/${$page.params.threadId}/`;
		else if (api === 'delegate-history') _api += `delegate/pool/${delegate_pool_id}/`;

		_api += `comment/${id}/delete`;

		const { res, json } = await fetchRequest('POST', _api);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: 'Failed to delete comment', success: false });
			return;
		}

		comments?.map((comment) => {
			if (comment.id !== id) return comment;

			comment.message = '[Deleted]';
			comment.active = false;
			return comment;
		});
		comments = comments;
	};

	const commentReport = async (id: number, message: string) => {
		let _api = 'report/create';

		let data = {
			title: reportTitle,
			description: reportDescription
		};

		const { res, json } = await fetchRequest('POST', _api, data);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: 'Failed to report comment', success: false });
			return;
		}

		comments.map((comment) => {
			if (comment.id !== id) return comment;

			// comment.message = '[Reported]';
			comment.active = false;
			comment.being_reported = true;
			return comment;
		});
		comments = comments;
	};

	// The entire upvote-downvote system in the front end is ugly brute-force, refactoring would be neat.
	const commentVote = async (_vote: -1 | 1) => {
		if (isVoting) return; // Prevent multiple clicks while processing
		isVoting = true;

		let vote = {};
		let regretting = userUpVote === _vote;

		if (regretting) vote = { vote: null };
		else if (_vote === -1) vote = { vote: false };
		else if (_vote === 1) vote = { vote: true };

		let _api = '';
		if (api === 'poll') _api = `group/poll/${$page.params.pollId}/comment/${comment.id}/vote`;
		else if (api === 'thread')
			_api = `group/thread/${$page.params.threadId}/comment/${comment.id}/vote`;
		else if (api === 'delegate-history')
			_api = `group/delegate/pool/${delegate_pool_id}/comment/${comment.id}/vote`;

		const { res, json } = await fetchRequest('POST', _api, vote);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: 'Comment vote failed', success: false });
			return;
		}

		// Only update UI after successful API call
		if (regretting) {
			userUpVote = 0;
			comment.user_vote = null;
			if (_vote === 1) comment.score -= 1;
			else if (_vote === -1) comment.score += 1;
		} else {
			if (userUpVote !== 0) {
				// If changing vote from up to down or vice versa
				comment.score += 2 * _vote;
			} else {
				comment.score += _vote;
			}
			userUpVote = _vote;
			comment.user_vote = _vote === 1;
		}

		isVoting = false;
	};

	onMount(() => {
		if (comment.user_vote === null || comment.user_vote === undefined) userUpVote = 0;
		else if (comment.user_vote === true) userUpVote = 1;
		else if (comment.user_vote === false) userUpVote = -1;

		commentsStore.subscribe((store) => {
			comments = store.allComments;
		});
	});
</script>

{#if comment.being_edited}
	<div
		class="py-2"
		class:thread-line={comment.reply_depth > 0}
		style:margin-left={`${indent(comment.reply_depth)}px`}
	>
		<CommentPost
			{delegate_pool_id}
			bind:proposals
			bind:comments
			bind:files={images}
			bind:beingEdited={comment.being_edited}
			message={comment.message || ''}
			parent_id={comment.parent_id}
			id={comment.id}
			{api}
		/>
	</div>
{:else}
	<article
		class="flex gap-3 py-3 text-sm dark:text-darkmodeText"
		class:thread-line={comment.reply_depth > 0}
		style:margin-left={`${indent(comment.reply_depth)}px`}
	>
		<ProfilePicture
			profilePicture={comment.author_profile_image}
			username={comment.author_name}
			userId={comment.author_id}
			Class="self-start [&_img]:h-8 [&_img]:w-8"
		/>
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-baseline gap-x-2">
				<a
					href={`/user?id=${comment.author_id}`}
					class="truncate font-semibold text-gray-900 hover:underline dark:text-darkmodeText"
					>{comment.author_name}</a
				>
				{#if comment.created_at}
					<time
						datetime={comment.created_at}
						title={new Date(comment.created_at).toLocaleString()}
						class="text-xs text-gray-500 dark:text-gray-400"
						>{timeSince(comment.created_at, $locale)}</time
					>
				{/if}
				{#if comment.edited && comment.active}
					<span class="text-xs text-gray-400">{$_('(edited)')}</span>
				{/if}
			</div>

			{#key comment.message}
				{#if comment.message}
					<p
						class="mt-0.5 whitespace-pre-wrap break-words leading-relaxed"
						class:italic={!comment.active}
						class:text-gray-400={!comment.active}
						id={`comment-${comment.id}`}
					>{#each splitTags(comment.message) as part}{#if part.tag}<span class="font-semibold text-primary dark:text-secondary">{part.text}</span>{:else}{part.text}{/if}{/each}</p>
				{/if}
			{/key}

			{#if comment.attachments?.length > 0}
				<div class="mt-2 flex flex-col items-start gap-2">
					{#each comment.attachments as attachment}
						{#if typeof attachment.file === 'string' && (attachment.file
								.slice(-3)
								.toLowerCase() === 'pdf' || attachment.file.slice(-3).toLowerCase() === 'txt')}
							<a
								href={attachment.file.substring(0, 4) === 'blob'
									? attachment.file
									: `${env.PUBLIC_API_URL}/media/${attachment.file}`}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-primary hover:bg-gray-200 dark:bg-darkbackground dark:text-secondary dark:hover:bg-gray-700"
							>
								<Fa icon={faPaperclip} class="text-xs" />
								{$_('View File')}
							</a>
						{:else}
							<img
								src={(() => {
									if (typeof attachment.file === 'string')
										return attachment.file.substring(0, 4) === 'blob'
											? attachment.file
											: `${env.PUBLIC_API_URL}/media/${attachment.file}`;
									else return URL.createObjectURL(attachment.file);
								})()}
								alt={$_('Attachment to the comment')}
								class="max-h-72 max-w-full rounded-xl border border-gray-200 object-contain dark:border-gray-700"
							/>
						{/if}
					{/each}
				</div>
			{/if}

			{#if comment.active}
				<div class="-ml-1 mt-1.5 flex flex-wrap items-center gap-1 text-xs">
					<div
						class="mr-1 flex items-center rounded-full bg-gray-100 dark:bg-darkbackground"
					>
						<button
							type="button"
							class="flex h-7 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 {comment.user_vote ===
							true
								? 'text-primary dark:text-secondary'
								: 'text-gray-500 dark:text-gray-400'}"
							aria-label={$_('Upvote')}
							aria-pressed={comment.user_vote === true}
							on:click={() => commentVote(1)}
						>
							<Fa icon={faThumbsUp} />
						</button>
						<span class="min-w-[1.5ch] text-center font-semibold tabular-nums"
							>{comment.score}</span
						>
						<button
							type="button"
							class="flex h-7 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 {comment.user_vote ===
							false
								? 'text-primary dark:text-secondary'
								: 'text-gray-500 dark:text-gray-400'}"
							aria-label={$_('Downvote')}
							aria-pressed={comment.user_vote === false}
							on:click={() => commentVote(-1)}
						>
							<Fa icon={faThumbsDown} />
						</button>
					</div>

					<button
						type="button"
						class={actionClass}
						on:click={() => (comment.being_replied = true)}
					>
						{$_('Reply')}
					</button>
					{#if Number($userStore?.id || -1) === comment.author_id}
						<button
							type="button"
							class={actionClass}
							on:click={() => {
								comment.being_edited = true;
								comment.being_edited_message = comment.message || '';
							}}
						>
							{$_('Edit')}
						</button>
						<button
							type="button"
							class={`${actionClass} hover:!text-red-600 dark:hover:!text-red-400`}
							on:click={() => commentDelete(comment.id)}
						>
							{$_('Delete')}
						</button>
					{:else}
						<button
							type="button"
							class={`${actionClass} hover:!text-red-600 dark:hover:!text-red-400`}
							on:click={() => (ReportCommentModalShow = true)}
						>
							{$_('Report')}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</article>

	<Modal
		bind:open={ReportCommentModalShow}
		buttons={[
			{
				label: 'Report',
				type: 'warning',
				onClick: () => commentReport(comment.id, comment.message || '')
			},
			{ label: 'Cancel', type: 'secondary', onClick: () => (ReportCommentModalShow = false) }
		]}
	>
		<div slot="header">{$_('Report Comment')}</div>
		<div class="flex flex-col gap-3" slot="body">
			<TextInput inputClass="bg-white" required label="Title" bind:value={reportTitle} />
			<TextArea
				label="Description"
				required
				bind:value={reportDescription}
				inputClass="whitespace-pre-wrap"
			/>
		</div>
	</Modal>
{/if}

{#if comment.being_replied}
	<div
		class="thread-line py-2"
		style:margin-left={`${indent(comment.reply_depth + 1)}px`}
	>
		<CommentPost
			{delegate_pool_id}
			bind:files={images}
			bind:proposals
			bind:comments
			bind:replying={comment.being_replied}
			parent_id={comment.id}
			replyingTo={comment.author_name}
			{api}
		/>
	</div>
{/if}

<style>
	/* Replies are indented with a line connecting them to the comment above */
	.thread-line {
		border-left: 2px solid rgb(229 231 235);
		padding-left: 0.75rem;
	}

	:global(.dark) .thread-line {
		border-left-color: rgb(55 65 81);
	}
</style>
