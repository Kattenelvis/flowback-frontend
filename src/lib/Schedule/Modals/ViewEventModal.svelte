<script lang="ts">
	export let selectedEvent, showEvent;

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	const handleEdit = () => {
		dispatch('edit');
	};

	const handleDelete = () => {
		dispatch('delete');
	};
</script>

<div
	class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
	role="button"
	on:click={() => (showEvent = false)}
	on:keydown
	tabindex="0"
>
	<button
		class="bg-white dark:bg-darkobject p-6 rounded-lg w-full max-w-md overflow-y-auto max-h-[90vh]"
		on:click|stopPropagation
	>
		<h2 class="text-xl mb-4 text-gray-900 dark:text-white">{selectedEvent.title}</h2>
		<p>
			<strong class="text-gray-700 dark:text-gray-300">Description:</strong>
			{selectedEvent.description || 'N/A'}
		</p>
		<p>
			<strong class="text-gray-700 dark:text-gray-300">Start:</strong>
			{selectedEvent.start_date}
		</p>
		<p>
			<strong class="text-gray-700 dark:text-gray-300">End:</strong>
			{selectedEvent.end_date}
		</p>
		{#if selectedEvent.meeting_link}
			<p>
				<strong class="text-gray-700 dark:text-gray-300">Meeting Link:</strong>
				<a
					href={selectedEvent.meeting_link}
					target="_blank"
					class="text-blue-500 dark:text-blue-300">{selectedEvent.meeting_link}</a
				>
			</p>
		{/if}
		<!-- ...existing group-specific fields... -->
		<div class="flex justify-end gap-2 mt-4">
			<button
				on:click={() => (showEvent = false)}
				class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600"
			>
				Close
			</button>
			<button
				on:click={handleEdit}
				class="px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-800"
			>
				Edit
			</button>
			<button
				on:click={handleDelete}
				class="px-4 py-2 bg-red-500 dark:bg-red-700 text-white rounded hover:bg-red-600 dark:hover:bg-red-800"
			>
				Delete
			</button>
		</div>
	</button>
</div>
