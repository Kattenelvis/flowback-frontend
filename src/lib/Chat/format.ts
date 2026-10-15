import type { Channel, Message } from './types';

type Translate = (
	id: string,
	options?: { values?: Record<string, string> }
) => string;

// What an info message says, e.g. "User anna joined the channel"
export const infoText = (message: Message, t: Translate) => {
	const user = message.user.username;
	switch (message.event) {
		case 'joined':
			return t('channelJoin', { values: { user } });
		case 'left':
			return t('channelLeave', { values: { user } });
		default:
			// Renames carry the new title in the text
			return message.message;
	}
};

// The line under a chat's name in the chat list
export const previewText = (
	channel: Channel,
	userId: number | undefined,
	t: Translate
) => {
	const message = channel.last_message;
	if (!message) return '';
	if (message.type === 'info') return infoText(message, t);
	if (message.user.id === userId) return `${t('You')}: ${message.message}`;
	if (channel.kind !== 'user')
		return `${message.user.username}: ${message.message}`;
	return message.message;
};

export const channelTitle = (channel: Channel) =>
	channel.title || channel.other_user?.username || 'Name not found';
