import {WebSocket} from 'partysocket';
import type {JsonRpcMessage} from './json-rpc.ts';
import {
	OpenEvent,
	CloseEvent,
	ErrorEvent,
	JsonRpcMessageEvent,
	type IOpenEvent,
	type ICloseEvent,
	type IErrorEvent,
} from './events.ts';
import type {CommunicationChannel} from './communication-channel.ts';

export type Options = {
	WebSocket?: any;
	maxReconnectionDelay?: number;
	minReconnectionDelay?: number;
	reconnectionDelayGrowFactor?: number;
	minUptime?: number;
	connectionTimeout?: number;
	maxRetries?: number;
	maxEnqueuedMessages?: number;
	debug?: boolean;
	debugLogger?: (...args: any[]) => void;
};

export type UrlProvider = string | (() => string) | (() => Promise<string>);

export type ProtocolsProvider
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	= null
		| string
		| string[]
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
		| (() => string | string[] | null)
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
		| (() => Promise<string | string[] | null>);

export class WebsocketChannel extends EventTarget implements CommunicationChannel {
	protected readonly socket;

	constructor(url: UrlProvider, protocols?: ProtocolsProvider, options: Options = {}) {
		super();

		this.socket = new WebSocket(url, protocols, {...options, startClosed: true});
		this.socket.addEventListener('open', this.onSocketOpen);
		this.socket.addEventListener('close', this.onSocketClose);
		this.socket.addEventListener('error', this.onSocketError);
		this.socket.addEventListener('message', this.onSocketMessage);
	}

	connect(): void {
		this.socket.reconnect();
	}

	close() {
		this.socket.close();
	}

	send(message: JsonRpcMessage): void {
		this.socket.send(JSON.stringify(message));
	}

	protected onSocketOpen = (_event: IOpenEvent) => {
		this.dispatchEvent(new OpenEvent());
	};

	protected onSocketClose = (event: ICloseEvent) => {
		this.dispatchEvent(new CloseEvent(event.code, event.reason, event.wasClean));
	};

	protected onSocketMessage = (event: MessageEvent) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		this.dispatchEvent(new JsonRpcMessageEvent(JSON.parse(event.data.toString()) as JsonRpcMessage));
	};

	protected onSocketError = (event: IErrorEvent) => {
		this.dispatchEvent(new ErrorEvent(event.error, event.message));
	};
}
