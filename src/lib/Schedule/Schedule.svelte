<script lang="ts">
	import Fa from 'svelte-fa';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
	import {
		Calendar,
		formatDate,
		type DayHeaderContentArg,
		type Duration,
		type EventDropArg
	} from '@fullcalendar/core';
	import { _ } from 'svelte-i18n';
	import { onDestroy, onMount } from 'svelte';
	import dayGridPlugin from '@fullcalendar/daygrid';
	import { fetchRequest } from '$lib/FetchRequest';
	import timeGridPlugin from '@fullcalendar/timegrid';
	import listPlugin from '@fullcalendar/list';
	import multiMonthPlugin from '@fullcalendar/multimonth';
	import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
	import Modal from '$lib/Generic/Modal.svelte';
	import {
		ScheduleItem2Default,
		type Schedule,
		type ScheduleItem2
	} from '$lib/Schedule/interface';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import TextArea from '$lib/Generic/TextArea.svelte';
	import NotificationOptions from '$lib/Generic/NotificationOptions.svelte';
	import AdvancedFiltering from '$lib/Generic/AdvancedFiltering.svelte';
	import Select from '$lib/Generic/Select.svelte';
	import { deepCopy, toDatetimeLocal } from '$lib/Generic/GenericFunctions';
	import GroupSelection from '$lib/Generic/GroupSelection.svelte';

	let open = $state(false),
		events: ScheduleItem2[] = $state([]),
		selectedEvent: ScheduleItem2 = $state(ScheduleItem2Default),
		editingEvent: ScheduleItem2 = $state(ScheduleItem2Default),
		//TODO get rid of groupid and use groupIds only
		groupId: null | number = $state(null),
		groupIds: number[] = $state([]),
		workgroupIds: number[] = $state([]),
		userChecked = $state(false),
		selectedWorkgroupId: number | null = $state(null),
		selectedGroupId: number | null = $state(null),
		calendar: Calendar,
		lastDateTap: { dateStr: string; time: number } | null = null,
		selectedStartDate: string = $state(''),
		selectedEndDate: string = $state('');

	const HOUR = 60 * 60 * 1000;

	// setDate keeps the wall-clock time across daylight saving changes
	const addDays = (date: Date, days: number) => {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	};

	const startOfDay = (date: Date) => {
		const result = new Date(date);
		result.setHours(0, 0, 0, 0);
		return result;
	};

	// The midnight after the last day the date falls on, so an event ending at 10:30 still covers that day
	const endOfDay = (date: Date) => {
		const midnight = startOfDay(date);
		return midnight < date ? addDays(midnight, 1) : midnight;
	};

	// Like FullCalendar does it: whole days by the calendar, so the wall-clock time survives daylight saving changes
	const addDuration = (date: Date, { years, months, days, milliseconds }: Duration) => {
		const result = new Date(date);
		result.setFullYear(
			result.getFullYear() + years,
			result.getMonth() + months,
			result.getDate() + days
		);
		return new Date(result.getTime() + milliseconds);
	};

	// The datetime-local inputs hold local time without a timezone, which the backend would read as UTC
	const localToISO = (local: string) => (local ? new Date(local).toISOString() : null);

	const scheduleEventList = async () => {
		let schedules: Schedule[] = [];
		// Before getting events, we need to get all schedules for the user, groups and workgroups
		// because events are tied to schedules.

		// Get user schedule
		if (userChecked) {
			let api = `schedule/list?limit=50&origin_name=user`;

			const { res, json } = await fetchRequest('GET', api);
			schedules.push(json.results ?? []);
		}

		// Get group schedules
		if (groupIds.length > 0) {
			let api = `schedule/list?limit=50&`;
			api += `origin_ids=${groupIds.join(',')}&origin_name=group`;

			const { res, json } = await fetchRequest('GET', api);
			schedules.push(json.results ?? []);
		}

		// Get workgroup schedules
		if (workgroupIds.length > 0) {
			let api = `schedule/list?limit=50&origin_ids=${workgroupIds.join(',')}&origin_name=workgroup`;
			const { res, json } = await fetchRequest('GET', api);
			schedules.push(json.results ?? []);
		}

		if (schedules.length === 0) {
			events = [];
			return;
		}
		schedules = schedules.flat(1);

		// Finally, get the events from every schedule
		{
			let api = `schedule/event/list?limit=50&schedule_ids=${schedules.map((s) => s.id).join(',')}`;
			const { res, json } = await fetchRequest('GET', api);

			events = json.results ?? [];
			events = events.map((e) =>
				e.schedule_origin_name === 'workgroup'
					? {
							...e,
							workgroup_id: e.schedule_origin_id
						}
					: e
			);
		}
	};

	const getAPI = (type = '') => {
		let api = '';
		if (selectedWorkgroupId !== null)
			api += `group/workgroup/${selectedWorkgroupId}/schedule/event/${type}`;
		else if (selectedGroupId !== null)
			api += `group/${selectedGroupId}/schedule/event/${type}`;
		else api += `user/schedule/event/${type}`;

		return api;
	};

	const scheduleEventCreate = async () => {
		let api = getAPI('create');

		const { res, json } = await fetchRequest('POST', api, {
			title: editingEvent.title,
			description: editingEvent.description,
			start_date: localToISO(selectedStartDate),
			end_date: localToISO(selectedEndDate),
			repeat_frequency: editingEvent.repeat_frequency,
			meeting_link: editingEvent.meeting_link
		});

		if (!res.ok) {
			//@ts-ignore
			if (res.status === 403) {
				ErrorHandlerStore.set({
					message: 'You do not have permission to create events for this group',
					success: false
				});
				return;
			}

			ErrorHandlerStore.set({
				message: 'Failed to create event',
				success: false
			});
			return;
		}

		ErrorHandlerStore.set({
			message: 'Successfully created event',
			success: true
		});

		selectedEvent = ScheduleItem2Default;
		open = false;
	};

	const scheduleEventUpdate = async () => {
		let api = getAPI('update');

		const { res, json } = await fetchRequest('POST', api, {
			...editingEvent,
			event_id: selectedEvent.id,
			start_date: localToISO(selectedStartDate),
			end_date: localToISO(selectedEndDate)
		});

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Failed to edit event',
				success: false
			});
			return;
		}

		ErrorHandlerStore.set({
			message: 'Successfully edited event',
			success: true
		});

		selectedEvent = ScheduleItem2Default;
		open = false;
	};

	// Dragging or resizing only changes when an event happens, so only its times are sent
	const scheduleEventMove = async (info: EventDropArg | EventResizeDoneArg) => {
		const { event, oldEvent, revert } = info;
		const stored = events.find((e) => e.id.toString() === event.id);
		if (!stored || !event.start) return;

		let start: Date, end: Date;
		if (event.allDay === oldEvent.allDay) {
			// Shift the stored times by however far the event was moved or stretched. That keeps the time of day
			// of events shown as whole-day bars in the month view, and moves all of a repeated event's occurrences
			const storedStart = new Date(stored.start_date);
			const storedEnd = stored.end_date
				? new Date(stored.end_date)
				: new Date(storedStart.getTime() + HOUR);
			start = addDuration(storedStart, 'delta' in info ? info.delta : info.startDelta);
			end = addDuration(storedEnd, 'delta' in info ? info.delta : info.endDelta);
		} else {
			// Moved between the all-day row and the time grid: it loses its end, so give it a default length.
			// A repeated event's occurrences are shifted copies, the backend stores the first one
			const dayOffset = event.extendedProps.dayOffset ?? 0;
			const newEnd =
				event.end ??
				(event.allDay ? addDays(event.start, 1) : new Date(event.start.getTime() + HOUR));
			start = addDays(event.start, -dayOffset);
			end = addDays(newEnd, -dayOffset);
		}

		const { res } = await fetchRequest('POST', getAPI('update'), {
			event_id: Number(event.id),
			start_date: start.toISOString(),
			end_date: end.toISOString()
		});

		if (!res.ok) {
			revert();
			ErrorHandlerStore.set({
				message: 'Failed to edit event',
				success: false
			});
			return;
		}

		ErrorHandlerStore.set({
			message: 'Successfully edited event',
			success: true
		});

		await scheduleEventList();
	};

	// Always start from an empty form, editingEvent may still hold the last opened event
	const openCreateForm = (start: Date, end: Date) => {
		selectedEvent = ScheduleItem2Default;
		editingEvent = deepCopy(ScheduleItem2Default);
		selectedStartDate = toDatetimeLocal(start);
		selectedEndDate = toDatetimeLocal(end);
		open = true;
	};

	const ScheduleEventDelete = async (event_id: number) => {
		let api = getAPI('delete');

		const { res, json } = await fetchRequest('POST', api, {
			event_id
		});

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Failed to delete event',
				success: false
			});
			return;
		}

		ErrorHandlerStore.set({
			message: 'Successfully deleted event',
			success: true
		});

		events = events.filter((e) => e.id !== event_id);
		open = false;
		return;
	};

	// Week and day views get a stacked "WED / 8" column header, today's number highlighted like in the month view
	const timeGridDayHeader = (arg: DayHeaderContentArg) => ({
		html: `<span class="day-header-weekday">${arg.text}</span><span class="day-header-number">${arg.date.getDate()}</span>`
	});

	// Read documentation for this calendar module: https://fullcalendar.io/
	const renderCalendar = () => {
		let calendarEl = document.getElementById('calendar-2');
		if (!calendarEl) return;

		const isMobile = window.innerWidth < 768;
		// Fill the remaining viewport, leaving room for the card padding and the mobile bottom nav
		const height = Math.max(
			480,
			window.innerHeight -
				calendarEl.getBoundingClientRect().top -
				window.scrollY -
				(isMobile ? 88 : 32)
		);

		// Keep the view and date the user was looking at when re-rendering (e.g. on resize)
		const initialView = calendar?.view.type ?? 'dayGridMonth';
		const initialDate = calendar?.getDate();

		calendar?.destroy();
		calendar = new Calendar(calendarEl, {
			plugins: [
				dayGridPlugin,
				interactionPlugin,
				timeGridPlugin,
				listPlugin,
				multiMonthPlugin
			],
			initialView,
			initialDate,
			height,
			headerToolbar: {
				left: 'prev title next',
				center: 'dayGridMonth,timeGridWeek,timeGridDay',
				right: 'today addEventButton'
			},
			buttonText: {
				today: $_('Today'),
				month: $_('Month'),
				week: $_('Week'),
				day: $_('Day')
			},
			// unit is the current view's navigation unit: 'month', 'week' or 'day'
			buttonHints: {
				prev: (_text: string, unit: string) => $_(`Previous ${unit}`),
				next: (_text: string, unit: string) => $_(`Next ${unit}`),
				today: $_('Today')
			},
			viewHint: (buttonText: string) => buttonText,
			dayHeaderFormat: { weekday: 'short' },
			// Month view bars cover whole days, for which FullCalendar leaves out the time, so add the start time back
			eventContent: ({ event }, createElement) =>
				event.extendedProps.timeLabel
					? createElement(
							'div',
							{ className: 'fc-event-main-frame' },
							createElement('div', { className: 'fc-event-time' }, event.extendedProps.timeLabel),
							createElement(
								'div',
								{ className: 'fc-event-title-container' },
								createElement('div', { className: 'fc-event-title fc-sticky' }, event.title)
							)
						)
					: true,
			// Events are fed per view, see showEvents
			viewDidMount: ({ view }) => showEvents(view.type),
			views: {
				timeGridWeek: {
					dayHeaderContent: timeGridDayHeader,
					// Shorter titles on phones keep the navigation on a single row
					...(isMobile && { titleFormat: { month: 'short', day: 'numeric' } })
				},
				timeGridDay: {
					dayHeaderFormat: { weekday: 'long' },
					dayHeaderContent: timeGridDayHeader,
					...(isMobile && { titleFormat: { month: 'short', day: 'numeric', year: 'numeric' } })
				}
			},
			allDayText: $_('All day'),
			scrollTime: '08:00:00',
			nowIndicator: true,
			fixedWeekCount: false,
			// Re-render so the height, header labels and add-button text follow the new viewport.
			// Deferred so the calendar isn't destroyed from inside its own callback.
			windowResize: () => setTimeout(renderCalendar),

			selectable: true,
			// selectMirror: true,
			select: ({ start, end }) => openCreateForm(start, end),
			// On touch devices selecting a day requires a long press, so also allow double-tapping a day
			dateClick: (info) => {
				const now = Date.now();
				const isDoubleTap =
					lastDateTap?.dateStr === info.dateStr && now - lastDateTap.time < 400;
				lastDateTap = isDoubleTap ? null : { dateStr: info.dateStr, time: now };
				if (!isDoubleTap) return;

				// A tapped time slot becomes a one hour event, a tapped day a whole-day event
				openCreateForm(
					info.date,
					info.allDay ? addDays(info.date, 1) : new Date(info.date.getTime() + HOUR)
				);
			},

			customButtons: {
				addEventButton: {
					text: isMobile ? '+' : `+ ${$_('Create Event')}`,
					hint: $_('Create Event'),
					click: () => {
						// Suggest the next full hour
						const start = new Date();
						start.setHours(start.getHours() + 1, 0, 0, 0);
						openCreateForm(start, new Date(start.getTime() + HOUR));
					}
				}
			},

			eventClick: ({ event }) => {
				open = true;
				selectedEvent = events.find((e) => e.id.toString() === event.id) ?? selectedEvent;
				editingEvent = deepCopy(selectedEvent);

				// Take the stored times (of this occurrence), a month view bar only knows whole days
				const dayOffset = event.extendedProps.dayOffset ?? 0;
				const start = addDays(new Date(selectedEvent.start_date), dayOffset);
				const end = selectedEvent.end_date
					? addDays(new Date(selectedEvent.end_date), dayOffset)
					: start;
				selectedStartDate = toDatetimeLocal(start);
				selectedEndDate = toDatetimeLocal(end);
			},
			eventDrop: scheduleEventMove,
			eventResize: scheduleEventMove,
			// Show as many events as fit and put the rest behind "+ more", so every week row keeps the same height
			dayMaxEventRows: true,
			eventInteractive: true,
			eventClassNames: 'cursor-pointer',
			editable: true,
			eventStartEditable: true,
			eventResizableFromStart: true,
			eventDurationEditable: true
		});
		calendar.render();
	};

	// Events have no all-day flag, so one running from midnight to midnight is shown as all-day
	// and anything else at its time
	const isWholeDays = (start: Date, end: Date | null) =>
		end !== null &&
		end > start &&
		[start, end].every((date) => date.getHours() === 0 && date.getMinutes() === 0);

	const distributeEvents = (asWholeDays: boolean) =>
		events.flatMap((event) => {
			const start = new Date(event.start_date);
			const end = event.end_date ? new Date(event.end_date) : null;
			const wholeDays = isWholeDays(start, end);

			// Daily events are shown six weeks ahead, weekly events six times
			const [occurrences, daysBetween] =
				event.repeat_frequency === 1 ? [42, 1] : event.repeat_frequency === 2 ? [6, 7] : [1, 0];

			return Array.from({ length: occurrences }, (_, i) => {
				const dayOffset = i * daysBetween;
				const occurrenceStart = addDays(start, dayOffset);
				const occurrenceEnd = end ? addDays(end, dayOffset) : undefined;

				return {
					...event,
					id: String(event.id),
					dayOffset,
					...(asWholeDays && !wholeDays
						? {
								// A bar over the days the event touches, labelled with its start time
								allDay: true,
								start: startOfDay(occurrenceStart),
								end: occurrenceEnd && endOfDay(occurrenceEnd),
								timeLabel: formatDate(occurrenceStart, {
									hour: 'numeric',
									minute: '2-digit',
									omitZeroMinute: true,
									meridiem: 'narrow'
								})
							}
						: { allDay: wholeDays, start: occurrenceStart, end: occurrenceEnd })
				};
			});
		});

	// FullCalendar's month grid only lets all-day events be stretched over days, so the month view gets
	// every event as a whole-day bar. The week and day views show events at their time
	const showEvents = (viewType: string | undefined) => {
		if (!calendar || !viewType) return;
		calendar.removeAllEventSources();
		calendar.addEventSource(distributeEvents(viewType === 'dayGridMonth'));
	};

	onMount(async () => {
		groupId =
			Number(new URLSearchParams(document.location.search).get('groupId')) ??
			null;
		if (groupId) groupIds = [...groupIds, groupId];
		else userChecked = true;

		await scheduleEventList();
		renderCalendar();
	});

	// Otherwise the calendar's window resize listener outlives the page and re-renders a stale calendar
	onDestroy(() => calendar?.destroy());

	$effect(() => {
		// Rerendering the calendar leads to issues with event changes changing the month one is one, instead we do this
		if (events) showEvents(calendar?.view.type);
	});

	$effect(() => {
		// Track all filter dependencies, but only call scheduleEventList once
		workgroupIds;
		groupIds;
		userChecked;
		scheduleEventList();
	});
</script>

<div class="flex items-center gap-2 px-3 pt-7 pb-2 md:px-6 md:pt-4">
	<!-- The mobile header already provides a back button -->
	<button
		onclick={() => history.back()}
		class="hidden md:block rounded-full p-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-white/10 transition-colors"
		aria-label={$_('Back')}
		id="back-button"
	>
		<Fa icon={faArrowLeft} />
	</button>
	<AdvancedFiltering bind:groupIds bind:workgroupIds bind:userChecked />
</div>

<div
	class="schedule-card mx-2 mb-2 md:mx-6 md:mb-4 rounded-2xl bg-white dark:bg-darkobject dark:text-darkmodeText border border-gray-200 dark:border-gray-700/60 shadow-sm p-2 md:p-4"
>
	<div class="w-full" id="calendar-2"></div>
</div>

<!-- Modal for displaying, creating and editing schedule events -->
<Modal
	bind:open
	buttons={[
		{
			label: 'Submit',
			onClick: async () => {
				selectedEvent.schedule_id === 0
					? await scheduleEventCreate()
					: await scheduleEventUpdate();
				scheduleEventList();
			},
			type: 'default',
			submit: true
		},
		{
			label: 'Delete',
			onClick: () => ScheduleEventDelete(selectedEvent.id),
			type: 'warning',
			class: selectedEvent.id ? 'visible' : 'invisible'
		}
	]}
	onClose={() => {
		selectedEvent = ScheduleItem2Default;
		scheduleEventList();
	}}
	stopAtPropagation={false}
>
	<div slot="header">
		{#if editingEvent.schedule_id === 0}
			<span>{$_('Create an Event')}</span>
		{:else if editingEvent.schedule_id !== 0}
			<span>{$_('Edit Event ')}{editingEvent.title}</span>
			<NotificationOptions
				type="event"
				id={editingEvent.id}
				api={`schedule/${editingEvent.schedule_id}/event/subscribe`}
				labels={['subsc']}
				categories={['subsc']}
			/>
		{/if}
	</div>

	<div slot="body">
		<div role="form" class="schedule-form flex flex-col gap-3 text-left">
			<TextInput label="Title" bind:value={editingEvent.title} />
			<TextArea label="Description" bind:value={editingEvent.description} />

			<div class="flex flex-col gap-3">
				<label class="flex flex-col gap-1">
					<span class="dark:text-darkmodeText">{$_('Start date')}</span>
					<input
						type="datetime-local"
						bind:value={selectedStartDate}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="dark:text-darkmodeText">{$_('End date')}</span>
					<input
						type="datetime-local"
						bind:value={selectedEndDate}
					/>
				</label>
			</div>

			<Select
				disableFirstChoice
				labels={['One-off', 'Daily', 'Weekly', 'Monthly', 'Yearly']}
				values={[null, 1, 2, 3, 4]}
				bind:value={editingEvent.repeat_frequency}
				label="Repeat Frequency"
				classInner="border bg-white dark:bg-darkobject border-gray-300 border-solid"
			/>

			<GroupSelection bind:selectedGroupId bind:selectedWorkgroupId />

			<TextInput label="Meeting Link" bind:value={editingEvent.meeting_link} />
			<!-- <TextInput label="Tag" bind:value={selectedEvent.tag_name} /> -->
		</div>
	</div>
</Modal>

<style>
	.schedule-card {
		--fc-border-color: rgb(229 231 235);
		--fc-page-bg-color: transparent;
		--fc-neutral-bg-color: rgb(249 250 251);
		--fc-today-bg-color: rgba(160, 34, 239, 0.06);
		--fc-event-bg-color: rgba(1, 91, 192, 0.12);
		--fc-event-border-color: var(--primary);
		--fc-event-text-color: var(--primary);
		--fc-highlight-color: rgba(1, 91, 192, 0.1);
		--fc-small-font-size: 0.75rem;
	}

	:global(.dark) .schedule-card {
		--fc-border-color: rgba(55, 65, 81, 0.6);
		--fc-neutral-bg-color: rgba(255, 255, 255, 0.03);
		--fc-today-bg-color: rgba(182, 100, 233, 0.08);
		--fc-event-bg-color: rgba(1, 91, 192, 0.35);
		--fc-event-text-color: var(--darkmode-text-color);
		--fc-highlight-color: rgba(1, 91, 192, 0.25);
	}

	/* Toolbar */
	.schedule-card :global(.fc .fc-toolbar.fc-header-toolbar) {
		margin-bottom: 0.75rem;
		gap: 0.5rem;
	}

	.schedule-card :global(.fc-toolbar-chunk) {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.schedule-card :global(.fc .fc-toolbar-title) {
		font-size: 1.125rem;
		font-weight: 600;
		min-width: 9.5rem;
		text-align: center;
	}

	.schedule-card :global(.fc .fc-button) {
		border: none;
		box-shadow: none;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: none;
		transition:
			background-color 150ms,
			filter 150ms;
	}

	.schedule-card :global(.fc .fc-button:focus-visible) {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.schedule-card :global(.fc .fc-prev-button),
	.schedule-card :global(.fc .fc-next-button) {
		background: transparent;
		color: inherit;
		border-radius: 9999px;
		padding: 0.5rem 0.6rem;
		line-height: 1;
	}

	.schedule-card :global(.fc .fc-prev-button:hover),
	.schedule-card :global(.fc .fc-next-button:hover) {
		background: rgb(243 244 246);
	}

	:global(.dark) .schedule-card :global(.fc .fc-prev-button:hover),
	:global(.dark) .schedule-card :global(.fc .fc-next-button:hover) {
		background: rgba(255, 255, 255, 0.1);
	}

	.schedule-card :global(.fc .fc-today-button) {
		background: transparent;
		color: var(--primary);
		border: 1px solid rgb(229 231 235);
		border-radius: 9999px;
		padding: 0.35rem 0.9rem;
		opacity: 1;
	}

	.schedule-card :global(.fc .fc-today-button:hover:not(:disabled)) {
		background: rgba(1, 91, 192, 0.08);
	}

	.schedule-card :global(.fc .fc-today-button:disabled) {
		color: rgb(156 163 175);
		cursor: default;
	}

	:global(.dark) .schedule-card :global(.fc .fc-today-button) {
		color: var(--accent-secondary);
		border-color: rgba(55, 65, 81, 0.6);
	}

	:global(.dark) .schedule-card :global(.fc .fc-today-button:disabled) {
		color: rgb(107 114 128);
	}

	.schedule-card :global(.fc .fc-addEventButton-button) {
		background: var(--primary);
		color: white;
		border-radius: 9999px;
		padding: 0.35rem 1rem;
		margin-left: 0.25rem;
	}

	.schedule-card :global(.fc .fc-addEventButton-button:hover) {
		filter: brightness(0.93);
	}

	/* View switcher (Month / Week / Day): a segmented control with a raised active segment */
	.schedule-card :global(.fc .fc-toolbar .fc-button-group) {
		gap: 0.125rem;
		padding: 0.1875rem;
		border-radius: 9999px;
		background: rgb(243 244 246);
	}

	:global(.dark) .schedule-card :global(.fc .fc-toolbar .fc-button-group) {
		background: rgba(255, 255, 255, 0.06);
	}

	.schedule-card :global(.fc .fc-toolbar .fc-button-group > .fc-button) {
		margin: 0;
		padding: 0.3rem 1rem;
		border-radius: 9999px;
		background: transparent;
		color: rgb(107 114 128);
		box-shadow: none;
		transition:
			background-color 150ms,
			color 150ms,
			box-shadow 150ms;
	}

	.schedule-card :global(.fc .fc-toolbar .fc-button-group > .fc-button:hover) {
		color: rgb(31 41 55);
	}

	.schedule-card :global(.fc .fc-toolbar .fc-button-group > .fc-button.fc-button-active) {
		background: white;
		color: var(--primary);
		font-weight: 600;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.06),
			0 1px 3px rgba(1, 91, 192, 0.12);
	}

	:global(.dark) .schedule-card :global(.fc .fc-toolbar .fc-button-group > .fc-button) {
		color: rgb(156 163 175);
	}

	:global(.dark) .schedule-card :global(.fc .fc-toolbar .fc-button-group > .fc-button:hover) {
		color: rgb(229 231 235);
	}

	:global(.dark)
		.schedule-card
		:global(.fc .fc-toolbar .fc-button-group > .fc-button.fc-button-active) {
		background: rgba(255, 255, 255, 0.12);
		color: var(--darkmode-text-color);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	/* Grid */
	.schedule-card :global(.fc .fc-col-header-cell) {
		background: var(--fc-neutral-bg-color);
	}

	.schedule-card :global(.fc .fc-col-header-cell-cushion) {
		padding: 0.5rem 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgb(107 114 128);
	}

	:global(.dark) .schedule-card :global(.fc .fc-col-header-cell-cushion) {
		color: rgb(156 163 175);
	}

	.schedule-card :global(.fc .fc-daygrid-day-top) {
		flex-direction: row;
		padding: 0.25rem;
	}

	.schedule-card :global(.fc .fc-daygrid-day-number) {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 1.75rem;
		height: 1.75rem;
		padding: 0 0.25rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.schedule-card :global(.fc .fc-day-other .fc-daygrid-day-top) {
		opacity: 0.45;
	}

	.schedule-card :global(.fc .fc-day-today .fc-daygrid-day-number) {
		background: var(--accent);
		color: white;
		font-weight: 700;
	}

	:global(.dark) .schedule-card :global(.fc .fc-day-today .fc-daygrid-day-number) {
		background: var(--accent-secondary);
	}

	.schedule-card :global(.fc .fc-daygrid-day:not(.fc-day-today):hover) {
		background: rgba(1, 91, 192, 0.03);
	}

	/* Events */
	.schedule-card :global(.fc .fc-daygrid-event) {
		margin: 1px 4px 2px;
		padding: 0.15rem 0.4rem;
		border-width: 0 0 0 3px;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* The bar clips its overflow, so keep the resize handles inside it rather than half outside */
	.schedule-card :global(.fc .fc-daygrid-event .fc-event-resizer-start) {
		left: 0;
	}

	.schedule-card :global(.fc .fc-daygrid-event .fc-event-resizer-end) {
		right: 0;
	}

	.schedule-card :global(.fc .fc-daygrid-event:hover) {
		filter: brightness(0.96);
	}

	:global(.dark) .schedule-card :global(.fc .fc-daygrid-event:hover) {
		filter: brightness(1.15);
	}

	.schedule-card :global(.fc .fc-daygrid-more-link) {
		margin-left: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--primary);
	}

	:global(.dark) .schedule-card :global(.fc .fc-daygrid-more-link) {
		color: var(--accent-secondary);
	}

	.schedule-card :global(.fc .fc-popover) {
		border-radius: 0.75rem;
		overflow: hidden;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .schedule-card :global(.fc .fc-popover) {
		background: var(--darkmode-object-color);
	}

	/* Week and day views */
	/* FullCalendar reserves scrollbar gutters in the header rows too; keep them slim and trackless */
	.schedule-card :global(.fc .fc-scroller) {
		scrollbar-width: thin;
		scrollbar-color: rgb(209 213 219) transparent;
	}

	:global(.dark) .schedule-card :global(.fc .fc-scroller) {
		scrollbar-color: rgb(75 85 99) transparent;
	}

	/* The header and all-day rows never scroll, their gutter only aligns the columns with the body */
	.schedule-card :global(.fc .fc-scrollgrid-section:not(.fc-scrollgrid-section-liquid) .fc-scroller) {
		scrollbar-color: transparent transparent;
		background: var(--fc-neutral-bg-color);
	}

	.schedule-card :global(.fc .fc-timegrid .fc-col-header-cell-cushion) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.5rem 0.25rem;
	}

	.schedule-card :global(.fc .day-header-number) {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.25rem;
		border-radius: 9999px;
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: normal;
		color: rgb(31 41 55);
	}

	:global(.dark) .schedule-card :global(.fc .day-header-number) {
		color: var(--darkmode-text-color);
	}

	.schedule-card :global(.fc .fc-day-today .day-header-weekday) {
		color: var(--accent);
	}

	.schedule-card :global(.fc .fc-day-today .day-header-number) {
		background: var(--accent);
		color: white;
	}

	:global(.dark) .schedule-card :global(.fc .fc-day-today .day-header-weekday) {
		color: var(--accent-secondary);
	}

	:global(.dark) .schedule-card :global(.fc .fc-day-today .day-header-number) {
		background: var(--accent-secondary);
	}

	/* A single-column day view needs no today tint; the header pill already marks it */
	.schedule-card :global(.fc .fc-timeGridDay-view .fc-day-today) {
		background: transparent;
	}

	.schedule-card :global(.fc .fc-timegrid-slot) {
		height: 2.75rem;
	}

	.schedule-card :global(.fc .fc-timegrid-slot-minor) {
		border-top-style: dashed;
		border-top-color: rgb(243 244 246);
	}

	:global(.dark) .schedule-card :global(.fc .fc-timegrid-slot-minor) {
		border-top-color: rgba(55, 65, 81, 0.3);
	}

	/* Hour labels sit on their hour line instead of floating mid-slot */
	.schedule-card :global(.fc .fc-timegrid-slot-label) {
		vertical-align: top;
		border-color: transparent;
	}

	.schedule-card :global(.fc .fc-timegrid-slot-label-cushion) {
		padding: 0.125rem 0.625rem 0 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		color: rgb(156 163 175);
		text-transform: uppercase;
	}

	.schedule-card :global(.fc .fc-timegrid-axis-cushion) {
		max-width: 3.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 500;
		line-height: 1.2;
		color: rgb(156 163 175);
		text-align: right;
	}

	.schedule-card :global(.fc .fc-timegrid .fc-daygrid-body) {
		background: var(--fc-neutral-bg-color);
	}

	.schedule-card :global(.fc .fc-timegrid-divider) {
		padding: 0 0 1px;
		background: var(--fc-border-color);
		border: none;
	}

	/* Opaque (the same tint as month events on white) so the slot lines don't show through */
	.schedule-card :global(.fc .fc-timegrid-event) {
		border-width: 0 0 0 3px;
		border-radius: 0.375rem;
		background-color: color-mix(in srgb, var(--primary) 12%, white);
		font-size: 0.75rem;
		box-shadow: none;
	}

	:global(.dark) .schedule-card :global(.fc .fc-timegrid-event) {
		background-color: color-mix(in srgb, var(--primary) 35%, var(--darkmode-object-color));
	}

	/* Overlapping events are separated by a thin ring in the card colour */
	.schedule-card :global(.fc .fc-timegrid-event-harness-inset .fc-timegrid-event) {
		box-shadow: 0 0 0 1px white;
	}

	:global(.dark) .schedule-card :global(.fc .fc-timegrid-event-harness-inset .fc-timegrid-event) {
		box-shadow: 0 0 0 1px var(--darkmode-object-color);
	}

	.schedule-card :global(.fc .fc-timegrid-event .fc-event-main) {
		padding: 0.2rem 0.4rem;
	}

	.schedule-card :global(.fc .fc-timegrid-event .fc-event-time) {
		font-weight: 500;
		opacity: 0.8;
	}

	.schedule-card :global(.fc .fc-timegrid-event .fc-event-title) {
		font-weight: 600;
	}

	/* Current time: an accent line with a dot where it meets the time axis */
	.schedule-card :global(.fc .fc-timegrid-now-indicator-line) {
		border-width: 2px 0 0;
		border-color: var(--accent);
	}

	.schedule-card :global(.fc .fc-timegrid-now-indicator-line::before) {
		content: '';
		position: absolute;
		top: -6px;
		left: 0;
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		background: var(--accent);
	}

	.schedule-card :global(.fc .fc-timegrid-now-indicator-arrow) {
		display: none;
	}

	@media (max-width: 767px) {
		/* The view switcher gets its own full-width row below the navigation */
		.schedule-card :global(.fc .fc-toolbar.fc-header-toolbar) {
			flex-wrap: wrap;
			row-gap: 0.625rem;
		}

		.schedule-card :global(.fc .fc-toolbar-chunk:nth-child(2)) {
			order: 3;
			width: 100%;
		}

		.schedule-card :global(.fc .fc-toolbar .fc-button-group) {
			width: 100%;
		}

		.schedule-card :global(.fc .fc-toolbar .fc-button-group > .fc-button) {
			flex: 1;
			padding: 0.3rem 0.5rem;
		}

		.schedule-card :global(.fc .day-header-number) {
			min-width: 1.75rem;
			height: 1.75rem;
			font-size: 0.9375rem;
		}

		.schedule-card :global(.fc .fc-timegrid-slot-label-cushion) {
			padding-right: 0.375rem;
		}

		.schedule-card :global(.fc .fc-toolbar-title) {
			font-size: 1rem;
			min-width: 0;
		}

		.schedule-card :global(.fc .fc-prev-button),
		.schedule-card :global(.fc .fc-next-button) {
			padding: 0.5rem;
		}

		.schedule-card :global(.fc .fc-today-button) {
			padding: 0.3rem 0.7rem;
		}

		.schedule-card :global(.fc .fc-addEventButton-button) {
			padding: 0.3rem 0.8rem;
		}

		.schedule-card :global(.fc .fc-daygrid-day-number) {
			min-width: 1.5rem;
			height: 1.5rem;
			font-size: 0.75rem;
		}

		.schedule-card :global(.fc .fc-daygrid-event) {
			margin: 1px 2px;
			padding: 0.05rem 0.25rem;
			font-size: 0.6875rem;
		}
	}

	/* Event modal */
	.schedule-form :global(input:not([type='checkbox'])),
	.schedule-form :global(textarea),
	.schedule-form :global(select) {
		padding: 0.5rem 0.625rem;
		border: 1px solid rgb(209 213 219);
		border-radius: 0.5rem;
		transition:
			border-color 150ms,
			box-shadow 150ms;
	}

	.schedule-form :global(input:not([type='checkbox']):focus),
	.schedule-form :global(textarea:focus),
	.schedule-form :global(select:focus) {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(1, 91, 192, 0.15);
	}

	:global(.dark) .schedule-form :global(input:not([type='checkbox'])),
	:global(.dark) .schedule-form :global(textarea),
	:global(.dark) .schedule-form :global(select) {
		border-color: rgb(75 85 99);
		background: var(--darkmode-background-color);
		color: var(--darkmode-text-color);
		color-scheme: dark;
	}
</style>
