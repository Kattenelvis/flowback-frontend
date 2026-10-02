<script lang="ts">
	import AuthInput from './AuthInput.svelte';
	import { fetchRequest } from '../FetchRequest';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { _ } from 'svelte-i18n';
	import Loader from '$lib/Generic/Loader.svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/User/interfaces';

	let username = '',
		password = '',
		loading = false,
		remainLoggedIn = false;

	export let selectedPage: string;

	const logIn = async () => {
		loading = true;
		const { json, res } = await fetchRequest(
			'POST',
			'login',
			{ username, password },
			false,
			true
		);
		loading = false;

		if (!res.ok)
			ErrorHandlerStore.set({
				message:
					(typeof json?.detail === 'string' ? json.detail : null) ??
					json?.non_field_errors?.[0] ??
					json?.detail?.non_field_errors?.[0] ??
					'Something went wrong',
				success: false
			});
		else if (json?.token || typeof json === 'string') {
			await localStorage.setItem('token', json?.token ?? json);

			//Checks if user has selected the "Remain logged in" button and acts accordingly
			if (remainLoggedIn)
				await localStorage.removeItem('sessionExpirationTime');
			else
				await localStorage.setItem(
					'sessionExpirationTime',
					//A session is set to 24 hours with "1000 * 3600 * 24"
					(new Date().getTime() + 1000 * 3600 * 24).toString()
				);

			{
				const { json } = await fetchRequest('GET', 'user');
				userStore.set(json);
			}

			goto('/home');
		} else {
			ErrorHandlerStore.set({
				success: false,
				message: 'There was a problem logging in'
			});
		}
	};
</script>

<Loader bind:loading>
	<form class="flex flex-col gap-5" on:submit|preventDefault={logIn}>
		<AuthInput label="Username" bind:value={username} name="username" autocomplete="username" required />
		<div>
			<AuthInput
				label="Password"
				bind:value={password}
				type="password"
				name="password"
				autocomplete="current-password"
				required
			/>
			<div class="mt-3 flex items-center justify-between text-sm">
				<label class="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
					<input type="checkbox" class="auth-check" bind:checked={remainLoggedIn} />
					{$_('Remain logged in')}
				</label>
				<button type="button" class="auth-link" on:click={() => (selectedPage = 'ForgotPassword')}>
					{$_('Forgot password?')}
				</button>
			</div>
		</div>

		<button type="submit" class="auth-button mt-2">
			{$_('Login')}
		</button>
	</form>
</Loader>
