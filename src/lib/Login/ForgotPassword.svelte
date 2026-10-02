<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import Loader from '$lib/Generic/Loader.svelte';
	import { statusMessageFormatter } from '$lib/Generic/StatusMessage';
	import AuthInput from './AuthInput.svelte';
	import { _ } from 'svelte-i18n';

	export let selectedPage: string = "", email: string = "";

	let loading = false;

	const sendCode = async () => {
		loading = true;
		const { res, json } = await fetchRequest('POST', 'forgot_password', { email }, false);
		loading = false;
		if (res.ok) selectedPage = 'GotMail';
		else ErrorHandlerStore.set(statusMessageFormatter(res, json));
	};
</script>

<Loader bind:loading>
	<form class="flex flex-col gap-5" on:submit|preventDefault={sendCode}>
		<AuthInput label="Email" type="email" bind:value={email} autocomplete="email" autofocus required />
		<button type="submit" class="auth-button mt-1">{$_('Send reset link')}</button>
	</form>
	<button type="button" class="auth-link mt-6 text-sm" on:click={() => (selectedPage = 'Login')}>
		← {$_('Back to login')}
	</button>
</Loader>
