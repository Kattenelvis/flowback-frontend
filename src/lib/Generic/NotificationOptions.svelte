<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
	import { faBellSlash } from '@fortawesome/free-solid-svg-icons/faBellSlash';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { _ } from 'svelte-i18n';
	import { darkModeStore } from '$lib/Generic/DarkMode';
	import { ErrorHandlerStore } from './ErrorHandlerStore';

	let {
		notificationOpen = false,
		categories,
		labels,
		type,
		api,
		unsubscribeApi,
		occurrenceStart,
		id,
		Class = '',
		ClassOpen = '',
		hoverEffect = true
	}: {
		notificationOpen?: boolean;
		categories: string[];
		labels: string[];
		type: 'poll' | 'group' | 'thread' | 'delegation' | 'event';
		api: string;
		// Events are left through an endpoint of their own
		unsubscribeApi?: string;
		// Start of the occurrence of a repeating event that is open, for the choice of following only that one
		occurrenceStart?: string;
		id: number;
		Class?: string;
		ClassOpen?: string;
		hoverEffect?: boolean;
	} = $props();

	let notifications: NotificationObject[] = $state([]);

	interface NotificationObject {
		channel_category: string;
		channel_sender_id: number;
		channel_sender_type: string;
	}

	interface NotificationSubscriptionResponse {
		origin_id: number;
		channel_id: number;
		channel_name: 'group' | 'poll' | 'thread';
		tags: {
			name: string;
			reminders: null;
		}[];
	}

	const closeWindowWhenClickingOutside = () => {
		window.addEventListener('click', function (e) {
			if (
				notificationOpen &&
				//@ts-ignore
				![
					...document.getElementsByClassName(`notifications-clickable-region`)
				]?.find((element) =>
					//@ts-ignore
					element.contains(e.target)
				)
			) {
				notificationOpen = false;
			}
		});
	};

	// Events are followed as a whole, or for a repeating event as the one occurrence that is open.
	// Which one comes from the event itself, as a single occurrence has no subscription to list
	const getEventSubscription = async () => {
		const { res, json } = await fetchRequest(
			'GET',
			`schedule/event/list?ids=${id}`
		);
		if (!res.ok) return;

		const event = json.results.find((e: any) => e.id === id);
		const isThisOccurrence = () =>
			!!occurrenceStart &&
			new Date(event.subscribed_occurrence).getTime() ===
				new Date(occurrenceStart).getTime();

		let subscribedCategory: string | null = null;
		if (event?.subscribed) {
			if (!event.subscribed_occurrence) subscribedCategory = categories[0];
			else if (isThisOccurrence()) subscribedCategory = 'occurrence';
		}

		notifications = subscribedCategory
			? [
					{
						channel_category: subscribedCategory,
						channel_sender_id: id,
						channel_sender_type: type
					}
				]
			: [];
	};

	const eventSubscription = async (category: string, subscribed: boolean) => {
		const { res, json } = subscribed
			? await fetchRequest('POST', unsubscribeApi!, {
					event_ids: id.toString()
				})
			: await fetchRequest('POST', api, {
					event_ids: id.toString(),
					...(category === 'occurrence'
						? { occurrence_start: occurrenceStart }
						: {})
				});

		if (!res.ok) {
			const shown = [
				'Event is not active or has already ended.',
				'Occurrence has already ended.'
			];
			ErrorHandlerStore.set({
				message: subscribed
					? 'Failed to unsubscribe'
					: shown.includes(json.detail?.[0])
						? json.detail[0]
						: 'Failed to subscribe',
				success: false
			});
			return;
		}

		// Following the series or one occurrence replaces whatever was followed before
		notifications = subscribed
			? []
			: [
					{
						channel_category: category,
						channel_sender_id: id,
						channel_sender_type: type
					}
				];
		ErrorHandlerStore.set({
			message: subscribed ? 'Unsubscribed' : 'Subscribed',
			success: true
		});
	};

	const getNotifications = async () => {
		if (type === 'event') return getEventSubscription();

		const { res, json } = await fetchRequest(
			'GET',
			'notification/subscription'
		);
		if (!res.ok) return;

		const notificationsData = json.results.find(
			(notification: NotificationSubscriptionResponse) =>
				notification.origin_id === id
		);

		notifications = notificationsData
			? notificationsData.tags.map((tag: any) => ({
					channel_category: tag.name,
					channel_sender_id: id,
					channel_sender_type: type
				}))
			: [];
	};

	const notificationSubscription = async (
		category: string,
		method: 'add' | 'remove' = 'add'
	) => {
		method === 'add'
			? (notifications = [
					...notifications,
					{
						channel_category: category,
						channel_sender_id: id,
						channel_sender_type: type
					}
				])
			: (notifications = notifications.filter(
					(item) => item.channel_category !== category
				));

		const payload = {
			tags: notifications.map((notification) => notification.channel_category)
		};

		const { res } = await fetchRequest('POST', `${api}`, payload);
		if (!res.ok) {
			ErrorHandlerStore.set({
				message: method === 'add' ? 'Failed to subscribe' : 'Failed to unsubscribe',
				success: false
			});
			return;
		}

		if (method === 'add')
			ErrorHandlerStore.set({ message: 'Subscribed', success: true });
		else ErrorHandlerStore.set({ message: 'Unsubscribed', success: true });
	};

	const subscribeToAll = async () => {
		const { res, json } = await fetchRequest('POST', `${api}`, {
			tags: categories
		});

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Failed to subscribe to all',
				success: false
			});
			return;
		}

		ErrorHandlerStore.set({ message: 'Subscribed to all', success: true });

		notifications = categories.map((category) => ({
			channel_category: category,
			channel_sender_id: id,
			channel_sender_type: type
		}));
	};

	onMount(() => {
		closeWindowWhenClickingOutside();
		// getNotifications();
	});

	$effect(() => {
		if (notificationOpen) {
			getNotifications();
		}
	});
</script>

<div class={`${Class} notifications-clickable-region relative z-100 `}>
	<button
		type="button"
		id={`notification-bell-${type}`}
		class={``}
		onclick={() => {
			notificationOpen = !notificationOpen;
		}}
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
		<div
			class={`z-40 absolute mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white text-sm text-gray-900 shadow-xl dark:border-gray-700 dark:bg-darkobject dark:text-darkmodeText ${ClassOpen}`}
		>
			<div class="border-b border-gray-200 px-4 py-3 font-semibold dark:border-gray-700">{$_('Manage Subscriptions')}</div>
			{#if type !== 'event'}
				<button
					type="button"
					onclick={(e) => {
						e.preventDefault();
						subscribeToAll();
					}}
					class="w-full border-b border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:border-gray-700 dark:text-secondary dark:hover:bg-gray-700">{$_('Subscribe to All')}</button
				>{/if}
			{#each categories as category, i}
				{@const isSubscribed = notifications?.some(
					(notificationObject) => notificationObject.channel_category === category
				)}
				<button
					type="button"
					aria-pressed={isSubscribed}
					class="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:border-gray-700 dark:hover:bg-gray-700"
					class:bg-blue-50={isSubscribed}
					class:dark:bg-gray-700={isSubscribed}
					onclick={(e) => {
						e.preventDefault();
						if (type === 'event') eventSubscription(category, isSubscribed);
						else if (!isSubscribed) notificationSubscription(category, 'add');
						else notificationSubscription(category, 'remove');
					}}
				>
					<span>{$_(labels[i])}</span>
					<Fa
						class={isSubscribed ? 'text-primary dark:text-secondary' : 'text-gray-400 dark:text-gray-500'}
						swapOpacity
						icon={isSubscribed ? faBell : faBellSlash}
						size={'1x'}
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>
