<script lang="ts">
	import TextInput from '$lib/Generic/TextInput.svelte';
	import type { Filter } from './Kanban';
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { elipsis } from '$lib/Generic/GenericFunctions';
	import type { WorkGroup } from '../WorkingGroups/interface';

	export let filter: Filter,
		handleSearch: () => Promise<void>,
		Class = '',
		workGroups: WorkGroup[] = [];

	let searched = true;

	const onWorkGroupChange = async (workGroupId: string) => {
		filter.workgroup = workGroupId ? Number(workGroupId) : null;
		searched = false;
		await handleSearch();
	};

	onMount(() => {});
</script>

<form
	class="bg-white dark:bg-darkobject dark:text-darkmodeText shadow rounded p-4 flex flex-col w-full gap-4 ${Class}"
	on:submit|preventDefault={async () => {
		searched = true;
		await handleSearch();
	}}
>
	<div class="w-full flex items-end gap-4">
		<TextInput
			Class="flex-1 placeholder-gray-600 rounded pr-6 text-gray-500 bg-gray-100 dark:bg-darkobject dark:text-darkmodeText"
			inputClass="placeholder-gray-600 text-gray-500 border-0 bg-gray-100 dark:bg-darkobject dark:text-darkmodeText"
			placeholder={$_('Search tasks')}
			on:change={async () => {
				searched = false;
				await handleSearch();
			}}
			label=""
			max={null}
			search={true}
			bind:value={filter.search}
		/>
		<div class="flex flex-row gap-2 flex-1 items-center">
			<label class="block text-md" for="work-group">
				{$_('Work Group')}:
			</label>
			<select
				style="width:100%"
				class="rounded p-1 dark:border-gray-600 dark:bg-darkobject text-gray-700 dark:text-darkmodeText font-semibold"
				on:change={(e) => onWorkGroupChange(e.target.value)}
				id="work-group"
			>
				<option value="">{($_('All'))}</option>
				{#each workGroups as group}
					<option value={group.id}>{elipsis(group.name)}</option>
				{/each}
			</select>
		</div>
	</div>
</form>