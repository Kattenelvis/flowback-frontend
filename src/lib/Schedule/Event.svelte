<!-- Event.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import type { scheduledEvent } from '$lib/Schedule/interface';
	import { elipsis } from '$lib/Generic/GenericFunctions';
	import { fetchRequest } from '$lib/FetchRequest';
	import { page } from '$app/stores';
	import CreateEventModal from './Modals/CreateEventModal.svelte';
	import EditEventModal from './Modals/EditEventModal.svelte';
	import ViewEventModal from './Modals/ViewEventModal.svelte';

	export let Class = '',
		x: number,
		y: number,
		advancedTimeSettingsDates: Date[] = [],
		selectedDatePosition = '0-0',
		showCreateScheduleEvent = false,
		showEvent = false,
		showEditScheduleEvent = false,
		selectedDate = new Date(),
		month: number,
		year: number,
		events: scheduledEvent[] = [],
		selectedEvent: scheduledEvent,
		workGroups: any[] = [],
		type: 'user' | 'group',
		scheduleEventCreate: (event: scheduledEvent) => Promise<void>,
		scheduleEventEdit: (event: scheduledEvent) => Promise<void>,
		scheduleEventDelete: (eventId: number) => Promise<void>;

	// Members list and selections
	let members: { id: number; name: string }[] = [],
		selectedMembers: number[] = [],
		selectedReminders: number[] = [],
		// Default to Daily
		selectedFrequency: number = 1,
		choicesOpenMembers = false,
		choicesOpenReminders = false;

	const currentDate = new Date();
	const groupId = $page.params.groupId || '1';

	onMount(async () => {
		const today = new Date();
		let tomorrow = new Date();
		tomorrow.setDate(today.getDate());
		advancedTimeSettingsDates = [today, tomorrow];
		if (type === 'group') {
			await fetchMembers();
		}
		window.addEventListener('click', handleOutsideClick);
	});

	onDestroy(() => {
		window.removeEventListener('click', handleOutsideClick);
		restoreBackgroundScroll();
	});

	$: if (showEvent || showCreateScheduleEvent || showEditScheduleEvent) {
		preventBackgroundScroll();
	} else {
		restoreBackgroundScroll();
	}

	const getDate = (year: number, month: number, x: number, y: number) => {
		return new Date(year, month, getDay(x, y));
	};

	const firstDayInMonthWeekday = () => {
		return new Date(year, month, 0).getDay();
	};

	const getDay = (x: number, y: number) => {
		return -firstDayInMonthWeekday() + x + 7 * (y - 1);
	};

	const isToday = () => {
		return (
			getDay(x, y) === currentDate.getDate() &&
			month === currentDate.getMonth() &&
			year === currentDate.getFullYear()
		);
	};

	const getEventsAtDate = (date: Date) => {
		return events
			?.filter((event) => {
				let startDate = new Date(event.start_date);
				startDate.setHours(0);
				startDate.setMinutes(0);
				startDate.setSeconds(0);
				return startDate <= date && new Date(event.end_date) >= date;
			})
			.sort((a, b) => {
				const dateA = new Date(a.start_date).getTime();
				const dateB = new Date(b.start_date).getTime();
				return dateA === dateB ? a.event_id - b.event_id : dateA - dateB;
			});
	};

	// Frequency options
	let frequencyOptions = [
		{ id: 1, name: 'Daily' },
		{ id: 2, name: 'Weekly' },
		{ id: 3, name: 'Monthly' },
		{ id: 4, name: 'Yearly' }
	];

	// Reminder options (in seconds)
	let reminderOptions = [
		{ id: 300, name: '5 minutes before' },
		{ id: 600, name: '10 minutes before' },
		{ id: 1800, name: '30 minutes before' },
		{ id: 3600, name: '1 hour before' },
		{ id: 86400, name: '1 day before' }
	];

	const getGroupUsers = async () => {
		let api = `group/${groupId}/users?limit=100`;
		const { json, res } = await fetchRequest('GET', api);
		if (!res.ok) return [];
		return json.results;
	};

	const fetchMembers = async () => {
		if (type === 'group') {
			const users = await getGroupUsers();
			members = users.map((user: any) => ({
				id: user.id,
				name: user.user?.username || `User ${user.id}`
			}));
		}
	};

	//Helper function to format date for local datetime-local input -->

	function formatDateForLocalInput(date: Date): string {
		const pad = (num: number) => num.toString().padStart(2, '0');
		const year = date.getFullYear();
		const month = pad(date.getMonth() + 1);
		const day = pad(date.getDate());
		const hours = pad(date.getHours() || 0);
		const minutes = pad(date.getMinutes() || 1);
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	const handleOutsideClick = (e: MouseEvent) => {
		const modal = document.querySelector('.modal-content');
		const membersRegion = document.querySelector('.members-clickable-region');
		const remindersRegion = document.querySelector('.reminders-clickable-region');

		if (modal && !modal.contains(e.target as Node)) {
			choicesOpenMembers = false;
			choicesOpenReminders = false;
			return;
		}

		if (choicesOpenMembers && membersRegion && !membersRegion.contains(e.target as Node)) {
			choicesOpenMembers = false;
		}
		if (choicesOpenReminders && remindersRegion && !remindersRegion.contains(e.target as Node)) {
			choicesOpenReminders = false;
		}
	};

	const preventBackgroundScroll = () => {
		document.body.style.overflow = 'hidden';
	};

	const restoreBackgroundScroll = () => {
		document.body.style.overflow = '';
	};

	// Initialize values when opening modals
	const initializeModalValues = () => {
		if (showCreateScheduleEvent) {
			selectedFrequency = 1;
			selectedMembers = [];
			selectedReminders = [];
		} else if (showEditScheduleEvent || showEvent) {
			selectedFrequency =
				selectedEvent.repeat_frequency &&
				frequencyOptions.some((opt) => opt.id === selectedEvent.repeat_frequency)
					? selectedEvent.repeat_frequency
					: 1;
			selectedMembers =
				selectedEvent.assignee_ids?.map((member: any) => {
					return member.id;
				}) || [];
			selectedReminders = selectedEvent.reminders || [];
		}
	}

	$: if (showCreateScheduleEvent || showEditScheduleEvent || showEvent) {
		initializeModalValues();
	}

	const handleSubmit = async () => {
		const updatedEvent = {
			...selectedEvent,
			assignee_ids: type === 'group' ? selectedMembers : undefined,
			reminders: type === 'group' ? selectedReminders : undefined,
			repeat_frequency: type === 'group' ? selectedFrequency : undefined
		};

		try {
			if (showCreateScheduleEvent) {
				await scheduleEventCreate(updatedEvent);
				showCreateScheduleEvent = false;
			} else if (showEditScheduleEvent) {
				await scheduleEventEdit(updatedEvent);
				showEditScheduleEvent = false;
			}
		} catch (error) {
			console.error('Error submitting event:', error);
		}
	};
</script>

<!-- Calendar Day Display -->
<button
	on:dblclick={() => {
		const clickedDate = new Date(year, month, getDay(x, y));
		clickedDate.setHours(0, 0, 0, 0);
		const dateStr = formatDateForLocalInput(clickedDate);
		selectedEvent = {
			start_date: dateStr,
			end_date: dateStr,
			title: '',
			description: '',
			meeting_link: '',
			event_id: 0,
			schedule_origin_name: type,
			created_by: 0,
			work_group: undefined,
			assignee_ids: [],
			reminders: [],
			repeat_frequency: 1
		};
		selectedDate = clickedDate;
		showCreateScheduleEvent = true;
	}}
	class={`${Class} dark:text-darkmodeText dark:hover:brightness-125 dark:bg-darkobject relative calendar-day border-l border-t border-gray-400 select-none cursor-pointer text-gray-600 transition-all duration-20`}
	id={`${x}-${y}`}
	on:click={() => {
		document.getElementById(selectedDatePosition)?.classList.remove('selected');
		document.getElementById(`${x}-${y}`)?.classList.add('selected');
		selectedDatePosition = `${x}-${y}`;
		selectedDate = new Date(year, month, getDay(x, y));
	}}
>
	<div class="w-full flex flex-col items-center">
		{#key events || month || year || window.innerHeight}
			<div
				class={`px-1 rounded-full flex justify-center
                ${isToday() ? 'bg-secondary text-white w-[25%]' : ''}`}
			>
				<div>{new Date(year, month, getDay(x, y)).getDate()}</div>
			</div>
			{#if getEventsAtDate(getDate(year, month, x, y))?.length > 0}
				{#each getEventsAtDate(getDate(year, month, x, y)) as event, i}
					{#if (1000 * i) / window.innerHeight < 3}
						<button
							on:click={() => {
								const formattedStart = new Date(event.start_date).toISOString().slice(0, 16);
								const formattedEnd = new Date(event.end_date).toISOString().slice(0, 16);
								selectedEvent = {
									...event,
									start_date: formattedStart,
									end_date: formattedEnd,
									description: event.description || '',
									meeting_link: event.meeting_link || '',
									assignee_ids: event.assignee_ids || [],
									reminders: event.reminders || [],
									repeat_frequency: event.repeat_frequency || 1
								};
								showEvent = true;
							}}
							class="break-all bg-secondary w-full text-white text-sm mb-1 text-center"
						>
							{elipsis(event.title, 15)}
						</button>
					{/if}
				{/each}
			{/if}
		{/key}
	</div>
</button>

<!-- Modal 1: Create Event Modal -->
{#if showCreateScheduleEvent}
	<CreateEventModal
		{selectedEvent}
		{type}
		{workGroups}
		bind:showCreateScheduleEvent
		on:submit={handleSubmit}
	/>
{/if}

<!-- Modal 2: Edit Event Modal -->
{#if showEditScheduleEvent}
	<EditEventModal
		{selectedEvent}
		{type}
		{workGroups}
		bind:showEditScheduleEvent
		on:submit={handleSubmit}
	/>
{/if}

<!-- Modal 3: View Event Modal -->
{#if showEvent}
	<ViewEventModal
		{selectedEvent}
		{type}
		{scheduleEventDelete}
		bind:showEvent
		on:edit={() => {
			showEvent = false;
			showEditScheduleEvent = true;
		}}
		on:delete={() => scheduleEventDelete(selectedEvent.event_id)}
	/>
{/if}

<style>
	.selected {
		box-shadow: inset 0 0 10px 1px rgba(0, 0, 0, 0.4) !important;
	}

	.today {
		box-shadow: inset 0 0 4px 1px var(--secondary) !important;
		background-color: var(--secondary);
	}

	.today.selected {
		box-shadow: inset 0 0 10px 1px var(--secondary) !important;
	}

	.calendar-day {
		display: flex;
		justify-content: center;
		min-height: 80px;
	}

	.calendar-day:hover {
		box-shadow: inset 0 0 2px 2px rgba(0, 0, 0, 0.1);
	}

	.members-clickable-region,
	.reminders-clickable-region {
		position: relative;
		z-index: 0;
	}

	.modal-content {
		position: relative;
		z-index: 50;
	}

	.members-clickable-region .absolute,
	.reminders-clickable-region .absolute {
		top: 100%;
		left: 0;
		right: 0;
	}
</style>
