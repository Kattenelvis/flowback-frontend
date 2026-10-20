<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { fetchRequest } from '$lib/FetchRequest';
	import Modal from '$lib/Generic/Modal.svelte';
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
	<div slot="body" class="form">
		<label class="field">
			<span class="caption">{$_('Account name')}</span>
			<input type="text" maxlength="100" autocomplete="off" bind:value={account_name} />
		</label>
		<label class="field">
			<span class="caption">{$_('Account number')}</span>
			<input type="text" maxlength="20" autocomplete="off" bind:value={account_number} />
		</label>
	</div>
	<div slot="footer">
		<button type="button" class="save" on:click={save}>
			{account ? $_('Save') : $_('Create account')}
		</button>
	</div>
</Modal>

<style>
	.form {
		display: grid;
		gap: 1rem;
		text-align: left;
	}


	.field input[type='text'] {
		width: 100%;
		height: 2.5rem;
		padding: 0 0.8rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(100, 100, 120, 0.3);
		background: rgba(100, 100, 120, 0.05);
		color: inherit;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.field input[type='text']:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(1, 91, 192, 0.15);
	}

	:global(html.dark) .field input[type='text'] {
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.04);
	}

	.caption {
		display: block;
		margin-bottom: 0.3rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgb(105, 105, 120);
	}

	:global(html.dark) .caption {
		color: rgb(160, 160, 175);
	}

	.save {
		width: 100%;
		min-height: 2.8rem;
		border-radius: 0.9rem;
		background: var(--primary);
		color: #fff;
		font-weight: 500;
		cursor: pointer;
		box-shadow: 0 8px 18px -10px rgba(1, 91, 192, 0.9);
		transition: background-color 0.15s;
	}

	.save:hover {
		background: #0150a8;
	}
</style>
