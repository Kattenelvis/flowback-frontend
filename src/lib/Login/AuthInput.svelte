<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
	import type { FullAutoFill } from 'svelte/elements';

	export let value: string = '',
		label: string,
		type: 'text' | 'password' | 'email' = 'text',
		required = false,
		name = '',
		autocomplete: FullAutoFill = 'off',
		autofocus = false,
		max = 100,
		id = `auth-${label.toLowerCase().replace(/\s+/g, '-')}`;

	let revealed = false;

	$: inputType = type === 'password' && revealed ? 'text' : type;
	$: value === null && (value = '');
</script>

<div class="w-full">
	<label for={id} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
		{$_(label)}
	</label>
	<div class="relative">
		<!-- svelte-ignore a11y-autofocus -->
		<input
			{id}
			{name}
			{required}
			{autocomplete}
			{autofocus}
			type={inputType}
			maxlength={max}
			{value}
			on:input={(e) => (value = e.currentTarget.value)}
			class="w-full rounded-[0.6rem] border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm outline-none transition
				placeholder:text-gray-400 hover:border-gray-400
				focus:border-[var(--brand)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--brand)_18%,transparent)]
				dark:border-gray-600 dark:bg-darkobject dark:text-darkmodeText"
			class:pr-11={type === 'password'}
		/>
		{#if type === 'password'}
			<!-- Named "Show"/"Hide" rather than "... password" so getByLabel('Password') stays unambiguous -->
			<button
				type="button"
				class="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
				aria-label={$_(revealed ? 'Hide' : 'Show')}
				aria-pressed={revealed}
				on:click={() => (revealed = !revealed)}
			>
				<Fa icon={revealed ? faEyeSlash : faEye} />
			</button>
		{/if}
	</div>
</div>
