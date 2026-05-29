import {ReconnectionManager} from '@qsys-tools/reconnectable';
import {
	type UrlProvider, type ProtocolsProvider, wsReconnectable, type WsReconnectable,
} from './ws-reconnectable.ts';

if (!globalThis.EventTarget || !globalThis.Event) {
	throw new Error('No globalThis.EventTarget / globalThis.Event');
}

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

export default class ReconnectingWebSocket extends ReconnectionManager<WsReconnectable> {
	protected _options: Options;
	private _binaryType: BinaryType = 'blob';

	constructor(
		url: UrlProvider,
		protocols: ProtocolsProvider = null,
		options: Options = {},
	) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		super(wsReconnectable(url, protocols, options.WebSocket as typeof WebSocket), options);
		this._options = options;
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

	protected _postCreate() {
		this._ws!.binaryType = this._binaryType;
	}

	private get _ws() {
		return this.currentChannel;
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
	 * The number of bytes of data that have been queued using calls to send() but not yet
	 * transmitted to the network. This value resets to zero once all queued data has been sent.
	 * This value does not reset to zero when the connection is closed; if you keep calling send(),
	 * this will continue to climb. Read only
	 */
	get bufferedAmount(): number {
		let bytes = 0;

		for (const message of this.messageQueue) {
			if (typeof message === 'string') {
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
		return this._ws ? this._ws.extensions : '';
	}

	/**
	 * A string indicating the name of the sub-protocol the server selected;
	 * this will be one of the strings specified in the protocols parameter when creating the
	 * WebSocket object
	 */
	get protocol(): string {
		return this._ws ? this._ws.protocol : '';
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
		return this._ws ? this._ws.url : '';
	}
}
