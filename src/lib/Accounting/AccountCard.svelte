<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
	import type { Account } from './interface';
	import { balanceTone, formatMoney } from './functions';

	// Clicking the card filters the transactions to this account
	export let account: Account,
		selected = false,
		index = 0,
		onToggle: (account: Account) => void,
		onEdit: (account: Account) => void,
		onRemove: (account: Account) => void;

	$: tone = balanceTone(account.balance);
</script>

<div class={`card ${tone}`} class:selected style={`--i: ${index}`} data-account-id={account.id}>
	<button type="button" class="main" aria-pressed={selected} on:click={() => onToggle(account)}>
		<span class="number">{account.account_number}</span>
		<span class="name">{account.account_name}</span>
		<span class="balance">{formatMoney(account.balance)}</span>
	</button>
	<div class="actions">
		<button type="button" aria-label={$_('Edit account')} on:click={() => onEdit(account)}>
			<Fa icon={faPen} />
		</button>
		<button
			type="button"
			class="danger"
			aria-label={$_('Remove account')}
			on:click={() => onRemove(account)}
		>
			<Fa icon={faTrash} />
		</button>
	</div>
</div>

<style>
	.card {
		position: relative;
		border-radius: 1rem;
		background: #fff;
		border: 1px solid rgba(100, 100, 120, 0.16);
		box-shadow: 0 1px 2px rgba(20, 20, 40, 0.04);
		overflow: hidden;
		animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
		animation-delay: calc(var(--i) * 55ms + 120ms);
		transition:
			transform 0.18s,
			box-shadow 0.18s,
			border-color 0.18s;
	}

	/* The coloured spine of a ledger book */
	.card::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 4px;
		background: rgba(110, 110, 125, 0.4);
		transition: width 0.18s;
	}

	.card.positive::before {
		background: #12905c;
	}

	.card.negative::before {
		background: #c8324f;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 14px 28px -16px rgba(1, 60, 130, 0.35);
	}

	.card:hover::before,
	.card.selected::before {
		width: 6px;
	}

	.card.selected {
		border-color: var(--primary);
		box-shadow:
			0 0 0 1px var(--primary),
			0 14px 28px -16px rgba(1, 60, 130, 0.45);
	}

	.main {
		display: grid;
		width: 100%;
		gap: 0.15rem;
		padding: 1rem 1.1rem 1rem 1.4rem;
		text-align: left;
		cursor: pointer;
	}

	.number {
		justify-self: start;
		padding: 0.05rem 0.45rem;
		border-radius: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		background: rgba(1, 91, 192, 0.1);
		color: var(--primary);
	}

	.name {
		margin-top: 0.35rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.balance {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-size: 1.45rem;
		letter-spacing: -0.02em;
		overflow-wrap: anywhere;
	}

	.positive .balance {
		color: #0f7b4f;
	}

	.negative .balance {
		color: #b42343;
	}

	.zero .balance {
		color: rgb(120, 120, 135);
	}

	.actions {
		position: absolute;
		top: 0.55rem;
		right: 0.55rem;
		display: flex;
		gap: 0.1rem;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.card:hover .actions,
	.card:focus-within .actions {
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

	@media (hover: none) {
		.actions {
			opacity: 1;
		}
	}

	:global(html.dark) .card {
		background: var(--darkmode-object-color);
		border-color: rgba(255, 255, 255, 0.09);
	}

	:global(html.dark) .card.selected {
		border-color: #6fa8ff;
		box-shadow:
			0 0 0 1px #6fa8ff,
			0 14px 28px -16px rgba(0, 0, 0, 0.8);
	}

	:global(html.dark) .number {
		background: rgba(120, 170, 255, 0.14);
		color: #8cbcff;
	}

	:global(html.dark) .positive .balance {
		color: #5fd6a0;
	}

	:global(html.dark) .negative .balance {
		color: #ff8da1;
	}

	:global(html.dark) .zero .balance {
		color: rgb(150, 150, 165);
	}

	:global(html.dark) .actions button {
		color: rgb(170, 170, 185);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			animation: none;
			transition: none;
		}
	}
</style>
