<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import {
		faBookOpen,
		faFileArrowDown,
		faInbox,
		faPlus,
		faTriangleExclamation
	} from '@fortawesome/free-solid-svg-icons';
	import Layout from '$lib/Generic/Layout.svelte';
	import Loader from '$lib/Generic/Loader.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import Pagination from '$lib/Generic/Pagination.svelte';
	import { fetchRequest, fetchAllPages } from '$lib/FetchRequest';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import type {
		Transaction as TransactionType,
		Account,
		Filter
	} from '$lib/Accounting/interface';
	import Transaction from '$lib/Accounting/Transaction.svelte';
	import AccountCard from '$lib/Accounting/AccountCard.svelte';
	import TransactionFilter from '$lib/Accounting/TransactionFilter.svelte';
	import TransactionModal from '$lib/Accounting/TransactionModal.svelte';
	import AccountModal from '$lib/Accounting/AccountModal.svelte';
	import formatDate from '$lib/Accounting/formatDate';
	import { generateAndDownloadHTML } from '$lib/Accounting/HTML';
	import {
		escapeHTML,
		errorMessage,
		filterQuery,
		formatMoney,
		toggleAccountFilter
	} from '$lib/Accounting/functions';

	let loading = true,
		transactions: TransactionType[] = [],
		transactionCount = 0,
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

	$: accountsFiltered = filter.account_ids.some((account) => account.checked);
	// Accounts the totals are calculated for, which is all of them unless some are filtered on
	$: shownAccounts = accountsFiltered
		? accounts.filter((account) =>
				filter.account_ids.some((selected) => selected.checked && selected.id === account.id)
			)
		: accounts;
	$: totalBalance = shownAccounts.reduce((total, account) => total + account.balance, 0);
	$: pageDebit = transactions.reduce((total, transaction) => total + (transaction.debit_amount || 0), 0);
	$: pageCredit = transactions.reduce(
		(total, transaction) => total + (transaction.credit_amount || 0),
		0
	);

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
		transactionCount = json.count;
		transactions = json.results;
	};

	// Typing in the filter would otherwise send a request for every keystroke. It is called from a
	// reactive statement in the filter, so reading searchTimer must not make that statement depend on it
	const handleSearch = () =>
		untrack(() => {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(getTransactions, 300);
		});

	const toggleAccount = (account: Account) => {
		filter = toggleAccountFilter(filter, account.id);
		handleSearch();
	};

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

				return `<tr><td class="number">${escapeHTML(account.account_number)}</td><td>${escapeHTML(account.account_name)}</td><td class="amount">${formatMoney(balance)}</td></tr>`;
			})
			.join('');

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${$_('Accounting')}</title>
	<style>
		body { font-family: Georgia, 'Times New Roman', serif; color: #1d1d27; max-width: 42rem; margin: 3rem auto; padding: 0 1.5rem; }
		h1 { font-size: 2rem; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 0.25rem; }
		.period { color: #6b6b7b; margin: 0 0 2rem; }
		table { width: 100%; border-collapse: collapse; }
		th { text-align: left; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b7b; padding: 0.5rem 0; border-bottom: 3px double #9a9aaa; }
		td { padding: 0.6rem 0; border-bottom: 1px solid #e3e3ea; }
		.number { font-family: 'Courier New', monospace; color: #015bc0; width: 5rem; }
		.amount, th.amount { text-align: right; font-family: 'Courier New', monospace; }
		tfoot td { font-weight: 700; border-bottom: 3px double #1d1d27; padding-top: 0.9rem; }
	</style>
</head>
<body>
	<h1>${$_('Sheet')}</h1>
	<p class="period">${$_('From')}: ${filter.date_after ? formatDate(filter.date_after.toString()) : $_('Start')} &nbsp;·&nbsp; ${$_('To')}: ${filter.date_before ? formatDate(filter.date_before.toString()) : $_('End')}</p>
	<table>
		<thead><tr><th>${$_('Account Number')}</th><th>${$_('Account Name')}</th><th class="amount">${$_('Balance')}</th></tr></thead>
		<tbody>${rows}</tbody>
		<tfoot><tr><td></td><td>${$_('Total balance')}</td><td class="amount">${formatMoney(total)}</td></tr></tfoot>
	</table>
</body>
</html>`;
	};
</script>

<svelte:head>
	<title>{$_('Accounting')}</title>
</svelte:head>

<Layout centered>
	<div class="accounting w-full max-w-[1100px] px-4 md:px-6 pt-8 pb-28 dark:text-darkmodeText">
		<Loader bind:loading>
			<header class="head">
				<div>
					<p class="eyebrow">{$_('Your books')}</p>
					<h1>{$_('Accounting')}</h1>
				</div>
				<div class="buttons">
					<button
						type="button"
						class="btn primary"
						on:click={() => {
							editedTransaction = null;
							openTransactionModal = true;
						}}
					>
						<Fa icon={faPlus} />
						{$_('Add transaction')}
					</button>
					<button
						type="button"
						class="btn ghost"
						on:click={() => {
							editedAccount = null;
							openAccountModal = true;
						}}
					>
						<Fa icon={faPlus} />
						{$_('Create account')}
					</button>
					<button
						type="button"
						class="btn ghost"
						on:click={() => generateAndDownloadHTML(generateHTMLContent)}
					>
						<Fa icon={faFileArrowDown} />
						{$_('Generate Printable HTML file')}
						{filter.date_before !== null || filter.date_after !== null
							? $_('between selected dates')
							: ''}
					</button>
				</div>
			</header>

			<section class="summary" id="accounting-total-balance">
				<div class="summary-main">
					<span class="label">{$_('Total balance')}</span>
					<span class="figure">{formatMoney(totalBalance)}</span>
					<span class="caption">
						{accountsFiltered
							? $_('For the selected accounts')
							: $_('Debits minus credits across all accounts')}
					</span>
				</div>
				<dl class="stats">
					<div>
						<dt>{$_('Accounts')}</dt>
						<dd>{shownAccounts.length}</dd>
					</div>
					<div>
						<dt>{$_('Transactions')}</dt>
						<dd>{transactionCount}</dd>
					</div>
				</dl>
			</section>

			<section class="section">
				<div class="section-head">
					<h2>{$_('Accounts')}</h2>
					{#if accounts.length > 0}
						<button
							type="button"
							class="link"
							on:click={() => {
								editedAccount = null;
								openAccountModal = true;
							}}
						>
							<Fa icon={faPlus} />
							{$_('New account')}
						</button>
					{/if}
				</div>
				{#if accounts.length > 0}
					<div class="cards">
						{#each accounts as account, index (account.id)}
							{@const selected = filter.account_ids.some(
								(chosen) => chosen.id === account.id && chosen.checked
							)}
							<AccountCard
								{account}
								{selected}
								{index}
								onToggle={toggleAccount}
								onEdit={(chosen) => {
									editedAccount = chosen;
									openAccountModal = true;
								}}
								onRemove={(chosen) => {
									deletedAccount = chosen;
									openDeleteAccount = true;
								}}
							/>
						{/each}
					</div>
				{:else if !loading}
					<div class="empty big">
						<Fa icon={faBookOpen} size="2x" />
						<p class="title">{$_('You have no accounts yet')}</p>
						<p class="hint">{$_('Accounts are the pages of your ledger. Transactions are booked on them.')}</p>
						<button
							type="button"
							class="btn primary"
							on:click={() => {
								editedAccount = null;
								openAccountModal = true;
							}}
						>
							<Fa icon={faPlus} />
							{$_('Create your first account')}
						</button>
					</div>
				{/if}
			</section>

			<section class="section">
				<h2>{$_('Transactions')}</h2>
				<div class="ledger-card">
					<TransactionFilter bind:filter {handleSearch} />

					<div class="ledger-grid head-row" aria-hidden="true">
						<span>{$_('Date')}</span>
						<span>{$_('Description')}</span>
						<span>{$_('Account')}</span>
						<span title={$_('Verification number')}>{$_('Ver. no.')}</span>
						<span class="right">{$_('Debit')}</span>
						<span class="right">{$_('Credit')}</span>
						<span></span>
					</div>

					{#each transactions as transaction, index (transaction.id)}
						<Transaction
							{transaction}
							{index}
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
						{#if !loading}
							<div class="empty">
								<Fa icon={faInbox} size="lg" />
								<p>{$_('No transactions found')}</p>
							</div>
						{/if}
					{/each}

					{#if transactions.length > 0}
						<div class="ledger-grid totals">
							<span class="total-label">{$_('Total on this page')}</span>
							<span class="total debit">{formatMoney(pageDebit)}</span>
							<span class="total credit">{formatMoney(pageCredit)}</span>
						</div>
					{/if}

					<div class="foot">
						<label class="per-page">
							{$_('Show on page')}:
							<select id="accounting-limit" bind:value={limit} on:change={() => getTransactions()}>
								<option value={20}>20</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</label>
						<Pagination bind:iterable={transactions} bind:next bind:prev />
					</div>
				</div>
			</section>
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
		<div class="confirm">
			<span class="warning"><Fa icon={faTriangleExclamation} /></span>
			<p class="name">{deletedTransaction?.description ?? ''}</p>
		</div>
	</div>
	<div slot="footer" class="confirm-buttons">
		<button type="button" class="btn ghost" on:click={() => (openDeleteTransaction = false)}
			>{$_('Cancel')}</button
		>
		<button type="button" class="btn danger" on:click={deleteTransaction}>{$_('Delete')}</button>
	</div>
</Modal>

<Modal bind:open={openDeleteAccount}>
	<div slot="header">{$_('Are you sure?')}</div>
	<div slot="body">
		<div class="confirm">
			<span class="warning"><Fa icon={faTriangleExclamation} /></span>
			<p class="name">{deletedAccount?.account_name ?? ''}</p>
			<p class="hint">{$_('Deleting an account also deletes all of its transactions.')}</p>
		</div>
	</div>
	<div slot="footer" class="confirm-buttons">
		<button type="button" class="btn ghost" on:click={() => (openDeleteAccount = false)}
			>{$_('Cancel')}</button
		>
		<button type="button" class="btn danger" on:click={deleteAccount}>{$_('Delete Account')}</button>
	</div>
</Modal>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.25rem 2rem;
		margin-bottom: 1.5rem;
	}

	.eyebrow {
		margin: 0 0 0.35rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--primary);
	}

	.head h1 {
		margin: 0;
		text-align: left;
		font-size: clamp(2rem, 4.5vw, 2.8rem);
		font-weight: 600;
		letter-spacing: -0.035em;
		line-height: 1;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 2.6rem;
		padding: 0 1.1rem;
		border-radius: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.15s,
			box-shadow 0.15s,
			transform 0.15s;
	}

	.btn:active {
		transform: translateY(1px);
	}

	.btn.primary {
		background: var(--primary);
		color: #fff;
		box-shadow: 0 8px 18px -10px rgba(1, 91, 192, 0.9);
	}

	.btn.primary:hover {
		background: #0150a8;
	}

	.btn.ghost {
		border: 1px solid rgba(100, 100, 120, 0.3);
		background: rgba(255, 255, 255, 0.6);
	}

	.btn.ghost:hover {
		border-color: var(--primary);
		color: var(--primary);
	}

	.btn.danger {
		background: #c8324f;
		color: #fff;
	}

	.btn.danger:hover {
		background: #b02843;
	}

	/* A slim strip: the balance is context for the lists, not the headline */
	.summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 2rem;
		padding: 0.85rem 1.25rem;
		margin-bottom: 1.75rem;
		border-radius: 1rem;
		background: rgba(1, 91, 192, 0.07);
		border: 1px solid rgba(1, 91, 192, 0.14);
		animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.summary-main {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.9rem;
		min-width: 0;
	}

	.label {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgb(105, 105, 120);
	}

	.figure {
		border-bottom: 3px double rgba(1, 91, 192, 0.45);
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-size: 1.3rem;
		letter-spacing: -0.02em;
		color: var(--primary);
		overflow-wrap: anywhere;
	}

	.caption {
		font-size: 0.8rem;
		color: rgb(120, 120, 135);
	}

	.stats {
		display: flex;
		gap: 1.5rem;
		margin: 0;
	}

	.stats div {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
	}

	.stats dt {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgb(120, 120, 135);
	}

	.stats dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
	}

	.section {
		margin-bottom: 2rem;
	}

	.section h2 {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgb(105, 105, 120);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.9rem;
	}

	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.85rem;
	}

	.section-head h2,
	.section > h2 {
		margin: 0;
	}

	.section > h2 {
		margin-bottom: 0.85rem;
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.7rem;
		border-radius: 0.6rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--primary);
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.link:hover {
		background: rgba(1, 91, 192, 0.1);
	}

	.ledger-card {
		border-radius: 1.25rem;
		background: #fff;
		border: 1px solid rgba(100, 100, 120, 0.16);
		box-shadow: 0 1px 2px rgba(20, 20, 40, 0.04);
		overflow: hidden;
	}

	/* Shared column template of the header, the rows and the totals */
	:global(.ledger-grid) {
		display: grid;
		column-gap: 1rem;
	}

	@media (min-width: 768px) {
		:global(.ledger-grid) {
			grid-template-columns: 6.5rem minmax(0, 1.5fr) minmax(0, 1.3fr) 4.5rem 8rem 8rem 4.25rem;
		}
	}

	.head-row {
		display: none;
		padding: 0.7rem 1.25rem;
		border-top: 1px solid rgba(100, 100, 120, 0.14);
		border-bottom: 3px double rgba(100, 100, 120, 0.4);
		background: rgba(100, 100, 120, 0.05);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgb(105, 105, 120);
	}

	@media (min-width: 768px) {
		.head-row {
			display: grid;
		}
	}

	.right {
		text-align: right;
	}

	.totals {
		padding: 0.9rem 1.25rem;
		border-top: 1px solid rgba(100, 100, 120, 0.14);
		background: rgba(100, 100, 120, 0.04);
		align-items: baseline;
	}

	.total-label {
		grid-column: 1 / 5;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgb(105, 105, 120);
	}

	.total {
		justify-self: end;
		padding-bottom: 0.1rem;
		border-bottom: 3px double currentColor;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.total.debit {
		color: #0b5cad;
	}

	.total.credit {
		color: #b4530a;
	}

	@media (max-width: 767px) {
		.totals {
			grid-template-columns: 1fr auto auto;
			column-gap: 1.25rem;
			padding: 0.9rem 1rem;
		}

		.total-label {
			grid-column: 1;
		}
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
		padding: 0.9rem 1.25rem;
		border-top: 1px solid rgba(100, 100, 120, 0.14);
		font-size: 0.9rem;
		color: rgb(105, 105, 120);
	}

	.per-page select {
		margin-left: 0.4rem;
		height: 2.2rem;
		padding: 0 0.5rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(100, 100, 120, 0.3);
		background: transparent;
		color: inherit;
		font-family: var(--font-mono);
	}

	.empty {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		padding: 2.5rem 1rem;
		color: rgb(120, 120, 135);
		text-align: center;
	}

	.empty p {
		margin: 0;
	}

	.empty.big {
		padding: 3rem 1.5rem;
		border-radius: 1.25rem;
		border: 2px dashed rgba(100, 100, 120, 0.3);
		gap: 0.65rem;
	}

	.empty .title {
		font-size: 1.15rem;
		font-weight: 600;
		color: inherit;
	}

	.empty .hint {
		max-width: 26rem;
		margin-bottom: 0.6rem;
	}

	.confirm {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
	}

	.confirm p {
		margin: 0;
	}

	.confirm .name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.confirm .hint {
		font-size: 0.9rem;
		opacity: 0.75;
	}

	.warning {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: 999px;
		background: rgba(200, 50, 79, 0.12);
		color: #c8324f;
		font-size: 1.2rem;
	}

	.confirm-buttons {
		display: flex;
		justify-content: center;
		gap: 0.6rem;
	}

	:global(html.dark) .section h2,
	:global(html.dark) .head-row,
	:global(html.dark) .total-label,
	:global(html.dark) .foot {
		color: rgb(160, 160, 175);
	}

	:global(html.dark) .link {
		color: #8cbcff;
	}

	:global(html.dark) .ledger-card {
		background: var(--darkmode-object-color);
		border-color: rgba(255, 255, 255, 0.09);
	}

	:global(html.dark) .head-row,
	:global(html.dark) .totals,
	:global(html.dark) .foot {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(html.dark) .head-row,
	:global(html.dark) .totals {
		background: rgba(255, 255, 255, 0.03);
	}

	:global(html.dark) .btn.ghost {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.18);
	}

	:global(html.dark) .btn.ghost:hover {
		border-color: #8cbcff;
		color: #8cbcff;
	}

	:global(html.dark) .eyebrow {
		color: #8cbcff;
	}

	:global(html.dark) .summary {
		background: rgba(120, 170, 255, 0.07);
		border-color: rgba(120, 170, 255, 0.16);
	}

	:global(html.dark) .figure {
		border-bottom-color: rgba(140, 188, 255, 0.5);
		color: #8cbcff;
	}

	:global(html.dark) .label,
	:global(html.dark) .caption,
	:global(html.dark) .stats dt {
		color: rgb(160, 160, 175);
	}

	:global(html.dark) .total.debit {
		color: #7fb8ff;
	}

	:global(html.dark) .total.credit {
		color: #ffb067;
	}

	:global(html.dark) .per-page select {
		border-color: rgba(255, 255, 255, 0.2);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.summary {
			animation: none;
		}
	}
</style>
