<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
	import { faBellSlash } from '@fortawesome/free-solid-svg-icons/faBellSlash';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { _ } from 'svelte-i18n';
	import SuccessPoppup from './SuccessPoppup.svelte';
	import { page } from '$app/stores';
	import { darkModeStore } from '$lib/Generic/DarkMode';

	export let notificationOpen = false,
		categories: string[],
		type: 'poll' | 'group' | 'group_thread',
		labels: string[],
		api: string,
		id: number,
		Class = '',
		ClassOpen = '',
		hoverEffect = true;

	let popupMessage: string = '',
		notifications: NotificationObject[] = [],
		show = false;

	interface NotificationObject {
		channel_category: string;
		channel_sender_id: number;
		channel_sender_type: string;
	}

	const groupId = $page.params.groupId;
	const pollId = $page.params.pollId;

	const closeWindowWhenClickingOutside = () => {
		window.addEventListener('click', function (e) {
			if (
				notificationOpen &&
				//@ts-ignore
				![...document.getElementsByClassName(`notifications-clickable-region`)]?.find((element) =>
					//@ts-ignore
					element.contains(e.target)
				)
			) {
				notificationOpen = false;
			}
		});
	};

	const getNotifications = async () => {
		const { res, json } = await fetchRequest('GET', 'notification/subscription');
		notifications = json.results.filter(
			(notificationObject: any) => notificationObject.channel_sender_id === id
		);
	};

	const notificationSubscription = async (category: string) => {
		const { res, json } = await fetchRequest('POST', `${api}/subscribe`, {
			categories: [category]
		});
		if (res.ok) {
			notifications.push({
				channel_category: category,
				channel_sender_id: id,
				channel_sender_type: type
			});
			popupMessage = 'Subscribed';
		} else popupMessage = 'Something went wrong';

		notifications = notifications;
	};

	const notificationUnsubscription = async (category: string) => {
		const { res, json } = await fetchRequest('POST', `notification/unsubscribe`, {
			channel_sender_id: id,
			channel_category: category,
			channel_sender_type: type
		});
		if (res.ok) {
			notifications = notifications.filter((object) => object.channel_category !== category);
			popupMessage = 'Unsubscribed';
		} else popupMessage = 'Something went wrong';
	};

	onMount(() => {
		closeWindowWhenClickingOutside();
	});

	$: if (notificationOpen) getNotifications();
</script>

<div class={`${Class} notifications-clickable-region`}>
	<button
		class={``}
		on:click={() => {
			notificationOpen = !notificationOpen;
		}}
		on:keydown
	>
		{#key darkModeStore}
			<Fa
				class={'hover:cursor-pointer hover:text-primary dark:text-secondary'}
				icon={faBell}
				size={'1.2x'}
			/>
		{/key}
	</button>

	{#if notificationOpen && categories}
		<div class={`z-50 absolute mt-2 bg-white dark:bg-darkobject shadow-xl text-sm ${ClassOpen}`}>
			<div class="text-xs p-2 ">{$_('Manage Subscriptions')}</div>
			{#each categories as category, i}
				<button
					class="bg-gray-200 dark:bg-gray-700 w-full p-2 px-5 flex justify-between items-center transition-all"
					class:active:bg-gray-400={hoverEffect}
					class:dark:active:bg-slate-700={hoverEffect}
					class:dark:active:bg-slate-900={hoverEffect}
					class:hover:bg-gray-300={hoverEffect}
					class:hover:cursor-pointer={hoverEffect}
					class:dark:hover:bg-slate-800={hoverEffect}
					class:!bg-white={notifications?.find(
						(notificationObject) => notificationObject.channel_category === category
					)}
					class:dark:!bg-slate-400={notifications?.find(
						(notificationObject) => notificationObject.channel_category === category
					)}
					on:click={() => {
						if (notifications.find((object) => object.channel_category === category))
							notificationUnsubscription(category);
						else notificationSubscription(category);
					}}
				>
					{$_(labels[i])}
					<Fa
						class=""
						color={notifications?.find(
							(notificationObject) => notificationObject.channel_category === category
						)
							? 'black'
							: 'white'}
						swapOpacity
						icon={notifications?.find(
							(notificationObject) => notificationObject.channel_category === category
						)
							? faBell
							: faBellSlash}
						size={'1.4x'}
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>
<SuccessPoppup bind:show bind:message={popupMessage} />
