<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import TextArea from '$lib/Generic/TextArea.svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import type { Comment } from '../Poll/interface';
	import type { proposal } from '../Poll/interface';
	import FileUploads from '$lib/Generic/FileUploads.svelte';
	import Fa from 'svelte-fa';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import { darkModeStore } from '$lib/Generic/DarkMode';
	import { onMount } from 'svelte';
	import type { poppup } from '$lib/Generic/Poppup';
	import Poppup from '$lib/Generic/Poppup.svelte';
	import { commentsStore } from './commentStore';
	import { getCommentDepth } from './functions';
	import { onDestroy } from 'svelte';

	export let comments: Comment[] = [],
		proposals: proposal[] = [],
		parent_id: number | null = null,
		id = 0,
		beingEdited = false,
		message = '',
		replying = false,
		api: 'poll' | 'thread' | 'delegate-history',
		delegate_pool_id: number | null = null,
		files: File[] = [];

	let show = false,
		showMessage = '',
		recentlyTappedButton = '',
		darkmode = false,
		poppup: poppup,
		filteredProposal: proposal | null = null;

	// Reactive subscription to the filtered proposal in the commentsStore
	$: filteredProposal = $commentsStore.filterByProposal;

	const getId = () => {
		if (api === 'poll') return `poll/${$page.params.pollId}`;
		else if (api === 'thread') return `thread/${$page.params.threadId}`;
		else if (api === 'delegate-history') return `delegate/pool/${delegate_pool_id}`;
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
			files.forEach((image) => {
				formData.append('attachments', image);
			});

		const { res, json } = await fetchRequest(
			'POST',
			`group/${getId()}/comment/create`,
			formData,
			true,
			false
		);

		if (!res.ok) {
			poppup = { message: 'Failed to post comment', success: false };
			return;
		}

		// Calculate the reply_depth based on the parent comment
		let replyDepth = 0;

		const parentComment = $commentsStore.filteredComments.find(
			(comment) => comment.id === parent_id
		);

		if (parentComment) {
			replyDepth = getCommentDepth(parentComment, $commentsStore.filteredComments) + 1;
		}

		const newComment: Comment = {
			id: json,
			message,
			attachments: files.map((file) => ({ file: URL.createObjectURL(file) })),
			parent_id,
			reply_depth: replyDepth,
			author_id: Number(window.localStorage.getItem('userId')) || 0,
			author_name: window.localStorage.getItem('userName') || '',
			author_profile_image: window.localStorage.getItem('pfp-link') || '',
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
		replying = false;

		subscribeToReplies();
	};

	const commentUpdate = async () => {
		const formData = new FormData();

		if (message === '' && files.length === 0) {
			poppup = { message: 'Cannot create empty comment', success: false };
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
			poppup = { message: 'Failed to edit comment', success: false };
			return;
		}

		show = true;
		showMessage = $_('Edited Comment');
		const index = comments.findIndex((comment) => comment.id === id);
		let comment = comments.find((comment) => comment.id === id);
		if (comment) {
			comment.message = message;
			comments.splice(index, 1, comment);
			comments = comments;
			comment.edited = true;
			comment.attachments = files.map((image) => {
				return { file: URL.createObjectURL(image) };
			});
		}
	};

	//TODO: Optimize so that this doesn't fire every time a comment is made
	const subscribeToReplies = async () => {
		const { res, json } = await fetchRequest('POST', `group/${getId()}/subscribe`, {
			categories: ['comment_self']
		});
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		// Check for a specific key, e.g., the "k" key:
		if (event.ctrlKey && event.key === 'Enter' && message.trim() !== '') {
			beingEdited ? commentUpdate() : commentCreate();
		}
	};

	document.addEventListener('keydown', handleKeyDown);

	onMount(() => {
		darkModeStore.subscribe((value) => {
			darkmode = value;
		});
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<form
	class="relative"
	on:submit|preventDefault={() => (beingEdited ? commentUpdate() : commentCreate())}
>
	<!-- When # typed, show proposals to be tagged -->
	<div
		class="hidden absolute z-50 bg-white dark:bg-darkbackground shadow w-full top-full border-gray-300 rounded"
		class:!block={recentlyTappedButton === '#'}
	>
		{#if proposals?.length > 0}
			<div class="max-h-48 overflow-y-auto">
				<div class="px-4 py-2 font-semibold text-sm text-gray-600 border-b border-gray-200">
					{$_('All proposals')}
				</div>
				<ul class="divide-y divide-gray-200">
					{#each proposals as proposal}
						<li class="px-4 py-2">
							<button type="button"
								class="w-full text-left hover:bg-gray-100 dark:hover:bg-darkbackground dark:hover:brightness-125 cursor-pointer"
								on:click={() => {
									message = `${message}${proposal.title.replaceAll(' ', '-')} `;
									recentlyTappedButton = '';
								}}>
								{proposal.title}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
	<div class="flex">
		<div class="flex flex-grow">
			<TextArea
				label=""
				bind:value={message}
				bind:recentlyTappedButton
				inputClass="bg-gray-100 border-0 placeholder-gray-600 pl-2 max-h-[15rem]"
				Class="w-full"
				placeholder={$_('Write a comment...')}
				displayMax={false}
				id="comment"
			/>
		</div>
		<div class="flex ml-2 items-start">
			<FileUploads
				bind:files
				minimalist
				disableCropping
				Class="content-center p-2 rounded hover:bg-gray-100 h-10"
			/>
			<div class="p-2 m-auto">
				<Button
					Class=" !rounded-none bg-white dark:bg-darkbackground hover:!brightness-100 hover:bg-gray-100"
					type="submit"
					label=""
					><Fa icon={faPaperPlane} color={darkmode ? 'white' : 'black'} class="text-lg" /></Button
				>
			</div>
		</div>
	</div>
</form>

<Poppup bind:poppup />
