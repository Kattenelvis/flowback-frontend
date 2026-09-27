<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import TextSend from '$lib/Generic/TextSend.svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import type { Comment } from '../Poll/interface';
	import type { proposal } from '../Poll/interface';
	import Fa from 'svelte-fa';
	import { faPaperclip, faXmark } from '@fortawesome/free-solid-svg-icons';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { commentsStore } from './commentStore';
	import { getCommentDepth } from './functions';
	import { userStore } from '$lib/User/interfaces';

	export let comments: Comment[] = [],
		proposals: proposal[] = [],
		parent_id: number | null = null,
		id = 0,
		beingEdited = false,
		message = '',
		replying = false,
		api: 'poll' | 'thread' | 'delegate-history',
		delegate_pool_id: number | null = null,
		files: File[] = [],
		// Name of the author of the comment being replied to
		replyingTo = '';

	let show = false,
		showMessage = '',
		filteredProposal: proposal | null = null,
		textarea: HTMLTextAreaElement | null = null,
		fileInput: HTMLInputElement;

	$: showTagMenu =
		api === 'poll' && proposals?.length > 0 && /(^|\s)#$/.test(message);

	const tagProposal = (proposal: proposal) => {
		message = `${message}${proposal.title.replaceAll(' ', '-')} `;
		textarea?.focus();
	};

	const addFiles = (e: Event) => {
		const input = e.currentTarget as HTMLInputElement;
		files = [...files, ...Array.from(input.files ?? [])];
		// Lets the same file be picked again after removing it
		input.value = '';
	};

	const removeFile = (index: number) => {
		files = files.filter((_, i) => i !== index);
	};

	const cancel = () => {
		beingEdited = false;
		replying = false;
		files = [];
	};

	// Reactive subscription to the filtered proposal in the commentsStore
	$: filteredProposal = $commentsStore.filterByProposal;

	const getId = () => {
		if (api === 'poll') return `poll/${$page.params.pollId}`;
		else if (api === 'thread') return `thread/${$page.params.threadId}`;
		else if (api === 'delegate-history')
			return `delegate/pool/${delegate_pool_id}`;
	};

	const commentCreate = async () => {
		const formData = new FormData();

		// Prepend the hashtag to the message if a proposal is filtered
		if (filteredProposal) {
			message = `#${filteredProposal.title.replaceAll(' ', '-')} ${message}`;
		}

		if (message !== '') formData.append('message', message);
		if (parent_id) formData.append('parent_id', parent_id.toString());
		if (files)
			files.forEach((file) => {
				formData.append('attachments', file);
			});

		const { res, json } = await fetchRequest(
			'POST',
			`group/${getId()}/comment/create`,
			formData,
			true,
			false
		);

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Failed to post comment',
				success: false
			});
			return;
		}

		// Calculate the reply_depth based on the parent comment

		const id = json;
		getNewComment(id);
	};

	const getNewComment = async (id: number) => {
		let replyDepth = 0;

		const { res, json } = await fetchRequest(
			'GET',
			`group/${getId()}/comment/list?id=${id}`
		);

		if (res.ok) {
			const newComment = json.results[0];
			commentsStore.add(newComment);
			comments = comments;
			showMessage = 'Successfully posted comment';
			show = true;
			message = '';
			files = [];
			replying = false;

			subscribeToReplies();

			return;
		}

		const parentComment = $commentsStore.allComments.find(
			(comment) => comment.id === parent_id
		);

		if (parentComment) {
			replyDepth =
				getCommentDepth(parentComment, $commentsStore.allComments) + 1;
		}

		const newComment: Comment = {
			id: json,
			message,
			attachments: files.map((file) => ({ file: URL.createObjectURL(file) })),
			parent_id,
			reply_depth: replyDepth,
			author_id: $userStore?.id || -1,
			author_name: $userStore?.username || '',
			author_profile_image: $userStore?.profile_image || '',
			score: 1,
			active: true,
			edited: false,
			being_edited: false,
			being_replied: false,
			being_reported: false,
			user_vote: true,
			being_edited_message: ''
		};

		comments = comments;

		commentsStore.add(newComment);

		showMessage = 'Successfully posted comment';
		show = true;
		message = '';
		files = [];
		replying = false;

		subscribeToReplies();
	};

	const commentUpdate = async () => {
		const formData = new FormData();

		if (message === '' && files.length === 0) {
			ErrorHandlerStore.set({
				message: 'Cannot create empty comment',
				success: false
			});
			return;
		}

		if (message !== '') formData.append('message', message);
		if (parent_id) formData.append('parent_id', parent_id.toString());
		if (files)
			files.forEach((image) => {
				formData.append('attachments', image);
			});

		const { res, json } = await fetchRequest(
			'POST',
			`group/${getId()}/comment/${id}/update`,
			formData,
			true,
			false
		);

		beingEdited = false;

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Failed to edit comment',
				success: false
			});
			return;
		}

		show = true;
		showMessage = $_('Edited Comment');
		const index = comments?.findIndex((comment) => comment.id === id);
		let comment = comments?.find((comment) => comment.id === id);
		if (comment) {
			comment.message = message;
			comments.splice(index, 1, comment);
			comments = comments;
			comment.edited = true;
			comment.attachments = files.map((image) => {
				return { file: URL.createObjectURL(image) };
			});
		}
		files = [];
	};

	//TODO: Optimize so that this doesn't fire every time a comment is made
	const subscribeToReplies = async () => {
		const { res, json } = await fetchRequest(
			'POST',
			`group/${getId()}/notification/subscribe`,
			{
				tags: ['comment_self']
			}
		);
	};
</script>

<div class="relative">
	{#if beingEdited || replying}
		<div
			class="mb-1.5 flex items-center justify-between gap-2 px-1 text-xs text-gray-500 dark:text-gray-400"
		>
			<span class="truncate">
				{#if beingEdited}
					{$_('Editing comment')}
				{:else}
					{$_('Replying to')}
					<span class="font-semibold text-gray-700 dark:text-darkmodeText"
						>{replyingTo}</span
					>
				{/if}
			</span>
			<button
				type="button"
				class="shrink-0 rounded-full px-2 py-1 font-semibold hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
				on:click={cancel}>{$_('Cancel')}</button
			>
		</div>
	{/if}

	{#if files.length > 0}
		<ul class="mb-2 flex flex-wrap gap-2">
			{#each files as file, i}
				<li
					class="flex max-w-full items-center gap-2 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm dark:bg-darkbackground"
				>
					<Fa icon={faPaperclip} class="shrink-0 text-xs text-gray-500" />
					<span class="truncate">{file.name}</span>
					<button
						type="button"
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
						aria-label={`${$_('Remove')} ${file.name}`}
						on:click={() => removeFile(i)}
					>
						<Fa icon={faXmark} class="text-xs" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<TextSend
		bind:value={message}
		bind:textarea
		id={beingEdited || replying ? '' : 'textarea-comment'}
		placeholder="Write a comment..."
		sendLabel={beingEdited ? 'Save' : 'Send'}
		allowEmpty={files.length > 0}
		autofocus={beingEdited || replying}
		onSend={() => (beingEdited ? commentUpdate() : commentCreate())}
	>
		<button
			slot="before"
			type="button"
			class="ml-1 mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
			title={$_('Attach file')}
			aria-label={$_('Attach file')}
			on:click={() => fileInput.click()}
		>
			<Fa icon={faPaperclip} />
		</button>
	</TextSend>
	<input
		bind:this={fileInput}
		type="file"
		multiple
		accept=".jpg, .jpeg, .png, .pdf, .txt"
		class="hidden"
		on:change={addFiles}
	/>

	<!-- Typing # lists the proposals so one can be tagged in the comment -->
	{#if showTagMenu}
		<div
			class="absolute left-0 right-12 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-darkobject"
		>
			<p
				class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
			>
				{$_('Tag a proposal')}
			</p>
			<ul class="max-h-48 overflow-y-auto pb-1">
				{#each proposals as proposal}
					<li>
						<button
							type="button"
							class="flex w-full items-baseline gap-1 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
							on:click={() => tagProposal(proposal)}
						>
							<span class="font-semibold text-primary dark:text-secondary">#</span>
							<span class="min-w-0 break-words">{proposal.title}</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
