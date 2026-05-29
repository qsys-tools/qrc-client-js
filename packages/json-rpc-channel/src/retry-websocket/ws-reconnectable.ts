import {type Reconnectable, ReconnectState, type WebSocketEventMap} from '@qsys-tools/reconnectable';

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
export type WsArgMap
	= {
		// eslint-disable-next-line @typescript-eslint/no-restricted-types
		create: [url: string, protocols: string | string[] | null | undefined];
		// eslint-disable-next-line @typescript-eslint/no-restricted-types
		connect: [];
		close: [code: number | undefined, reason: string | undefined];
	};

export type WsReconnectable = Extract<Reconnectable<
	WebSocket,
	WsMessageData,
	WebSocketEventMap,
	WsArgMap
>, {connectsAtCreation: true}>;

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

export const wsReconnectable = (url: UrlProvider, protocols: ProtocolsProvider = null, WS?: typeof WebSocket): WsReconnectable => {
	if (typeof url !== 'string' && typeof url !== 'function' && !(('then' in url) && (typeof url.then === 'function'))) {
		throw new TypeError('url needs to be a string, a promise for a string, or a function that returns one of those');
	}

	return {
		connectsAtCreation: true,

		closeChannel(channel, args): void {
			if (Array.isArray(args)) {
				const [code, reason] = args;
				channel.close(code, reason);
			} else {
				channel.close(3000, args);
			}
		},

		attachListeners(channel, {open, close, message, error}) {
			channel.addEventListener('message', message);
			channel.addEventListener('close', close);
			// @ts-expect-error It works
			channel.addEventListener('error', error);
			channel.addEventListener('open', open);

			return () => {
				channel.removeEventListener('message', message);
				channel.removeEventListener('close', close);
				// @ts-expect-error It works
				channel.removeEventListener('error', error);
				channel.removeEventListener('open', open);
			};
		},

		async makeCreateArgs() {
			return Promise.all([getNextUrl(url), getNextProtocols(protocols)]);
		},

		createChannel(url, protocols?) {
			if (!WS && typeof WebSocket === 'undefined' && !didWarnAboutMissingWebSocket) {
				console.error('‼️ No WebSocket implementation available. You should define options.WebSocket.');
				didWarnAboutMissingWebSocket = true;
			}

			const WSC = WS ?? WebSocket;
			const ws = protocols ? new WSC(url, protocols) : new WSC(url);

			return ws;
		},

		send(channel, message) {
			channel.send(message);
		},

		getChannelState(channel: WebSocket): ReconnectState {
			switch (channel.readyState) {
				case 1: {
					return ReconnectState.OPEN;
				}

				case 0: {
					return ReconnectState.CONNECTING;
				}

				case 2: {
					return ReconnectState.CLOSING;
				}

				case 3: {
					return ReconnectState.CLOSED;
				}
			}

			throw new Error('WebSocket readyState supplied is not supported');
		},

		buildInternalCloseEvent(args) {
			if (typeof args === 'string') {
				return new CloseEvent('close', {reason: args});
			}

			const [code, reason] = args;
			return new CloseEvent('close', {code, reason});
		},

		buildInternalErrorEvent(error: Error) {
			return new ErrorEvent('error', {error});
		},
	};
};
