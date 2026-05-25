import type {Socket} from 'node:net';
import {getLogger} from '@logtape/logtape';
import {TypedEventTarget} from 'typescript-event-target';
import type {JsonRpcMessage} from './json-rpc.ts';
import {buildDuplexStream} from './stream-transforms.ts';
import type {CommunicationChannel} from './communication-channel.ts';
import {
	type CommunicationChannelEventMap, OpenEvent, CloseEvent, ErrorEvent, JsonRpcMessageEvent,
} from './events.ts';

type SocketConnectionInfo = {host: string; port: number};

const logger = getLogger(['qsys-tools', 'json-rpc-channel', 'socket-channel']);

export class SocketChannel extends TypedEventTarget<CommunicationChannelEventMap> implements CommunicationChannel {
	protected finished = false;
	protected errors: Error[] = [];

	private readonly stream: ReturnType<typeof buildDuplexStream>;

	private readonly socket: Socket;

	private readonly connectionInfo: SocketConnectionInfo;

	constructor(socket: Socket, connectionInfo: SocketConnectionInfo) {
		super();
		this.socket = socket;
		this.connectionInfo = connectionInfo;
		this.attachSocketListeners(socket);

		const destroyHandler = () => {
			this.removeEventListener('error', destroyHandler);
			this.destroy();
		};

		this.addEventListener('error', destroyHandler);

		this.stream = buildDuplexStream(socket, this.finish);
		this.stream.on('data', this.onJsonMessage);
	}

	connect() {
		logger.trace('connect {*}', this.connectionInfo);
		this.socket.connect(this.connectionInfo);
	}

	send(message: JsonRpcMessage) {
		logger.trace('send {*}', message);
		this.stream.write(message);
	}

	close() {
		logger.trace('end');
		this.stream.end();
	}

	destroy = (error?: Error) => {
		this.socket.destroy(error);
		this.stream.destroy(error);
		this.detachSocketListeners(this.socket);
	};

	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	protected finish = (_stream: 'read' | 'write', error: Error | null) => {
		// TODO: Implement DEBUG Logging. console.warn(`finish on ${stream} stream: ${error ?? 'no error'}`);
		if (error && !this.errors.includes(error)) {
			this.errors.push(error);
			this.dispatchTypedEvent('error', new ErrorEvent(error, `${_stream} stream error`));
		}

		if (this.finished) {
			return;
		}

		this.finished = true;
		this.dispatchTypedEvent('close', new CloseEvent(1000, 'some reason', !error));
	};

	protected attachSocketListeners(socket: Socket) {
		socket.addListener('close', this.onSocketClose);
		socket.addListener('end', this.onSocketEnd);
		socket.addListener('finish', this.onSocketFinish);
		socket.addListener('connect', this.onSocketConnect);
		socket.addListener('connectionAttempt', this.onSocketConnectionAttempt);
		socket.addListener('connectionAttemptFailed', this.onSocketConnectionAttemptFailed);
		socket.addListener('lookup', this.onSocketLookup);
		socket.addListener('ready', this.onSocketReady);
		socket.addListener('timeout', this.onSocketTimeout);
	}

	protected detachSocketListeners(socket: Socket) {
		socket.removeListener('close', this.onSocketClose);
		socket.removeListener('end', this.onSocketEnd);
		socket.removeListener('finish', this.onSocketFinish);
		socket.removeListener('connect', this.onSocketConnect);
		socket.removeListener('connectionAttempt', this.onSocketConnectionAttempt);
		socket.removeListener('connectionAttemptFailed', this.onSocketConnectionAttemptFailed);
		socket.removeListener('lookup', this.onSocketLookup);
		socket.removeListener('ready', this.onSocketReady);
		socket.removeListener('timeout', this.onSocketTimeout);
	}

	protected onJsonMessage = (message: JsonRpcMessage) => {
		logger.trace('onJsonMessage {*}', message);
		this.dispatchTypedEvent('json-rpc-message', new JsonRpcMessageEvent(message));
	};

	protected onSocketClose = (hadError: boolean) => {
		logger.trace('onSocketClose {*}', {hadError});
		this.dispatchTypedEvent('close', new CloseEvent(1000, 'unknown reason', !hadError));
	};

	protected onSocketEnd = () => {
		logger.trace('onSocketEnd');
		// Do Nothing... Prefer close
	};

	protected onSocketFinish = () => {
		logger.trace('onSocketFinish');
		// Do nothing
	};

	protected onSocketConnect = () => {
		logger.trace('onSocketConnect');
		// Do Nothing... Wait for ready event
	};

	protected onSocketConnectionAttempt = (ip: string, port: number, family: number) => {
		logger.trace('onSocketConnectionAttempt {*}', {ip, port, family});
		// Do Nothing
	};

	protected onSocketConnectionAttemptFailed = (ip: string, port: number, family: number, error: Error) => {
		logger.warning('onSocketConnectionAttemptFailed {*}', {
			ip, port, family, error,
		});
		this.dispatchTypedEvent('error', new ErrorEvent(error, 'socket connection attempt failed'));
	};

	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	protected onSocketLookup = (error: Error | null, address: string, family: number | null, host: string) => {
		if (error !== null) {
			logger.warning('onSocketLookup', {
				error, address, family, host,
			});
			this.dispatchTypedEvent('error', new ErrorEvent(error, 'socket lookup failed'));
		}
	};

	protected onSocketReady = () => {
		logger.trace('onSocketReady');
		this.dispatchTypedEvent('open', new OpenEvent());
	};

	protected onSocketTimeout = () => {
		logger.warning('onSocketTimeout');
		this.dispatchTypedEvent('error', new ErrorEvent(new Error('Socket timeout')));
	};
}
