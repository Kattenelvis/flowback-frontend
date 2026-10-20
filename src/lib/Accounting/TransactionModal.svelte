<script lang="ts">
	import { _ } from 'svelte-i18n';
	import DateInput from 'date-picker-svelte/DateInput.svelte';
	import { fetchRequest } from '$lib/FetchRequest';
	import Modal from '$lib/Generic/Modal.svelte';
	import Select from '$lib/Generic/Select.svelte';
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
	<div slot="body" class="form">
		<fieldset class="segmented">
			<legend class="sr-only">{$_('Transaction type')}</legend>
			<label class="debit" class:active={account_type === 'debit'}>
				<input type="radio" value="debit" bind:group={account_type} />
				<span>{$_('Debit')}</span>
			</label>
			<label class="credit" class:active={account_type === 'credit'}>
				<input type="radio" value="credit" bind:group={account_type} />
				<span>{$_('Credit')}</span>
			</label>
		</fieldset>

		<label class="amount" for="transaction-amount">
			<span class="caption">{$_('Amount')}</span>
			<input
				id="transaction-amount"
				class:credit={account_type === 'credit'}
				type="number"
				inputmode="decimal"
				step="any"
				min="0"
				placeholder="0.00"
				bind:value={amount}
			/>
		</label>

		<label class="field">
			<span class="caption">{$_('Description')}</span>
			<input type="text" maxlength="100" autocomplete="off" bind:value={description} />
		</label>
		<label class="field">
			<span class="caption">{$_('Verification number')}</span>
			<input type="text" maxlength="20" autocomplete="off" bind:value={verification_number} />
		</label>

		<div class="row">
			<div class="field date-field">
				<span class="caption">{$_('Date')}</span>
				<DateInput bind:value={date} format="yyyy-MM-dd" placeholder="YYYY-MM-DD" max={latestDate} />
			</div>
			<div class="field">
				<label class="caption" for="transaction-account">{$_('Account')}</label>
				<Select
					id="transaction-account"
					innerLabel={null}
					labels={accounts.map((account) => `${account.account_name} ${account.account_number}`)}
					values={accounts.map((account) => account.id)}
					bind:value={account_id}
				/>
			</div>
		</div>
	</div>
	<div slot="footer">
		<button type="button" class="save" on:click={save}>
			{transaction ? $_('Save') : $_('Create transaction')}
		</button>
	</div>
</Modal>

<style>
	.form {
		display: grid;
		gap: 1rem;
		text-align: left;
	}

	.segmented {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 0.9rem;
		background: rgba(100, 100, 120, 0.12);
	}

	.segmented label {
		position: relative;
		display: grid;
		place-items: center;
		height: 2.4rem;
		border-radius: 0.7rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s,
			box-shadow 0.15s;
	}

	.segmented input {
		position: absolute;
		opacity: 0;
		inset: 0;
		cursor: pointer;
	}

	.segmented label.active {
		background: #fff;
		box-shadow: 0 2px 8px -2px rgba(20, 20, 40, 0.3);
		color: #0b5cad;
	}

	.segmented label.credit.active {
		color: #b4530a;
	}

	.segmented label:focus-within {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
	}


	.amount input {
		width: 100%;
		padding: 0.5rem 0.9rem;
		border-radius: 0.9rem;
		border: 1px solid rgba(100, 100, 120, 0.3);
		background: rgba(100, 100, 120, 0.05);
		font-family: var(--font-mono);
		font-size: 1.9rem;
		letter-spacing: -0.03em;
		color: #0b5cad;
		text-align: right;
	}

	.amount input.credit {
		color: #b4530a;
	}

	.amount input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(1, 91, 192, 0.15);
	}


	.field input[type='text'],
	.field :global(select) {
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

	.field input[type='text']:focus,
	.field :global(select:focus) {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(1, 91, 192, 0.15);
	}

	:global(html.dark) .field input[type='text'],
	:global(html.dark) .field :global(select) {
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

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.date-field :global(.date-time-field input) {
		width: 100%;
		height: 2.2rem;
		padding: 0 0.6rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(100, 100, 120, 0.3);
		background: transparent;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: inherit;
	}

	.date-field :global(.date-time-field input) {
		height: 2.5rem;
		border-radius: 0.75rem;
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	:global(html.dark) .segmented {
		background: rgba(255, 255, 255, 0.07);
	}

	:global(html.dark) .segmented label.active {
		background: rgba(255, 255, 255, 0.14);
		box-shadow: none;
		color: #7fb8ff;
	}

	:global(html.dark) .segmented label.credit.active {
		color: #ffb067;
	}


	:global(html.dark) .amount input {
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.04);
		color: #7fb8ff;
	}

	:global(html.dark) .amount input.credit {
		color: #ffb067;
	}

	:global(html.dark) .date-field :global(.date-time-field input) {
		border-color: rgba(255, 255, 255, 0.2);
	}
</style>
