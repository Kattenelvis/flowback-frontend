<!-- TODO: Refactor this file, simplify, make extendible (open-close principle maybe) -->
<script lang="ts">
	import { formatDate } from '$lib/Generic/DateFormatter';
	import HeaderIcon from '$lib/Header/HeaderIcon.svelte';
	import { faDownLong } from '@fortawesome/free-solid-svg-icons/faDownLong';
	import Fa from 'svelte-fa';
	import { _ } from 'svelte-i18n';
	import {
		dateLabelsDatePoll,
		getPhaseUserFriendlyNameWithNumber
	} from '../functions';
	import {
		DATE_POLL_PHASE_CONFIG,
		TEXT_POLL_PHASE_CONFIG,
		type PollPhaseConfig
	} from '../phases';
	import {
		faC,
		faCircle,
		faCircleCheck,
		faCircleExclamation
	} from '@fortawesome/free-solid-svg-icons';
	import type { Phase, poll } from '../interface';
	import { onMount } from 'svelte';

	export let enableDetails = false,
		displayTimeline = true,
		Class = '',
		dates: Date[] = [],
		poll: poll,
		phase: Phase,
		horizontal = false,
		displayTimelinePhase = true;

	let datesArray: string[] = [],
		displayDetails = false,
		dateLabels: string[] = [],
		currentPhaseIndex: number,
		fraction: number,
		datePlacement: number[] = [],
		pollPhases: PollPhaseConfig[] = [];

	const setupDates = () => {
		currentPhaseIndex = 0;

		// TEXT POLL
		if (poll?.poll_type === 4) pollPhases = TEXT_POLL_PHASE_CONFIG;
		// DATE POLL
		else if (poll?.poll_type === 3) pollPhases = DATE_POLL_PHASE_CONFIG;

		currentPhaseIndex = pollPhases.findIndex((p) => p.phase === phase);
		dates = pollPhases.map((p) => new Date(poll[p.endDateField!] as string));

		// Timeline isn't needed for polls with 1 phase, so this shouldn't be an issue
		fraction = currentPhaseIndex / (pollPhases.length - 1);

		let totalTime = dates[dates.length - 1].getTime() - dates[0].getTime();

		dates.forEach((date, i) => {
			// Date placement on Timeline
			const toDateTime = date.getTime() - dates[0].getTime();
			datePlacement[i] = (100 * toDateTime) / totalTime;
			datesArray[i] = formatDate(date.toString());
		});
	};

	$: if (phase || poll) {
		setupDates();
	}
</script>

<div class={`relative flex flex-col items-center ${Class}`}>
	{#if displayTimelinePhase}
		<div id="poll-timeline" class="text-center dark:text-darkmodeText">
			<span class="font-semibold text-primary dark:text-secondary">
				{$_('Current')}:
			</span>
			{$_('Phase')}
			{pollPhases.find((p) => p.id === currentPhaseIndex)?.label}
		</div>
	{/if}

	{#if displayTimeline}
		<div
			class={`m-4 flex justify-between rounded-md
				${horizontal ? '' : 'gap-20'}
				${horizontal ? 'flex-row' : 'flex-col mx-auto'}
				${horizontal ? 'mx-4 w-[calc(100%-4rem)]' : 'm-4'}
				${horizontal ? 'max-h-4' : 'max-w-4'}
			`}
			style={`background: linear-gradient(${
				horizontal ? '90deg' : '180deg'
			}, rgba(189, 208, 255, 1) ${fraction * 100 - 2}%, rgba(191, 191, 191, 1) ${fraction * 100}%`}
		>
			{#each datePlacement as date, i}
				{@const icon = (() => {
					if (i === currentPhaseIndex) return faCircleExclamation;
					else if (i < currentPhaseIndex || dates[i] <= new Date())
						return faCircleCheck;
				})()}

				<HeaderIcon
					Class="!cursor-default"
					size="1x"
					text={`${i + 1}. ${$_(TEXT_POLL_PHASE_CONFIG[i].label)}${i !== 5 ? `: ${datesArray[i]}` : ''}`}
					{icon}
				/>
			{/each}
		</div>
	{/if}
	{#if enableDetails && displayDetails}
		<button
			class="hover:underline flex items-center gap-1 text-xs"
			on:click={() => (displayDetails = false)}
		>
			<Fa icon={faDownLong} flip />
			{$_('Time details')}
		</button>
		<ul class="p-2">
			{#each datesArray as date, i}
				<li
					class="border-b md:border-b-0 flex justify-between flex-col md:flex-row text-center"
				>
					<div class="mb-4 md:mb-0">{$_(dateLabels[i])}:</div>
					<div class="mb-4 md:mb-0">{date}</div>
				</li>
			{/each}
		</ul>
	{:else if enableDetails}
		<button
			class="hover:underline flex items-center gap-1 text-xs"
			on:click={() => (displayDetails = true)}
		>
			<Fa icon={faDownLong} />
			{$_('Time details')}
		</button>
	{/if}
</div>
