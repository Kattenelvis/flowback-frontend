<script lang="ts">
	import Layout from '$lib/Generic/Layout.svelte';
	import Fa from 'svelte-fa';
	import {
		faUser,
		faBell,
		faPieChart,
		faArrowLeft,
		faInfo,
		faCircleInfo,
		faEnvelope,
		faFileContract,
		faChevronRight,
		faMoon,
		faDownload,
		faTrashCan,
		faPen
	} from '@fortawesome/free-solid-svg-icons';
	import { env } from '$env/dynamic/public';
	import { _ } from 'svelte-i18n';
	import { fetchRequest } from '$lib/FetchRequest';
	import { onMount } from 'svelte';
	import { configToReadable } from '$lib/utils/configToReadable';
	import Modal from '$lib/Generic/Modal.svelte';
	import { goto } from '$app/navigation';
	import { isMobile } from '$lib/utils/isMobile';
	import Toggle from '$lib/Generic/Toggle.svelte';
	import { darkModeStore, toggleDarkMode } from '$lib/Generic/DarkMode';
	import TermsOfService from '$lib/Login/TermsOfService.svelte';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { userStore } from '$lib/User/interfaces';

	type PageType =
		| 'profile'
		| 'notifications'
		| 'poll-process'
		| 'info'
		| 'tos';

	interface SettingsPage {
		page: PageType;
		icon: any;
		text: string;
		description?: string;
	}

	const sidebarItems: SettingsPage[] = [
		{
			page: 'profile',
			icon: faUser,
			text: 'User Profile',
			description: 'Your account, appearance and personal data'
		},
		{
			page: 'tos',
			icon: faFileContract,
			text: 'Terms of Service',
			description: 'The rules every Flowback user agrees to'
		},
		// {
		// 	page: 'notifications',
		// 	icon: faBell,
		// 	text: 'Notifications'
		// },
		// {
		// 	page: 'poll-process',
		// 	icon: faPieChart,
		// 	text: 'Poll Process'
		// },
		// {
		// 	page: 'info',
		// 	icon: faInfo,
		// 	text: 'Information'
		// }
	];

	// if mobile, default to null, otherwise default to profile
	let selectedPage: PageType | null = $isMobile ? null : 'profile',
		sectionHeading =
			'text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
		iconChip =
			'flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-blue-50 text-primary dark:bg-gray-700 dark:text-secondary',
		rowDesign = 'flex items-center gap-4 w-full p-4 text-left transition-colors',
		userConfig = {
			notificationSettings: {
				schedule: {
					invited_to_event: false,
					event_date_changed: false,
					event_canceled: false,
					new_member_added: false,
					event_frequency_changed: false
				},
				kanban: {
					task_assigned: false,
					task_priority_changed: false,
					task_status_changed: false
				},
				posts: {
					new_thread_created: false,
					new_poll_created: false,
					vote_on_comment: false
				}
			},
			pollSettings: {
				area_voting: false,
				proposal_creation: false,
				prediction_statement_creation: false,
				prediction_betting: false,
				delegate_voting: false,
				voting: false
			}
		},
		serverConfig: any = {},
		version = '77',
		// GDPR data access/erasure requests are handled manually via mail for now
		privacyModalOpen = false,
		privacyRequest: 'data' | 'delete' = 'data';

	// Desktop always shows a page next to the menu, also when zooming out from the mobile layout
	$: if (!$isMobile && !selectedPage) selectedPage = 'profile';

	$: currentItem = sidebarItems.find((item) => item.page === selectedPage);

	const selectPage = (page: PageType) => {
		selectedPage = page;
		// On mobile the menu and the page are separate views, so going back should return to the menu
		if ($isMobile) history.pushState({}, '');
	};

	const openPrivacyModal = (request: 'data' | 'delete') => {
		privacyRequest = request;
		privacyModalOpen = true;
	};

	const userUpdate = async () => {
		const { res, json } = await fetchRequest('POST', 'user/update', {
			user_config: JSON.stringify(userConfig)
		});
	};

	const getServerConfig = async () => {
		const { res, json } = await fetchRequest('GET', 'server/config');

		if (!res.ok) return;

		serverConfig = json;
	};

	const getUserConfig = async () => {
		const { res, json } = await fetchRequest('GET', 'user');

		if (res.ok && json.user_config) userConfig = JSON.parse(json.user_config);
	};

	const saveUserConfig = async () => {
		const { res, json } = await fetchRequest('POST', 'user/update', {
			user_config: JSON.stringify(userConfig)
		});
	};

	const a = (key1: string, key2 = '') => {
		if (key2 === '') {
			//@ts-ignore
			return userConfig.pollSettings[key1];
		}
		//@ts-ignore
		else return userConfig.notificationSettings[key1][key2];
	};

	onMount(() => {
		getUserConfig();
		getServerConfig();

		const onPopState = () => {
			selectedPage = null;
		};

		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});
</script>

<Layout centered>
	<div
		class="w-full max-w-5xl px-4 md:px-6 pt-8 pb-8 flex flex-col md:flex-row md:items-start gap-4 md:gap-6 dark:text-darkmodeText"
	>
		{#if !$isMobile || !selectedPage}
			<aside class="w-full md:w-56 lg:w-64 md:shrink-0 md:sticky md:top-24">
				<div class="hidden md:flex items-center gap-2 mb-4">
					<button
						class="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-gray-600 hover:bg-white hover:text-primary dark:text-gray-300 dark:hover:bg-darkobject dark:hover:text-secondary transition-colors"
						on:click={() => goto('/home')}
						aria-label={$_('Back')}
					>
						<Fa icon={faArrowLeft} />
					</button>
					<h1
						class="min-w-0 text-2xl font-semibold text-left text-primary dark:text-secondary break-words"
					>
						{$_('Settings')}
					</h1>
				</div>

				<nav
					class="flex flex-col gap-1 p-2 bg-white dark:bg-darkobject rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
				>
					{#each sidebarItems as item}
						{@const active = selectedPage === item.page}
						<button
							on:click={() => selectPage(item.page)}
							class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors
							{active
								? 'bg-blue-50 text-primary font-semibold dark:bg-gray-700 dark:text-secondary'
								: 'hover:bg-gray-100 dark:hover:bg-gray-700'}"
							aria-current={active ? 'page' : undefined}
						>
							<span
								class="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg transition-colors
								{active
									? 'bg-primary text-white dark:bg-secondary dark:text-darkobject'
									: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}"
							>
								<Fa icon={item.icon} />
							</span>
							<span class="flex-1 min-w-0 break-words">{$_(item.text)}</span>
							<Fa icon={faChevronRight} class="md:hidden shrink-0 text-gray-400" />
						</button>
					{/each}
				</nav>
			</aside>
		{/if}

		{#if selectedPage}
			<section
				class="flex-1 min-w-0 bg-white dark:bg-darkobject rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
			>
				{#if currentItem}
					<header
						class="flex items-center gap-4 px-5 py-4 md:px-8 md:py-6 border-b border-gray-200 dark:border-gray-700"
					>
						<span
							class="hidden sm:flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-lg bg-blue-50 text-primary dark:bg-gray-700 dark:text-secondary"
						>
							<Fa icon={currentItem.icon} />
						</span>
						<div class="min-w-0">
							<h2 class="text-xl font-semibold text-primary dark:text-secondary break-words">
								{$_(currentItem.text)}
							</h2>
							{#if currentItem.description}
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{$_(currentItem.description)}
								</p>
							{/if}
						</div>
					</header>
				{/if}

				<div class="px-5 py-5 md:px-8 md:py-6">
					{#if selectedPage === 'profile'}
						<div class="flex flex-col gap-8">
							<div
								class="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<ProfilePicture
									username={$userStore?.username}
									profilePicture={$userStore?.profile_image}
									size={3}
								/>
								<div class="flex-1 min-w-[10rem]">
									<p class="text-lg font-semibold break-words">{$userStore?.username ?? ''}</p>
									{#if $userStore?.email}
										<p class="text-sm text-gray-500 dark:text-gray-400 break-all">
											{$userStore.email}
										</p>
									{/if}
								</div>
								<a
									href="/user"
									class="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium border-primary text-primary hover:bg-primary hover:text-white hover:no-underline dark:border-secondary dark:text-secondary dark:hover:bg-secondary dark:hover:text-darkobject transition-colors"
								>
									<Fa icon={faPen} class="w-3 h-3" />
									{$_('Edit profile')}
								</a>
							</div>

							<div class="flex flex-col gap-3">
								<h3 class={sectionHeading}>{$_('Appearance')}</h3>
								<div
									class="{rowDesign} rounded-xl border border-gray-200 dark:border-gray-700"
								>
									<span class={iconChip}><Fa icon={faMoon} /></span>
									<div class="flex-1 min-w-0">
										<p class="font-medium">{$_('Dark Mode')}</p>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											{$_('Use a dark color theme')}
										</p>
									</div>
									<div class="flex shrink-0">
										<Toggle checked={$darkModeStore} onInput={toggleDarkMode} />
									</div>
								</div>
							</div>

							<div class="flex flex-col gap-3">
								<h3 class={sectionHeading}>{$_('Your data')}</h3>
								<div
									class="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden"
								>
									<button
										type="button"
										class="{rowDesign} hover:bg-gray-50 dark:hover:bg-gray-700/50"
										on:click={() => openPrivacyModal('data')}
									>
										<span class={iconChip}><Fa icon={faDownload} /></span>
										<span class="flex-1 min-w-0">
											<span class="block font-medium">{$_('Give me all my data')}</span>
											<span class="block text-sm text-gray-500 dark:text-gray-400">
												{$_('Request a copy of the personal data stored about you')}
											</span>
										</span>
										<Fa icon={faChevronRight} class="shrink-0 text-gray-400" />
									</button>
									<button
										type="button"
										class="{rowDesign} hover:bg-red-50 dark:hover:bg-red-900/20"
										on:click={() => openPrivacyModal('delete')}
									>
										<span
											class="{iconChip} !bg-red-50 !text-red-600 dark:!bg-red-900/30 dark:!text-red-400"
										>
											<Fa icon={faTrashCan} />
										</span>
										<span class="flex-1 min-w-0">
											<span class="block font-medium text-red-600 dark:text-red-400">
												{$_('Delete account')}
											</span>
											<span class="block text-sm text-gray-500 dark:text-gray-400">
												{$_('Permanently delete your account and personal data')}
											</span>
										</span>
										<Fa icon={faChevronRight} class="shrink-0 text-gray-400" />
									</button>
								</div>
							</div>
						</div>
					{:else if selectedPage === 'notifications' && userConfig?.notificationSettings}
						{#each Object.entries(userConfig.notificationSettings) as [key1, settings]}
							<span
								class="text-lg text-primary dark:text-secondary font-semibold mb-3"
								>{$_(configToReadable(key1))}</span
							>
							<span class="mb-2 block text-gray-600 dark:text-gray-400"
								>{$_('Notify me when')}...</span
							>
							<ul class="mb-6">
								{#each Object.entries(settings) as [key2, setting]}
									<li
										class="flex justify-between p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<span>{$_(configToReadable(key2))}</span>
										<input
											on:change={saveUserConfig}
											value={userConfig.pollSettings}
											type="checkbox"
											on:input={(e) => {
												//@ts-ignore
												userConfig.notificationSettings[key1][key2] =
													//@ts-ignore
													e.target.checked;

												userUpdate();
											}}
											checked={a(key1, key2)}
										/>
									</li>
								{/each}
							</ul>
						{/each}
					{:else if selectedPage === 'poll-process' && userConfig?.pollSettings}
						<span
							class="text-lg text-primary dark:text-secondary font-semibold mb-3"
							>{$_('Poll Phases')}</span
						>
						<div class="mb-2 text-gray-600 dark:text-gray-400">
							{$_('Select the phases you want to participate in')}
						</div>
						<ul class="gap-2">
							{#each Object.entries(userConfig.pollSettings) as [key, setting]}
								<li
									class="flex justify-between p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
								>
									<span>{$_(configToReadable(key))}</span>
									<input
										type="checkbox"
										on:change={saveUserConfig}
										value={userConfig.pollSettings}
										on:input={(e) => {
											//@ts-ignore
											userConfig.pollSettings[key] =
												//@ts-ignore
												e.target.checked;

											userUpdate();
										}}
										checked={a(key)}
									/>
								</li>
							{/each}
						</ul>
					{:else if selectedPage === 'info'}
						<div>{$_('Frontend version')}: {version}</div>
						<div>{$_('Backend version')}: {serverConfig.VERSION}</div>
					{:else if selectedPage === 'tos'}
						<!-- The page header already names the terms, so the component's own title is hidden -->
						<TermsOfService
							Class="!border-none !p-0 !gap-4 max-w-prose [&_p]:leading-7 text-gray-700 dark:text-gray-300 [&_h1]:hidden"
						/>
					{/if}
				</div>
			</section>
		{/if}
	</div>
</Layout>

<Modal bind:open={privacyModalOpen} Class="max-w-[480px]">
	<div slot="header">
		{privacyRequest === 'data' ? $_('Give me all my data') : $_('Delete account')}
	</div>
	<div slot="body" class="flex flex-col gap-4 text-left">
		{#if env.PUBLIC_PRIVACY_MAIL}
			<p>
				{privacyRequest === 'data'
					? $_('To get a copy of all personal data stored about you, send an email to:')
					: $_('To delete your account and personal data, send an email to:')}
			</p>
			<a
				href={`mailto:${env.PUBLIC_PRIVACY_MAIL}?subject=${encodeURIComponent(
					privacyRequest === 'data'
						? $_('Request for my personal data')
						: $_('Request to delete my account')
				)}`}
				class="flex items-center gap-2 font-semibold text-primary dark:text-secondary hover:underline break-all"
			>
				<Fa icon={faEnvelope} />
				{env.PUBLIC_PRIVACY_MAIL}
			</a>
			<div
				class="flex gap-2 rounded-lg p-3 text-sm bg-blue-50 border border-blue-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
			>
				<Fa icon={faCircleInfo} class="mt-0.5 shrink-0 text-primary dark:text-secondary" />
				<span>
					{$_(
						"Send the email from the address connected to your account so we can verify that it's you. We will respond within one month."
					)}
				</span>
			</div>
		{:else}
			<p>{$_('Contact the administrator of this Flowback instance to make this request.')}</p>
		{/if}
	</div>
</Modal>
