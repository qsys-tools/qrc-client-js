import type {Reconnectable} from './reconnect-manager.ts';

export type UrlProvider = string | (() => string) | (() => Promise<string>);

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

type WsReconnectable = Reconnectable<
	WebSocket,
	WsMessageData,
	WsMessageData,
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	[url: string, protocols: string | string[] | null]
>;

export const wsReconnectable = (url: UrlProvider, protocols: ProtocolsProvider = null) => {
	async function getUrl() {
		return typeof url === 'function' ? url() : url;
	}

	async function getProtocols() {
		return typeof protocols === 'function' ? protocols() : protocols;
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
			return Promise.all([getUrl(), getProtocols()]);
		},

		createChannel([url, protocols]) {
			return protocols ? new WebSocket(url, protocols) : new WebSocket(url);
		},

		send(channel, message) {
			channel.send(message);
		},

	} satisfies WsReconnectable;
};
