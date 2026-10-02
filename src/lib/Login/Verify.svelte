<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import Loader from '$lib/Generic/Loader.svelte';
	import { _ } from 'svelte-i18n';
	import AuthInput from './AuthInput.svelte';
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	// TODO: Blockchain
	// import { becomeMemberOfGroup } from '$lib/Blockchain_v1_Ethereum/javascript/rightToVote';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { userStore } from '$lib/User/interfaces';

	let verification_code = '',
		password = '',
		loading = false,
		acceptedEmailNotifications = false,
		username = '';

	const validateUsername = () => {
		if (!username) {
			// usernameError = '';
			return;
		}

		const regex = /^[a-zA-Z0-9@./+/_-]+$/;
		if (!username.match(regex)) {
			// usernameError =
			// 	'Username may only contain letters, numbers, and @/./+/-/_ characters. No spaces are allowed.';
		} else {
			// usernameError = '';
		}
	};

	//Both verifies and logs in
	const verifyAccount = async () => {
		loading = true;
		const { res, json } = await fetchRequest(
			'POST',
			'register/verify',
			{ verification_code, password, username },
			false
		);

		loading = false;

		if (!res.ok) {
			if (
				json?.detail?.verification_code ||
				json?.detail[0] === 'Not found.' ||
				json?.detail[0] === 'Verification code has already been used.'
			)
				ErrorHandlerStore.set({
					message: 'Wrong verification code',
					success: false
				});
			else if (json?.detail?.non_field_errors)
				ErrorHandlerStore.set({
					message: json?.detail?.non_field_errors[0],
					success: false
				});
			else if (json?.detail?.username)
				ErrorHandlerStore.set({
					message: json?.detail?.username[0],
					success: false
				});
			else if (json?.detail[0] === 'Email already registered')
				ErrorHandlerStore.set({ message: json?.detail[0], success: false });
			else
				ErrorHandlerStore.set({
					message: 'Something went wrong',
					success: false
				});

			return;
		}

		//Done with account registration, redirect
		ErrorHandlerStore.set({ message: 'Success', success: true });

		localStorage.setItem('token', json?.token ?? json);

		loading = true;

		{
			const { res, json } = await fetchRequest('POST', 'user/update', {
				email_notifications: acceptedEmailNotifications
			});
		}

		{
			const { json } = await fetchRequest('GET', 'user');
			userStore.set(json);
		}

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

		loading = false;
		goto('/home');
	};

	const getVerificationCodeFromURL = () => {
		verification_code = $page.url.searchParams.get('verification_code') || '';
	};

	onMount(() => {
		getVerificationCodeFromURL();

		// For when users click the link in their verification email.
		const urlParams = new URLSearchParams(window.location.search);
		verification_code = urlParams.get('verification_code') || '';
	});

	$: username && validateUsername();
</script>

<Loader bind:loading>
	<form class="flex flex-col gap-5" on:submit|preventDefault={verifyAccount}>
		{#if !$page.url.searchParams.get('verification_code')}
			<AuthInput
				label="Verification Code"
				bind:value={verification_code}
				autocomplete="one-time-code"
				required
			/>
		{/if}

		<AuthInput label="Username" bind:value={username} autocomplete="username" required />
		<AuthInput
			label="Choose a Password"
			bind:value={password}
			type="password"
			autocomplete="new-password"
			required
		/>

		<label class="flex items-start gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
			<input type="checkbox" class="auth-check mt-0.5 shrink-0" bind:checked={acceptedEmailNotifications} />
			{$_('Email me notifications about activity in my groups')}
		</label>

		<button type="submit" class="auth-button mt-1">
			{$_('Send')}
		</button>
	</form>
</Loader>
