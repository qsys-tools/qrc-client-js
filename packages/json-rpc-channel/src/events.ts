import type {JsonRpcMessage} from './json-rpc.ts';

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

export type IJsonRpcMessageEvent = Event & {
	message: JsonRpcMessage;
};

export type CommunicationChannelEventMap = {
	open: Event;
	close: CloseEvent;
	error: ErrorEvent;
	'json-rpc-message': IJsonRpcMessageEvent;
};

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

export class JsonRpcMessageEvent extends Event implements IJsonRpcMessageEvent {
	constructor(public readonly message: JsonRpcMessage) {
		super('json-rpc-message');
	}
}

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

export function isJsonRpcMessageEvent(event: Event): event is IJsonRpcMessageEvent {
	return event.type === 'json-rpc-message' && 'message' in event;
}
