<script lang="ts">
	import { _ } from 'svelte-i18n';
	import DateInput from 'date-picker-svelte/DateInput.svelte';
	import { fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import Select from '$lib/Generic/Select.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import type { Account, Transaction } from './interface';
	import { errorMessage, latestDate } from './functions';

	// Creates a transaction, or edits `transaction` when one is given
	export let open = false,
		accounts: Account[] = [],
		transaction: Transaction | null = null,
		onSaved: () => void = () => {};

	let account_type: 'debit' | 'credit' = 'debit',
		amount: number | null = null,
		description = '',
		verification_number = '',
		date = new Date(),
		account_id: number | undefined;

	const reset = () => {
		account_type = transaction && !transaction.debit_amount ? 'credit' : 'debit';
		amount = transaction ? transaction.debit_amount || transaction.credit_amount : null;
		description = transaction?.description ?? '';
		verification_number = transaction?.verification_number ?? '';
		date = transaction ? new Date(transaction.date) : new Date();
		account_id = transaction?.account.id ?? accounts[0]?.id;
	};

	$: if (open) reset();

	const save = async () => {
		if (!amount || amount <= 0) {
			ErrorHandlerStore.set({ message: 'The amount must be greater than zero', success: false });
			return;
		}
		if (account_id === undefined) {
			ErrorHandlerStore.set({ message: 'Create an account first', success: false });
			return;
		}

		const data = {
			debit_amount: account_type === 'debit' ? amount : 0,
			credit_amount: account_type === 'credit' ? amount : 0,
			description,
			verification_number,
			date
		};

		const { res, json } = transaction
			? await fetchRequest(
					'POST',
					`ledger/account/${transaction.account.id}/transactions/${transaction.id}/update`,
					{ ...data, new_account_id: account_id }
				)
			: await fetchRequest('POST', `ledger/account/${account_id}/transactions/create`, data);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: errorMessage(json), success: false });
			return;
		}

		ErrorHandlerStore.set({
			message: transaction ? 'Successfully updated transaction' : 'Successfully created transaction',
			success: true
		});
		open = false;
		onSaved();
	};
</script>

<Modal bind:open onSubmit={save}>
	<div slot="header">{transaction ? $_('Edit transaction') : $_('Add transaction')}</div>
	<div slot="body" class="text-left">
		<fieldset>
			<legend>{$_('Transaction type')}</legend>
			<div>
				<input type="radio" id="transaction-debit" value="debit" bind:group={account_type} />
				<label for="transaction-debit">{$_('Debit')}</label>
			</div>
			<div>
				<input type="radio" id="transaction-credit" value="credit" bind:group={account_type} />
				<label for="transaction-credit">{$_('Credit')}</label>
			</div>
		</fieldset>
		<div class="mt-3">
			<label for="transaction-amount">{$_('Amount')}</label>
			<div>
				<input
					id="transaction-amount"
					class="dark:bg-darkobject"
					type="number"
					step="any"
					min="0"
					bind:value={amount}
				/>
			</div>
		</div>
		<div class="mt-3">
			<TextInput label="Verification number" max={20} bind:value={verification_number} />
		</div>
		<div class="mt-3">
			<TextInput label="Description" bind:value={description} />
		</div>
		<div class="mt-3">
			<span>{$_('Date')}</span>
			<DateInput bind:value={date} format="yyyy-MM-dd" max={latestDate} />
		</div>
		<div class="mt-3">
			<label for="transaction-account">{$_('Account')}</label>
			<Select
				id="transaction-account"
				innerLabel={null}
				labels={accounts.map((account) => `${account.account_name} ${account.account_number}`)}
				values={accounts.map((account) => account.id)}
				bind:value={account_id}
			/>
		</div>
	</div>
	<div slot="footer">
		<Button onClick={save}>{transaction ? $_('Save') : $_('Create transaction')}</Button>
	</div>
</Modal>
