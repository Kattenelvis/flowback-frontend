<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import type { scheduledEvent } from '../interface';

	export let showCreateScheduleEvent = false,
		selectedEvent: scheduledEvent,
		workGroups: any[] = [],
		loading = false,
		type: 'user' | 'group';

	// Members list and selections
	let members: { id: number; name: string }[] = [],
		selectedMembers: number[] = [],
		selectedReminders: number[] = [],
		// Default to Daily
		selectedFrequency: number = 1,
		choicesOpenMembers = false,
		choicesOpenReminders = false;

	let frequencyOptions = [
		{ id: 1, name: 'Daily' },
		{ id: 2, name: 'Weekly' },
		{ id: 3, name: 'Monthly' },
		{ id: 4, name: 'Yearly' }
	];

	const dispatch = createEventDispatcher();

	const toggleSelection = (id: number, type: 'members' | 'reminders', event: Event) => {
		// ...existing code for toggling selection...
	};

	const handleSubmit = () => {
		dispatch('submit');
	};
</script>

<!-- Modal 1: Create Event Modal -->
{#if showCreateScheduleEvent}hiiii
	<button
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		on:click={() => (showCreateScheduleEvent = false)}
	>
		<button
			class="bg-white dark:bg-darkobject p-6 rounded-lg w-full max-w-md overflow-y-auto max-h-[90vh] modal-content"
			on:click|stopPropagation
		>
			<h2 class="text-xl mb-4 text-gray-900 dark:text-white">{$_('Create Event')}</h2>
			<form on:submit|preventDefault={handleSubmit}>
				<div class="mb-4">
					<label for="title" class="block mb-1 text-gray-700 dark:text-gray-300"
						>{$_('Title')}</label
					>
					<input
						id="title"
						type="text"
						bind:value={selectedEvent.title}
						class="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="description" class="block mb-1 text-gray-700 dark:text-gray-300"
						>{$_('Description')}</label
					>
					<textarea
						id="description"
						bind:value={selectedEvent.description}
						class="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
					/>
				</div>
				<div class="mb-4">
					<label for="start_date" class="block mb-1 text-gray-700 dark:text-gray-300"
						>{$_('Start Date')}</label
					>
					<input
						id="start_date"
						type="datetime-local"
						bind:value={selectedEvent.start_date}
						class="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="end_date" class="block mb-1 text-gray-700 dark:text-gray-300"
						>{$_('End Date')}</label
					>
					<input
						id="end_date"
						type="datetime-local"
						bind:value={selectedEvent.end_date}
						class="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="meeting_link" class="block mb-1 text-gray-700 dark:text-gray-300"
						>{$_('Meeting Link')}</label
					>
					<input
						id="meeting_link"
						type="url"
						bind:value={selectedEvent.meeting_link}
						class="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
					/>
				</div>

				<div class="mb-4">
					<label for="frequency" class="block mb-1 text-gray-700 dark:text-gray-300"
						>{$_('Frequency')}</label
					>
					<select
						id="frequency"
						bind:value={selectedFrequency}
						class="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
					>
						{#each frequencyOptions as option}
							<option value={option.id}>{option.name}</option>
						{/each}
					</select>
				</div>
                
				{#if type === 'group'}
					<div class="mb-4">
						<label for="work_group" class="block mb-1 text-gray-700 dark:text-gray-300"
							>{$_('Work Group')}</label
						>
						<select
							id="work_group"
							bind:value={selectedEvent.work_group}
							class="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
						>
							<option value={undefined}>None</option>
							{#each workGroups as group}
								<option value={group}>{group.name}</option>
							{/each}
						</select>
					</div>

					<div class="mb-4 members-clickable-region relative">
						<label for="assign_members" class="block mb-1 text-gray-700 dark:text-gray-300"
							>{$_('Assign Members')}</label
						>
						<button
							id="assign_members"
							type="button"
							class="w-full p-2 border rounded flex justify-between items-center text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
							on:click|stopPropagation={() => (choicesOpenMembers = !choicesOpenMembers)}
						>
							<span
								>{selectedMembers.length > 0
									? `${selectedMembers.length} selected`
									: 'Select members'}</span
							>
							<span>{choicesOpenMembers ? '▲' : '▼'}</span>
						</button>
						{#if choicesOpenMembers}
							<button
								class="absolute mt-2 bg-white dark:bg-darkobject shadow-xl text-sm w-full z-[90] border border-gray-300 dark:border-gray-600 rounded max-h-48 overflow-y-auto"
								on:click|stopPropagation
							>
								<div class="text-xs p-2 border-b border-gray-200 dark:border-gray-600">
									{$_('Select Members')}
								</div>
								{#each members as member}
									<button
										type="button"
										on:click|stopPropagation={(e) => toggleSelection(member.id, 'members', e)}
										class="w-full hover:bg-gray-300 active:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-800 dark:active:bg-slate-900 p-2 px-5 flex justify-between items-center hover:cursor-pointer transition-all"
										class:bg-secondary={selectedMembers.includes(member.id)}
										class:text-white={selectedMembers.includes(member.id)}
									>
										{member.name}
										<input
											type="checkbox"
											checked={selectedMembers.includes(member.id)}
											on:change|stopPropagation={(e) => toggleSelection(member.id, 'members', e)}
											class="ml-2"
										/>
									</button>
								{/each}
							</button>
						{/if}
					</div>
					{#if !choicesOpenMembers}
						<div class="mb-4 reminders-clickable-region relative">
							<label for="reminders" class="block mb-1 text-gray-700 dark:text-gray-300"
								>{$_('Reminders')}</label
							>
							<button
								id="reminders"
								type="button"
								class="w-full p-2 border rounded flex justify-between items-center text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
								on:click|stopPropagation={() => (choicesOpenReminders = !choicesOpenReminders)}
							>
								<span
									>{selectedReminders.length > 0
										? `${selectedReminders.length} selected`
										: 'Select reminders'}</span
								>
								<span>{choicesOpenReminders ? '▲' : '▼'}</span>
							</button>
							{#if choicesOpenReminders}
								<button
									class="absolute mt-2 bg-white dark:bg-darkobject shadow-xl text-sm w-full z-[90] border border-gray-300 dark:border-gray-600 rounded max-h-48 overflow-y-auto"
									on:click|stopPropagation
								>
									<div class="text-xs p-2 border-b border-gray-200 dark:border-gray-600">
										{$_('Select Reminders')}
									</div>
									<!-- {#each reminderOptions as reminder}
											<button
												type="button"
												on:click|stopPropagation={(e) => toggleSelection(reminder.id, 'reminders', e)}
												class="w-full hover:bg-gray-300 active:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-800 dark:active:bg-slate-900 p-2 px-5 flex justify-between items-center hover:cursor-pointer transition-all"
												class:bg-secondary={selectedReminders.includes(reminder.id)}
												class:text-white={selectedReminders.includes(reminder.id)}
											>
												{reminder.name}
												<input
													type="checkbox"
													checked={selectedReminders.includes(reminder.id)}
													on:change|stopPropagation={(e) =>
														toggleSelection(reminder.id, 'reminders', e)}
													class="ml-2"
												/>
											</button>
										{/each} -->
								</button>
							{/if}
						</div>
					{/if}
				{/if}
				<div class="flex justify-end gap-2">
					<button
						type="button"
						on:click={() => (showCreateScheduleEvent = false)}
						class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600"
					>
						{$_('Cancel')}
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-dark"
						disabled={loading}
					>
						{loading ? $_('Loading...') : $_('Create')}
					</button>
				</div>
			</form>
		</button>
	</button>
{/if}
