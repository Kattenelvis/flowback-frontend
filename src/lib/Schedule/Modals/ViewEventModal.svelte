<script lang="ts">
	import type { scheduledEvent } from '../interface';
	import { _ } from 'svelte-i18n';

	export let showEvent = false,
		showEditScheduleEvent = false,
		selectedEvent: scheduledEvent,
		type: 'user' | 'group',
		scheduleEventDelete: (eventId: number) => Promise<void>;

	// Members list and selections
	let members: { id: number; name: string }[] = [];
</script>

{#if showEvent}
	<button
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		on:click={() => (showEvent = false)}
	>
		<button
			class="bg-white dark:bg-darkobject p-6 rounded-lg w-full max-w-md overflow-y-auto max-h-[90vh]"
			on:click|stopPropagation
		>
			<h2 class="text-xl mb-4 text-gray-900 dark:text-white">{selectedEvent.title}</h2>
			<p>
				<strong class="text-gray-700 dark:text-gray-300">{$_('Description')}:</strong>
				{selectedEvent.description || 'N/A'}
			</p>
			<p>
				<strong class="text-gray-700 dark:text-gray-300">{$_('Start')}:</strong>
				{selectedEvent.start_date}
			</p>
			<p>
				<strong class="text-gray-700 dark:text-gray-300">{$_('End')}:</strong>
				{selectedEvent.end_date}
			</p>
			{#if selectedEvent.meeting_link}
				<p>
					<strong class="text-gray-700 dark:text-gray-300">{$_('Meeting Link')}:</strong>
					<a
						href={selectedEvent.meeting_link}
						target="_blank"
						class="text-blue-500 dark:text-blue-300">{selectedEvent.meeting_link}</a
					>
				</p>
			{/if}
			{#if type === 'group'}
				<!-- {#if selectedEvent.repeat_frequency !== undefined}
					<p>
						<strong class="text-gray-700 dark:text-gray-300">{$_('Frequency')}:</strong>
						{frequencyOptions.find((opt) => opt.id === selectedEvent.repeat_frequency)?.name ||
							'N/A'}
					</p>
				{/if} -->
				{#if selectedEvent.assignee_ids?.length}
					<p>
						<strong class="text-gray-700 dark:text-gray-300">{$_('Assigned Members')}:</strong>
						{selectedEvent.assignee_ids
							.map((id) => members.find((m) => m.id === id)?.name || `User ${id}`)
							.join(', ')}
					</p>
				{/if}
				<!-- {#if selectedEvent.reminders?.length}
					<p>
						<strong class="text-gray-700 dark:text-gray-300">{$_('Reminders')}:</strong>
						{selectedEvent.reminders
							.map((time) => reminderOptions.find((r) => r.id === time)?.name || `${time} seconds`)
							.join(', ')}
					</p>
				{/if} -->
			{/if}
			<div class="flex justify-end gap-2 mt-4">
				<button
					on:click={() => (showEvent = false)}
					class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600"
				>
					{$_('Close')}
				</button>
				<button
					on:click={() => {
						showEvent = false;
						showEditScheduleEvent = true;
					}}
					class="px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-800"
				>
					{$_('Edit')}
				</button>
				<button
					on:click={() => scheduleEventDelete(selectedEvent.event_id)}
					class="px-4 py-2 bg-red-500 dark:bg-red-700 text-white rounded hover:bg-red-600 dark:hover:bg-red-800"
				>
					{$_('Delete')}
				</button>
			</div>
		</button>
	</button>
{/if}
