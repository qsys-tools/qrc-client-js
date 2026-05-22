import type {Socket} from 'node:net';
import type {Readable, Writable} from 'node:stream';
import pump from 'pump';
import type {JsonRpcMessage} from './types.ts';
import {
	log, nullJsonDecoder, nullJsonEncoder, addRpcVersion, timeout,
} from './stream-transforms.ts';
import {AbstractChannel} from './abstract-channel.ts';

type SocketConnectionInfo = {host: string; port: number};

export class SocketChannel extends AbstractChannel {
	protected finished = false;
	protected errors: Error[] = [];

	private readonly readStream: Readable;

	private readonly writeStream: Writable;

	private readonly socket: Socket;

	private readonly forwardedEvents: Array<[string, (...args: unknown[]) => void]>;

	private readonly connectionInfo: SocketConnectionInfo;

	constructor(socket: Socket, connectionInfo: SocketConnectionInfo) {
		super();
		this.socket = socket;
		this.connectionInfo = connectionInfo;

		this.forwardedEvents = ['close', 'connect', 'end', 'ready', 'lookup', 'timeout']
			.map(eventName => {
				const handler = (...args: unknown[]) => {
					this.emit(eventName, ...args);
				};

				this.socket.on(eventName, handler);

				return [eventName, handler];
			});

		this.once('error', this.destroy);

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
		this.readStream.on('data', this.onMessage);
	}

	connect(): void {
		this.socket.connect(this.connectionInfo);
	}

	send(message: JsonRpcMessage): void {
		this.writeStream.write(message);
	}

	destroy = (error?: Error) => {
		this.socket.destroy(error);
		this.readStream.destroy(error);
		this.writeStream.destroy(error);
		for (const [eventName, handler] of this.forwardedEvents) {
			this.socket.off(eventName, handler);
		}
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
			this.emit('error', error);
		}

		if (this.finished) {
			return;
		}

		this.finished = true;
		this.emit('finish', error);
	}
}
