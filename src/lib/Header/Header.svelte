<script lang="ts">
	import HeaderIcon from './HeaderIcon.svelte';
	import Logo from '$lib/assets/Logo.png';
	import Reforum from '$lib/assets/ReforumTransparent.png';
	import DefaultPFP from '$lib/assets/abstract-user-flat-4.svg';
	import SideHeader from './SideHeader.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { fetchRequest } from '$lib/FetchRequest';
	import Notifications from './Notifications.svelte';
	import { darkModeStore, initializeDarkMode, toggleDarkMode } from '$lib/Generic/DarkMode';
	import type { Group, GroupUser } from '$lib/Group/interface';
	import { pfpStore } from '$lib/Login/stores';
	import {
		faCalendarDays,
		faCoins,
		faHouse,
		faMoon,
		faPeopleGroup,
		faArrowsSpin,
		faPeopleArrows,
		faListCheck
	} from '@fortawesome/free-solid-svg-icons';
	import Sun from './Sun.svelte';
	import { env } from '$env/dynamic/public';
	import Fa from 'svelte-fa';
	import { getPermissionsFast } from '$lib/Generic/GenericFunctions';
	import { page } from '$app/stores';

	let sideHeaderOpen = false,
		profileImage: string | null = DefaultPFP,
		selectedHref = '';

	onMount(async () => {
		if (location.pathname !== '/login') {
			getProfileImage();
			setPfP();
		}

		initializeDarkMode(); // Ensure background color is set correctly

		pfpStore.subscribe(() => {
			getProfileImage();
		});
	});

	onDestroy(() => {
		profileImage = null;
		clearProfileImage(); // Ensure profile image is cleared on component destroy
	});

	const setPfP = () => {
		if (!profileImage) getProfileImage();
		else {
			const pfpLink = localStorage.getItem('pfp-link');

			if (pfpLink !== 'null') profileImage = pfpLink;
			else profileImage = null;
		}
	};

	const getProfileImage = async () => {
		const { res, json } = await fetchRequest('GET', 'user');

		if (res.ok && json.profile_image) profileImage = json.profile_image;

		localStorage.setItem('pfp-link', json.profile_image);
	};

	const clearProfileImage = () => {
		localStorage.removeItem('pfp-link');
		profileImage = null;
	};
</script>

<header
	class="sticky top-0 z-50 md:flex justify-between flex-row items-center p-1.5 px-3 bg-white shadow select-none dark:bg-darkobject"
	id="header"
>
	<a
		href={env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE' ? '/groups/1' : '/home'}
		class="md:w-auto flex justify-center md:flex-none"
		><img
			src={env.PUBLIC_LOGO === 'REFORUM' ? Reforum : Logo}
			class="w-32 cursor-pointer"
			alt="flowback logo"
		/></a
	>
	<div class="!flex justify-between md:w-[80%]">
		<nav class="flex items-baseline p-6 justify-evenly md:justify-center md:gap-[10%] w-[70%]">
			{#if !(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE')}
				<HeaderIcon disableTextOnHover icon={faHouse} text="Home" href="home" bind:selectedHref />
				<!-- <HeaderIcon disableTextOnHover icon={faGlobeEurope} text="Public" href="public" /> -->
				<HeaderIcon
					disableTextOnHover
					icon={faPeopleGroup}
					text="Groups"
					href="groups"
					bind:selectedHref
				/>
			{/if}
			{#if env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE'}
				<HeaderIcon
					disableTextOnHover
					icon={faHouse}
					text="Home"
					href="groups/1"
					bind:selectedHref
				/>
			{/if}

			<HeaderIcon
				disableTextOnHover
				icon={faListCheck}
				text="Tasks"
				href="kanban"
				bind:selectedHref
			/>

			<HeaderIcon
				disableTextOnHover
				icon={faCalendarDays}
				text="Schedule"
				href="schedule"
				bind:selectedHref
			/>

			{#if env.PUBLIC_FLOWBACK_LEDGER_MODULE === 'TRUE'}
				<HeaderIcon
					disableTextOnHover
					icon={faCoins}
					text={!(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE') ? 'My Ledger' : 'Group Ledger'}
					href="ledger"
					bind:selectedHref
				/>
			{/if}

			{#if env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE'}
				<HeaderIcon
					disableTextOnHover
					icon={faArrowsSpin}
					text={'Automate'}
					href="automate"
					bind:selectedHref
				/>
			{:else}
				<HeaderIcon
					disableTextOnHover
					icon={faPeopleArrows}
					text={'Delegations'}
					href="automate"
					bind:selectedHref
				/>
			{/if}
		</nav>

		<div class="flex gap-4 items-center float-right hover:bg-grey-800">
			<div class="mr-5 flex gap-4 items-center">
				<button
					class="dark:text-darkmodeText cursor-pointer pl-2"
					title={`Enable ${$darkModeStore ? 'lightmode' : 'darkmode'}`}
					on:click={toggleDarkMode}
				>
					{#if $darkModeStore}
						<Sun />
					{:else}
						<Fa icon={faMoon} size={'1.3x'} />
					{/if}
				</button>
				<Notifications />
			</div>
			<button id="side-header" on:click={() => (sideHeaderOpen = !sideHeaderOpen)}>
				{#key profileImage}
					<img
						src={profileImage ? `${env.PUBLIC_API_URL}${profileImage}` : DefaultPFP}
						class={`w-8 h-8 rounded-full cursor-pointer ${
							sideHeaderOpen && 'ring-blue-500 ring-4'
						}`}
						alt="default pfp"
					/>
				{/key}
			</button>
		</div>
	</div>
	<SideHeader bind:sideHeaderOpen />
</header>

<!-- Kind of an ugly fix for mobile phones. TODO: More elegant solution  -->
<style>
	header:nth-child(1) {
		align-self: stretch;
	}

	/* header > .inline-flex {
		gap: calc(8% - 60px);
	} */

	header {
		flex-wrap: wrap-reverse;
		padding: 0rem 1rem;
	}

	/* @media only screen and (max-width: 768px) {
		header > .inline-flex {
			gap: calc(15% - 70px);
		}
	} */

	@media only screen and (max-width: 500px) {
		header > div:last-child {
			float: none;
			display: block;
		}
	}
</style>
