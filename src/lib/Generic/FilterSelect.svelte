<script lang="ts">
	import { tick } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

	// A compact labelled dropdown for filter bars. It never shrinks below its
	// content, so a row of them wraps on narrow screens instead of squeezing.
	// Option labels are shown as given, so translate them before passing them in.
	export let label: string,
		value: any,
		labels: string[] = [],
		values: any[] = labels,
		onChange: () => void = () => {},
		Class = '';

	// Wait for the bound value to reach the parent before telling it
	const changed = async () => {
		await tick();
		onChange();
	};
</script>

<label
	class="relative inline-flex max-w-full shrink-0 items-center rounded-full bg-gray-100 text-sm transition-colors hover:bg-gray-200 focus-within:ring-2 focus-within:ring-primary dark:bg-darkbackground dark:hover:bg-gray-700 dark:focus-within:ring-secondary {Class}"
>
	<span class="pl-3 text-gray-500 dark:text-gray-400">{$_(label)}</span>
	<select
		bind:value
		on:change={changed}
		class="min-w-0 cursor-pointer appearance-none border-0 bg-transparent [field-sizing:content] py-1.5 pl-1.5 pr-8 font-semibold text-gray-800 outline-none dark:text-darkmodeText"
	>
		{#each labels as option, i}
			<option value={values[i]} class="dark:bg-darkobject">{option}</option>
		{/each}
	</select>
	<Fa
		icon={faChevronDown}
		class="pointer-events-none absolute right-3 text-[0.6rem] text-gray-500 dark:text-gray-400"
	/>
</label>
