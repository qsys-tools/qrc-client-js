import type {AddressInfo, Socket, SocketConnectOpts} from 'node:net';
import EventEmitter from 'node:events';

type Connectable = {
	connect(portPathOrOptions: number | string | SocketConnectOpts, connectionListener?: () => void): Connectable;

	connect(port: number, host: string, connectionListener?: () => void): Connectable;
};

// eslint-disable-next-line unicorn/prefer-event-target
export default abstract class SocketWrapper extends EventEmitter implements Connectable {
	abstract readonly socket: Socket;

	protected readonly _forwardedEvents: Record<string, (...args: any[]) => void> = {};

	get bufferSize(): number {
		// eslint-disable-next-line @typescript-eslint/no-deprecated
		return this.socket.bufferSize;
	}

	get writableLength(): number {
		return this.socket.writableLength;
	}

	get bytesRead(): number {
		return this.socket.bytesRead;
	}

	get bytesWritten(): number {
		return this.socket.bytesWritten;
	}

	get connecting(): boolean {
		return this.socket.connecting;
	}

	get localAddress(): string | undefined {
		return this.socket.localAddress;
	}

	get localPort(): number | undefined {
		return this.socket.localPort;
	}

	get remoteAddress(): string | undefined {
		return this.socket.remoteAddress;
	}

	get remoteFamily(): string | undefined {
		return this.socket.remoteFamily;
	}

	get remotePort(): number | undefined {
		return this.socket.remotePort;
	}

	address(): Record<string, unknown> | AddressInfo {
		return this.socket.address();
	}

	connect(options: SocketConnectOpts, connectionListener?: () => void): this;
	connect(port: number, host: string, connectionListener?: () => void): this;
	connect(port: number, connectionListener?: () => void): this;
	connect(path: string, connectionListener?: () => void): this;
	connect(...args: any[]): this {
		// @ts-expect-error just passing args
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.socket.connect(...args);
		return this;
	}

	end(): void {
		this.socket.end();
	}

	setTimeout(timeout: number, callback?: () => void): this {
		this.socket.setTimeout(timeout, callback);
		return this;
	}

	protected _connectForwardedEvents(socket: EventEmitter): EventEmitter {
		if (socket) {
			for (const key of Object.keys(this._forwardedEvents)) {
				socket.on(key, this._forwardedEvents[key]);
			}
		}

		return socket;
	}

	protected _disconnectForwardedEvents(socket: EventEmitter): EventEmitter {
		if (socket) {
			for (const key of Object.keys(this._forwardedEvents)) {
				socket.off(key, this._forwardedEvents[key]);
			}
		}

		return socket;
	}
}
