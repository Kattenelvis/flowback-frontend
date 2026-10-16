<script>
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { UsersApi } from '$lib/api/users';

	export let open = false;

	const logBackIn = () => {
		localStorage.setItem(
			'sessionExpirationTime',
			// A session is set to 24 hours with "1000 * 3600 * 24"
			(new Date().getTime() + 1000 * 3600 * 24).toString()
		);

		open = false;
	};

	const logOut = async () => {
		open = false;
		// Revoke the token on the server. If it already expired we still want to log out locally
		try {
			await UsersApi.logout();
		} catch {}
		localStorage.removeItem('token');
		localStorage.removeItem('sessionExpirationTime');
		goto('/login');
	};
</script>

<Modal
	bind:open
	buttons={[
		{
			label: 'Log Out',
			onClick: logOut,
			type: 'warning'
		},
		{
			label: 'Stay logged in',
			onClick: logBackIn,
			type: 'primary'
		}
	]}
>
	<div slot="body" class="py-4 px-2 text-lg">
		{$_('Your session is about to expire, stay logged in?')}
	</div>
</Modal>
