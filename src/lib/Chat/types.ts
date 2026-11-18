// Mirrors flowback-backend/flowback/chat/serializers.py

export type ChannelKind = 'user' | 'user_group' | 'group' | 'workgroup';

export interface ChatUser {
	id: number;
	username: string;
	profile_image: string | null;
}

export interface Message {
	id: number;
	channel_id: number;
	user: ChatUser;
	message: string;
	// 'info' messages are written by the server, e.g. when someone joins
	type: 'message' | 'info';
	event: 'joined' | 'left' | 'renamed' | null;
	created_at: string;
	updated_at: string;
	parent_id: number | null;
	topic_id: number | null;
	attachments: { id: number; file: string; file_name: string }[] | null;
}

// A message as shown in the chat, including ones still being sent
export interface ChatMessage extends Message {
	client_id?: string;
	pending?: 'sending' | 'failed';
}

// A chat as the logged in user sees it
export interface Channel {
	id: number;
	kind: ChannelKind;
	// For direct messages, the other person's username
	title: string | null;
	status: 'active' | 'invited';
	member_count: number;
	other_user: ChatUser | null;
	invited_by: ChatUser | null;
	last_message: Message | null;
	last_activity: string;
	last_read_at: string | null;
	unread_count: number;
	can_leave: boolean;
	can_rename: boolean;
	can_invite: boolean;
}

export interface ChannelMember {
	user: ChatUser;
	status: 'active' | 'invited';
}

export interface Page<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

// Sent by the server over the websocket, see flowback-backend/flowback/chat/consumers.py
export type ChatEvent =
	| {
			type: 'message.created';
			channel_id: number;
			message: Message;
			client_id?: string;
	  }
	| { type: 'message.updated'; channel_id: number; message: Message }
	| { type: 'message.deleted'; channel_id: number; message_id: number }
	| { type: 'channel.added'; channel: Channel }
	| {
			type: 'channel.updated';
			channel_id: number;
			title: string | null;
			member_count: number;
	  }
	| { type: 'channel.removed'; channel_id: number }
	| { type: 'channel.read'; channel_id: number }
	| {
			type: 'error';
			method: string | null;
			detail: unknown;
			client_id?: string;
	  };
