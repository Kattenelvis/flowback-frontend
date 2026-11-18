<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import {
		errorMessage,
		fetchRequest,
		type ApiFieldError
	} from '$lib/FetchRequest';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import AuthInput from './AuthInput.svelte';
	import { _ } from 'svelte-i18n';
	import { userStore } from '$lib/User/interfaces';

	let password: string,
		password2: string,
		verification_code: string,
		loading = false;

	async function verifyAccount() {
		if (env.PUBLIC_EMAIL_REGISTRATION === 'TRUE')
			verification_code = $page.url.searchParams.get('verification_code') ?? '';

		if (password !== password2) {
			ErrorHandlerStore.set({ message: 'Passwords do not match', success: false });
			return;
		}

		loading = true;
		const { res, json } = await fetchRequest(
			'POST',
			'forgot_password/verify',
			{ verification_code, password },
			false
		);

		if (!res.ok) {
			const wrongCode =
				json?.code === 'not_found' ||
				json?.detail === 'Verification code has already been used.' ||
				json?.errors?.some(
					(error: ApiFieldError) => error.field === 'verification_code'
				);

			ErrorHandlerStore.set({
				message: wrongCode
					? 'Wrong verification code'
					: errorMessage(res, json),
				success: false
			});

			return;
		}

		//Done with account registration, redirect
		ErrorHandlerStore.set({ message: 'Success', success: true });

		localStorage.setItem('token', json.token);

		{
			const { json } = await fetchRequest('GET', 'user');
			userStore.set(json);
		}

		loading = false;

		//For one group flowback, immediately join the single group
		if (env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE') {
			const { res } = await fetchRequest('POST', `group/1/join`, { to: 1 });
			if (!res.ok) {
				ErrorHandlerStore.set({
					message: 'Account was created but failed to join group',
					success: false
				});
			}
		}

		goto('/home');
	}
</script>

<form class="flex flex-col gap-5" on:submit|preventDefault={verifyAccount}>
	<AuthInput label="New Password" bind:value={password} type="password" autocomplete="new-password" required />
	<AuthInput label="Confirm Password" bind:value={password2} type="password" autocomplete="new-password" required />
	{#if !(env.PUBLIC_EMAIL_REGISTRATION === 'TRUE')}
		<AuthInput label="Verification Code" bind:value={verification_code} autocomplete="one-time-code" required />
	{/if}

	<button type="submit" class="auth-button mt-1">{$_('Update password')}</button>
</form>
