// The one websocket the chat uses. It reconnects with backoff when the connection drops and tells
// the store whenever it opens, so the store can catch up on anything it missed.
import { env } from '$env/dynamic/public';
import type { ChatEvent } from './types';

const MAX_RETRY_DELAY = 30_000;

export interface ChatSocketHandlers {
	onEvent: (event: ChatEvent) => void;
	onOpen: () => void;
	onClose: () => void;
}

export class ChatSocket {
	private ws: WebSocket | null = null;
	private token: string | null = null;
	private retries = 0;
	private retryTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(private handlers: ChatSocketHandlers) {}

	get isOpen() {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	start(token: string) {
		if (this.token === token && this.ws) return;
		this.stop();
		this.token = token;
		this.connect();
	}

	stop() {
		this.token = null;
		this.retries = 0;
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;

		const ws = this.ws;
		this.ws = null;
		ws?.close();
	}

	// Returns false if the message couldn't be handed to the socket
	send(payload: object): boolean {
		if (!this.ws || !this.isOpen) return false;
		this.ws.send(JSON.stringify(payload));
		return true;
	}

	private connect() {
		if (!this.token) return;

		const ws = new WebSocket(
			`${env.PUBLIC_WEBSOCKET_API}/chat/ws?token=${this.token}`
		);
		this.ws = ws;

		ws.onopen = () => {
			if (ws !== this.ws) return;
			this.retries = 0;
			this.handlers.onOpen();
		};

		ws.onmessage = (message) => {
			if (ws !== this.ws) return;
			let event: ChatEvent;
			try {
				event = JSON.parse(message.data);
			} catch {
				return;
			}
			if (event && typeof event.type === 'string') this.handlers.onEvent(event);
		};

		ws.onclose = () => {
			// A socket we replaced or stopped on purpose
			if (ws !== this.ws) return;
			this.ws = null;
			this.handlers.onClose();
			this.scheduleReconnect();
		};
	}

	private scheduleReconnect() {
		if (!this.token) return;
		// Exponential backoff with jitter, so clients don't all reconnect at once after a server restart
		const delay =
			Math.min(MAX_RETRY_DELAY, 1000 * 2 ** this.retries) *
			(0.5 + Math.random() / 2);
		this.retries++;
		this.retryTimer = setTimeout(() => this.connect(), delay);
	}
}
