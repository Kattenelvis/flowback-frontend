<script lang="ts">
	import { goto } from '$app/navigation';
	import { fetchRequest } from '$lib/FetchRequest';
	import Modal from '$lib/Generic/Modal.svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { posts } from './stores';
	import Loader from '$lib/Generic/Loader.svelte';

	export let deleteModalShow = false,
		postId: string | number,
		loading = false,
		post_type: 'poll' | 'thread' = 'poll';

	let errorHandler: any;

	const deletePoll = async () => {
		loading = true;
		let _api =
			post_type === 'poll' ? `group/poll/${postId}/delete` : `group/thread/${postId}/delete`;

		const { res, json } = await fetchRequest('POST', _api);

		loading = false;

		if (!res.ok) {
			$ErrorHandlerStore = {
				message: post_type === 'poll' ? 'Could not delete poll' : 'Could not delete thread',
				success: false
			};

			return;
		}

		$ErrorHandlerStore = {
			message: post_type === 'poll' ? 'Successfully deleted poll' : 'Successfully deleted thread',
			success: true
		};

		if (
			Number($page.params.threadId) === Number(postId) ||
			Number($page.params.pollId) === Number(postId)
		) {
			// If the current page is the one being deleted, redirect to the group page
			const source = new URLSearchParams(window.location.search).get('source');
			goto(source === 'home' ? '/home' : `/groups/${$page.params.groupId}?page=flow`);
			return;
		} else {
			// If at a thread or poll page
			posts.update((currentPosts) => {
				// Polls and threads share the list and can have the same id
				return currentPosts.filter(
					(post) => !(post.id === postId && post.related_model === post_type)
				);
			});
		}

		deleteModalShow = false;
	};
</script>

<Modal
	bind:open={deleteModalShow}
	Class="max-w-[500px]"
	buttons={[
		{ label: 'Remove', type: 'warning', onClick: deletePoll },
		{ label: 'Cancel', type: 'default', onClick: () => (deleteModalShow = false) }
	]}
>
	>
	<div slot="header">{post_type === 'poll' ? $_('Deleting Poll') : $_('Deleting Thread')}</div>
	<div slot="body">
		<Loader bind:loading>
			{$_('Are you sure you want to delete this poll?')}
		</Loader>
	</div>
</Modal>

 
