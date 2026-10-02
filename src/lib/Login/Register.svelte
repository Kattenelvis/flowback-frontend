<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import Loader from '$lib/Generic/Loader.svelte';
	import { _ } from 'svelte-i18n';
	import AuthInput from './AuthInput.svelte';
	import { mailStore } from './stores';
	import TermsOfService from './TermsOfService.svelte';
	import { env } from '$env/dynamic/public';

	let email = '',
		loading = false,
		acceptedToS = false,
		usernameError: string = '';

	export let selectedPage: string;

	const registerAccount = async () => {
		if (!acceptedToS) {
			ErrorHandlerStore.set({
				message: 'You must accept terms of service to register',
				success: false
			});
			return;
		}

		if (usernameError) {
			ErrorHandlerStore.set({ message: usernameError, success: false });
			return;
		}

		loading = true;
		const { res, json } = await fetchRequest(
			'POST',
			'register',
			{ email },
			false
		);
		loading = false;

		if (!res.ok) {
			ErrorHandlerStore.set({
				message:
					(json?.detail?.email && json?.detail?.email[0]) ??
					(json?.detail && json?.detail[0]) ??
					json ??
					'Something went wrong',
				success: false
			});
			return;
		}

		mailStore.set(email);
		ErrorHandlerStore.set({ message: 'Email Sent', success: true });

		if (!(env.PUBLIC_EMAIL_REGISTRATION === 'FALSE')) selectedPage = 'GotMail';
		else selectedPage = 'Verify';
	};
</script>

<Loader bind:loading>
	<form class="flex flex-col gap-5" on:submit|preventDefault={registerAccount}>
		<AuthInput label="Email" type="email" bind:value={email} autocomplete="email" required />

		<div class="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white text-sm text-gray-600 dark:border-gray-700 dark:bg-darkobject dark:text-gray-300">
			<TermsOfService Class="!border-0 !gap-3 [&_h1]:!text-base [&_h1]:!text-left [&_h1]:font-semibold [&_h1]:!leading-6 [&_h1]:text-gray-900 dark:[&_h1]:text-darkmodeText" />
		</div>

		<label class="flex items-start gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
			<input type="checkbox" class="auth-check mt-0.5 shrink-0" bind:checked={acceptedToS} />
			{$_('Yes, I accept the terms of service')}
		</label>

		<button type="submit" class="auth-button mt-1" disabled={!email || !acceptedToS}>
			{$_('Send verification email')}
		</button>
	</form>
</Loader>
