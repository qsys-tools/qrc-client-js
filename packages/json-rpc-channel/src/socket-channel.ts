import type {Socket} from 'node:net';
import type {Readable, Writable} from 'node:stream';
import pump from 'pump';
import {TypedEventTarget} from 'typescript-event-target';
import type {JsonRpcMessage} from './json-rpc.ts';
import {
	log, nullJsonDecoder, nullJsonEncoder, addRpcVersion, timeout,
} from './stream-transforms.ts';
import type {CommunicationChannel} from './communication-channel.ts';
import {type CommunicationChannelEventMap, OpenEvent, CloseEvent, ErrorEvent, JsonRpcMessageEvent} from './events.ts';

type SocketConnectionInfo = {host: string; port: number};

export class SocketChannel extends TypedEventTarget<CommunicationChannelEventMap> implements CommunicationChannel {
	protected finished = false;
	protected errors: Error[] = [];

	private readonly readStream: Readable;

	private readonly writeStream: Writable;

	private readonly socket: Socket;

	private readonly connectionInfo: SocketConnectionInfo;

	constructor(socket: Socket, connectionInfo: SocketConnectionInfo) {
		super();
		this.socket = socket;
		this.connectionInfo = connectionInfo;

		const destroyHandler = () => {
			this.removeEventListener('error', destroyHandler)
			this.destroy();
		};

		this.addEventListener('error', destroyHandler);

		this.readStream = this.buildReadStream(
			socket,
			error => {
				this.finish('write', error);
			},
		);
		this.writeStream = this.buildWriteStream(
			socket,
			error => {
				this.finish('read', error);
			},
		);
		this.readStream.on('data', this.onJsonMessage);
	}

	connect() {
		this.socket.connect(this.connectionInfo);
	}

	send(message: JsonRpcMessage) {
		this.writeStream.write(message);
	}

	close() {
		this.destroy();
	}

	destroy = (error?: Error) => {
		this.socket.destroy(error);
		this.readStream.destroy(error);
		this.writeStream.destroy(error);
		this.detachSocketListeners(this.socket);
	};

	end = () => {
		this.socket.end();
	};

	protected buildReadStream(socket: Socket, finish: (error: Error | undefined) => void): Readable {
		const readStream = log('received: ');

		pump(
			socket,
			nullJsonDecoder(),
			readStream,
			finish,
		);

		return readStream;
	}

	protected buildWriteStream(socket: Socket, finish: (error: Error | undefined) => void): Writable {
		const writeStream = addRpcVersion();
		pump(
			writeStream,
			timeout(5000, () => {
				this.send({
					jsonrpc: '2.0',
					method: 'NoOp',
					params: {},
				});
			}),
			log('sending: '),
			nullJsonEncoder(),
			socket,
			finish,
		);
		return writeStream;
	}

	protected finish(_stream: 'read' | 'write', error: Error | undefined) {
		// TODO: Implement DEBUG Logging. console.warn(`finish on ${stream} stream: ${error ?? 'no error'}`);
		if (error && !this.errors.includes(error)) {
			this.errors.push(error);
			this.dispatchTypedEvent('error', new ErrorEvent(error, `${_stream} stream error`));
		}

		if (this.finished) {
			return;
		}

		this.finished = true;
		this.dispatchTypedEvent('close', new CloseEvent(1000, 'some reason' , !error))
	}

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
		this.dispatchTypedEvent('json-rpc-message', new JsonRpcMessageEvent(message))
	}

	protected onSocketClose = (hadError: boolean) => {
		this.dispatchTypedEvent('close', new CloseEvent(1000, 'unknown reason', !hadError));
	}

	protected onSocketEnd = () => {
		// Do Nothing... Prefer close
	}

	protected onSocketFinish = () => {
		// Do nothing
	}

	protected onSocketConnect = () => {
		// Do Nothing... Wait for ready event
	}

	protected onSocketConnectionAttempt = (_ip: string, _port: number, _family: number) => {
		// Do Nothing
	};

	protected onSocketConnectionAttemptFailed = (_ip: string, _port: number, _family: number, error: Error) => {
		this.dispatchTypedEvent('error', new ErrorEvent(error, 'socket connection attempt failed'));
	};

	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	protected onSocketLookup = (error: Error | null, _address: string, _family: number | null, _host: string) => {
		if (error !== null) {
			this.dispatchTypedEvent('error', new ErrorEvent(error, 'socket lookup failed'));
		}
	}

	protected onSocketReady = () => {
		this.dispatchTypedEvent('open', new OpenEvent());
	}

	protected onSocketTimeout = () => {
		this.dispatchTypedEvent('error', new ErrorEvent(new Error('Socket timeout')));
	};
}
