// Run with `npm run test:unit`
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	expandOccurrences,
	type Frequency,
	type RepeatingEvent
} from '../src/lib/Schedule/recurrence.ts';

const DAILY = 1,
	WEEKLY = 2,
	MONTHLY = 3,
	YEARLY = 4;

const utc = (year: number, month: number, day: number, hour = 0, minute = 0) =>
	new Date(Date.UTC(year, month - 1, day, hour, minute));

const repeating = (
	start: Date,
	end: Date | null,
	repeat_frequency: Frequency,
	extra: Partial<RepeatingEvent> = {}
): RepeatingEvent => ({
	start_date: start.toISOString(),
	end_date: end?.toISOString() ?? null,
	repeat_frequency,
	...extra
});

const starts = (event: RepeatingEvent, from: Date, to: Date) =>
	expandOccurrences(event, from, to).map(({ start }) => start.toISOString());

// 18:00 to 19:00 on Oct 15 in Stockholm, the clocks go back on Oct 25
const evening = (extra: Partial<RepeatingEvent> = {}) =>
	repeating(utc(2026, 10, 15, 16), utc(2026, 10, 15, 17), DAILY, extra);

describe('events that do not repeat', () => {
	it('are returned as they are, wherever the window is', () => {
		const event: RepeatingEvent = {
			start_date: '2026-10-15T16:00:00Z',
			end_date: null,
			repeat_frequency: null
		};

		assert.deepEqual(
			expandOccurrences(event, utc(2030, 1, 1), utc(2030, 2, 1)),
			[{ start: utc(2026, 10, 15, 16), end: null }]
		);
	});
});

describe('daily events', () => {
	it('keep their time when the clocks go back', () => {
		const occurrences = expandOccurrences(
			evening({ timezone: 'Europe/Stockholm' }),
			utc(2026, 10, 23),
			utc(2026, 10, 28)
		);

		assert.deepEqual(
			occurrences.map(({ start }) => start.toISOString()),
			[
				'2026-10-23T16:00:00.000Z',
				'2026-10-24T16:00:00.000Z',
				'2026-10-25T17:00:00.000Z',
				'2026-10-26T17:00:00.000Z',
				'2026-10-27T17:00:00.000Z'
			]
		);
		assert.deepEqual(
			occurrences.map(
				({ start, end }) => (end!.getTime() - start.getTime()) / 3600000
			),
			[1, 1, 1, 1, 1]
		);
	});

	it('keep their time when the clocks go forward', () => {
		const event = repeating(utc(2026, 3, 21, 17), utc(2026, 3, 21, 18), DAILY, {
			timezone: 'Europe/Stockholm'
		});

		assert.deepEqual(starts(event, utc(2026, 3, 27), utc(2026, 4, 1)), [
			'2026-03-27T17:00:00.000Z',
			'2026-03-28T17:00:00.000Z',
			'2026-03-29T16:00:00.000Z',
			'2026-03-30T16:00:00.000Z',
			'2026-03-31T16:00:00.000Z'
		]);
	});

	it('in UTC follow the clock of the server instead', () => {
		assert.deepEqual(
			starts(
				evening({ timezone: 'UTC' }),
				utc(2026, 10, 24),
				utc(2026, 10, 27)
			),
			[
				'2026-10-24T16:00:00.000Z',
				'2026-10-25T16:00:00.000Z',
				'2026-10-26T16:00:00.000Z'
			]
		);
		assert.deepEqual(
			starts(evening(), utc(2026, 10, 24), utc(2026, 10, 27)),
			starts(evening({ timezone: 'UTC' }), utc(2026, 10, 24), utc(2026, 10, 27))
		);
	});

	it('are held an hour later when their time is skipped by the clocks going forward', () => {
		const event = repeating(utc(2026, 3, 28, 1, 30), null, DAILY, {
			timezone: 'Europe/Stockholm'
		});

		assert.deepEqual(starts(event, utc(2026, 3, 28), utc(2026, 3, 31)), [
			'2026-03-28T01:30:00.000Z',
			'2026-03-29T01:30:00.000Z', // 03:30, 02:30 doesn't exist that day
			'2026-03-30T00:30:00.000Z'
		]);
	});

	it('are held the first time when their time happens twice', () => {
		const event = repeating(utc(2026, 10, 24, 0, 30), null, DAILY, {
			timezone: 'Europe/Stockholm'
		});

		assert.deepEqual(starts(event, utc(2026, 10, 24), utc(2026, 10, 27)), [
			'2026-10-24T00:30:00.000Z',
			'2026-10-25T00:30:00.000Z', // 02:30 CEST, not 02:30 CET
			'2026-10-26T01:30:00.000Z'
		]);
	});

	it('go on for years, there is no limit to how many are shown', () => {
		const occurrences = starts(
			evening({ timezone: 'Europe/Stockholm' }),
			utc(2040, 6, 1),
			utc(2040, 7, 1)
		);

		assert.equal(occurrences.length, 30);
		assert.ok(occurrences.every((start) => start.endsWith('T16:00:00.000Z')));
	});

	it('are not shown before they have started', () => {
		assert.deepEqual(starts(evening(), utc(2026, 9, 1), utc(2026, 10, 15)), []);
	});

	it('keep a whole-day length when the clocks change during it', () => {
		// Midnight to midnight in Stockholm, the clocks go back at 03:00 on Oct 25
		const event = repeating(
			utc(2026, 10, 14, 22),
			utc(2026, 10, 15, 22),
			DAILY,
			{
				timezone: 'Europe/Stockholm'
			}
		);
		const [, duringChange, after] = expandOccurrences(
			event,
			utc(2026, 10, 24, 12),
			utc(2026, 10, 27)
		);

		assert.equal(duringChange.start.toISOString(), '2026-10-24T22:00:00.000Z'); // Oct 25 00:00 CEST
		assert.equal(duringChange.end!.toISOString(), '2026-10-25T23:00:00.000Z'); // Oct 26 00:00 CET, 25 hours later
		assert.equal(after.start.toISOString(), '2026-10-25T23:00:00.000Z');
		assert.equal(after.end!.toISOString(), '2026-10-26T23:00:00.000Z');
	});

	it('are shown in a window they started before and end in', () => {
		// 23:00 to 01:00 in UTC
		const event = repeating(utc(2026, 10, 1, 23), utc(2026, 10, 2, 1), DAILY);

		assert.deepEqual(
			starts(event, utc(2026, 10, 10, 0, 30), utc(2026, 10, 10, 12)),
			['2026-10-09T23:00:00.000Z']
		);
	});

	it('have no end if they have no end', () => {
		const [{ end }] = expandOccurrences(
			repeating(utc(2026, 10, 1, 23), null, DAILY),
			utc(2026, 10, 3),
			utc(2026, 10, 4)
		);

		assert.equal(end, null);
	});
});

describe('weekly events', () => {
	it('keep their weekday and time', () => {
		// Wednesday 18:00 in Stockholm
		const event = repeating(
			utc(2026, 10, 14, 16),
			utc(2026, 10, 14, 17),
			WEEKLY,
			{
				timezone: 'Europe/Stockholm'
			}
		);

		assert.deepEqual(starts(event, utc(2026, 10, 1), utc(2026, 11, 20)), [
			'2026-10-14T16:00:00.000Z',
			'2026-10-21T16:00:00.000Z',
			'2026-10-28T17:00:00.000Z',
			'2026-11-04T17:00:00.000Z',
			'2026-11-11T17:00:00.000Z',
			'2026-11-18T17:00:00.000Z'
		]);
	});

	it('are shown more than six weeks after they started', () => {
		const event = repeating(utc(2026, 9, 7, 12), utc(2026, 9, 7, 13), WEEKLY);

		assert.deepEqual(starts(event, utc(2026, 10, 19), utc(2026, 11, 3)), [
			'2026-10-19T12:00:00.000Z',
			'2026-10-26T12:00:00.000Z',
			'2026-11-02T12:00:00.000Z'
		]);
	});
});

describe('monthly events', () => {
	it('keep their day of the month and time', () => {
		const event = repeating(
			utc(2026, 10, 15, 16),
			utc(2026, 10, 15, 17),
			MONTHLY,
			{
				timezone: 'Europe/Stockholm'
			}
		);

		assert.deepEqual(starts(event, utc(2026, 10, 1), utc(2027, 3, 1)), [
			'2026-10-15T16:00:00.000Z',
			'2026-11-15T17:00:00.000Z',
			'2026-12-15T17:00:00.000Z',
			'2027-01-15T17:00:00.000Z',
			'2027-02-15T17:00:00.000Z'
		]);
	});

	it('skip months without their day', () => {
		const event = repeating(utc(2026, 1, 31, 12), null, MONTHLY, {
			timezone: 'Europe/Stockholm'
		});

		assert.deepEqual(starts(event, utc(2026, 1, 1), utc(2026, 6, 30)), [
			'2026-01-31T12:00:00.000Z',
			'2026-03-31T11:00:00.000Z',
			'2026-05-31T11:00:00.000Z'
		]);
	});
});

describe('yearly events', () => {
	it('on a leap day are only held in leap years', () => {
		const event = repeating(utc(2024, 2, 29, 12), null, YEARLY, {
			timezone: 'Europe/Stockholm'
		});

		assert.deepEqual(starts(event, utc(2024, 1, 1), utc(2029, 1, 1)), [
			'2024-02-29T12:00:00.000Z',
			'2028-02-29T12:00:00.000Z'
		]);
	});

	it('keep their date and time', () => {
		const event = repeating(
			utc(2026, 10, 15, 16),
			utc(2026, 10, 15, 17),
			YEARLY,
			{
				timezone: 'Europe/Stockholm'
			}
		);

		assert.deepEqual(starts(event, utc(2027, 1, 1), utc(2029, 1, 1)), [
			'2027-10-15T16:00:00.000Z',
			'2028-10-15T16:00:00.000Z'
		]);
	});
});

describe('the repeat end date', () => {
	it('is the last time an event may start', () => {
		const event = evening({
			repeat_frequency_end_date: utc(2026, 10, 20, 16).toISOString()
		});

		assert.deepEqual(starts(event, utc(2026, 10, 18), utc(2026, 12, 1)), [
			'2026-10-18T16:00:00.000Z',
			'2026-10-19T16:00:00.000Z',
			'2026-10-20T16:00:00.000Z'
		]);
	});
});

describe('an unknown timezone', () => {
	it('is treated as UTC instead of breaking the calendar', () => {
		assert.deepEqual(
			starts(
				evening({ timezone: 'Not/AZone' }),
				utc(2026, 10, 24),
				utc(2026, 10, 27)
			),
			starts(evening({ timezone: 'UTC' }), utc(2026, 10, 24), utc(2026, 10, 27))
		);
	});
});
