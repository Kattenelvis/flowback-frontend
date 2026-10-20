// REST calls for the chat, see flowback-backend/flowback/chat/urls.py
import { fetchRequest } from '$lib/FetchRequest';
import type { Channel, ChannelMember, Message, Page } from './types';

export class ChatApiError extends Error {
	constructor(message: string, readonly status: number) {
		super(message);
	}
}

// The backend wraps errors as { detail: [message] } or { detail: message }
const errorMessage = (json: any, fallback: string): string => {
	const detail = json?.detail;
	if (typeof detail === 'string') return detail;
	if (Array.isArray(detail) && typeof detail[0] === 'string') return detail[0];
	return fallback;
};

const request = async <T>(
	method: 'GET' | 'POST',
	path: string,
	data: object | null = null,
	fallbackError = 'Something went wrong'
): Promise<T> => {
	const body = method === 'POST' ? data ?? {} : null;
	const { res, json } = await fetchRequest(method, path, body);
	if (!res.ok)
		throw new ChatApiError(
			errorMessage(json, fallbackError),
			'status' in res ? res.status : 0
		);
	return json as T;
};

const query = (params: Record<string, string | number | undefined>) => {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params))
		if (value !== undefined && value !== '') search.set(key, String(value));
	return search.toString();
};

export const chatApi = {
	listChannels: (params: { search?: string; limit?: number } = {}) =>
		request<Page<Channel>>('GET', `chat/channel/list?${query(params)}`),

	// Follows a `next` link from listChannels
	listChannelsPage: (url: string) => request<Page<Channel>>('GET', url),

	getChannel: (channelId: number) =>
		request<Channel>('GET', `chat/channel/${channelId}`),

	openDirect: (userId: number) =>
		request<Channel>(
			'POST',
			'chat/channel/direct',
			{ user_id: userId },
			'Could not start the conversation'
		),

	createGroupChat: (title: string, userIds: number[]) =>
		request<Channel>(
			'POST',
			'chat/channel/create',
			{ title, user_ids: userIds },
			'Failed to create group chat'
		),

	invite: (channelId: number, userIds: number[]) =>
		request<void>('POST', `chat/channel/${channelId}/invite`, {
			user_ids: userIds
		}),

	accept: (channelId: number) =>
		request<Channel>('POST', `chat/channel/${channelId}/accept`),

	decline: (channelId: number) =>
		request<void>('POST', `chat/channel/${channelId}/decline`),

	leave: (channelId: number) =>
		request<void>(
			'POST',
			`chat/channel/${channelId}/leave`,
			null,
			'Could not leave the chat'
		),

	rename: (channelId: number, title: string) =>
		request<Channel>(
			'POST',
			`chat/channel/${channelId}/update`,
			{ title },
			'Could not change title'
		),

	markRead: (channelId: number) =>
		request<void>('POST', `chat/channel/${channelId}/read`),

	listMembers: (channelId: number) =>
		request<Page<ChannelMember>>(
			'GET',
			`chat/channel/${channelId}/member/list?limit=1000`
		),

	// Newest first
	listMessages: (channelId: number, beforeId?: number, limit = 50) =>
		request<Page<Message>>(
			'GET',
			`chat/channel/${channelId}/message/list?${query({
				before_id: beforeId,
				limit
			})}`
		)
};
