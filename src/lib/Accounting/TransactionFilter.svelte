<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { untrack } from 'svelte';
	import Fa from 'svelte-fa';
	import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
	import type { Filter } from './interface';
	import { isFilterActive, latestDate, toggleAccountFilter } from './functions';
	import DateInput from 'date-picker-svelte/DateInput.svelte';

	// Calls handleSearch whenever the filter has changed
	export let filter: Filter, handleSearch: () => void;

	let // The inputs have their own state, because binding them straight to the filter makes the date
		// inputs and the filter update each other forever
		dateAfter: Date | null = null,
		dateBefore: Date | null = null,
		description = '',
		// The date inputs keep their text when the value is set to null, so they are recreated to clear them
		clearCount = 0;

	$: filterActive = isFilterActive(filter);
	$: chosenAccounts = filter.account_ids.filter((account) => account.checked);

	const applyInputs = (after: Date | null, before: Date | null, text: string) =>
		untrack(() => {
			const search = text || null;
			if (
				after?.getTime() === filter.date_after?.getTime() &&
				before?.getTime() === filter.date_before?.getTime() &&
				search === filter.description
			)
				return;

			filter = { ...filter, date_after: after, date_before: before, description: search };
			handleSearch();
		});

	$: applyInputs(dateAfter, dateBefore, description);

	const removeAccount = (id: number) => {
		filter = toggleAccountFilter(filter, id);
		handleSearch();
	};

	const clearFilter = () => {
		filter = {
			account_ids: filter.account_ids.map((account) => ({ ...account, checked: false })),
			date_after: null,
			date_before: null,
			description: null
		};
		dateAfter = null;
		dateBefore = null;
		description = '';
		clearCount++;
		handleSearch();
	};
</script>

<form class="toolbar" on:submit|preventDefault>
	<label class="search">
		<Fa icon={faMagnifyingGlass} />
		<input
			id="accounting-search"
			type="text"
			autocomplete="off"
			placeholder={$_('Search descriptions')}
			aria-label={$_('Search')}
			bind:value={description}
		/>
	</label>
	{#key clearCount}
		<div class="dates">
			<div class="date">
				<span>{$_('Earliest Date')}</span>
				<DateInput bind:value={dateAfter} format="yyyy-MM-dd" placeholder="YYYY-MM-DD" max={latestDate} />
			</div>
			<div class="date">
				<span>{$_('Last Date')}</span>
				<DateInput bind:value={dateBefore} format="yyyy-MM-dd" placeholder="YYYY-MM-DD" max={latestDate} />
			</div>
		</div>
	{/key}
	{#if filterActive}
		<button type="button" class="clear" on:click={clearFilter}>{$_('Clear Filter')}</button>
	{/if}
</form>

{#if chosenAccounts.length > 0}
	<div class="chips">
		{#each chosenAccounts as account (account.id)}
			<button
				type="button"
				class="chip"
				aria-label={`${$_('Remove')} ${account.label}`}
				on:click={() => removeAccount(account.id)}
			>
				{account.label}
				<Fa icon={faXmark} />
			</button>
		{/each}
	</div>
{/if}

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 1rem;
		padding: 1rem 1.25rem;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex: 1 1 14rem;
		height: 2.5rem;
		padding: 0 0.85rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(100, 100, 120, 0.28);
		color: rgb(110, 110, 125);
		background: rgba(100, 100, 120, 0.05);
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.search:focus-within {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(1, 91, 192, 0.15);
	}

	.search input {
		flex: 1;
		min-width: 0;
		background: transparent;
		outline: none;
		color: inherit;
	}

	.dates {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.date {
		display: grid;
		gap: 0.2rem;
	}

	.date span {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgb(110, 110, 125);
	}

	.date :global(.date-time-field input) {
		width: 9.5rem;
		height: 2.5rem;
		padding: 0 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(100, 100, 120, 0.28);
		background: rgba(100, 100, 120, 0.05);
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: inherit;
	}

	.date :global(.date-time-field input:focus) {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(1, 91, 192, 0.15);
	}

	.clear {
		height: 2.5rem;
		padding: 0 0.9rem;
		border-radius: 0.75rem;
		font-weight: 500;
		color: var(--primary);
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.clear:hover {
		background: rgba(1, 91, 192, 0.1);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0 1.25rem 1rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.65rem 0.3rem 0.8rem;
		border-radius: 999px;
		font-size: 0.85rem;
		background: rgba(1, 91, 192, 0.1);
		color: var(--primary);
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.chip:hover {
		background: rgba(1, 91, 192, 0.18);
	}

	:global(html.dark) .search,
	:global(html.dark) .date :global(.date-time-field input) {
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.04);
		color: var(--darkmode-text-color);
	}

	:global(html.dark) .search {
		color: rgb(160, 160, 175);
	}

	:global(html.dark) .date span {
		color: rgb(160, 160, 175);
	}

	:global(html.dark) .clear,
	:global(html.dark) .chip {
		color: #8cbcff;
	}

	:global(html.dark) .chip {
		background: rgba(120, 170, 255, 0.14);
	}
</style>
