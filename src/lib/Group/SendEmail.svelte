<script lang="ts">
	import { errorMessage, fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import { page } from '$app/stores';
	import TextArea from '$lib/Generic/TextArea.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import Loader from '$lib/Generic/Loader.svelte';
	import {env} from "$env/dynamic/public";

	let title: string,
		message: string,
  
		loading = false;

	const sendEmail = async () => {
		loading = true;
		const { res, json } = await fetchRequest('POST', `group/${$page.params.groupId}/mail`, {
			title,
			message
		});

		if (res.ok) {
			ErrorHandlerStore.set({ message: 'Skickade Mail', success: true });
		} else {
			ErrorHandlerStore.set({
				message: errorMessage(res, json),
				success: false
			});
		}
		loading = false;
	};
</script>

<div class="bg-white dark:bg-darkobject p-6 text-xl rounded shadow dark:text-darkmodeText">
	<Loader bind:loading>
		<form on:submit|preventDefault={sendEmail} class="flex flex-col gap-4">
			<h1 class="text-3xl">Send Mail</h1>
			<TextInput required label="Title" bind:value={title} />
			<TextArea required label="Message" bind:value={message} />
			 
			<div class="font-bold">
				Warning: This will send a mail to {env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE'
					? 'everyone'
					: 'everyone in the group'}
			</div>
			<Button disabled={loading} type="submit" Class="" label="Send Mail" />
		</form>
	</Loader>
</div>
