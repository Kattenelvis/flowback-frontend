<script lang="ts">
	import GroupSidebarButton from '$lib/Group/GroupSidebarButton.svelte';
	import type { GroupDetails, SelectablePage } from '$lib/Group/interface';
	import { page } from '$app/stores';
	import Fa from 'svelte-fa';
	import {
		faUserGroup,
		faCircleInfo,
		faVideoCamera,
		faMailReplyAll,
		faPersonRunning,
		faCheckToSlot,
		faBars,
		faX,
		faCog,
		faListCheck,
		faPeopleCarryBox,
		faPeopleArrows
	} from '@fortawesome/free-solid-svg-icons';
	import { fetchRequest } from '$lib/FetchRequest';
	import Modal from '$lib/Generic/Modal.svelte';
	import { _ } from 'svelte-i18n';
	import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons/faCalendarAlt';
	import { faCoins } from '@fortawesome/free-solid-svg-icons';
	import { goto } from '$app/navigation';
	import { removeGroupMembership } from '$lib/Blockchain_v1_Ethereum/javascript/rightToVote';
	import { env } from '$env/dynamic/public';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import {
		groupUserStore,
		groupUserPermissionStore
	} from '$lib/Group/interface';
	import { groupStore } from '$lib/Group/Kanban/Kanban';
	import { chatOpenStore, chatPartnerStore } from '$lib/Chat/functions';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let selectedPage: SelectablePage = 'flow',
		group: GroupDetails,
		Class: string;

	let innerWidth = 0,
		menuOpen = false,
		areYouSureModal = false;

	// On phones the menu is a bottom sheet opened from a floating button
	$: mobile = innerWidth < 700;
	$: if (!mobile) menuOpen = false;
	$: cardClass = mobile
		? 'rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col'
		: 'bg-white dark:bg-darkobject shadow rounded flex flex-col';

	const leaveGroup = async () => {
		const { res, json } = await fetchRequest(
			'POST',
			`group/${$page.params.groupId}/leave`
		);

		if (!res.ok) {
			ErrorHandlerStore.set({
				message:
					json.detail[0] ||
					json.detail ||
					'An error occurred while leaving the group',
				success: false
			});
			return;
		}

		if (env.PUBLIC_BLOCKCHAIN_INTEGRATION === 'TRUE')
			removeGroupMembership(Number($page.params.groupId));

		groupStore.set($groupStore.filter((g) => g.id !== group.id));
		chatPartnerStore.set(0);
		goto('/home');
	};

	const action = (page: SelectablePage) => {
		menuOpen = false;
		if (selectedPage === page) return;
		selectedPage = page;
		goto(`?page=${page}`, { noScroll: true });
	};

	//@ts-ignore
	$: selectedPage = $page.url.searchParams.get('page') || 'flow';
</script>

<svelte:window bind:innerWidth />
<!-- On document, not window: Modal's Escape listener stops propagation at document -->
<svelte:document
	on:keydown={(e) => {
		if (e.key === 'Escape') menuOpen = false;
	}}
/>

<!-- TODO: Make it easier to add a sidebarbutton -->
{#snippet menuItems()}
	<div class="w-full">
		<GroupSidebarButton
			action={() => {
				if (
					$groupUserPermissionStore?.create_poll ||
					$groupUserStore?.is_admin
				)
					goto(
						`/createpoll?id=${$page.params.groupId}&type=${
							selectedPage === 'threads' ? 'thread' : 'poll'
						}`
					);
				else
					ErrorHandlerStore.set({
						message: 'You do not have permission to create a post',
						success: false
					});
			}}
			text="Create a post"
			disabled={!$groupUserPermissionStore?.create_poll &&
				!$groupUserStore?.is_admin}
			faIcon={faCheckToSlot}
			isSelected={false}
			Class="relative  text-white hover:!bg-blue-800 active:!bg-blue-900 bg-primary dark:saturate-50 shadow rounded w-full"
		/>
	</div>
	<div class={cardClass}>
		<GroupSidebarButton
			action={() => action('flow')}
			text="Flow"
			isSelected={selectedPage === 'flow'}
		/>
		<!-- <GroupSidebarButton
			action={() => action('threads')}
			text="Threads"
			isSelected={selectedPage === 'threads'}
		/> -->
		<!-- <GroupSidebarButton
			action={() => action('delegation')}
			isSelected={selectedPage === 'delegation'}
			text="Delegation"
			faIcon={faPeopleArrows}
		/> -->
		<GroupSidebarButton
			action={() => action('working-groups')}
			text={env.PUBLIC_LOGO === 'REFORUM'
				? 'Work- and local Groups'
				: 'Work Groups'}
			isSelected={selectedPage === 'working-groups'}
			faIcon={faPeopleCarryBox}
		/>
		<!-- svgIcon={workgroupsymbol} -->

		<!-- <GroupSidebarButton
			action={() => action('documents')}
			isSelected={selectedPage === 'documents'}
			text="Documents"
			faIcon={faFile}
		/> -->
		{#if !(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE')}
			<GroupSidebarButton
				action={() => goto(`/delegations?groupId=${$page.params.groupId}`)}
				isSelected={selectedPage === 'delegation'}
				text="Group Delegation"
				faIcon={faPeopleArrows}
			/>

			<GroupSidebarButton
				action={() => goto(`/kanban?groupId=${$page.params.groupId}`)}
				isSelected={selectedPage === 'kanban'}
				text="Group Tasks"
				faIcon={faListCheck}
			/>

			<GroupSidebarButton
				action={() => goto(`/schedule?groupId=${$page.params.groupId}`)}
				isSelected={selectedPage === 'schedule'}
				text="Group schedule"
				faIcon={faCalendarAlt}
			/>
		{/if}
		<GroupSidebarButton
			action={() => action('members')}
			text="Members"
			faIcon={faUserGroup}
			isSelected={selectedPage === 'members'}
		/>
		<!-- <GroupSidebarButton
			action={() => (action('statistics'))}
			text="Statistics"
			faIcon={faChartColumn}
			isSelected={selectedPage === 'statistics'}
		/> -->
		<a
			class="text-inherit w-full"
			target="_blank"
			href={`https://meet.flowback.org/${group.jitsi_room}`}
			on:click={() => (menuOpen = false)}
		>
			<!-- TODO: Bad UX should have icon for external link -->
			<GroupSidebarButton
				Class="w-full"
				text="Video Conference"
				faIcon={faVideoCamera}
				isSelected={false}
			/></a
		>
		{#if !(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE')}
			<GroupSidebarButton
				action={() => action('about')}
				text="About"
				faIcon={faCircleInfo}
				isSelected={selectedPage === 'about'}
			/>
		{/if}
	</div>
	{#if !(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE')}
		<div class={cardClass}>
			<GroupSidebarButton
				Class="w-full"
				action={() => {
					menuOpen = false;
					areYouSureModal = true;
				}}
				text="Leave group"
				faIcon={faPersonRunning}
				isSelected={false}
			/>
			{#if env.PUBLIC_FLOWBACK_LEDGER_MODULE === 'TRUE'}
				<a class="text-inherit w-full" href={`/ledger`}>
					<GroupSidebarButton
						Class="w-full"
						text="Group Ledger"
						faIcon={faCoins}
						isSelected={false}
					/>
				</a>
			{/if}
		</div>
	{/if}
	{#if $groupUserStore?.is_admin}
		<div class={cardClass}>
			<GroupSidebarButton
				action={() => action('email')}
				text="Send Email"
				faIcon={faMailReplyAll}
				isSelected={selectedPage === 'email'}
			/>
			<GroupSidebarButton
				action={() => goto(`/groups/${$page.params.groupId}/edit`)}
				text="Edit Group"
				faIcon={faCog}
				isSelected={false}
			/>
		</div>
	{/if}
{/snippet}

{#if mobile}
	{#if !$chatOpenStore}
		<button
			on:click={() => (menuOpen = true)}
			aria-label={$_('Open Menu')}
			aria-expanded={menuOpen}
			aria-controls="group-menu"
			class="fixed bottom-24 right-5 z-[105] flex items-center gap-2 rounded-full bg-primary px-5 py-4 text-white shadow-lg transition-transform active:scale-95 dark:saturate-50"
		>
			<Fa icon={faBars} />
			<span class="font-semibold">{$_('Menu')}</span>
		</button>
	{/if}

	{#if menuOpen}
		<!-- Keyboard users close the sheet with Escape or its close button -->
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			on:click={() => (menuOpen = false)}
			class="fixed inset-0 z-[120] bg-gray-900/45 backdrop-blur-[2px] touch-none"
			transition:fade={{ duration: 150 }}
		></div>
		<!-- Sits above the bottom navigation bar (z-100) so every item can be reached -->
		<nav
			id="group-menu"
			aria-label={$_('Group menu')}
			class="fixed inset-x-0 bottom-0 z-[121] flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-darkobject dark:text-darkmodeText"
			transition:fly={{ y: 400, duration: 250, easing: cubicOut }}
		>
			<div
				class="flex items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-gray-700"
			>
				<span
					class="flex-1 truncate text-lg font-semibold text-primary dark:text-secondary"
					>{group.name}</span
				>
				<button
					on:click={() => (menuOpen = false)}
					aria-label={$_('Close Menu')}
					class="rounded-full p-3 text-gray-500 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<Fa icon={faX} />
				</button>
			</div>
			<div
				class="flex flex-col gap-4 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
			>
				{@render menuItems()}
			</div>
		</nav>
	{/if}
{:else}
	<nav class={`${Class} flex flex-col gap-6 dark:!text-darkmodeText`}>
		{@render menuItems()}
	</nav>
{/if}

<Modal
	bind:open={areYouSureModal}
	Class="max-w-[400px]"
	buttons={[
		{ label: 'Yes', type: 'warning', onClick: leaveGroup },
		{ label: 'No', type: 'default', onClick: () => (areYouSureModal = false) }
	]}
>
	>
	<div slot="header">{$_('Are you sure?')}</div>
	<div slot="body">{$_('You are about to leave the group!')}</div>
</Modal>
