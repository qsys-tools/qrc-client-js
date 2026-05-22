import type {WebSocket as WsWebSocket} from 'ws';
import type {JsonRpcMessage} from '../json-rpc.ts';
import {AbstractChannel} from './abstract-channel.ts';

export type IWebSocketEventMap = {
	[key in keyof WebSocketEventMap]: WebSocketEventMap[key] | WsWebSocket.WebSocketEventMap[key];
};

export type IWebSocket = WebSocket | WsWebSocket;
export type IOpenEvent = IWebSocketEventMap['open'];
export type IMessageEvent = IWebSocketEventMap['message'];
export type ICloseEvent = IWebSocketEventMap['close'];
export type IErrorEvent = IWebSocketEventMap['error'];

export class WebsocketChannel extends AbstractChannel {
	protected readonly socket: IWebSocket;

	constructor(socket: IWebSocket) {
		super();

		this.socket = socket;
		this.socket.addEventListener('open', this.onSocketOpen);
		this.socket.addEventListener('message', this.onSocketMessage);
		this.socket.addEventListener('close', this.onSocketClose);
		this.socket.addEventListener('error', this.onSocketError);
	}

	connect(): void {
		if (this.socket.readyState === this.socket.OPEN) {
			this.emit('connect');
		}
	}

	send(message: JsonRpcMessage): void {
		this.socket.send(JSON.stringify(message));
	}

	end() {
		this.socket.close();
	}

	protected onSocketOpen = (event: IOpenEvent): void => {
		this.emit('connect', event);
	};

	protected onSocketClose = (event: ICloseEvent): void => {
		this.emit('close', event);
	};

	protected onSocketMessage = (event: IMessageEvent): void => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-member-access
		this.onMessage(JSON.parse(event.data.toString()) as JsonRpcMessage);
	};

	protected onSocketError = (event: IErrorEvent): void => {
		this.emit('error', event);
	};
}
