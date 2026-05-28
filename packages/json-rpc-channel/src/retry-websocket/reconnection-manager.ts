/* eslint-disable @typescript-eslint/member-ordering,@typescript-eslint/no-restricted-types */
// TODO: lose this eslint-disable

/*!
 * Reconnecting WebSocket
 * by Pedro Ladaria <pedro.ladaria@gmail.com>
 * https://github.com/pladaria/reconnecting-websocket
 * License MIT
 */

import {TypedEventTarget} from 'typescript-event-target';
import {getNextDelay} from './retry-delay.ts';
import {
	type OptionalArgs, type Reconnectable, type ReconnectableEventMap, ReconnectState, type RcArgMap,
} from './reconnectable.ts';
import {cloneWsEvent} from './clone-ws-event.ts';

export type Options = {
	maxReconnectionDelay?: number;
	minReconnectionDelay?: number;
	reconnectionDelayGrowFactor?: number;
	minUptime?: number;
	connectionTimeout?: number;
	maxRetries?: number;
	maxEnqueuedMessages?: number;
	startClosed?: boolean;
	debugLogger?: (...args: any[]) => void;
	debug?: boolean;
};

const DEFAULT = {
	minUptime: 5000,
	connectionTimeout: 4000,
	maxRetries: Number.POSITIVE_INFINITY,
	maxEnqueuedMessages: Number.POSITIVE_INFINITY,
	startClosed: false,
	debug: false,
};

type AnyReconnectable = Reconnectable<any, any, ReconnectableEventMap, RcArgMap>;
type Channel<RC extends AnyReconnectable> = RC extends Reconnectable<infer Channel, any, any, any> ? Channel : never;
type SendMessage<RC extends AnyReconnectable> = RC extends Reconnectable<any, infer SendMessage, any, any> ? SendMessage : never;
type EventMap<RC extends AnyReconnectable> = RC extends Reconnectable<any, any, infer EventMap, any> ? EventMap : never;
type ArgMap<RC extends AnyReconnectable> = RC extends Reconnectable<any, any, any, infer ArgMap> ? ArgMap : never;

export default class ReconnectionManager<RC extends Reconnectable<any, any, any, any>> extends TypedEventTarget<Pick<EventMap<RC>, keyof ReconnectableEventMap>> {
	protected _options: Options;
	private _unsub: undefined | (() => void);
	private _retryCount = -1;
	private _uptimeTimeout: ReturnType<typeof setTimeout> | undefined;
	private _connectTimeout: ReturnType<typeof setTimeout> | undefined;
	private _shouldReconnect = true;
	private _connectLock = false;
	private _closeCalled = false;
	private readonly _debugLogger = console.log.bind(console);

	private _messageQueue: Array<SendMessage<RC>> = [];
	private _channel?: Channel<RC>;
	private readonly _reconnectable: Reconnectable<Channel<RC>, SendMessage<RC>, EventMap<RC>, ArgMap<RC>>;

	constructor(
		reconnectable: Reconnectable<Channel<RC>, SendMessage<RC>, EventMap<RC>, ArgMap<RC>>,
		options: Options = {},
	) {
		super();
		this._reconnectable = reconnectable;
		this._options = options;
		if (this._options.startClosed) {
			this._shouldReconnect = false;
		}

		if (this._options.debugLogger) {
			this._debugLogger = this._options.debugLogger;
		}

		void this._connect();
	}

	get messageQueue() {
		return Object.freeze(this._messageQueue);
	}

	get retryCount(): number {
		return Math.max(this._retryCount, 0);
	}

	get shouldReconnect(): boolean {
		return this._shouldReconnect;
	}

	get currentChannel() {
		return this._channel;
	}

	public onclose: ((event: EventMap<RC>['close']) => void) | null = null;
	public onerror: ((event: EventMap<RC>['error']) => void) | null = null;
	public onmessage: ((event: EventMap<RC>['message']) => void) | null = null;
	public onopen: ((event: EventMap<RC>['open']) => void) | null = null;

	/**
	 * Closes the underlying connection. If the connection is already
	 * CLOSED, this method does nothing
	 */
	public close(...args: OptionalArgs<ArgMap<RC>['close']>) {
		this._closeCalled = true;
		this._shouldReconnect = false;
		this._clearTimeouts();
		if (!this._channel) {
			this._debug('close enqueued: no channel instance');
			return;
		}

		if (this._getChannelState() === ReconnectState.CLOSED) {
			this._debug('close: already closed');
			return;
		}

		this._reconnectable.closeChannel(this._channel, args);
	}

	protected _isChannelClosed() {
		return this._channel && this._getChannelState() === ReconnectState.CLOSED;
	}

	protected _isChannelOpen() {
		return this._channel && this._getChannelState() === ReconnectState.OPEN;
	}

	protected _isChannelClosing() {
		return this._channel && this._getChannelState() === ReconnectState.CLOSING;
	}

	protected _isChannelConnecting() {
		return this._channel && this._getChannelState() === ReconnectState.CONNECTING;
	}

	protected _getChannelState() {
		return this._channel && this._reconnectable.getChannelState(this._channel);
	}

	/**
	 * Closes the connection or connection attempt and connects again.
	 * Resets retry counter;
	 */
	public reconnect(...args: OptionalArgs<ArgMap<RC>['close']>) {
		this._shouldReconnect = true;
		this._closeCalled = false;
		this._retryCount = -1;
		if (!this._isChannelClosed()) {
			this._disconnect(args);
		}

		void this._connect();
	}

	/**
	 * Enqueue specified data to be transmitted to the server over the WebSocket connection
	 */
	public send(data: SendMessage<RC>) {
		if (this._isChannelOpen()) {
			this._debug('send', data);
			this._reconnectable.send(this._channel!, data);
		} else {
			const {maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages}
				= this._options;
			if (this._messageQueue.length < maxEnqueuedMessages) {
				this._debug('enqueue', data);
				this._messageQueue.push(data);
			}
		}
	}

	private _debug(...args: unknown[]) {
		if (this._options.debug) {
			this._debugLogger('RWS>', ...args);
		}
	}

	private async _wait(): Promise<void> {
		return new Promise(resolve => {
			const delay = getNextDelay(this._retryCount, this._options);
			this._debug(`waiting for ${delay}`);
			setTimeout(resolve, delay);
		});
	}

	private async _connect() {
		if (this._connectLock || !this._shouldReconnect) {
			return;
		}

		this._connectLock = true;

		const {
			maxRetries = DEFAULT.maxRetries,
			connectionTimeout = DEFAULT.connectionTimeout,
		} = this._options;

		if (this._retryCount >= maxRetries) {
			this._debug('max retries reached', this._retryCount, '>=', maxRetries);
			this._connectLock = false;
			return;
		}

		this._retryCount++;

		this._debug('connect', this._retryCount);
		this._removeListeners();

		try {
			await this._wait();
			const createArgs: ArgMap<RC> = await this._reconnectable.makeCreateArgs();
			if (this._closeCalled) {
				this._connectLock = false;
				return;
			}

			this._channel = this._reconnectable.createChannel(...createArgs);
			this._postCreate();
			// @ts-expect-error Types are hard
			this._debug('connect', ...createArgs);
			this._connectLock = false;
			this._addListeners();

			this._connectTimeout = setTimeout(
				() => {
					this._handleTimeout();
				},
				connectionTimeout,
			);
		} catch (error: unknown) {
			// Via https://github.com/pladaria/reconnecting-websocket/pull/166
			this._connectLock = false;
			let internalError: Error;

			if (error instanceof Error) {
				internalError = error;
			}	else {
				internalError = typeof error === 'string' ? new Error(error) : new Error('unknown error: ', {cause: error});
			}

			this._handleError(this._reconnectable.buildInternalErrorEvent(internalError));
		}
	}

	protected _postCreate() {
		// Empty
	}

	private _handleTimeout() {
		this._debug('timeout event');
		this._handleError(this._reconnectable.buildInternalErrorEvent(new Error('TIMEOUT')));
	}

	private _disconnect(reason: string | OptionalArgs<ArgMap<RC>['close']>) {
		this._clearTimeouts();
		if (!this._channel) {
			return;
		}

		this._removeListeners();
		try {
			if (
				this._isChannelOpen() ?? this._isChannelConnecting()
			) {
				this._reconnectable.closeChannel(this._channel, reason);
			}

			this._handleClose(this._reconnectable.buildInternalCloseEvent(reason));
		} catch {
			// ignore
		}
	}

	private _acceptOpen() {
		this._debug('accept open');
		this._retryCount = 0;
	}

	private readonly _handleOpen = (event: EventMap<RC>['open']) => {
		this._debug('open event');
		const {minUptime = DEFAULT.minUptime} = this._options;

		clearTimeout(this._connectTimeout);
		this._uptimeTimeout = setTimeout(() => {
			this._acceptOpen();
		}, minUptime);

		if (!this._channel) {
			throw new Error('Channel is not defined');
		}

		// Send enqueued messages (messages sent before websocket open event)
		for (const message of this._messageQueue) {
			this._reconnectable.send(this._channel, message);
		}

		this._messageQueue = [];

		if (this.onopen) {
			this.onopen(event);
		}

		this._redispatchEvent('open', event);
	};

	private _redispatchEvent<T extends keyof ReconnectableEventMap>(type: T, event: EventMap<RC>[T]): void {
		this.dispatchTypedEvent(type, cloneWsEvent(event));
	}

	private readonly _handleMessage = (event: EventMap<RC>['message']) => {
		this._debug('message event');

		if (this.onmessage) {
			this.onmessage(event);
		}

		this._redispatchEvent('message', event);
	};

	private readonly _handleError = (event: EventMap<RC>['error']) => {
		this._debug('error event', event);

		// OLD: event.message === 'TIMEOUT' ? 'timeout' : undefined,
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions,@typescript-eslint/no-base-to-string
		this._disconnect(`Error Event ${event}`);

		if (this.onerror) {
			this.onerror(event);
		}

		this._debug('exec error listeners');
		this._redispatchEvent('error', event);

		void this._connect();
	};

	private readonly _handleClose = (event: EventMap<RC>['close']) => {
		this._debug('close event');
		this._clearTimeouts();

		if (this._shouldReconnect) {
			void this._connect();
		}

		if (this.onclose) {
			this.onclose(event);
		}

		this._redispatchEvent('close', event);
	};

	private _removeListeners() {
		if (!this._channel) {
			return;
		}

		this._debug('removeListeners');
		this._unsub!();
	}

	private _addListeners() {
		if (!this._channel) {
			return;
		}

		this._debug('addListeners');
		this._unsub = this._reconnectable.attachListeners(this._channel, {
			open: this._handleOpen,
			close: this._handleClose,
			message: this._handleMessage,
			error: this._handleError,
		});
	}

	private _clearTimeouts() {
		clearTimeout(this._connectTimeout);
		clearTimeout(this._uptimeTimeout);
	}
}
