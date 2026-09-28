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
		faEnvelope
	} from '@fortawesome/free-solid-svg-icons';
	import { env } from '$env/dynamic/public';
	import { _ } from 'svelte-i18n';
	import RadioButtons2 from '$lib/Generic/RadioButtons2.svelte';
	import { fetchRequest } from '$lib/FetchRequest';
	import { onMount } from 'svelte';
	import { configToReadable } from '$lib/utils/configToReadable';
	import Modal from '$lib/Generic/Modal.svelte';
	import { goto } from '$app/navigation';
	import { isMobile } from '$lib/utils/isMobile';
	import Toggle from '$lib/Generic/Toggle.svelte';
	import { darkModeStore, toggleDarkMode } from '$lib/Generic/DarkMode';

	type PageType =
		| 'profile'
		| 'notifications'
		| 'poll-process'
		| 'info';

	interface SettingsPage {
		page: PageType;
		icon: any;
		text: string;
	}

	const sidebarItems: SettingsPage[] = [
		{
			page: 'profile',
			icon: faUser,
			text: 'User Profile'
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
		optionsDesign =
			'flex items-center gap-3 w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 transition-all',
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

		window.addEventListener('popstate', () => {
			selectedPage = null;
		});
	});
</script>

<Layout centered>
	<div class={$isMobile ? 'flex flex-col w-full h-[100svh]' : 'flex mt-6 gap-6'}>
		<div
			class="bg-white dark:bg-darkobject dark:text-darkmodeText p-6 shadow
			{$isMobile ? 'h-full' : 'w-[300px] h-[800px] rounded border'}"
			class:hidden={$isMobile && selectedPage}
		>
			<div class={$isMobile ? 'hidden' : 'flex items-center mb-4 gap-4'}>
				<button
					class="text-gray-600 hover:text-primary dark:text-secondary transition-colors"
					on:click={() => goto('/home')}
				>
					<Fa icon={faArrowLeft} />
				</button>
				<h1
					class="text-xl text-left text-primary dark:text-secondary font-semibold text-center"
				>
					{$_('Settings')}
				</h1>
			</div>
			{#if !$isMobile || !selectedPage}
				<div class="mt-4">
					{#each sidebarItems as item}
						<button
							on:click={() => {
								selectedPage = item.page;
								history.pushState({}, '');
							}}
							class={optionsDesign}
							class:bg-gray-100={selectedPage === item.page}
							class:dark:bg-gray-800={selectedPage === item.page}
							class:border-l-2={selectedPage === item.page}
							class:border-primary={selectedPage === item.page}
						>
							<Fa icon={item.icon} class="w-5 h-5" />{$_(item.text)}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		{#if !$isMobile || selectedPage}
			<div
				class="bg-white dark:bg-darkobject dark:text-darkmodeText p-6 shadow
				{$isMobile ? 'h-full' : 'w-[450px] rounded border'}"
			>
				<ul class="flex flex-col h-full">
					{#if selectedPage === 'profile'}
						<li
							class="text-lg text-primary dark:text-secondary font-semibold mb-3"
						>
							{$_('General')}
						</li>
						<RadioButtons2
							Class="pb-4"
							ClassInner="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
							name="radio1"
							label="Who can see my profile"
							labelClass="text-gray-600 dark:text-gray-400"
							labels={['All', 'Only people in my groups', 'Only group admins']}
							values={['1', '2', '3']}
							radioSide="right"
						/>
						<RadioButtons2
							ClassInner="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
							name="radio2"
							label="Who can contact me in chat"
							labelClass="text-gray-600 dark:text-gray-400"
							labels={['All', 'Only people in my groups', 'Only group admins']}
							values={['1', '2', '3']}
							radioSide="right"
						/>

						{#if $isMobile}
							<div class="flex items-center justify-between my-4">
								<span>{$_('Dark Mode')}</span>
								<Toggle checked={$darkModeStore} onInput={toggleDarkMode} />
							</div>
						{/if}

						<div class="pt-4 md:mt-auto">
							<button
								type="button"
								class="block cursor-pointer hover:underline"
								on:click={() => openPrivacyModal('data')}
							>
								{$_('Give me all my data')}
							</button>
							<button
								type="button"
								class="block text-red-600 cursor-pointer hover:underline mt-2"
								on:click={() => openPrivacyModal('delete')}
							>
								{$_('Delete account')}
							</button>
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
					{/if}
				</ul>
			</div>
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
