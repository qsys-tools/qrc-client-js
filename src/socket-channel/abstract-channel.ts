import EventEmitter from 'node:events';
import type {JsonRpcMessage} from '../json-rpc.ts';
import type {CommunicationChannel} from './communication-channel.ts';

// eslint-disable-next-line unicorn/prefer-event-target
export abstract class AbstractChannel extends EventEmitter implements CommunicationChannel {
	private readonly callbacks: Array<(message: JsonRpcMessage) => void> = [];

	subscribe(callback: (message: JsonRpcMessage) => void): () => void {
		this.callbacks.push(callback);
		return () => {
			const index = this.callbacks.indexOf(callback);
			if (index !== -1) {
				this.callbacks.splice(index, 1);
			}
		};
	}

	abstract end(): void;
	abstract send(message: JsonRpcMessage): void;
	abstract connect(): void;

	protected readonly onMessage = (data: JsonRpcMessage): void => {
		const callbacks = [...this.callbacks];
		for (const callback of callbacks) {
			callback(data);
		}
	};
}
