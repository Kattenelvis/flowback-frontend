// Occurrences of repeating events.
//
// A repeating event only has its first occurrence stored. The others are that occurrence's wall-clock time repeated
// in the event's timezone, so a daily event at 18:00 stays at 18:00 when the clocks change.
// The backend does the same calculation for reminders (flowback/schedule/recurrence.py), keep the two in sync.

export type Frequency = 1 | 2 | 3 | 4; // Daily, weekly, monthly, yearly. Months and years without the event's day are skipped

export interface RepeatingEvent {
	start_date: string;
	end_date: string | null;
	repeat_frequency: Frequency | null;
	repeat_frequency_end_date?: string | null;
	timezone?: string;
}

export interface Occurrence {
	start: Date;
	end: Date | null;
}

const DAY = 24 * 60 * 60 * 1000;

// A wall-clock time is the timestamp of what a clock shows, as if it were showing UTC.
// That is a time without a timezone or daylight saving time, which days and months can be added to.
type Wall = number;

const formatters = new Map<string, Intl.DateTimeFormat>();

const formatter = (timeZone: string): Intl.DateTimeFormat => {
	let found = formatters.get(timeZone);
	if (!found) {
		try {
			found = new Intl.DateTimeFormat('en-US', {
				timeZone,
				hourCycle: 'h23',
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric'
			});
		} catch {
			// A timezone this browser doesn't know, better to draw the event in UTC than to not draw the calendar
			found = formatter('UTC');
		}
		formatters.set(timeZone, found);
	}
	return found;
};

const toWall = (instant: number, timeZone: string): Wall => {
	const parts: Record<string, number> = {};
	for (const { type, value } of formatter(timeZone).formatToParts(instant))
		parts[type] = Number(value);

	const milliseconds = instant - Math.floor(instant / 1000) * 1000;
	return (
		Date.UTC(
			parts.year,
			parts.month - 1,
			parts.day,
			parts.hour,
			parts.minute,
			parts.second
		) + milliseconds
	);
};

// A time skipped by the clocks going forward is held an hour later, one that happens
// twice when they go back is held the first time. The backend does the same
const toInstant = (wall: Wall, timeZone: string): number => {
	const offset = (instant: number) => toWall(instant, timeZone) - instant;

	// The offset from UTC is looked up a day to each side of the time, as it is the same on both
	// sides unless the clocks change nearby. Then at most one of the two offsets fits the time
	const before = offset(wall - DAY);
	const after = offset(wall + DAY);

	const early = wall - before;
	if (offset(early) === before) return early;

	const late = wall - after;
	return offset(late) === after ? late : early;
};

const daysInMonth = (year: number, month: number) =>
	new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

// The wall-clock time of the occurrence at index (0 is the first), null if the event skips it
const occurrenceWall = (
	first: Wall,
	frequency: Frequency,
	index: number
): Wall | null => {
	if (frequency === 1) return first + index * DAY;
	if (frequency === 2) return first + index * 7 * DAY;

	const date = new Date(first);
	const timeOfDay =
		first -
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

	let year = date.getUTCFullYear();
	let month = date.getUTCMonth();
	if (frequency === 3) {
		const months = year * 12 + month + index;
		year = Math.floor(months / 12);
		month = months % 12;
	} else year += index;

	return date.getUTCDate() > daysInMonth(year, month)
		? null
		: Date.UTC(year, month, date.getUTCDate()) + timeOfDay;
};

// The index of the occurrence a wall-clock time is closest to, from before it for daily and weekly events
// and in the same month or year for monthly and yearly ones
const indexAt = (first: Wall, frequency: Frequency, wall: Wall) => {
	if (frequency === 1 || frequency === 2)
		return Math.floor((wall - first) / (DAY * (frequency === 1 ? 1 : 7)));

	const [from, at] = [new Date(first), new Date(wall)];
	return frequency === 3
		? (at.getUTCFullYear() - from.getUTCFullYear()) * 12 +
				at.getUTCMonth() -
				from.getUTCMonth()
		: at.getUTCFullYear() - from.getUTCFullYear();
};

// The occurrences of an event that are in or overlap a window of time. Events that don't repeat are
// returned as they are, as the events the backend returns for a window are already within it
export const expandOccurrences = (
	event: RepeatingEvent,
	windowStart: Date,
	windowEnd: Date
): Occurrence[] => {
	const start = new Date(event.start_date);
	const end = event.end_date ? new Date(event.end_date) : null;

	if (!event.repeat_frequency) return [{ start, end }];

	const frequency = event.repeat_frequency;
	const timeZone = event.timezone || 'UTC';
	const lastStart = event.repeat_frequency_end_date
		? new Date(event.repeat_frequency_end_date).getTime()
		: Infinity;

	const firstWall = toWall(start.getTime(), timeZone);
	// Wall-clock length of the event, which is the same for every occurrence also when the clocks change in the middle of it
	const length = end ? toWall(end.getTime(), timeZone) - firstWall : 0;

	// A day to each side is far more than enough for what the clocks changing moves an occurrence
	const earliestWall = toWall(windowStart.getTime(), timeZone) - length - DAY;
	const latestWall = toWall(windowEnd.getTime(), timeZone) + DAY;

	const occurrences: Occurrence[] = [];
	const lastIndex = indexAt(firstWall, frequency, latestWall);
	for (
		let index = Math.max(0, indexAt(firstWall, frequency, earliestWall));
		index <= lastIndex;
		index++
	) {
		const wall = occurrenceWall(firstWall, frequency, index);
		if (wall === null) continue;

		const occurrenceStart = toInstant(wall, timeZone);
		if (occurrenceStart > lastStart) break;

		const occurrenceEnd = end ? toInstant(wall + length, timeZone) : null;
		if (
			occurrenceStart >= windowEnd.getTime() ||
			(occurrenceEnd ?? occurrenceStart) < windowStart.getTime()
		)
			continue;

		occurrences.push({
			start: new Date(occurrenceStart),
			end: occurrenceEnd === null ? null : new Date(occurrenceEnd)
		});
	}

	return occurrences;
};
