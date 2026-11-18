// All chat state lives here. REST responses and websocket events both go through the update
// functions below, so the chat list, open conversation and unread markers always agree.
// Components read the derived stores and call the exported actions; they never fetch on their own.
import { derived, get, writable } from 'svelte/store';
import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
import { userStore } from '$lib/User/interfaces';
import { chatApi, ChatApiError } from './api';
import { ChatSocket } from './socket';
import type { Channel, ChatEvent, ChatMessage, Message } from './types';

const SEND_TIMEOUT = 10_000;

interface MessageList {
	// Sent messages ordered by id, then messages still being sent
	items: ChatMessage[];
	hasOlder: boolean;
	// Whether the newest messages have been fetched since the websocket (re)connected
	loaded: boolean;
}

interface ChatState {
	// Every chat and chat invite we know of
	channels: Record<number, Channel>;
	// Link to the next page of the chat list, null once everything is loaded
	channelsNext: string | null;
	channelsLoaded: boolean;
	// Messages of the chats that have been opened
	messages: Record<number, MessageList>;
	selectedId: number | null;
	connected: boolean;
}

const initialState = (): ChatState => ({
	channels: {},
	channelsNext: null,
	channelsLoaded: false,
	messages: {},
	selectedId: null,
	connected: false
});

const state = writable<ChatState>(initialState());

const update = (change: (s: ChatState) => Partial<ChatState>) =>
	state.update((s) => ({ ...s, ...change(s) }));

// Read-only views for components

export const chatState = { subscribe: state.subscribe };

// Whether the chat panel is shown
export const chatOpenStore = writable(false);

const byActivity = (a: Channel, b: Channel) =>
	b.last_activity.localeCompare(a.last_activity) || b.id - a.id;

export const channelList = derived(state, (s) =>
	Object.values(s.channels)
		.filter((c) => c.status === 'active')
		.sort(byActivity)
);

export const invites = derived(state, (s) =>
	Object.values(s.channels)
		.filter((c) => c.status === 'invited')
		.sort(byActivity)
);

export const selectedChannel = derived(state, (s) =>
	s.selectedId ? s.channels[s.selectedId] ?? null : null
);

export const selectedMessages = derived(state, (s) =>
	s.selectedId ? s.messages[s.selectedId] ?? null : null
);

export const hasUnread = derived(state, (s) =>
	Object.values(s.channels).some(
		(c) => c.status === 'invited' || c.unread_count > 0
	)
);

// State changes

const putChannels = (s: ChatState, channels: Channel[]) => ({
	channels: {
		...s.channels,
		...Object.fromEntries(channels.map((c) => [c.id, c]))
	}
});

const patchChannel = (s: ChatState, id: number, patch: Partial<Channel>) =>
	s.channels[id]
		? { channels: { ...s.channels, [id]: { ...s.channels[id], ...patch } } }
		: {};

const dropChannel = (s: ChatState, id: number) => {
	const { [id]: _channel, ...channels } = s.channels;
	const { [id]: _messages, ...messages } = s.messages;
	return {
		channels,
		messages,
		selectedId: s.selectedId === id ? null : s.selectedId
	};
};

const putMessages = (
	s: ChatState,
	channelId: number,
	change: (list: MessageList) => MessageList
) =>
	s.messages[channelId]
		? {
				messages: {
					...s.messages,
					[channelId]: change(s.messages[channelId])
				}
		  }
		: {};

// Adds drafts and sent messages. A sent message carrying a client_id replaces the
// draft it was sent from; client_ids are only kept on drafts.
const mergeMessages = (
	items: ChatMessage[],
	incoming: ChatMessage[]
): ChatMessage[] => {
	let drafts = items.filter((m) => m.pending);
	const sent = new Map(items.filter((m) => !m.pending).map((m) => [m.id, m]));

	for (const message of incoming) {
		if (message.pending) {
			drafts = [
				...drafts.filter((d) => d.client_id !== message.client_id),
				message
			];
			continue;
		}

		const { client_id, ...confirmed } = message;
		if (client_id) drafts = drafts.filter((d) => d.client_id !== client_id);
		sent.set(confirmed.id, confirmed);
	}

	return [...[...sent.values()].sort((a, b) => a.id - b.id), ...drafts];
};

const toast = (message: string) =>
	ErrorHandlerStore.set({ message, success: false });

// Bumped on logout, so answers to requests made before then are ignored
let session = 0;
const stillCurrent = () => {
	const started = session;
	return () => started === session;
};

// Whether the server said the user isn't in the chat, as opposed to e.g. a network error
const notAMember = (error: unknown) =>
	error instanceof ChatApiError && [400, 403, 404].includes(error.status);

const errorText = (error: unknown, fallback: string) =>
	error instanceof ChatApiError ? error.message : fallback;

// Loading

export const loadChannels = async () => {
	const current = stillCurrent();
	const page = await chatApi.listChannels({ limit: 30 });
	if (!current()) return;
	update((s) => ({
		...putChannels(s, page.results),
		channelsNext: page.next,
		channelsLoaded: true
	}));
};

let loadingMoreChannels = false;

export const loadMoreChannels = async () => {
	const next = get(state).channelsNext;
	if (!next || loadingMoreChannels) return;

	const current = stillCurrent();
	loadingMoreChannels = true;
	try {
		const page = await chatApi.listChannelsPage(next);
		if (current())
			update((s) => ({
				...putChannels(s, page.results),
				channelsNext: page.next
			}));
	} catch {
		// Tried again on the next scroll
	} finally {
		loadingMoreChannels = false;
	}
};

// Finds chats by title, or by username for direct messages
export const searchChannels = async (search: string): Promise<Channel[]> => {
	const current = stillCurrent();
	const page = await chatApi.listChannels({ search, limit: 30 });
	if (!current()) return [];
	update((s) => putChannels(s, page.results));
	return page.results;
};

// Fetches one chat again, dropping it if the user is no longer in it
const refreshChannel = async (channelId: number) => {
	const current = stillCurrent();
	try {
		const channel = await chatApi.getChannel(channelId);
		if (!current()) return null;
		update((s) => putChannels(s, [channel]));
		return channel;
	} catch (error) {
		if (current() && notAMember(error))
			update((s) => dropChannel(s, channelId));
		return null;
	}
};

// Fetches the newest messages, adding them to any already shown
const loadMessages = async (channelId: number) => {
	const current = stillCurrent();
	const page = await chatApi.listMessages(channelId);
	const newest = page.results.reverse();
	if (!current()) return;

	update((s) => {
		const cached = s.messages[channelId];
		const cachedSent = cached?.items.filter((m) => !m.pending) ?? [];
		const lastCached = cachedSent[cachedSent.length - 1];

		// More messages arrived while we were away than one page holds, so what we had
		// can't be joined up with them; start over from the newest page
		const gap =
			!!lastCached && page.next !== null && newest[0]?.id > lastCached.id;
		const keep = gap
			? cached.items.filter((m) => m.pending)
			: cached?.items ?? [];

		return {
			messages: {
				...s.messages,
				[channelId]: {
					items: mergeMessages(keep, newest),
					hasOlder: lastCached && !gap ? cached.hasOlder : page.next !== null,
					loaded: true
				}
			}
		};
	});
};

export const loadOlderMessages = async (channelId: number) => {
	const list = get(state).messages[channelId];
	const oldest = list?.items.find((m) => !m.pending);
	if (!list?.hasOlder || !oldest) return;

	const current = stillCurrent();
	const page = await chatApi.listMessages(channelId, oldest.id);
	if (!current()) return;
	update((s) =>
		putMessages(s, channelId, (list) => ({
			...list,
			items: mergeMessages(list.items, page.results.reverse()),
			hasOlder: page.next !== null
		}))
	);
};

// Opening chats

export const selectChannel = async (channelId: number | null) => {
	update(() => ({ selectedId: channelId }));
	if (!channelId) return;

	const channel =
		get(state).channels[channelId] ?? (await refreshChannel(channelId));
	if (!channel) {
		toast('Could not open the chat');
		return;
	}

	if (channel.status !== 'active') return;

	// An empty list straight away, so messages sent or received while the first
	// page loads aren't lost
	update((s) =>
		s.messages[channelId]
			? {}
			: {
					messages: {
						...s.messages,
						[channelId]: { items: [], hasOlder: false, loaded: false }
					}
			  }
	);

	if (!get(state).messages[channelId]?.loaded) {
		try {
			await loadMessages(channelId);
		} catch {
			// Drops the chat if the user has left it, e.g. in another tab
			await refreshChannel(channelId);
			return;
		}
	}
	if (isViewing(channelId)) markRead(channelId);
};

// Opens the chat panel, optionally on a specific chat
export const openChat = (channelId?: number) => {
	chatOpenStore.set(true);
	if (channelId) selectChannel(channelId);
};

export const closeChat = () => chatOpenStore.set(false);

// Opens the direct message with a user, creating it if needed
export const openDirectChat = async (userId: number) => {
	try {
		const channel = await chatApi.openDirect(userId);
		update((s) => putChannels(s, [channel]));
		openChat(channel.id);
	} catch (error) {
		toast(errorText(error, 'Could not start the conversation'));
	}
};

// Reading

const readTimers = new Map<number, ReturnType<typeof setTimeout>>();

const markRead = (channelId: number) => {
	update((s) => patchChannel(s, channelId, { unread_count: 0 }));

	// Several messages arriving at once only need one request
	clearTimeout(readTimers.get(channelId));
	readTimers.set(
		channelId,
		setTimeout(() => {
			readTimers.delete(channelId);
			chatApi.markRead(channelId).catch(() => {});
		}, 500)
	);
};

const isViewing = (channelId: number) =>
	get(chatOpenStore) && get(state).selectedId === channelId;

// Reopening the panel reads the chat that was left open
chatOpenStore.subscribe((open) => {
	const { selectedId, channels } = get(state);
	if (open && selectedId && channels[selectedId]?.unread_count)
		markRead(selectedId);
});

// Sending

const sendTimers = new Map<string, ReturnType<typeof setTimeout>>();

const makeClientId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`${Date.now()}-${Math.random().toString(36).slice(2)}`;

const setDraftStatus = (
	channelId: number,
	clientId: string,
	pending: ChatMessage['pending']
) =>
	update((s) =>
		putMessages(s, channelId, (list) => ({
			...list,
			items: list.items.map((m) =>
				m.client_id === clientId && m.pending ? { ...m, pending } : m
			)
		}))
	);

const deliver = (draft: ChatMessage) => {
	const clientId = draft.client_id as string;
	const sent = socket.send({
		method: 'message_create',
		channel_id: draft.channel_id,
		message: draft.message,
		client_id: clientId
	});

	if (!sent) {
		setDraftStatus(draft.channel_id, clientId, 'failed');
		return;
	}

	clearTimeout(sendTimers.get(clientId));
	sendTimers.set(
		clientId,
		setTimeout(() => {
			sendTimers.delete(clientId);
			setDraftStatus(draft.channel_id, clientId, 'failed');
		}, SEND_TIMEOUT)
	);
};

export const sendMessage = (channelId: number, text: string) => {
	const user = get(userStore);
	if (!user || !text.trim()) return;

	const now = new Date().toISOString();
	const draft: ChatMessage = {
		id: -Date.now(),
		channel_id: channelId,
		user: {
			id: user.id,
			username: user.username,
			profile_image: user.profile_image ?? null
		},
		message: text,
		type: 'message',
		event: null,
		created_at: now,
		updated_at: now,
		parent_id: null,
		topic_id: null,
		attachments: null,
		client_id: makeClientId(),
		pending: 'sending'
	};

	update((s) =>
		putMessages(s, channelId, (list) => ({
			...list,
			items: mergeMessages(list.items, [draft])
		}))
	);
	deliver(draft);
};

export const retryMessage = (channelId: number, clientId: string) => {
	const draft = get(state).messages[channelId]?.items.find(
		(m) => m.client_id === clientId && m.pending
	);
	if (!draft) return;

	setDraftStatus(channelId, clientId, 'sending');
	deliver(draft);
};

export const discardMessage = (channelId: number, clientId: string) =>
	update((s) =>
		putMessages(s, channelId, (list) => ({
			...list,
			items: list.items.filter((m) => !(m.client_id === clientId && m.pending))
		}))
	);

// Editing and deleting your own messages. Both show straight away; the server's
// message.updated / message.deleted events confirm them, and an error reloads the chat.

export const editMessage = (
	channelId: number,
	messageId: number,
	text: string
): boolean => {
	if (
		!socket.send({
			method: 'message_update',
			message_id: messageId,
			message: text
		})
	) {
		toast('Could not edit message');
		return false;
	}

	update((s) =>
		putMessages(s, channelId, (list) => ({
			...list,
			items: list.items.map((m) =>
				m.id === messageId && !m.pending
					? { ...m, message: text, updated_at: new Date().toISOString() }
					: m
			)
		}))
	);
	return true;
};

export const deleteMessage = (
	channelId: number,
	messageId: number
): boolean => {
	if (!socket.send({ method: 'message_delete', message_id: messageId })) {
		toast('Could not delete message');
		return false;
	}

	update((s) =>
		putMessages(s, channelId, (list) => ({
			...list,
			items: list.items.filter((m) => m.pending || m.id !== messageId)
		}))
	);
	return true;
};

// Membership

export const createGroupChat = async (title: string, userIds: number[]) => {
	const channel = await chatApi.createGroupChat(title, userIds);
	update((s) => putChannels(s, [channel]));
	await selectChannel(channel.id);
	return channel;
};

// Accepting opens the chat
export const acceptInvite = async (channelId: number) => {
	try {
		const channel = await chatApi.accept(channelId);
		update((s) => putChannels(s, [channel]));
		await selectChannel(channelId);
	} catch (error) {
		toast(errorText(error, 'Could not accept the invite'));
		refreshChannel(channelId);
	}
};

export const declineInvite = async (channelId: number) => {
	try {
		await chatApi.decline(channelId);
		update((s) => dropChannel(s, channelId));
	} catch (error) {
		toast(errorText(error, 'Could not decline the invite'));
		refreshChannel(channelId);
	}
};

export const leaveChannel = async (channelId: number) => {
	try {
		await chatApi.leave(channelId);
		update((s) => dropChannel(s, channelId));
	} catch (error) {
		toast(errorText(error, 'Could not leave the chat'));
	}
};

export const renameChannel = async (channelId: number, title: string) => {
	try {
		const channel = await chatApi.rename(channelId, title);
		update((s) => putChannels(s, [channel]));
		return true;
	} catch (error) {
		toast(errorText(error, 'Could not change title'));
		return false;
	}
};

export const inviteToChannel = async (channelId: number, userIds: number[]) => {
	try {
		await chatApi.invite(channelId, userIds);
		return true;
	} catch (error) {
		toast(errorText(error, 'Could not invite to the chat'));
		return false;
	}
};

// Websocket events

// One request per unknown chat, however many of its messages arrive meanwhile
const fetching = new Set<number>();
const fetchUnknownChannel = async (channelId: number) => {
	if (fetching.has(channelId)) return;
	fetching.add(channelId);
	await refreshChannel(channelId);
	fetching.delete(channelId);
};

const onMessageCreated = (message: Message, clientId?: string) => {
	const channelId = message.channel_id;
	const channel = get(state).channels[channelId];

	// A chat we haven't loaded, e.g. one far down the list
	if (!channel) {
		fetchUnknownChannel(channelId);
		return;
	}

	const fromOthers = message.user.id !== get(userStore)?.id;
	const viewing = isViewing(channelId);
	const unread =
		message.type === 'message' && fromOthers && !viewing
			? channel.unread_count + 1
			: channel.unread_count;

	if (clientId) {
		clearTimeout(sendTimers.get(clientId));
		sendTimers.delete(clientId);
	}

	update((s) => ({
		...patchChannel(s, channelId, {
			// Info messages like "User X joined" bump the chat but don't replace its preview
			...(message.type === 'message' ? { last_message: message } : {}),
			last_activity: message.created_at,
			unread_count: unread
		}),
		...putMessages(s, channelId, (list) => ({
			...list,
			items: mergeMessages(list.items, [{ ...message, client_id: clientId }])
		}))
	}));

	if (viewing && fromOthers) markRead(channelId);
};

const onMessageUpdated = (message: Message) =>
	update((s) => ({
		...(s.channels[message.channel_id]?.last_message?.id === message.id
			? patchChannel(s, message.channel_id, { last_message: message })
			: {}),
		...putMessages(s, message.channel_id, (list) => ({
			...list,
			items: list.items.map((m) =>
				m.id === message.id && !m.pending ? message : m
			)
		}))
	}));

const onMessageDeleted = (channelId: number, messageId: number) => {
	update((s) =>
		putMessages(s, channelId, (list) => ({
			...list,
			items: list.items.filter((m) => m.id !== messageId)
		}))
	);

	if (get(state).channels[channelId]?.last_message?.id === messageId)
		refreshChannel(channelId);
};

const onError = (event: Extract<ChatEvent, { type: 'error' }>) => {
	// An edit or deletion was refused, so undo what we showed by reloading the chat
	if (event.method === 'message_update' || event.method === 'message_delete') {
		toast(
			event.method === 'message_update'
				? 'Could not edit message'
				: 'Could not delete message'
		);
		const { selectedId } = get(state);
		if (selectedId) loadMessages(selectedId).catch(() => {});
		return;
	}

	if (!event.client_id) {
		toast('Something went wrong in the chat');
		return;
	}

	clearTimeout(sendTimers.get(event.client_id));
	sendTimers.delete(event.client_id);
	for (const [channelId, list] of Object.entries(get(state).messages))
		if (list.items.some((m) => m.client_id === event.client_id))
			setDraftStatus(Number(channelId), event.client_id, 'failed');

	toast('Could not send message');
};

const applyEvent = (event: ChatEvent) => {
	switch (event.type) {
		case 'message.created':
			return onMessageCreated(event.message, event.client_id);
		case 'message.updated':
			return onMessageUpdated(event.message);
		case 'message.deleted':
			return onMessageDeleted(event.channel_id, event.message_id);
		case 'channel.added':
			return update((s) => putChannels(s, [event.channel]));
		case 'channel.updated':
			return update((s) =>
				patchChannel(s, event.channel_id, {
					// A direct message is titled after the other person, which the server doesn't send here
					...(s.channels[event.channel_id]?.kind === 'user'
						? {}
						: { title: event.title }),
					member_count: event.member_count
				})
			);
		case 'channel.removed':
			return update((s) => dropChannel(s, event.channel_id));
		case 'channel.read':
			return update((s) =>
				patchChannel(s, event.channel_id, { unread_count: 0 })
			);
		case 'error':
			return onError(event);
	}
};

// Whenever the websocket (re)connects, catch up on whatever happened while it wasn't. The chat
// list is replaced in one go, and messages are fetched again when their chat is next opened.
const resync = async () => {
	const current = stillCurrent();
	const page = await chatApi.listChannels({ limit: 30 }).catch(() => null);
	if (!page || !current()) return;

	update((s) => ({
		channels: {
			// Keep the open chat on screen until it's checked below
			...(s.selectedId && s.channels[s.selectedId]
				? { [s.selectedId]: s.channels[s.selectedId] }
				: {}),
			...Object.fromEntries(page.results.map((c) => [c.id, c]))
		},
		channelsNext: page.next,
		channelsLoaded: true,
		messages: Object.fromEntries(
			Object.entries(s.messages).map(([id, list]) => [
				id,
				{ ...list, loaded: false }
			])
		)
	}));

	// Reload the open chat, unless the user has moved on to another one meanwhile
	const { selectedId } = get(state);
	if (!selectedId) return;
	const channel = await refreshChannel(selectedId);
	if (channel?.status !== 'active' || get(state).selectedId !== selectedId)
		return;

	await loadMessages(selectedId).catch(() => {});
	if (isViewing(selectedId)) markRead(selectedId);
};

const failDrafts = () =>
	update((s) => ({
		messages: Object.fromEntries(
			Object.entries(s.messages).map(([id, list]) => [
				id,
				{
					...list,
					items: list.items.map((m) =>
						m.pending === 'sending' ? { ...m, pending: 'failed' as const } : m
					)
				}
			])
		)
	}));

const socket = new ChatSocket({
	onEvent: applyEvent,
	onOpen: () => {
		update(() => ({ connected: true }));
		resync();
	},
	onClose: () => {
		update(() => ({ connected: false }));
		failDrafts();
	}
});

// Connects the chat for the logged in user
export const startChat = async () => {
	const token = localStorage.getItem('token');
	if (!token) return;

	socket.start(token);
	// Also loaded whenever the websocket connects, in case this fails
	await loadChannels().catch(() => {});
};

// Disconnects and forgets everything, e.g. on logout
export const stopChat = () => {
	session++;
	socket.stop();
	for (const timer of [...sendTimers.values(), ...readTimers.values()])
		clearTimeout(timer);
	sendTimers.clear();
	readTimers.clear();
	state.set(initialState());
	chatOpenStore.set(false);
};
