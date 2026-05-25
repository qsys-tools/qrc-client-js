/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-type-assertion */
import {
	CloseEvent,
	ErrorEvent,
	isCloseEvent,
	isErrorEvent,
	isMessageEvent,
	isOpenEvent,
	OpenEvent,
	type WebsocketEvent,
} from './websocket-events.ts';

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
