import {EventEmitter} from 'events';
import {AddressInfo, Socket, SocketConnectOpts} from 'net';

interface Connectable {
	connect(portPathOrOptions: number | string | SocketConnectOpts, connectionListener?: () => void): this;

	connect(port: number, host: string, connectionListener?: () => void): this;
}

export default abstract class SocketWrapper extends EventEmitter implements Connectable {
	abstract readonly socket: Socket;

	protected abstract readonly _forwardedEvents: any = {};

	get bufferSize(): number {
		return this.socket.bufferSize;
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

	get localAddress(): string {
		return this.socket.localAddress;
	}

	get localPort(): number {
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

	connect(arg0: any, ...args: any[]): this {
		this.socket.connect(arg0, ...args);
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
