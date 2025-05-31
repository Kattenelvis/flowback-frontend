<script lang="ts">
	import '../app.css';
	import { initializeLocalization } from '$lib/Localization/i18n';
	import Header from '$lib/Header/Header.svelte';
	import { beforeNavigate, goto, onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { groupUserStore, type GroupUser } from '$lib/Group/interface';
	import Chat from '$lib/Chat/Chat.svelte';
	import { _ } from 'svelte-i18n';
	import { env } from '$env/dynamic/public';
	import { fetchRequest } from '$lib/FetchRequest';
	import { workGroupsStore } from '$lib/Group/WorkingGroups/interface';
	import LogBackInModal from '$lib/Generic/LogBackInModal.svelte';
	import { userStore } from '$lib/User/interfaces';

	export const prerender = true;

	let showUI = false,
		scrolledY = '',
		openLoginModal = false,
		isBrowser = false;

	const shouldShowUI = () => {
		let pathname = window?.location?.pathname;

		if (pathname === '/login') return false;
		else if (pathname === '/') return false;
		else if (
			window.localStorage.getItem('token') === undefined ||
			window.localStorage.getItem('userId') === undefined
		)
			return false;

		return true;
	};

	//TODO: Avoid code duplication and introduce group stores for storing group data.
	const getGrouplist = async () => {
		const { res, json } = await fetchRequest('GET', 'group/list');
		console.log(res, 'Group List');

		if (!res.ok) return;
		else return json.results;
	};

	const redirect = async () => {
		if (!isBrowser) return;
		
		const relativePath = window.location.pathname;

		let pathname = window?.location?.pathname;

		const sessionExpirationTime = window.localStorage.getItem('sessionExpirationTime');
		if (
			sessionExpirationTime &&
			relativePath !== '/login' &&
			sessionExpirationTime < new Date().getTime().toString()
		) {
			localStorage.removeItem('token');
			goto('/login');
		} else if (!window.localStorage.getItem('token') && relativePath !== '/login') goto('/login');
		else if (
			//For one group flowback, if no group has been setup, redirect to create group.
			env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE' &&
			relativePath !== '/creategroup'
		) {
			const groups = await getGrouplist();
			if (groups.length === 0) goto('/creategroup');
		} else if (pathname === '/') goto('/home');
	};

	const getWorkingGroupList = async () => {
		if (!$page.params.groupId) return;
		const { res, json } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/list?limit=100&order_by=name_asc`
		);

		if (!res.ok) return;

		workGroupsStore.set(json.results);
	};

	const checkSessionExpiration = () => {
		const sessionExpiration = window.localStorage.getItem('sessionExpirationTime');
		if (!sessionExpiration) return;

		const expirationTime = Number(sessionExpiration);
		const currentTime = new Date().getTime();

		// Check if it will expire within next hour
		if (expirationTime > currentTime && expirationTime - currentTime < 3600000) {
			openLoginModal = true;
		}
	};

	const setUserGroupInfo = async () => {
		if (!$page.params.groupId) return;
		// if (
		// 	(Number(localStorage.getItem('userId')) === $userGroupInfo?.user.id &&
		// 	$userGroupInfo?.group_id === Number($page.params.groupId))
		// )
		// 	return;

		const { res, json } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/users?user_id=${localStorage.getItem('userId')}`
		);
		if (!res.ok) return;
		groupUserStore.set(json.results[0]);

		console.log(json, 'User Group Info');
	};

	const setUserInfo = async () => {
		if (
			localStorage.getItem('userId') === null ||
			Number(localStorage.getItem('userId')) === $userStore?.id
		)
			return;

		const { res, json } = await fetchRequest('GET', `users?id=${localStorage.getItem('userId')}`);
		if (!res.ok) return;
		userStore.set(json.results[0]);
	};

	beforeNavigate(() => {
		scrolledY = $page.params.pollId;
	});

	$: if ($page.url.pathname && isBrowser) {
		console.log('Page changed to: ', $page.url.pathname);
		redirect();
		getWorkingGroupList();
		showUI = shouldShowUI();

		setTimeout(() => {
			const html = document.getElementById(`poll-thumbnail-${scrolledY}`);
			html?.scrollIntoView();
		}, 200);

		checkSessionExpiration();
		setUserGroupInfo();
		setUserInfo();
	}

	//Initialize Translation, which should happen before any lifecycle hooks.
	initializeLocalization();

	onMount(() => {
		isBrowser = true;
		getWorkingGroupList();
		showUI = shouldShowUI();
		redirect();

		setTimeout(() => {
			const html = document.getElementById(`poll-thumbnail-${scrolledY}`);
			html?.scrollIntoView();
		}, 200);

		checkSessionExpiration();
	});
</script>

<main class="">
	{#if showUI}
		<Chat />
		<Header />
	{/if}

	<slot />
</main>
<div id="mobile-support">
	{$_('No support for mobile devices yet, try Flowback on a non-mobile device')}
</div>

<LogBackInModal bind:open={openLoginModal} />

<style>
	#mobile-support {
		display: none;
	}

	@media (max-width: 716px) {
		main {
			display: none !important;
		}

		#mobile-support {
			display: block !important;
		}
	}
</style>
