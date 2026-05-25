import type {JsonRpcMessage} from './json-rpc.ts';
import {
	type IOpenEvent,
	type ICloseEvent,
	type IErrorEvent,
	WsEvents,
} from './retry-websocket/index.ts';

export {
	type IOpenEvent,
	type ICloseEvent,
	type IErrorEvent,
	isOpenEvent,
	isCloseEvent,
	isErrorEvent,
} from './retry-websocket/index.ts';

export type IJsonRpcMessageEvent = Event & {
	message: JsonRpcMessage;
};

export type CommunicationChannelEventMap = {
	'open': IOpenEvent;
	'close': ICloseEvent;
	'error': IErrorEvent;
	'json-rpc-message': IJsonRpcMessageEvent;
};

export type CommunicationChannelEvent = CommunicationChannelEventMap[keyof CommunicationChannelEventMap];

export class JsonRpcMessageEvent extends Event implements IJsonRpcMessageEvent {
	constructor(public readonly message: JsonRpcMessage) {
		super('json-rpc-message');
	}
}

export function isJsonRpcMessageEvent(event: Event): event is IJsonRpcMessageEvent {
	return event.type === 'json-rpc-message' && 'message' in event;
}

export const CmcEvents = {
	OpenEvent: WsEvents.OpenEvent,
	CloseEvent: WsEvents.CloseEvent,
	ErrorEvent: WsEvents.ErrorEvent,
	JsonRpcMessageEvent,
};
