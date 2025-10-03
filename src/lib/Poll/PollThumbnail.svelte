<script lang="ts">
	import type { Phase, poll } from './interface';
	import { page } from '$app/stores';
	import Tag from '$lib/Group/Tag.svelte';
	import HeaderIcon from '$lib/Header/HeaderIcon.svelte';
	import Fa from 'svelte-fa';
	import { fetchRequest } from '$lib/FetchRequest';
	import { _ } from 'svelte-i18n';
	import NotificationOptions from '$lib/Generic/NotificationOptions.svelte';
	import { onMount } from 'svelte';
	import {
		getPhase,
		getPhaseUserFriendlyNameWithNumber,
		imacFormatting,
		nextPhase
	} from './functions';
	import { getPermissionsFast } from '$lib/Generic/GenericFunctions';
	import Select from '$lib/Generic/Select.svelte';
	import { getTags } from '$lib/Group/functions';
	import type { Tag as TagType } from '$lib/Group/interface';
	import { darkModeStore } from '$lib/Generic/DarkMode';
	import Button from '$lib/Generic/Button.svelte';
	import NewDescription from './NewDescription.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { env } from '$env/dynamic/public';
	import {
		faAnglesRight,
		faThumbtack,
		faAlignLeft,
		faCalendarAlt,
		faSlash,
		faGlobe,
		faLock
	} from '@fortawesome/free-solid-svg-icons';
	import { goto } from '$app/navigation';
	import MultipleChoices from '$lib/Generic/MultipleChoices.svelte';
	import ChatIcon from '$lib/assets/Chat_fill.svg';
	import Timeline from './NewDesign/Timeline.svelte';
	import ReportPostModal from './ReportPostModal.svelte';
	import type { Permissions } from '$lib/Group/Permissions/interface';
	import { groupUserStore } from '$lib/Group/interface';
	import DeletePostModal from './DeletePostModal.svelte';

	export let poll: poll;

	let onHoverGroup = false,
		phase: Phase,
		// If text poll, have all phases. Date polls have fewer phases to display
		dates: Date[],
		tags: TagType[] = [],
		tag: TagType,
		selectedTag: number,
		darkMode: boolean,
		voting = true,
		choicesOpen = false,
		deletePollModalShow = false,
		reportPollModalShow = false,
		hovering = false,
		showGroupInfo = !(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE') && !$page.params.groupId,
		permissions: Permissions;

	//When adminn presses the pin tack symbol, pin the poll
	const pinPoll = async () => {
		const { json, res } = await fetchRequest('POST', `group/poll/${poll?.id}/update`, {
			pinned: !poll?.pinned
		});

		if (!res.ok) {
			ErrorHandlerStore.set({ message: 'Could not pin poll', success: false });
			return;
		}

		poll.pinned = !poll?.pinned;
	};

	const submitTagVote = async (tag: number) => {
		const { json, res } = await fetchRequest('POST', `group/poll/${poll?.id}/area/update`, {
			tag,
			vote: true
		});

		if (!res.ok) {
			ErrorHandlerStore.set({ message: 'Could not submit tag vote', success: false });
			return;
		}

		voting = false;
	};

	const getAreaVote = async () => {
		const { json, res } = await fetchRequest('GET', `group/poll/${poll?.id}/area/list`);

		if (!res.ok) return;

		let selectedTagName = json?.results.find((tag: Tag) => tag.user_vote === true)?.tags[0]
			.tag_name;

		if (selectedTagName) {
			selectedTag = tags?.find((tag) => tag.name === selectedTagName)?.id || 0;
			voting = false;
		}
	};

	const getTag = async () => {
		const { json, res } = await fetchRequest(
			'GET',
			`group/${poll.group_id}/tags?id=${poll.tag_id}`
		);

		if (!res.ok) return;

		tag = json.results[0];
	};

	onMount(async () => {
		phase = getPhase(poll);
		if (phase === 'area_vote') {
			tags = await getTags(poll?.group_id);
			getAreaVote();
		}
		getTag();

		permissions = await getPermissionsFast(Number(poll.group_id));
		darkModeStore.subscribe((dark) => (darkMode = dark));
	});

	$: if (poll)
		dates =
			poll?.poll_type === 4
				? [
						new Date(poll?.start_date),
						new Date(poll?.area_vote_end_date),
						new Date(poll?.proposal_end_date),
						new Date(poll?.prediction_statement_end_date),
						new Date(poll?.prediction_bet_end_date),
						new Date(poll?.delegate_vote_end_date),
						new Date(poll?.end_date)
					]
				: [new Date(poll?.start_date), new Date(poll?.end_date)];
</script>

<div
	class="bg-white dark:bg-darkobject dark:text-darkmodeText rounded-sm p-4"
	class:poll-thumbnail-shadow={!darkMode}
	id={`poll-thumbnail-${poll?.id.toString()}`}
>
	<div class="mx-2">
		{#if showGroupInfo}
			<div class="flex gap-4 items-center pb-2 w-full justify-between dark:text-secondary">
				<a
					href={poll?.group_joined ? `groups/${poll?.group_id}` : ''}
					class:hover:underline={poll?.group_joined}
					class="text-black dark:text-darkmodeText flex items-center"
				>
					<!-- <img
						class="h-6 w-6 mr-1 rounded-full break-word"
						src={`${env.PUBLIC_API_URL}${poll?.group_image}`}
						alt={'Poll Thumbnail'}
						on:error={(e) => onThumbnailError(e, DefaultBanner)}
					/> -->
					<span class="break-word text-sm text-gray-700 dark:text-darkmodeText"
						>{poll?.group_name}</span
					>
				</a>
				<div class="flex gap-4 items-baseline">
					<NotificationOptions
						type="poll"
						id={poll?.id}
						api={`group/poll/${poll?.id}`}
						categories={['poll', 'timeline', 'comment_all']}
						labels={['Poll', 'Timeline', 'Comments']}
						Class="text-black dark:text-darkmodeText"
						ClassOpen="right-0"
					/>
					{#if $groupUserStore?.is_admin || poll?.pinned}
						<button class:cursor-pointer={$groupUserStore?.is_admin} on:click={pinPoll}>
							<Fa
								size="1.2x"
								icon={faThumbtack}
								color={poll?.pinned ? '#999' : '#CCC'}
								rotate={poll?.pinned ? '0' : '45'}
							/>
						</button>
					{/if}

					<MultipleChoices
						bind:choicesOpen
						labels={!(phase === 'result' || phase === 'prediction_vote') ||
						(poll?.allow_fast_forward &&
							(permissions?.poll_fast_forward || $groupUserStore?.is_admin))
							? [$_('Delete Poll'), $_('Report Poll'), $_('Fast Forward')]
							: [$_('Delete Poll'), $_('Report Poll')]}
						functions={[
							() => ((deletePollModalShow = true), (choicesOpen = false)),
							() => ((reportPollModalShow = true), (choicesOpen = false)),
							async () => (phase = await nextPhase(poll?.poll_type, poll?.id, phase))
						]}
						Class="text-black justify-self-center mt-2"
					/>
				</div>
			</div>
			<a
				class="cursor-pointer text-primary dark:text-secondary hover:underline text-xl break-words"
				href={`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?source=${
					$page.params.groupId ? 'group' : 'home'
				}`}
			>
				{poll?.title}
			</a>
		{:else}
			{#if poll?.created_by?.user}
				<div class="text-black dark:text-darkmodeText flex items-center">
					<!-- <img
						class="h-6 w-6 mr-1 rounded-full break-word"
						src={`${
							poll?.created_by?.user?.profile_image
								? env.PUBLIC_API_URL + poll?.created_by?.user?.profile_image
								: DefaultPFP
						}`}
						alt={'poll Thumbnail'}
						on:error={(e) => onThumbnailError(e, DefaultPFP)}
					/> -->
					<span class="break-word text-sm text-gray-700 dark:text-darkmodeText"
						>{poll?.created_by?.user?.username}</span
					>
				</div>
			{/if}
			<div class="flex justify-between items-start gap-4 pb-2">
				<a
					class="cursor-pointer text-primary dark:text-secondary hover:underline text-xl break-words"
					href={`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?source=${
						$page.params.groupId ? 'group' : 'home'
					}`}
				>
					{poll?.title}
				</a>

				<div class="flex gap-4 items-baseline">
					<NotificationOptions
						type="poll"
						id={poll?.id}
						api={`group/poll/${poll?.id}`}
						categories={['poll', 'timeline', 'comment_all']}
						labels={['Poll', 'Timeline', 'Comments']}
						Class="text-black dark:text-darkmodeText"
						ClassOpen="right-0"
					/>
					{#if $groupUserStore?.is_admin || poll?.pinned}
						<button class:cursor-pointer={$groupUserStore?.is_admin} on:click={pinPoll}>
							<Fa
								size="1.2x"
								icon={faThumbtack}
								color={poll?.pinned ? '#999' : '#CCC'}
								rotate={poll?.pinned ? '0' : '45'}
							/>
						</button>
					{/if}

					<MultipleChoices
						bind:choicesOpen
						labels={!(phase === 'result' || phase === 'prediction_vote') &&
						poll?.allow_fast_forward &&
						(permissions?.poll_fast_forward || $groupUserStore?.is_admin)
							? [$_('Delete Poll'), $_('Report Poll'), $_('Fast Forward')]
							: [$_('Delete Poll'), $_('Report Poll')]}
						functions={[
							() => ((deletePollModalShow = true), (choicesOpen = false)),
							() => ((reportPollModalShow = true), (choicesOpen = false)),
							async () => (phase = await nextPhase(poll?.poll_type, poll?.id, phase))
						]}
						Class="text-black justify-self-center mt-2"
					/>
				</div>
			</div>
		{/if}

		<div class="flex gap-4 my-2 items-center">
			<!-- Poll Type Icons -->
			{#if poll?.poll_type === 4}
				<HeaderIcon Class="!p-0 !cursor-default" icon={faAlignLeft} text={'Text Poll'} />
			{:else if poll?.poll_type === 3}
				<HeaderIcon Class="!p-0 !cursor-default" icon={faCalendarAlt} text={'Date Poll'} />
			{/if}

			{#if poll.public}
				<HeaderIcon Class="!p-0 !cursor-default" icon={faGlobe} text={'Public Poll'} />
			{:else}
				<HeaderIcon Class="!p-0 !cursor-default" icon={faLock} text={'Private Poll'} />
			{/if}

			<!-- Fast Forward Icon -->
			{#if poll?.allow_fast_forward}
				<HeaderIcon Class="!p-0 !cursor-default" icon={faAnglesRight} text={'Fast Forward'} />
			{:else}
				<div
					role="button"
					tabindex="0"
					on:mouseover={() => (hovering = true)}
					on:mouseleave={() => (hovering = false)}
					on:focus={() => (hovering = true)}
					on:blur={() => (hovering = false)}
					class="relative w-4 h-4"
				>
					<Fa style="position:absolute" icon={faAnglesRight} />
					<Fa style="position:absolute" icon={faSlash} rotate="90" />
					<div
						class="absolute text-black p-1 bg-white mt-4 border border-gray-400 rounded text-sm z-50 w-[100px] left-[calc(50%-50px)] text-center filter opacity-80"
						class:invisible={!hovering}
					>
						{$_('No Fast Forward')}
					</div>
				</div>
			{/if}

			<!-- Comment icon. When user clicks it leads to the comment section on the poll -->
			<a
				class="flex gap-1 items-center text-black dark:text-darkmodeText hover:bg-gray-100 dark:hover:bg-slate-500 cursor-pointer text-sm"
				href={onHoverGroup
					? '/groups/1'
					: `/groups/${poll?.group_id || $page.params.groupId}/polls/${
							poll?.id
						}?section=comments&source=${$page.params.groupId ? 'group' : 'home'}`}
			>
				<img
					class="w-5"
					src={ChatIcon}
					alt="open chat"
					style:filter={darkMode ? 'brightness(0) invert(1)' : 'none'}
				/>
				<span class="inline">{poll?.total_comments}</span>
			</a>

			{#if poll?.poll_type === 4 && tag}
				<Tag bind:tag />
			{/if}

			{#if poll?.interval_mean_absolute_correctness}
				{$_('Historical imac value')}: {imacFormatting(poll.interval_mean_absolute_correctness)}
			{/if}

			{#if poll?.poll_type === 4}
				<!-- Phase -->
				<div class="text-sm font-semibold text-primary dark:text-secondary">
					{$_('Current phase')}
					{$_(getPhaseUserFriendlyNameWithNumber(phase))}
				</div>
			{/if}
		</div>

		{#if poll?.description?.length > 0}
			<NewDescription limit={2} lengthLimit={700} description={poll?.description} Class="mt-2" />
		{/if}

		<Timeline
			bind:phase
			bind:poll
			enableDetails
			displayTimelinePhase={false}
			Class={'!absolute md:!relative left-4 md:left-0'}
			horizontal
		/>

		<div class="!mt-4">
			{#if poll?.poll_type === 4}
				<!-- PHASE 1: AREA VOTE -->
				{#if phase === 'area_vote'}
					<form
						on:submit|preventDefault={() => submitTagVote(selectedTag)}
						class="flex justify-between"
					>
						<Select
							label={''}
							labels={tags?.map((tag) => tag.name)}
							bind:value={selectedTag}
							values={tags?.map((tag) => tag.id)}
							Class="w-[47%] "
							classInner="w-full !p-2 bg-white p-4 border-gray-400 rounded-md border"
							onInput={() => (voting = true)}
						/>
						{#if voting}
							<Button type="submit" Class="w-[47%]" buttonStyle="primary-light"
								>{$_('Save Vote')}</Button
							>
						{:else}
							<p class="w-[47%] text-center">{$_('Successfully saved voting!')}</p>
						{/if}
					</form>

					<!-- PHASE 2: PROPOSAL CREATION -->
				{:else if phase === 'proposal'}
					<div class="flex justify-between">
						<Button
							Class="w-[47%]"
							buttonStyle="primary-light"
							onClick={() =>
								goto(
									`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?display=0&source=${
										$page.params.groupId ? 'group' : 'home'
									}`
								)}>{$_('See Proposals')} ({poll?.total_proposals})</Button
						>
						<Button
							Class="w-[47%]"
							buttonStyle="primary-light"
							onClick={() =>
								goto(
									`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?display=1&source=${
										$page.params.groupId ? 'group' : 'home'
									}`
								)}>{$_('Create a Proposal')}</Button
						>
					</div>

					<!-- PHASE 3: PREDICTION STATEMENT CREATION -->
				{:else if phase === 'prediction_statement'}
					<div class="flex justify-between">
						<Button
							Class="w-[47%]"
							buttonStyle="primary-light"
							onClick={() =>
								goto(
									`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?display=0&source=${
										$page.params.groupId ? 'group' : 'home'
									}`
								)}>{$_('See Consequences')} ({poll?.total_predictions})</Button
						>
						<Button
							Class="w-[47%]"
							buttonStyle="primary-light"
							onClick={() =>
								goto(
									`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?display=1&source=${
										$page.params.groupId ? 'group' : 'home'
									}`
								)}>{$_('Create a Consequence')}</Button
						>
					</div>

					<!-- PHASE 4: PREDICTION BETTING -->
				{:else if phase === 'prediction_bet'}
					<div class="flex justify-between">
						<Button
							Class="w-[47%]"
							buttonStyle="primary-light"
							onClick={() =>
								goto(
									`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?source=${
										$page.params.groupId ? 'group' : 'home'
									}`
								)}>{$_('Manage Probabilities')}</Button
						>
						<!-- <p class="w-[47%]">{$_('You have not betted yet!')}</p> -->
					</div>

					<!-- PHASE 5 & 6: VOTING -->
				{:else if phase === 'delegate_vote' || phase === 'vote'}
					<div class="flex justify-between">
						<Button
							Class="w-[47%]"
							buttonStyle="primary-light"
							onClick={() =>
								goto(
									`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?source=${
										$page.params.groupId ? 'group' : 'home'
									}`
								)}>{$_('Manage votes')}</Button
						>
						<!-- <p class="w-[47%]">{$_('You have not voted yet!')}</p> -->
					</div>

					<!-- PHASE 7: RESULTS AND EVALUATION -->
				{:else if phase === 'prediction_vote' || phase === 'result'}
					<div class="flex justify-between">
						<Button
							Class="w-[47%]"
							buttonStyle="primary-light"
							onClick={() =>
								goto(
									`/groups/${poll?.group_id || $page.params.groupId}/polls/${poll?.id}?source=${
										$page.params.groupId ? 'group' : 'home'
									}`
								)}>{$_('View results & evaluate consequences')}</Button
						>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<DeletePostModal bind:deleteModalShow={deletePollModalShow} postId={poll?.id} />

<ReportPostModal
	post_type="poll"
	group_id={poll.group_id}
	post_id={poll.id}
	post_title={poll.title}
	post_description={poll.description}
	bind:reportModalShow={reportPollModalShow}
/>

<style>
	.poll-thumbnail-shadow {
		box-shadow: 0 0 5px rgb(203, 203, 203);
	}

	.poll-thumbnail-shadow-dark {
		box-shadow: 0 0 5px rgb(77, 77, 77);
	}
</style>
