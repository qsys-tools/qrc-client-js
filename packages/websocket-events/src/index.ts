// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-type-assertion */

export type IOpenEvent = Event & {
};

export type ICloseEvent = Event & {
	code: number;
	reason: string;
	wasClean: boolean;
};

export type IErrorEvent = Event & {
	message: string;
	error: Error;
};

export type WebSocketEventMap = {
	close: ICloseEvent;
	error: IErrorEvent;
	message: MessageEvent;
	open: IOpenEvent;
};

export type WebsocketEvent = WebSocketEventMap[keyof WebSocketEventMap];

export class OpenEvent extends Event implements IOpenEvent {
	constructor() {
		super('open');
	}
}

export class CloseEvent extends Event implements ICloseEvent {
	constructor(public readonly code: number, public readonly reason: string, public readonly wasClean: boolean) {
		super('close');
	}
}

export class ErrorEvent extends Event implements IErrorEvent {
	constructor(public readonly error: Error, public readonly message = error.message) {
		super('error');
	}
}

export const WsEvents = {
	Event,
	OpenEvent,
	ErrorEvent,
	CloseEvent,
	MessageEvent,
};

export function isOpenEvent(event: Event): event is IOpenEvent {
	return event.type === 'open';
}

export function isMessageEvent(event: Event): event is MessageEvent {
	return event.type === 'message' && 'data' in event;
}

export function isCloseEvent(event: Event): event is CloseEvent {
	return event.type === 'close' && 'code' in event && 'reason' in event;
}

export function isErrorEvent(event: Event): event is ErrorEvent {
	return event.type === 'error' && 'message' in event && 'error' in event;
}

function cloneEventBrowser<E extends WebsocketEvent>(event: E): E {
	// @ts-expect-error types are hard
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	return new (event as E).constructor(event.type, event) as E;
}

function cloneEventNode<E extends WebsocketEvent>(event: E): E {
	if (isMessageEvent(event)) {
		// @ts-expect-error types are hard
		return new MessageEvent(event.type, event);
	}

	if (isCloseEvent(event)) {
		const evt = new CloseEvent(
			(event.code || 1999),
			(event.reason || 'unknown reason'),
			event.wasClean,
		);
		return evt as E;
	}

	if (isErrorEvent(event)) {
		return new ErrorEvent(event.error, event.message || event.error?.message) as E;
	}

	if (isOpenEvent(event)) {
		return new OpenEvent() as E;
	}

	// @ts-expect-error We're going to try
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	return new Event(event.type, event) as E;
}
/* eslint-enable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-type-assertion */

// eslint-disable-next-line n/prefer-global/process
const isNode = globalThis.process?.versions?.node !== undefined;

// React Native has process and document polyfilled but not process.versions.node
// It needs Node-style event cloning because browser-style cloning produces
// events that fail instanceof Event checks in event-target-polyfill
// See: https://github.com/cloudflare/partykit/issues/257
const isReactNative
	= typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

export const cloneWsEvent = isNode || isReactNative ? cloneEventNode : cloneEventBrowser;
