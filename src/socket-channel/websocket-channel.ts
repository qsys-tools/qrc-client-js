import type {WebSocket as WsWebSocket} from 'ws';
import type {JsonRpcMessage} from '../json-rpc.ts';
import {AbstractChannel} from './abstract-channel.ts';

export type IWebSocket = WebSocket | WsWebSocket;
export type IMessageEvent = MessageEvent<string> | WsWebSocket.MessageEvent;

export class WebsocketChannel extends AbstractChannel {
	protected readonly socket: IWebSocket;

	constructor(socket: IWebSocket) {
		super();

		this.socket = socket;
		socket.addEventListener('message', (event: IMessageEvent) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-base-to-string
			this.onMessage(JSON.parse(event.data.toString()) as JsonRpcMessage);
		});
	}

	connect(): void {
		// Empty
	}

	send(message: JsonRpcMessage): void {
		this.socket.send(JSON.stringify(message));
	}

	end() {
		this.socket.close();
	}
}
