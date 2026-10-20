<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
	import type { Transaction } from './interface';
	import formatDate from './formatDate';
	import { formatMoney } from './functions';

	export let transaction: Transaction,
		onEdit: (transaction: Transaction) => void,
		onDelete: (transaction: Transaction) => void,
		index = 0;
</script>

<div class="ledger-grid row" style={`--i: ${index}`} data-transaction-id={transaction.id}>
	<div class="description">{transaction.description}</div>
	<div class="meta">
		<time class="date" datetime={transaction.date}>{formatDate(transaction.date)}</time>
		<span class="account">
			<span class="number">{transaction.account.account_number}</span>
			{transaction.account.account_name}
		</span>
		<span class="verification" title={$_('Verification number')}>{transaction.verification_number}</span>
	</div>
	<div class="amounts">
		<div class="amount debit" class:empty={!transaction.debit_amount} data-label={$_('Debit')}>
			{transaction.debit_amount ? formatMoney(transaction.debit_amount) : ''}
		</div>
		<div class="amount credit" class:empty={!transaction.credit_amount} data-label={$_('Credit')}>
			{transaction.credit_amount ? formatMoney(transaction.credit_amount) : ''}
		</div>
	</div>
	<div class="actions">
		<button type="button" aria-label={$_('Edit transaction')} on:click={() => onEdit(transaction)}>
			<Fa icon={faPen} />
		</button>
		<button
			type="button"
			class="danger"
			aria-label={$_('Delete transaction')}
			on:click={() => onDelete(transaction)}
		>
			<Fa icon={faTrash} />
		</button>
	</div>
</div>

<style>
	.row {
		position: relative;
		padding: 0.85rem 1.25rem;
		border-top: 1px solid rgba(100, 100, 120, 0.14);
		align-items: center;
		animation: rise 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both;
		animation-delay: calc(var(--i) * 28ms);
		transition: background-color 0.15s;
	}

	.row:hover,
	.row:focus-within {
		background: rgba(1, 91, 192, 0.05);
	}

	.description {
		font-weight: 500;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.15rem 0.75rem;
		font-size: 0.8rem;
		color: rgb(110, 110, 125);
	}

	.account {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
	}

	.number,
	.verification {
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	.number {
		padding: 0.05rem 0.4rem;
		border-radius: 0.35rem;
		background: rgba(1, 91, 192, 0.1);
		color: var(--primary);
	}

	.verification {
		padding: 0.05rem 0.4rem;
		border-radius: 0.35rem;
		border: 1px solid rgba(100, 100, 120, 0.3);
	}

	.date {
		font-variant-numeric: tabular-nums;
	}

	.amounts {
		display: contents;
	}

	.amount {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		text-align: right;
		white-space: nowrap;
	}

	.debit {
		color: #0b5cad;
	}

	.credit {
		color: #b4530a;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.row:hover .actions,
	.row:focus-within .actions {
		opacity: 1;
	}

	.actions button {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		color: rgb(100, 100, 115);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.actions button:hover {
		background: rgba(1, 91, 192, 0.12);
		color: var(--primary);
	}

	.actions button.danger:hover {
		background: rgba(200, 40, 70, 0.12);
		color: #c02846;
	}

	/* The shared column template is .ledger-grid in the accounting page */
	@media (min-width: 768px) {
		.meta {
			display: contents;
		}

		.date {
			order: 1;
		}

		.description {
			order: 2;
		}

		.account {
			order: 3;
		}

		.verification {
			order: 4;
			justify-self: start;
		}

		.debit {
			order: 5;
		}

		.credit {
			order: 6;
		}

		.actions {
			order: 7;
		}
	}

	/* Phones: description and amount on top, details underneath */
	@media (max-width: 767px) {
		.row {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			column-gap: 1rem;
			row-gap: 0.35rem;
			padding: 0.9rem 1rem;
		}

		.description {
			grid-column: 1;
			grid-row: 1;
		}

		.amounts {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			grid-column: 2;
			grid-row: 1;
		}

		.amount.empty {
			display: none;
		}

		.amount::before {
			content: attr(data-label);
			display: block;
			font-family: system-ui, sans-serif;
			font-size: 0.62rem;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			opacity: 0.7;
		}

		.meta {
			grid-column: 1;
			grid-row: 2;
		}

		.actions {
			grid-column: 2;
			grid-row: 2;
			opacity: 1;
		}
	}

	@media (hover: none) {
		.actions {
			opacity: 1;
		}
	}

	:global(html.dark) .row {
		border-top-color: rgba(255, 255, 255, 0.08);
	}

	:global(html.dark) .row:hover,
	:global(html.dark) .row:focus-within {
		background: rgba(120, 170, 255, 0.07);
	}

	:global(html.dark) .meta {
		color: rgb(160, 160, 175);
	}

	:global(html.dark) .number {
		background: rgba(120, 170, 255, 0.14);
		color: #8cbcff;
	}

	:global(html.dark) .verification {
		border-color: rgba(255, 255, 255, 0.2);
	}

	:global(html.dark) .debit {
		color: #7fb8ff;
	}

	:global(html.dark) .credit {
		color: #ffb067;
	}

	:global(html.dark) .actions button {
		color: rgb(170, 170, 185);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row {
			animation: none;
		}
	}
</style>
