<script lang="ts">
	//@ts-ignore
	import Fa from 'svelte-fa/src/fa.svelte';
	import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
	import { _ } from 'svelte-i18n';
	import { fetchRequest } from '$lib/FetchRequest';
	import { onMount } from 'svelte';
	import type { notification } from './Notification';
	import TimeAgo from 'javascript-time-ago';
	import { goto } from '$app/navigation';
	import { notifications as notificationLimit } from '$lib/Generic/APILimits.json';
	import { darkModeStore } from '$lib/Generic/DarkMode';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { isMobile } from '$lib/utils/isMobile';

	let notifications: notification[],
		timeAgo: TimeAgo,
		notificationsOpen = false;

	const notificationList = async () => {
		//Prevents infinite reload in /login where <Header /> is hidden
		if (location.pathname === '/login') return;
		const { json, res } = await fetchRequest(
			'GET',
			`notification/list?order_by=timestamp_desc&limit=${notificationLimit}`
		);
		if (res.ok) notifications = json?.results;
	};

	const closeWindowWhenClickingOutside = () => {
		window.addEventListener('click', (e) => {
			const notificationListElement =
				document.getElementById(`notifications-list`);
			if (
				notificationsOpen &&
				//@ts-ignore
				!notificationListElement?.contains(e.target)
			) {
				notificationsOpen = false;
			}
		});
	};

	const readNotification = async (id: number) => {
		const { res, json } = await fetchRequest('POST', 'notification/update', {
			notification_object_ids: [id],
			read: true
		});
		if (!res.ok) return;

		// notifications = notifications.filter((notification) => notification.id !== id);
		// let notification = notifications.find(n => n.object_id === id)
		// notification?.read = true;
	};

	const markAllAsRead = async () => {
		const { res, json } = await fetchRequest('POST', 'notification/update', {
			notification_object_ids: notifications.map(
				(notification) => notification.object_id
			),
			read: true
		});

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: "Couldn't mark all notifications as read",
				success: false
			});
			return;
		}

		notifications = notifications.map((n) => ({ ...n, read: (n.read = true) }));
	};

	const gotoNotificationOrigin = async (notification: notification) => {
		switch (notification.tag) {
			case 'poll':
			case 'poll_vote_update':
				await goto(
					`/groups/${notification.data.group_id}/polls/${notification.data.poll_id}?source=notification`
				);
				return;
			case 'poll_comment':
				await goto(
					`/groups/${notification.data.group_id}/polls/${notification.data.poll_id}?section=comments&source=notification`
				);
				return;
			case 'thread':
				await goto(
					`/groups/${notification.data.group_id}/thread/${notification.data.thread_id}?source=notification`
				);
				return;
			case 'thread_comment':
				// TODO: Fix scuffed solution with channel_data by changing data in backend probably group models.py
				await goto(
					`/groups/${notification.data.group_id}/thread/${notification.data.thread_id}?section=comments&source=notification`
				);
				return;
			case 'group_user':
				await goto(`/groups/${notification.data.group_id}?page=members`);
				return;
			case 'kanban':
				await goto(`/kanban?groupId=${notification.data.group_id}`);
				return;
			case 'schedule':
				await goto(`/schedule?groupId=${notification.data.group_id}`);
				return;
			default:
				return;
		}
	};

	onMount(async () => {
		const en = (await import('javascript-time-ago/locale/en')).default;
		// addDefaultLocale throws when called twice, which happens when the bell remounts between the mobile and desktop header
		TimeAgo.addLocale(en);
		timeAgo = new TimeAgo('en');

		notificationList();
		closeWindowWhenClickingOutside();
	});
</script>

<!-- Notification bell in the header -->
<button
	id="notifications-list"
	class="small-notification relative cursor-pointer"
	on:click={() => (notificationsOpen = !notificationsOpen)}
>
	<Fa
		icon={faBell}
		color={$darkModeStore ? 'white' : 'black'}
		size={$isMobile ? '1.5x' : '1.3x'}
	/>
	<div
		class:hidden={!notifications ||
			notifications?.filter((n) => !n.read)?.length === 0}
		class="w-[2em] h-[2em] flex items-center justify-center rounded-full absolute -top-1.5 -right-1.5 text-[10px] text-white bg-secondary"
	>
		<span>{Math.min(99, notifications?.filter((n) => !n.read)?.length)}</span>
	</div>
</button>

<!-- Menu of notifications, that for now opens when clicking the notification bell in the header -->
{#if notificationsOpen}
	<ul
		class="absolute right-0 top-full z-[60] mt-3 max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-700 dark:bg-darkobject dark:text-darkmodeText select-none slide-animation"
		id="notifications-list"
	>
		<div class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-darkobject">
			<h2 class="font-semibold">{$_('Notifications')}</h2>
			<button on:click={markAllAsRead} class="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-secondary dark:hover:bg-gray-700">
				{$_('Mark all as read')}
			</button>
		</div>
		{#if notifications?.length > 0}
			{#each notifications as notification}
				<li
					class="flex border-b border-gray-100 transition-colors last:border-b-0 dark:border-gray-700"
					class:bg-blue-50={!notification.read}
					class:dark:bg-gray-700={!notification.read}
				>
					<button
						class="min-w-0 flex-1 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-gray-700/70"
						on:click={async () => {
							await gotoNotificationOrigin(notification);
							await readNotification(notification.object_id);
							notification.read = true;
						}}
					>
						<div class="flex items-start gap-3 break-words">
							<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" class:bg-primary={!notification.read} class:bg-gray-300={notification.read} class:dark:bg-gray-500={notification.read} aria-hidden="true"></span>
							<span class="min-w-0">
								<span class="block">
									{notification.reminder > 0
										? `${$_('Event starts soon')}: ${notification.data.title}`
										: $_(notification.message)}
								</span>
								<span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
								{timeAgo.format(new Date(notification.timestamp))}
								</span>
							</span>
						</div>
					</button>
					<button
						style="z-index: 1;"
						class="shrink-0 px-3 text-xs font-medium text-gray-500 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:text-gray-400 dark:hover:text-secondary"
						aria-label={$_('Mark as read')}
						title={$_('Mark as read')}
						on:click={async () => {
							await readNotification(notification.object_id);
							notification.read = true;

							// setTimeout(() => {
							// 	notificationsOpen = true;
							// }, 100);
							// hovered.push(notification.id);
							// hovered = hovered;
						}}
					>
						{#if !notification.read}{$_('Mark as read')}{/if}
					</button>
				</li>
			{/each}
		{:else}
			<div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400 cursor-default">
				{$_('No notifications')}
			</div>
		{/if}
	</ul>
{/if}

<style>
	@keyframes slide-animation {
		from {
			top: 80%;
		}
		to {
			top: 100%;
		}
	}

	.slide-animation {
		animation-name: slide-animation;
		animation-duration: 300ms;
	}
</style>
