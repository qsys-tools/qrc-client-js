/* eslint-disable @typescript-eslint/member-ordering,@typescript-eslint/no-restricted-types */
// TODO: lose this eslint-disable

/*!
 * Reconnecting WebSocket
 * by Pedro Ladaria <pedro.ladaria@gmail.com>
 * https://github.com/pladaria/reconnecting-websocket
 * License MIT
 */

import { TypedEventTarget } from 'typescript-event-target';
import {getNextDelay} from './retry-delay.ts';

if (!globalThis.EventTarget || !globalThis.Event) {
	console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports:

  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);
}

export class ErrorEvent extends Event {
	public message: string;
	public error: Error;
	constructor(error: Error, target: any) {
		super("error", target);
		this.message = error.message;
		this.error = error;
	}
}

export class CloseEvent extends Event {
	public code: number;
	public reason: string;
	public wasClean = true;
	constructor(code = 1000, reason = "", target: any) {
		super("close", target);
		this.code = code;
		this.reason = reason;
	}
}

export type WebSocketEventMap = {
	close: CloseEvent;
	error: ErrorEvent;
	message: MessageEvent;
	open: Event;
}

const Events = {
	Event,
	ErrorEvent,
	CloseEvent
};

function assert(condition: unknown, msg?: string): asserts condition {
	if (!condition) {
		throw new Error(msg);
	}
}

function cloneEventBrowser(e: Event) {
	return new (e as any).constructor(e.type, e) as Event;
}

function cloneEventNode(e: Event) {
	if ("data" in e) {
		const evt = new MessageEvent(e.type, e);
		return evt;
	}

	if ("code" in e || "reason" in e) {
		const evt = new CloseEvent(
			// @ts-expect-error we need to fix event/listener types
			(e.code || 1999) as number,
			// @ts-expect-error we need to fix event/listener types
			(e.reason || "unknown reason") as string,
			e
		);
		return evt;
	}

	if ("error" in e) {
		const evt = new ErrorEvent(e.error as Error, e);
		return evt;
	}

	const evt = new Event(e.type, e);
	return evt;
}

const isNode =
	typeof process !== "undefined" &&
	typeof process.versions?.node !== "undefined";

// React Native has process and document polyfilled but not process.versions.node
// It needs Node-style event cloning because browser-style cloning produces
// events that fail instanceof Event checks in event-target-polyfill
// See: https://github.com/cloudflare/partykit/issues/257
const isReactNative =
	typeof navigator !== "undefined" && navigator.product === "ReactNative";

const cloneEvent = isNode || isReactNative ? cloneEventNode : cloneEventBrowser;

export type Options = {
	WebSocket?: any;
	maxReconnectionDelay?: number;
	minReconnectionDelay?: number;
	reconnectionDelayGrowFactor?: number;
	minUptime?: number;
	connectionTimeout?: number;
	maxRetries?: number;
	maxEnqueuedMessages?: number;
	startClosed?: boolean;
	debug?: boolean;
	debugLogger?: (...args: any[]) => void;
};

const DEFAULT = {
	minUptime: 5000,
	connectionTimeout: 4000,
	maxRetries: Number.POSITIVE_INFINITY,
	maxEnqueuedMessages: Number.POSITIVE_INFINITY,
	startClosed: false,
	debug: false
};

let didWarnAboutMissingWebSocket = false;

export type UrlProvider = string | (() => string) | (() => Promise<string>);
export type ProtocolsProvider =
	| null
	| string
	| string[]
	| (() => string | string[] | null)
	| (() => Promise<string | string[] | null>);

export type Message =
	| string
	| ArrayBuffer
	| Blob
	| ArrayBufferView<ArrayBuffer>;


export default class ReconnectingWebSocket extends TypedEventTarget<WebSocketEventMap> {
	protected _url: UrlProvider;
	protected _protocols?: ProtocolsProvider;
	protected _options: Options;

	private _ws: WebSocket | undefined;
	private _retryCount = -1;
	private _uptimeTimeout: ReturnType<typeof setTimeout> | undefined;
	private _connectTimeout: ReturnType<typeof setTimeout> | undefined;
	private _shouldReconnect = true;
	private _connectLock = false;
	private _binaryType: BinaryType = "blob";
	private _closeCalled = false;
	private _messageQueue: Message[] = [];

	private readonly _debugLogger = console.log.bind(console);


	constructor(
		url: UrlProvider,
		protocols?: ProtocolsProvider,
		options: Options = {}
	) {
		super();
		this._url = url;
		this._protocols = protocols;
		this._options = options;
		if (this._options.startClosed) {
			this._shouldReconnect = false;
		}

		if (this._options.debugLogger) {
			this._debugLogger = this._options.debugLogger;
		}

		this._connect();
	}

	static get CONNECTING() {
		return 0;
	}

	static get OPEN() {
		return 1;
	}

	static get CLOSING() {
		return 2;
	}

	static get CLOSED() {
		return 3;
	}

	get CONNECTING() {
		return ReconnectingWebSocket.CONNECTING;
	}

	get OPEN() {
		return ReconnectingWebSocket.OPEN;
	}

	get CLOSING() {
		return ReconnectingWebSocket.CLOSING;
	}

	get CLOSED() {
		return ReconnectingWebSocket.CLOSED;
	}

	get binaryType() {
		return this._ws ? this._ws.binaryType : this._binaryType;
	}

	set binaryType(value: BinaryType) {
		this._binaryType = value;
		if (this._ws) {
			this._ws.binaryType = value;
		}
	}

	/**
	 * Returns the number or connection retries
	 */
	get retryCount(): number {
		return Math.max(this._retryCount, 0);
	}

	/**
	 * The number of bytes of data that have been queued using calls to send() but not yet
	 * transmitted to the network. This value resets to zero once all queued data has been sent.
	 * This value does not reset to zero when the connection is closed; if you keep calling send(),
	 * this will continue to climb. Read only
	 */
	get bufferedAmount(): number {
		let bytes = 0;

		for (const message of this._messageQueue) {
			if (typeof message === "string") {
				bytes += message.length; // Not byte size
			} else if (message instanceof Blob) {
				bytes += message.size;
			} else {
				bytes += message.byteLength;
			}
		}

		return bytes + (this._ws ? this._ws.bufferedAmount : 0);
	}

	/**
	 * The extensions selected by the server. This is currently only the empty string or a list of
	 * extensions as negotiated by the connection
	 */
	get extensions(): string {
		return this._ws ? this._ws.extensions : "";
	}

	/**
	 * A string indicating the name of the sub-protocol the server selected;
	 * this will be one of the strings specified in the protocols parameter when creating the
	 * WebSocket object
	 */
	get protocol(): string {
		return this._ws ? this._ws.protocol : "";
	}

	/**
	 * The current state of the connection; this is one of the Ready state constants
	 */
	get readyState(): number {
		if (this._ws) {
			return this._ws.readyState;
		}

		return this._options.startClosed
			? ReconnectingWebSocket.CLOSED
			: ReconnectingWebSocket.CONNECTING;
	}

	/**
	 * The URL as resolved by the constructor
	 */
	get url(): string {
		return this._ws ? this._ws.url : "";
	}

	/**
	 * Whether the websocket object is now in reconnectable state
	 */
	get shouldReconnect(): boolean {
		return this._shouldReconnect;
	}

	/**
	 * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
	 */
	public onclose: ((event: CloseEvent) => void) | null = null;

	/**
	 * An event listener to be called when an error occurs
	 */
	public onerror: ((event: ErrorEvent) => void) | null = null;

	/**
	 * An event listener to be called when a message is received from the server
	 */
	public onmessage: ((event: MessageEvent) => void) | null = null;

	/**
	 * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
	 * this indicates that the connection is ready to send and receive data
	 */
	public onopen: ((event: Event) => void) | null = null;

	/**
	 * Closes the WebSocket connection or connection attempt, if any. If the connection is already
	 * CLOSED, this method does nothing
	 */
	public close(code = 1000, reason?: string) {
		this._closeCalled = true;
		this._shouldReconnect = false;
		this._clearTimeouts();
		if (!this._ws) {
			this._debug("close enqueued: no ws instance");
			return;
		}

		if (this._ws.readyState === this.CLOSED) {
			this._debug("close: already closed");
			return;
		}

		this._ws.close(code, reason);
	}

	/**
	 * Closes the WebSocket connection or connection attempt and connects again.
	 * Resets retry counter;
	 */
	public reconnect(code?: number, reason?: string) {
		this._shouldReconnect = true;
		this._closeCalled = false;
		this._retryCount = -1;
		if (!this._ws || this._ws.readyState === this.CLOSED) {
			this._connect();
		} else {
			this._disconnect(code, reason);
			this._connect();
		}
	}

	/**
	 * Enqueue specified data to be transmitted to the server over the WebSocket connection
	 */
	public send(data: Message) {
		if (this._ws?.readyState === this.OPEN) {
			this._debug("send", data);
			this._ws.send(data);
		} else {
			const { maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages } =
				this._options;
			if (this._messageQueue.length < maxEnqueuedMessages) {
				this._debug("enqueue", data);
				this._messageQueue.push(data);
			}
		}
	}

	private _debug(...args: unknown[]) {
		if (this._options.debug) {
			this._debugLogger("RWS>", ...args);
		}
	}

	private _getNextDelay() {
		const delay = getNextDelay(this._retryCount, this._options);
		this._debug("next delay", delay);
		return delay;
	}

	private async _wait(): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, this._getNextDelay());
		});
	}

	private _isValidProtocol(protocol: unknown): protocol is string | string[] | null {
		return protocol === null || typeof protocol === 'string' || Array.isArray(protocol);
	}

	private async _getNextProtocols(
		protocolsProvider: ProtocolsProvider
	) {
		if (this._isValidProtocol(protocolsProvider)) {
			return protocolsProvider;
		}

		if (typeof protocolsProvider === "function") {
			const protocols = await protocolsProvider();
			if(this._isValidProtocol(protocols)) {
				return protocols;
			}
		}

		throw new Error("Invalid protocols");
	}

	private async _getNextUrl(urlProvider: UrlProvider) {
		if (typeof urlProvider === "string") {
			return urlProvider;
		}

		if (typeof urlProvider === "function") {
			const result = await urlProvider();
			if (typeof result === "string") {
				return result;
			}
		}

		throw new TypeError("Invalid UrlProvider");
	}

	private _connect() {
		if (this._connectLock || !this._shouldReconnect) {
			return;
		}

		this._connectLock = true;

		const {
			maxRetries = DEFAULT.maxRetries,
			connectionTimeout = DEFAULT.connectionTimeout
		} = this._options;

		if (this._retryCount >= maxRetries) {
			this._debug("max retries reached", this._retryCount, ">=", maxRetries);
			this._connectLock = false;
			return;
		}

		this._retryCount++;

		this._debug("connect", this._retryCount);
		this._removeListeners();

		this._wait()
			.then(async () => {
				const [url, protocols] = await Promise.all([
					this._getNextUrl(this._url),
					this._getNextProtocols(this._protocols ?? null)
				]);
				if (this._closeCalled) {
					this._connectLock = false;
					return;
				}

				if (
					!this._options.WebSocket &&
					typeof WebSocket === "undefined" &&
					!didWarnAboutMissingWebSocket
				) {
					console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket.

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`);
					didWarnAboutMissingWebSocket = true;
				}

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const WS: typeof WebSocket = this._options.WebSocket ?? WebSocket;
				this._debug("connect", { url, protocols });
				this._ws = protocols ? new WS(url, protocols) : new WS(url);

				this._ws.binaryType = this._binaryType;
				this._connectLock = false;
				this._addListeners();

				this._connectTimeout = setTimeout(
					() => {
						this._handleTimeout()
					},
					connectionTimeout
				);
			})
			// Via https://github.com/pladaria/reconnecting-websocket/pull/166
			.catch((error: unknown) => {
				this._connectLock = false;
				const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : undefined;
				this._handleError(new Events.ErrorEvent(new Error(message), this));
			});
	}

	private _handleTimeout() {
		this._debug("timeout event");
		this._handleError(new Events.ErrorEvent(new Error("TIMEOUT"), this));
	}

	private _disconnect(code = 1000, reason?: string) {
		this._clearTimeouts();
		if (!this._ws) {
			return;
		}

		this._removeListeners();
		try {
			if (
				this._ws.readyState === this.OPEN ||
				this._ws.readyState === this.CONNECTING
			) {
				this._ws.close(code, reason);
			}

			this._handleClose(new Events.CloseEvent(code, reason, this));
		} catch {
			// ignore
		}
	}

	private _acceptOpen() {
		this._debug("accept open");
		this._retryCount = 0;
	}

	private readonly _handleOpen = (event: Event) => {
		this._debug("open event");
		const { minUptime = DEFAULT.minUptime } = this._options;

		clearTimeout(this._connectTimeout);
		this._uptimeTimeout = setTimeout(() => {
			this._acceptOpen()
		}, minUptime);

		assert(this._ws, "WebSocket is not defined");

		this._ws.binaryType = this._binaryType;

		// Send enqueued messages (messages sent before websocket open event)
		for (const message of this._messageQueue) {
			this._ws?.send(message);
		}

		this._messageQueue = [];

		if (this.onopen) {
			this.onopen(event);
		}

		this.dispatchEvent(cloneEvent(event));
	};

	private readonly _handleMessage = (event: MessageEvent) => {
		this._debug("message event");

		if (this.onmessage) {
			this.onmessage(event);
		}

		this.dispatchEvent(cloneEvent(event));
	};

	private readonly _handleError = (event: ErrorEvent) => {
		this._debug("error event", event.message);
		this._disconnect(
			undefined,
			event.message === "TIMEOUT" ? "timeout" : undefined
		);

		if (this.onerror) {
			this.onerror(event);
		}

		this._debug("exec error listeners");
		this.dispatchEvent(cloneEvent(event));

		this._connect();
	};

	private readonly _handleClose = (event: CloseEvent) => {
		this._debug("close event");
		this._clearTimeouts();

		if (this._shouldReconnect) {
			this._connect();
		}

		if (this.onclose) {
			this.onclose(event);
		}

		this.dispatchEvent(cloneEvent(event));
	};

	private _removeListeners() {
		if (!this._ws) {
			return;
		}

		this._debug("removeListeners");
		this._ws.removeEventListener("open", this._handleOpen);
		this._ws.removeEventListener("close", this._handleClose);
		this._ws.removeEventListener("message", this._handleMessage);
		// @ts-expect-error we need to fix event/listerner types
		this._ws.removeEventListener("error", this._handleError);
	}

	private _addListeners() {
		if (!this._ws) {
			return;
		}

		this._debug("addListeners");
		this._ws.addEventListener("open", this._handleOpen);
		this._ws.addEventListener("close", this._handleClose);
		this._ws.addEventListener("message", this._handleMessage);
		// @ts-expect-error we need to fix event/listener types
		this._ws.addEventListener("error", this._handleError);
	}

	private _clearTimeouts() {
		clearTimeout(this._connectTimeout);
		clearTimeout(this._uptimeTimeout);
	}
}
