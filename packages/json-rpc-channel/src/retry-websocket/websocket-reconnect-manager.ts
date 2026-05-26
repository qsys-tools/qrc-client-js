import type {Reconnectable} from './reconnect-manager.ts';

export type UrlProvider = string | Promise<string> | (() => string) | (() => Promise<string>);

export type ProtocolsProvider
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	= | null
		| string
		| string[]
		// eslint-disable-next-line @typescript-eslint/no-restricted-types
		| (() => string | string[] | null)
		// eslint-disable-next-line @typescript-eslint/no-restricted-types
		| (() => Promise<string | string[] | null>);

export type WsMessageData
	= | string
		| ArrayBuffer
		| Blob
		| ArrayBufferView<ArrayBuffer>;

export type WsReconnectable = Reconnectable<
	WebSocket,
	WsMessageData,
	WsMessageData,
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	[url: string, protocols: string | string[] | null]
>;

export async function getNextUrl(url: UrlProvider) {
	const result = await (typeof url === 'function' ? url() : url);

	if (typeof result !== 'string') {
		throw new TypeError(`Url Provider returned ${typeof result}`);
	}

	return result;
}

export async function getNextProtocols(protocols: ProtocolsProvider) {
	const result = await (typeof protocols === 'function' ? protocols() : protocols);
	if (typeof result !== 'string' && !Array.isArray(result) && result !== null) {
		throw new TypeError(`Protocols Provider returned ${typeof result}`);
	}

	return result;
}

let didWarnAboutMissingWebSocket = false;

export const wsReconnectable = (url: UrlProvider, protocols: ProtocolsProvider = null, WS?: typeof WebSocket) => {
	if (typeof url !== 'string' && typeof url !== 'function' && !(('then' in url) && (typeof url.then === 'function'))) {
		throw new TypeError('url needs to be a string, a promise for a string, or a function that returns one of those');
	}

	return {
		connectsAtCreation: true,

		closeChannel(channel: WebSocket): void {
			channel.close();
		},

		attachListeners(channel, {open, close, message, error}) {
			const messageListener = (event: MessageEvent<WsMessageData>) => {
				message(event.data);
			};

			const errorListener = (event: Event) => {
				if ('error' in event && event.error instanceof Error) {
					error(event.error);
				}

				const message = 'message' in event ? event.message : ('reason' in event ? event.reason : event);

				// eslint-disable-next-line @typescript-eslint/no-base-to-string
				const errorInstance = new Error(typeof message === 'string' ? message : String(event));

				if (typeof Error.captureStackTrace === 'function') {
					Error.captureStackTrace(errorInstance);
				}

				error(errorInstance);
			};

			channel.addEventListener('message', messageListener);
			channel.addEventListener('close', close);
			channel.addEventListener('error', errorListener);
			channel.addEventListener('open', open);

			return () => {
				channel.removeEventListener('message', messageListener);
				channel.removeEventListener('close', close);
				channel.removeEventListener('error', errorListener);
				channel.removeEventListener('open', open);
			};
		},

		async makeCreateArgs() {
			return Promise.all([getNextUrl(url), getNextProtocols(protocols)]);
		},

		createChannel([url, protocols]) {
			if (!WS && typeof WebSocket === 'undefined' && !didWarnAboutMissingWebSocket) {
				console.error('‼️ No WebSocket implementation available. You should define options.WebSocket.');
				didWarnAboutMissingWebSocket = true;
			}

			const WSC = WS ?? WebSocket;
			return protocols ? new WSC(url, protocols) : new WSC(url);
		},

		send(channel, message) {
			channel.send(message);
		},

	} satisfies WsReconnectable;
};
