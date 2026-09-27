<script lang="ts">
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import {
		type Message,
		type Message1,
		type PreviewMessage
	} from './interfaces';
	import Button from '$lib/Generic/Button.svelte';
	import { fetchRequest } from '$lib/FetchRequest';
	import { userStore } from '$lib/User/interfaces';
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import Fa from 'svelte-fa';
	import {
		faComments,
		faSmile,
		faUsers
	} from '@fortawesome/free-solid-svg-icons';
	import { messageStore } from './Socket';
	import { onMount, onDestroy } from 'svelte';
	import Socket from './Socket';
	import { chatWindow as chatWindowLimit } from '../Generic/APILimits.json';
	import Modal from '$lib/Generic/Modal.svelte';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { chatPartnerStore, previewStore } from './functions';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import TextSend from '$lib/Generic/TextSend.svelte';

	export let selectedPage: 'direct' | 'group',
		isLookingAtOlderMessages: boolean,
		// Name shown for the open conversation, readable by the parent
		conversationTitle = '';

	let message: string = '',
		olderMessages: string,
		newerMessages: string,
		showEmoji = false,
		messages: Message[] = [],
		socket: WebSocket | null = null,
		chatWindow: any,
		errorState = false,
		participants: any[] = [],
		participantsModalOpen = false,
		preview: PreviewMessage | undefined,
		title = '';

	// Fetch recent messages for the selected chat
	const getRecentMessages = async () => {
		if (!$chatPartnerStore) return;
		const { res, json } = await fetchRequest(
			'GET',
			`chat/message/channel/${$chatPartnerStore}/list?order_by=created_at_desc&limit=${chatWindowLimit}`
		);
		if (!res.ok) {
			messages = [];
			$chatPartnerStore = null;
			errorState = true;
			return;
		}
		messages = json?.results.reverse();
		olderMessages = json.next;
		newerMessages = '';
	};

	const postMessage = async () => {
		if (!$chatPartnerStore || message.length === 0 || message.match(/^\s+$/))
			return;

		if (newerMessages) await getRecentMessages();

		let previewMessage = $previewStore?.find(
			(p) =>
				p.id === $chatPartnerStore ||
				p.recent_message?.group_id === $chatPartnerStore
		);

		if (!previewMessage)
			previewMessage = {
				id: Date.now(),
				timestamp: new Date().toString(),
				participants: [],
				recent_message: {
					message,
					created_at: new Date().toString(),
					notified: false,
					profile_image: $userStore?.profile_image || '',
					user_id: $userStore?.id || -1,
					user: {
						id: $userStore?.id || -1,
						username: $userStore?.username || '',
						profile_image: $userStore?.profile_image || '',
						banner_image: ''
					},
					channel_id: $chatPartnerStore,
					...(selectedPage === 'direct'
						? { target_id: $chatPartnerStore }
						: { group_id: $chatPartnerStore })
				}
			};

		if (!socket) return;

		const didSend = await Socket.sendMessage(
			socket,
			$chatPartnerStore,
			message,
			1
		);

		if (!didSend) {
			ErrorHandlerStore.set({
				message: 'Could not send message',
				success: false
			});
			return;
		}

		messages.push({
			id: Date.now(),
			message,
			user: {
				username: $userStore?.username || '',
				id: $userStore?.id || -1,
				profile_image: $userStore?.profile_image || ''
			},
			created_at: new Date().toString(),
			active: true,
			channel_id: $chatPartnerStore,
			channel_origin_name: 'group',
			type: 'message',
			updated_at: new Date().toString(),
			attachments: [],
			channel_title: '',
			parent: 0,
			topic_id: 0
		});

		messages = messages;

		message = '';
	};

	// Fetch older messages
	const showOlderMessages = async () => {
		if (!olderMessages) return;
		const { res, json } = await fetchRequest('GET', olderMessages);
		if (!res.ok) return;
		newerMessages = json.previous;
		olderMessages = json.next;
		messages = json?.results.reverse();
	};

	// Fetch newer messages
	const showNewerMessages = async () => {
		if (!newerMessages) return;
		const { res, json } = await fetchRequest('GET', newerMessages);
		olderMessages = json.next;
		newerMessages = json.previous;
		messages = json?.results.reverse();
	};

	// Handle incoming messages and set notifications
	const handleReceiveMessage = (
		preview: PreviewMessage[],
		message: Message1
	) => {
		if (message.channel_id === $chatPartnerStore) {
			if (messages.some((m) => m.id === message.id)) return;

			messages.push({
				id: message.id,
				message: message.message,
				user: {
					id: message.user?.id,
					username: message.user?.username,
					profile_image: message.user?.profile_image
				},
				created_at: new Date().toString(),
				active: true,
				channel_id: message.channel_id,
				channel_origin_name: message.channel_origin_name,
				type: message.type,
				updated_at: message.updated_at?.toString() ?? '',
				attachments: [],
				channel_title: '',
				parent: message.parent,
				topic_id: message.topic_id
			});
			messages = messages;
		} else preview = [...preview];

		const _preview = $previewStore?.find(
			(p) => p.channel_id === $chatPartnerStore
		);
		if (_preview && _preview.recent_message) {
			_preview.recent_message.message = message.message;
		}
	};

	// Subscribe to incoming messages
	const receiveMessage = () => {
		const unsubscribe = messageStore.subscribe((message: Message1 | null) => {
			if (!message || message.user?.id === $userStore?.id) return;
			handleReceiveMessage($previewStore ?? [], message);
		});
		return unsubscribe;
	};

	// Fetch channel participants
	const getChannelParticipants = async () => {
		if (!$chatPartnerStore) return;
		const { res, json } = await fetchRequest(
			'GET',
			`chat/message/channel/${$chatPartnerStore}/participant/list`
		);
		if (!res.ok) {
			console.error('Failed to fetch channel participants:', json);
			return;
		}
		participants = json?.results;
	};

	const conectToSocket = () => {
		let retries = 0;
		let interval: NodeJS.Timeout;
		// Attempt reconnecting websocket when server is shut down
		// Inspired by the user2909737's reply https://stackoverflow.com/questions/3780511/reconnection-of-client-when-server-reboots-in-websocket
		if (!socket) return;
		socket.onclose = () => {
			if (!interval)
				interval = setInterval(() => {
					console.warn('Attempting to reconnect');
					if (socket?.readyState === socket?.OPEN || retries === 50) {
						clearInterval(interval);
						return;
					}
					socket = Socket.createSocket($userStore?.id ?? 0) ?? null;
					retries++;
					// TODO: Add randomness to the interval to prevent many people reconnecting at once if backend issue?
				}, 4000);
		};
	};

	const changeName = async () => {
		if (!preview) return;
		const { res, json } = await fetchRequest(
			'POST',
			'chat/message/channel/userdata/update',
			{
				channel_id: preview.channel_id,
				title
			}
		);

		if (!res.ok)
			ErrorHandlerStore.set({
				message: 'Could not change title',
				success: false
			});

		preview.channel_title = title;

		$previewStore = [
			preview,
			...$previewStore.filter((p) => p.channel_id !== preview?.channel_id)
		];
	};

	// Fill the rename form whenever another chat is opened
	const resetTitle = (_partner: number | null) => {
		title = preview?.channel_title ?? '';
	};

	$: preview = $previewStore?.find((p) => p.channel_id === $chatPartnerStore);
	$: resetTitle($chatPartnerStore);

	// Direct messages opened from outside the chat list have no preview yet, so
	// fall back to the names of the other participants.
	$: conversationTitle =
		preview?.channel_title ||
		participants
			.filter((p) => p.user?.id !== $userStore?.id)
			.map((p) => p.user?.username)
			.filter(Boolean)
			.join(', ');

	let unsubscribeMessageStore: () => void;

	onMount(() => {
		unsubscribeMessageStore = receiveMessage();
		conectToSocket();
	});

	onDestroy(() => {
		if (unsubscribeMessageStore) unsubscribeMessageStore();
	});

	// Reactive updates
	$: (selectedPage || $chatPartnerStore) && getRecentMessages();
	$: (selectedPage || $chatPartnerStore) && getChannelParticipants();
	$: isLookingAtOlderMessages = !!newerMessages;
	// @ts-ignore
	$: if ($userStore) socket = Socket.createSocket($userStore?.id);
	$: messages &&
		browser &&
		setTimeout(() => {
			if (newerMessages) return;
			const d = document.querySelector('#chat-window');
			d?.scroll(0, 100000);
		}, 100);
</script>

{#if $chatPartnerStore}
	<div class="flex flex-col flex-1 min-h-0">
		<div
			class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
		>
			<div class="min-w-0 flex-1">
				<h3 class="font-semibold truncate">
					{conversationTitle || $_('Conversation')}
				</h3>
				{#if participants.length > 0}
					<p class="text-xs text-gray-400">
						{participants.length}
						{$_('participants')}
					</p>
				{/if}
			</div>
			<button
				type="button"
				class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-gray-100 active:bg-gray-200 dark:text-secondary dark:hover:bg-gray-700"
				title={$_('Participants')}
				aria-label={$_('Participants')}
				on:click={() => (participantsModalOpen = true)}
			>
				<Fa icon={faUsers} class="text-lg" />
			</button>
		</div>
		<ul
			class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-3 break-word"
			id="chat-window"
			bind:this={chatWindow}
		>
			{#if messages.length === 0 && $chatPartnerStore}
				<li class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
					{$_('Chat is currently empty, maybe say hello?')}
				</li>
			{/if}
			{#if olderMessages}
				<li class="text-center mt-6 mb-6">
					<Button onClick={showOlderMessages}
						>{$_('Show older messages')}</Button
					>
				</li>
			{/if}
			{#each messages as message (message.id)}
				{#if message.type === 'info'}
					{@const user = message.user.username}

					<li class="px-4 py-2 max-w-[100%] text-center">
						{$_({ id: 'channelJoin', values: { user } })}
					</li>
				{:else}
					{@const sentByUser = message.user?.id === $userStore?.id}
					<li class="px-4 py-2 max-w-[80%]" class:ml-auto={sentByUser}>
						<span>{message.user?.username}</span>
						<p
							class="p-2 rounded-xl break-words"
							class:bg-primary={sentByUser}
							class:text-white={sentByUser}
							class:bg-gray-300={!sentByUser}
							class:dark:bg-gray-600={sentByUser}
							class:dark:bg-gray-500={!sentByUser}
						>
							{message.message}
						</p>
						<span class="text-[14px] text-gray-400 ml-3">
							<!-- {formatDate(message?.created_at || new Date())} -->
						</span>
					</li>
				{/if}
			{/each}
			{#if newerMessages}
				<li class="text-center mt-6 mb-6">
					<Button onClick={showNewerMessages} buttonStyle="secondary">
						{$_('Show earlier messages')}
					</Button>
				</li>
			{/if}
		</ul>
		<div class="border-t border-gray-200 dark:border-gray-700 w-full p-2">
			<TextSend
				bind:value={message}
				autofocus
				sendOnEnter
				max={3000}
				maxHeight={120}
				placeholder="Write a message..."
				onSend={postMessage}
			/>
		</div>
	</div>
{:else}
	<div
		class="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-500 dark:text-gray-400"
	>
		<Fa icon={faComments} class="text-4xl text-gray-300 dark:text-gray-600" />
		<p class="font-medium text-gray-700 dark:text-darkmodeText">
			{$_('No chat selected')}
		</p>
		<p class="text-sm">{$_('Pick a conversation or start a new one.')}</p>
	</div>
{/if}

<Modal bind:open={participantsModalOpen} Class="max-w-[200px]">
	<div slot="header">{$_('Participants')}</div>
	<div slot="body">
		{#if participants.length > 0}
			<ul>
				{#each participants as participant (participant.id)}
					<ProfilePicture
						displayName
						username={participant.user?.username}
						profilePicture={participant.user?.profile_image}
					/>
				{/each}
			</ul>
		{:else}
			<p>{$_('No participants found.')}</p>
		{/if}
		{#if preview?.channel_origin_name === 'user_group'}
			<form on:submit|preventDefault={changeName}>
				<TextInput
					autofocus
					required
					bind:value={title}
					label="Chatgroup Name"
				/>
				<Button type="submit">Submit</Button>
			</form>
		{/if}
	</div>
</Modal>
