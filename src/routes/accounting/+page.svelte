<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/Generic/Button.svelte';
	import Layout from '$lib/Generic/Layout.svelte';
	import Loader from '$lib/Generic/Loader.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import Select from '$lib/Generic/Select.svelte';
	import Pagination from '$lib/Generic/Pagination.svelte';
	import { fetchRequest, fetchAllPages } from '$lib/FetchRequest';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import type {
		Transaction as TransactionType,
		Account,
		Filter
	} from '$lib/Accounting/interface';
	import Transaction from '$lib/Accounting/Transaction.svelte';
	import TransactionFilter from '$lib/Accounting/TransactionFilter.svelte';
	import TransactionModal from '$lib/Accounting/TransactionModal.svelte';
	import AccountModal from '$lib/Accounting/AccountModal.svelte';
	import formatDate from '$lib/Accounting/formatDate';
	import { generateAndDownloadHTML } from '$lib/Accounting/HTML';
	import {
		escapeHTML,
		errorMessage,
		filterQuery,
		formatAmount
	} from '$lib/Accounting/functions';

	let loading = true,
		transactions: TransactionType[] = [],
		accounts: Account[] = [],
		next: string = '',
		prev: string = '',
		limit = 20,
		filter: Filter = {
			account_ids: [],
			date_after: null,
			date_before: null,
			description: null
		},
		openTransactionModal = false,
		editedTransaction: TransactionType | null = null,
		openAccountModal = false,
		editedAccount: Account | null = null,
		deletedTransaction: TransactionType | null = null,
		openDeleteTransaction = false,
		deletedAccount: Account | null = null,
		openDeleteAccount = false,
		searchTimer: ReturnType<typeof setTimeout>;

	// Accounts the totals are calculated for, which is all of them unless some are filtered on
	$: shownAccounts = filter.account_ids.some((account) => account.checked)
		? accounts.filter((account) =>
				filter.account_ids.some((selected) => selected.checked && selected.id === account.id)
			)
		: accounts;
	$: totalBalance = shownAccounts.reduce((total, account) => total + account.balance, 0);

	onMount(async () => {
		await refresh();
		loading = false;
	});

	const refresh = async () => {
		await getAccounts();
		await getTransactions();
	};

	const getAccounts = async () => {
		const { ok, results } = await fetchAllPages<Account>('ledger/account/list');
		if (!ok) {
			ErrorHandlerStore.set({ message: 'Something went wrong', success: false });
			return;
		}

		accounts = results;
		// Keeps the chosen accounts when the list is fetched again
		filter.account_ids = accounts.map((account) => ({
			id: account.id,
			checked: filter.account_ids.some((selected) => selected.id === account.id && selected.checked),
			label: `${account.account_name} ${account.account_number}`
		}));
	};

	const getTransactions = async () => {
		const query = filterQuery(filter);
		query.set('limit', String(limit));

		const { res, json } = await fetchRequest('GET', `ledger/transactions/list?${query}`);
		if (!res.ok) {
			ErrorHandlerStore.set({ message: errorMessage(json), success: false });
			return;
		}

		next = json.next ?? '';
		prev = json.previous ?? '';
		transactions = json.results;
	};

	// Typing in the filter would otherwise send a request for every keystroke. It is called from a
	// reactive statement in the filter, so reading searchTimer must not make that statement depend on it
	const handleSearch = () =>
		untrack(() => {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(getTransactions, 300);
		});

	const deleteTransaction = async () => {
		if (!deletedTransaction) return;

		const { res, json } = await fetchRequest(
			'POST',
			`ledger/account/${deletedTransaction.account.id}/transactions/${deletedTransaction.id}/delete`
		);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: errorMessage(json), success: false });
			return;
		}

		ErrorHandlerStore.set({ message: 'Successfully deleted transaction', success: true });
		openDeleteTransaction = false;
		await refresh();
	};

	const deleteAccount = async () => {
		if (!deletedAccount) return;

		const { res, json } = await fetchRequest('POST', `ledger/account/${deletedAccount.id}/delete`);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: errorMessage(json), success: false });
			return;
		}

		ErrorHandlerStore.set({ message: 'Successfully deleted account', success: true });
		openDeleteAccount = false;
		await refresh();
	};

	// The sheet lists every account's balance over the filtered dates, not only the shown page
	const generateHTMLContent = async () => {
		const { ok, results } = await fetchAllPages<TransactionType>(
			`ledger/transactions/list?${filterQuery(filter)}`
		);

		if (!ok) {
			ErrorHandlerStore.set({ message: 'Something went wrong', success: false });
			return '';
		}

		let total = 0;
		const rows = shownAccounts
			.map((account) => {
				const balance = results
					.filter((transaction) => transaction.account.id === account.id)
					.reduce(
						(sum, transaction) =>
							sum + (transaction.debit_amount || 0) - (transaction.credit_amount || 0),
						0
					);
				total += balance;

				return `<div>${escapeHTML(account.account_name)}</div><div>${formatAmount(balance) || 0}</div>`;
			})
			.join('');

		return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${$_('Accounting')}</title>
        </head>
        <body>
            <h1 style="text-align:center">${$_('Sheet')}</h1>
            <div>${$_('From')}: ${filter.date_after ? formatDate(filter.date_after.toString()) : $_('Start')}</div>
            <div>${$_('To')}: ${filter.date_before ? formatDate(filter.date_before.toString()) : $_('End')}</div>
            <div style="display:grid; grid-template-columns:50% 50%; margin-top:10px">
                ${rows}
                <div style="font-weight:bold; margin-top:10px">${$_('Total balance')}</div>
                <div style="font-weight:bold; margin-top:10px">${formatAmount(total) || 0}</div>
            </div>
        </body>
        </html>
    `;
	};
</script>

<svelte:head>
	<title>{$_('Accounting')}</title>
</svelte:head>

<Layout centered>
	<div class="p-6 mt-6 dark:text-darkmodeText">
		<Loader bind:loading>
			<h1>{$_('Accounting')}</h1>

			<div class="mt-4">
				<div class="bg-white dark:bg-darkobject p-6">
					<div class="mb-4">{$_('Filtering')}</div>
					<TransactionFilter bind:filter {handleSearch} />
				</div>
				<div class="bg-white dark:bg-darkobject p-6 mt-6 flex flex-wrap gap-2 items-center">
					<Button
						onClick={() => {
							editedTransaction = null;
							openTransactionModal = true;
						}}>{$_('Add transaction')}</Button
					>
					<Button
						onClick={() => {
							editedAccount = null;
							openAccountModal = true;
						}}>{$_('Create account')}</Button
					>
					<Button onClick={() => generateAndDownloadHTML(generateHTMLContent)}
						>{$_('Generate Printable HTML file')}
						{filter.date_before !== null || filter.date_after !== null
							? $_('between selected dates')
							: ''}</Button
					>
					<div class="flex gap-2">
						{$_('Show on page')}:
						<Select
							id="accounting-limit"
							innerLabel={null}
							labels={['20', '50', '100']}
							values={[20, 50, 100]}
							bind:value={limit}
							onInput={() => setTimeout(getTransactions)}
						/>
					</div>
				</div>
			</div>

			<h2 class="mt-6">{$_('Accounts')}</h2>
			<div class="flex flex-col gap-4 mt-3 dark:bg-darkobject bg-white rounded shadow p-4">
				<div class="grid grid-cols-4 gap-4">
					<div class="font-bold">{$_('Account Name')}</div>
					<div class="font-bold">{$_('Account Number')}</div>
					<div class="font-bold">{$_('Balance')}</div>
					<div></div>
				</div>
				{#each accounts as account (account.id)}
					<div class="grid grid-cols-4 gap-4 items-center" data-account-id={account.id}>
						<div>{account.account_name}</div>
						<div>{account.account_number}</div>
						<div>{formatAmount(account.balance) || 0}</div>
						<div class="flex gap-4 justify-end">
							<button
								type="button"
								class="cursor-pointer"
								aria-label={$_('Edit account')}
								on:click={() => {
									editedAccount = account;
									openAccountModal = true;
								}}
							>
								<Fa icon={faPen} />
							</button>
							<button
								type="button"
								class="cursor-pointer"
								aria-label={$_('Remove account')}
								on:click={() => {
									deletedAccount = account;
									openDeleteAccount = true;
								}}
							>
								<Fa icon={faTrash} />
							</button>
						</div>
					</div>
				{:else}
					<div>{$_('You have no accounts yet')}</div>
				{/each}
			</div>

			<div class="mt-5" id="accounting-total-balance">
				{$_('Total balance')}: {formatAmount(totalBalance) || 0}
			</div>
			<h2 class="mt-3">{$_('Transactions')}</h2>
			<div class="flex flex-col gap-4 mt-3 dark:bg-darkobject bg-white rounded shadow p-4">
				<div class="grid grid-cols-8 gap-4">
					<div class="font-bold">{$_('Account Name')}</div>
					<div class="font-bold">{$_('Account Number')}</div>
					<div class="font-bold">{$_('Debit')}</div>
					<div class="font-bold">{$_('Credit')}</div>
					<div class="font-bold">{$_('Description')}</div>
					<div class="font-bold">{$_('Verification number')}</div>
					<div class="font-bold">{$_('Date')}</div>
					<div></div>
				</div>

				{#each transactions as transaction (transaction.id)}
					<Transaction
						{transaction}
						onEdit={(selected) => {
							editedTransaction = selected;
							openTransactionModal = true;
						}}
						onDelete={(selected) => {
							deletedTransaction = selected;
							openDeleteTransaction = true;
						}}
					/>
				{:else}
					<div>{$_('No transactions found')}</div>
				{/each}

				<Pagination bind:iterable={transactions} bind:next bind:prev />
			</div>
		</Loader>
	</div>
</Layout>

<TransactionModal
	bind:open={openTransactionModal}
	{accounts}
	transaction={editedTransaction}
	onSaved={refresh}
/>

<AccountModal bind:open={openAccountModal} account={editedAccount} onSaved={refresh} />

<Modal bind:open={openDeleteTransaction}>
	<div slot="header">{$_('Are you sure?')}</div>
	<div slot="body">
		{deletedTransaction?.description ?? ''}
	</div>
	<div slot="footer">
		<Button buttonStyle="warning" onClick={deleteTransaction}>{$_('Delete')}</Button>
		<Button onClick={() => (openDeleteTransaction = false)}>{$_('Cancel')}</Button>
	</div>
</Modal>

<Modal bind:open={openDeleteAccount}>
	<div slot="header">{$_('Are you sure?')}</div>
	<div slot="body">
		{deletedAccount?.account_name ?? ''}
		<div class="mt-2">{$_('Deleting an account also deletes all of its transactions.')}</div>
	</div>
	<div slot="footer">
		<Button buttonStyle="warning" onClick={deleteAccount}>{$_('Delete Account')}</Button>
		<Button onClick={() => (openDeleteAccount = false)}>{$_('Cancel')}</Button>
	</div>
</Modal>
