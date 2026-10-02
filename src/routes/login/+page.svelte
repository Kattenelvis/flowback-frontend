<script lang="ts">
	import Register from '$lib/Login/Register.svelte';
	import Login from '$lib/Login/Login.svelte';
	import ForgotPassword from '$lib/Login/ForgotPassword.svelte';
	import Verify from '$lib/Login/Verify.svelte';
	import NewPassword from '$lib/Login/NewPassword.svelte';
	import AuthShell from '$lib/Login/AuthShell.svelte';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import Fa from 'svelte-fa';
	import { faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';

	let selectedPage = 'Login';

	//Email is stored for automatic login when resetting password
	let email = '';

	const tabs = env.PUBLIC_DISABLE_ACCOUNT_CREATION === 'TRUE' ? ['Login'] : ['Login', 'Register'];

	const headings: Record<string, [string, string]> = {
		Login: ['Welcome back', 'Log in to continue to your groups.'],
		Register: ['Create your account', "Enter your email and we'll send you a link to get started."],
		Verify: ['Finish setting up', 'Pick a username and a password.'],
		GotMail: ['Check your inbox', ''],
		ForgotPassword: ['Reset your password', "We'll email you a link to choose a new one."],
		NewPassword: ['Choose a new password', '']
	};

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const emailParam = params.get('email');
		const verificationCode = params.get('verification_code');

		if (emailParam && verificationCode) {
			selectedPage = 'Verify';
			return;
		}

		if (localStorage.getItem('token')) goto('/home');
	});
</script>

<svelte:head>
	<title>{$_('Login to Flowback')}</title>
</svelte:head>

<AuthShell id="login-page" title={headings[selectedPage]?.[0]} subtitle={headings[selectedPage]?.[1]}>
	{#if tabs.length > 1 && (selectedPage === 'Login' || selectedPage === 'Register')}
		<div class="grid grid-cols-2 p-1 mb-7 rounded-xl bg-gray-200/70 dark:bg-darkobject">
			{#each tabs as tab}
				<button
					type="button"
					class="py-2 rounded-lg text-sm font-medium transition
						{selectedPage === tab
						? 'bg-white text-gray-900 shadow-sm dark:bg-darkbackground dark:text-darkmodeText'
						: 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}"
					aria-pressed={selectedPage === tab}
					on:click={() => (selectedPage = tab)}
				>
					{$_(tab)}
				</button>
			{/each}
		</div>
	{/if}

	{#if selectedPage === 'Login'}
		<Login bind:selectedPage />
	{:else if selectedPage === 'Register'}
		<Register bind:selectedPage />
	{:else if selectedPage === 'Verify'}
		<Verify />
	{:else if selectedPage === 'GotMail'}
		<div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-darkobject">
			<div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">
				<Fa icon={faEnvelopeOpenText} size="lg" />
			</div>
			<p class="text-gray-700 dark:text-gray-300">
				{$_("A link has been sent to your email. Check the spam folder if you don't see it.")}
			</p>
		</div>
		<button type="button" class="auth-link mt-6 text-sm" on:click={() => (selectedPage = 'Login')}>
			← {$_('Back to login')}
		</button>
	{:else if selectedPage === 'ForgotPassword'}
		<ForgotPassword bind:selectedPage bind:email />
	{:else if selectedPage === 'NewPassword'}
		<NewPassword />
	{/if}
</AuthShell>
