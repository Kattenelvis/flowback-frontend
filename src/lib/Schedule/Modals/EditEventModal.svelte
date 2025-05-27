<script lang="ts">

	export let showEditScheduleEvent;
	export let loading = false;

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	const toggleSelection = (id: number, type: 'members' | 'reminders', event: Event) => {
		// ...existing code for toggling selection...
	};

	const handleSubmit = () => {
		dispatch('submit');
	};
</script>

<button
	class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
	on:click={() => (showEditScheduleEvent = false)}
>
	<button
		class="bg-white dark:bg-darkobject p-6 rounded-lg w-full max-w-md overflow-y-auto max-h-[90vh] modal-content"
		on:click|stopPropagation
	>
		<h2 class="text-xl mb-4 text-gray-900 dark:text-white">Edit Event</h2>
		<form on:submit|preventDefault={handleSubmit}>
			<!-- ...existing form fields... -->
			<div class="flex justify-end gap-2">
				<button
					type="button"
					on:click={() => (showEditScheduleEvent = false)}
					class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-dark"
					disabled={loading}
				>
					{loading ? 'Loading...' : 'Update'}
				</button>
			</div>
		</form>
	</button>
</button>
