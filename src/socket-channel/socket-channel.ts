import type {Socket} from 'node:net';
import type {Readable, Writable} from 'node:stream';
import EventEmitter from 'node:events';
import pump from 'pump';
import type {CommunicationChannel} from '../communication-channel.ts';
import type {JsonRpcMessage} from '../json-rpc.ts';
import {
	log, nullJsonDecoder, nullJsonEncoder, addRpcVersion, timeout,
} from './stream-transforms.ts';

// eslint-disable-next-line unicorn/prefer-event-target
export class SocketChannel extends EventEmitter implements CommunicationChannel {
	protected finished = false;
	protected errors: Error[] = [];

	private readonly readStream: Readable;

	private readonly writeStream: Writable;

	private readonly socket: Socket;

	private readonly callbacks: Array<(message: JsonRpcMessage) => void> = [];

	private readonly forwardedEvents: Array<[string, (...args: unknown[]) => void]>;

	constructor(socket: Socket) {
		super();
		this.socket = socket;

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
		this.readStream.on('data', this.onData);
	}

	send(message: JsonRpcMessage): void {
		this.writeStream.write(message);
	}

	subscribe(callback: (message: JsonRpcMessage) => void): () => void {
		this.callbacks.push(callback);
		return () => {
			const index = this.callbacks.indexOf(callback);
			if (index !== -1) {
				this.callbacks.splice(index, 1);
			}
		};
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

	private readonly onData = (data: JsonRpcMessage): void => {
		const callbacks = [...this.callbacks];
		for (const callback of callbacks) {
			callback(data);
		}
	};
}
