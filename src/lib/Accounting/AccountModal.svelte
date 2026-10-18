<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import type { Account } from './interface';
	import { errorMessage } from './functions';

	// Creates an account, or edits `account` when one is given
	export let open = false,
		account: Account | null = null,
		onSaved: () => void = () => {};

	let account_name = '',
		account_number = '';

	const reset = () => {
		account_name = account?.account_name ?? '';
		account_number = account?.account_number ?? '';
	};

	$: if (open) reset();

	const save = async () => {
		const { res, json } = await fetchRequest(
			'POST',
			account ? `ledger/account/${account.id}/update` : 'ledger/account/create',
			{ account_name, account_number }
		);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: errorMessage(json), success: false });
			return;
		}

		ErrorHandlerStore.set({
			message: account ? 'Successfully updated account' : 'Successfully created account',
			success: true
		});
		open = false;
		onSaved();
	};
</script>

<Modal bind:open onSubmit={save}>
	<div slot="header">{account ? $_('Edit account') : $_('Create account')}</div>
	<div slot="body" class="text-left">
		<TextInput label="Account name" bind:value={account_name} />
		<div class="mt-3">
			<TextInput label="Account number" max={20} bind:value={account_number} />
		</div>
	</div>
	<div slot="footer">
		<Button onClick={save}>{account ? $_('Save') : $_('Create account')}</Button>
	</div>
</Modal>
