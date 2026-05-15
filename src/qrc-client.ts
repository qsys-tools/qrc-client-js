import {type Readable, type Writable} from 'node:stream';
import {Socket} from 'node:net';
import pump from 'pump';
import AnyObservable from 'any-observable';
import {
	type AutoPollUpdate,
	type JsonRpcRequest,
	type JsonRpcResponse,
	type ResponseHandler,
} from './types.ts';
import {
	autoPollGroup, destroyGroup, noOp, type PartialQrcCommand,
} from './commands.ts';
import {
	log, nullJsonDecoder, nullJsonEncoder, addRpcVersion, timeout,
} from './lib/stream-transforms.ts';
import UidMap from './lib/uid-map.ts';
import QrcError from './lib/qrc-error.ts';
import SocketWrapper from './lib/socket-wrapper.ts';
import type {ObservableConstructor} from './lib/observable.ts';
import {
	createCommand,
	type CommandMethod,
	type MethodWithoutParams,
	type MethodWithParams,
	type InferCommandParams,
} from './validation/parse-request.ts';
import {parseResponseResult, strictlyParseResponseResult, type InferResponseResult} from './validation/parse-response.ts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const Observable = AnyObservable as ObservableConstructor;

type SendArgs<M extends CommandMethod>
	= [PartialQrcCommand<M>]
		| (M extends MethodWithoutParams
			? [M]
			: M extends MethodWithParams
				? [M, InferCommandParams<M>]
				: never
	);

export default class QrcClient extends SocketWrapper {
	readonly readStream: Readable;

	readonly writeStream: Writable;

	readonly socket: Socket = new Socket();

	private readonly _map = new UidMap<ResponseHandler<any>>();

	constructor() {
		super();

		for (const eventName of ['close', 'connect', 'end', 'ready', 'lookup', 'timeout']) {
			this._forwardedEvents[eventName] = (...args: unknown[]) => {
				this.emit(eventName, ...args);
			};
		}

		this.once('error', () => {
			this.destroy();
		});

		this._connectForwardedEvents(this.socket);

		this.readStream = log('received: ');

		let finished = false;
		const errors: any[] = [];

		const finish = (error: any): void => {
			if (error && !errors.includes(error)) {
				errors.push(error);
				this.emit('error', error);
			}

			if (finished) {
				return;
			}

			finished = true;
			this.emit('finish', error);
		};

		pump(
			this.socket,
			nullJsonDecoder(),
			this.readStream,
			finish,
		);

		this.writeStream = addRpcVersion();
		pump(
			this.writeStream,
			timeout(5000, () => {
				this.writeStream.write(noOp());
			}),
			log('sending: '),
			nullJsonEncoder(),
			this.socket,
			finish,
		);

		this.readStream.on('data', this._data);
	}

	destroy = (error?: Error): void => {
		this.socket.destroy(error);
		this.readStream.destroy(error);
		this._disconnectForwardedEvents(this.socket);
	};

	// eslint-disable-next-line @typescript-eslint/unified-signatures
	async send<M extends MethodWithParams>(method: M, parameters: InferCommandParams<M>): Promise<InferResponseResult<M>>;
	async send<M extends MethodWithoutParams>(method: M): Promise<InferResponseResult<M>>;
	async send<M extends CommandMethod>(command: PartialQrcCommand<M>): Promise<InferResponseResult<M>>;
	async send<M extends CommandMethod>(...args: SendArgs<M>) {
		const method = typeof args[0] === 'string' ? args[0] : args[0].method;
		// @ts-expect-error types are hard
		const parameters: InferCommandParams<M> = typeof args[0] === 'string' ? args[1] : ('params' in args[0] ? args[0].params : undefined);
		return new Promise((resolve, reject) => {
			const id = this._map.put((error: QrcError | undefined, result?: InferResponseResult<M>): void => {
				if (error) {
					reject(error);
				} else {
					resolve(parseResponseResult(method, result));
				}
			});

			// @ts-expect-error types are hard
			this.writeStream.write({...createCommand(method, parameters), id});
		});
	}

	pollGroup(groupId: string, {rate = 0.2, autoDestroy = false}: {rate?: number; autoDestroy?: boolean} = {}) {
		return new Observable<AutoPollUpdate>(observer => {
			const handler = ({method, params}: JsonRpcRequest): void => {
				if (method === 'ChangeGroup.Poll') {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
					const update = params as unknown as AutoPollUpdate;
					if (update.Id === groupId && update.Changes && (update.Changes.length > 0)) {
						observer.next(update);
					}
				}
			};

			this.on('request', handler);

			void this.send(autoPollGroup(groupId, rate));

			return () => {
				if (autoDestroy) {
					void this.send(destroyGroup(groupId));
				}

				this.off('request', handler);
			};
		});
	}

	private readonly _data = (data: any) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (data.result ?? data.error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const response = (data as JsonRpcResponse<any>);
			if (typeof response.id === 'number') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
				const callback: ResponseHandler<any> | undefined = this._map.pull(data.id);
				if (callback) {
					if (response.error) {
						callback(new QrcError(response.error));
					} else {
						callback(undefined, response.result);
					}
				}
			}
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const request = (data as JsonRpcRequest);
			this.emit('request', request);
		}
	};
}
