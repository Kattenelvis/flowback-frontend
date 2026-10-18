<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
	import type { Transaction } from './interface';
	import formatDate from './formatDate';
	import { formatAmount } from './functions';

	export let transaction: Transaction,
		onEdit: (transaction: Transaction) => void,
		onDelete: (transaction: Transaction) => void;
</script>

<div class="grid grid-cols-8 gap-4 items-center" data-transaction-id={transaction.id}>
	<div>{transaction.account.account_name}</div>
	<div>{transaction.account.account_number}</div>
	<div>{formatAmount(transaction.debit_amount)}</div>
	<div>{formatAmount(transaction.credit_amount)}</div>
	<div>{transaction.description}</div>
	<div>{transaction.verification_number}</div>
	<div>{formatDate(transaction.date)}</div>
	<div class="flex gap-4 justify-end">
		<button
			type="button"
			class="cursor-pointer"
			aria-label={$_('Edit transaction')}
			on:click={() => onEdit(transaction)}
		>
			<Fa icon={faPen} />
		</button>
		<button
			type="button"
			class="cursor-pointer"
			aria-label={$_('Delete transaction')}
			on:click={() => onDelete(transaction)}
		>
			<Fa icon={faTrash} />
		</button>
	</div>
</div>
