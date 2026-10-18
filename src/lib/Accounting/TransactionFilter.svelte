<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { untrack } from 'svelte';
	import type { Filter } from './interface';
	import { isFilterActive, latestDate } from './functions';
	import DateInput from 'date-picker-svelte/DateInput.svelte';
	import CheckboxButtons from '$lib/Generic/CheckboxButtons.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import Button from '$lib/Generic/Button.svelte';

	// Calls handleSearch whenever the filter has changed
	export let filter: Filter, handleSearch: () => void;

	let openFilterAccounts = false,
		filterOn = false,
		// The inputs have their own state, because binding them straight to the filter makes the date
		// inputs and the filter update each other forever
		dateAfter: Date | null = null,
		dateBefore: Date | null = null,
		description = '',
		// The date inputs keep their text when the value is set to null, so they are recreated to clear them
		clearCount = 0;

	$: filterActive = isFilterActive(filter);

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

	const changingCheckbox = (id: number) => {
		filter = {
			...filter,
			account_ids: filter.account_ids.map((selected) =>
				selected.id === id ? { ...selected, checked: !selected.checked } : selected
			)
		};
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

{#if filterActive}
	<Button onClick={clearFilter}>{$_('Clear Filter')}</Button>
{/if}

<form class="mt-6" on:submit|preventDefault>
	{#if filterOn}
		<Button onClick={() => (filterOn = false)}>{$_('Close Filter Options')}</Button>
		<div class="mt-5">
			<div class="mt-6">
				<label class="block" for="accounting-search">{$_('Search')}</label>
				<input
					id="accounting-search"
					type="text"
					class="bg-gray-200 dark:bg-darkbackground outline outline-1 outline-gray-300 w-full"
					bind:value={description}
				/>
			</div>
			{#key clearCount}
				<div class="flex gap-2 mt-6">
					<div>{$_('Earliest Date')}<DateInput bind:value={dateAfter} format="yyyy-MM-dd" max={latestDate} /></div>
					<div>{$_('Last Date')}<DateInput bind:value={dateBefore} format="yyyy-MM-dd" max={latestDate} /></div>
				</div>
			{/key}
			<div class="mt-8">
				<Button onClick={() => (openFilterAccounts = true)}>{$_('Filter Accounts')}</Button>
			</div>
		</div>
	{:else}
		<Button onClick={() => (filterOn = true)}>{$_('Open Filter Options')}</Button>
	{/if}
</form>
<Modal bind:open={openFilterAccounts}>
	<div slot="header">{$_('Filter Accounts')}</div>
	<div slot="body">
		<CheckboxButtons
			onChange={changingCheckbox}
			label=""
			labels={filter.account_ids}
			Class={'flex flex-col text-left'}
		/>
	</div>
</Modal>
