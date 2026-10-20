import type { Filter } from './interface';
import formatDate from './formatDate';

// Float sums like 0.1 + 0.2 would otherwise show up as 0.30000000000000004
export const formatAmount = (amount: number | null | undefined) =>
	amount ? String(Number(Number(amount).toFixed(5))) : '';

// The date inputs only allow dates until the end of the current year unless given a later max
export const latestDate = new Date(new Date().getFullYear() + 20, 11, 31);

// For display: thousands separators and at least two decimals, in the browser's locale
export const formatMoney = (amount: number | null | undefined) =>
	Number(Number(amount || 0).toFixed(5)).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 5
	});

export const balanceTone = (amount: number) =>
	Math.abs(amount) < 0.000005 ? 'zero' : amount > 0 ? 'positive' : 'negative';

export const toggleAccountFilter = (filter: Filter, id: number): Filter => ({
	...filter,
	account_ids: filter.account_ids.map((account) =>
		account.id === id ? { ...account, checked: !account.checked } : account
	)
});

export const escapeHTML = (text: string) =>
	text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);

export const filterQuery = (filter: Filter) => {
	const query = new URLSearchParams();

	filter.account_ids.forEach((account) => {
		if (account.checked) query.append('account_ids', String(account.id));
	});
	if (filter.date_after) query.set('date_after', formatDate(filter.date_after.toString()));
	if (filter.date_before) query.set('date_before', formatDate(filter.date_before.toString()));
	if (filter.description) query.set('description', filter.description);

	return query;
};

export const isFilterActive = (filter: Filter) =>
	filter.account_ids.some((account) => account.checked) ||
	filter.date_after !== null ||
	filter.date_before !== null ||
	!!filter.description;

// Backend errors are either {detail: ['message']} or {detail: {field: ['message']}}
export const errorMessage = (json: any, fallback = 'Something went wrong') => {
	const detail = json?.detail;
	const first = Array.isArray(detail)
		? detail[0]
		: detail && typeof detail === 'object'
			? Object.entries(detail)
					.map(([field, messages]) =>
						field === 'non_field_errors' ? String(messages) : `${field}: ${messages}`
					)
					.join(', ')
			: detail;

	return typeof first === 'string' && first ? first : fallback;
};
