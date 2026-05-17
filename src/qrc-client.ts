/* eslint-disable unicorn/prefer-event-target */
import {type Readable, type Writable} from 'node:stream';
import {type Socket} from 'node:net';
import EventEmitter from 'node:events';
import pump from 'pump';
import {
	type JsonRpcRequest,
	type JsonRpcResponse,
} from './types.ts';
import {
	noOp, type PartialQrcCommand,
} from './commands.ts';
import {
	log, nullJsonDecoder, nullJsonEncoder, addRpcVersion, timeout,
} from './lib/stream-transforms.ts';
import UidMap from './lib/uid-map.ts';
import QrcError from './lib/qrc-error.ts';
import {
	noopValidator,
	type Validator,
	type CommandMethod,
	type MethodWithoutParams,
	type MethodWithParams,
	type InferCommandParams,
	type InferResponseResult,
} from './validation/index.ts';
import {QrcPollGroup} from './lib/poll-group.ts';

type SendArgs<M extends CommandMethod>
	= [PartialQrcCommand<M>]
		| (M extends MethodWithoutParams
			? [M]
			: M extends MethodWithParams
				? [M, InferCommandParams<M>]
				: never
	);

export type QrcClientOptions = {
	socket: Socket;
	validator?: Validator;
};

export default class QrcClient extends EventEmitter {
	readonly validator: Validator;

	readonly readStream: Readable;

	readonly writeStream: Writable;

	readonly socket;

	private readonly _map = new UidMap<PromiseWithResolvers<any> & {method: CommandMethod}>();
	private readonly pollGroups = new Map<string, QrcPollGroup>();

	private readonly requestHandlers = new EventEmitter();

	private readonly forwardedEvents: Array<[string, (...args: unknown[]) => void]>;

	constructor({validator = noopValidator, socket}: QrcClientOptions) {
		super();
		this.socket = socket;
		this.validator = validator;

		this.forwardedEvents = ['close', 'connect', 'end', 'ready', 'lookup', 'timeout']
			.map(eventName => {
				const handler = (...args: unknown[]) => {
					this.emit(eventName, ...args);
				};

				this.socket.on(eventName, handler);

				return [eventName, handler];
			});

		this.once('error', this.destroy);

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
		this.requestHandlers.on('ChangeGroup.Poll', this.handleChangeGroupPoll);
	}

	end = () => {
		this.socket.end();
	};

	destroy = (error?: Error) => {
		this.socket.destroy(error);
		this.readStream.destroy(error);
		for (const [eventName, handler] of this.forwardedEvents) {
			this.socket.off(eventName, handler);
		}
	};

	// eslint-disable-next-line @typescript-eslint/unified-signatures
	async send<M extends MethodWithParams>(method: M, parameters: InferCommandParams<M>): Promise<InferResponseResult<M>>;
	async send<M extends MethodWithoutParams>(method: M): Promise<InferResponseResult<M>>;
	async send<M extends CommandMethod>(command: PartialQrcCommand<M>): Promise<InferResponseResult<M>>;
	async send<M extends CommandMethod>(...args: SendArgs<M>) {
		const method = typeof args[0] === 'string' ? args[0] : args[0].method;
		// @ts-expect-error types are hard
		const parameters: InferCommandParams<M> = typeof args[0] === 'string' ? args[1] : ('params' in args[0] ? args[0].params : undefined);

		const {resolve, reject, promise: rawPromise} = Promise.withResolvers<InferResponseResult<M>>();
		const promise = rawPromise.finally(() => {
			this._map.delete(id);
		});
		const id = this._map.put({
			method,
			resolve,
			reject,
			promise,
		});

		try {
			this.writeStream.write({...this.validator.createCommand(method, parameters), id});
		} catch (error) {
			reject(error);
		}

		return promise;
	}

	pollGroup(groupId: string) {
		let pollGroup = this.pollGroups.get(groupId);
		if (!pollGroup) {
			pollGroup = new QrcPollGroup(this, groupId);
			this.pollGroups.set(groupId, pollGroup);
		}

		return pollGroup;
	}

	private readonly _data = (message: JsonRpcRequest | JsonRpcResponse) => {
		if ('result' in message || 'error' in message) {
			if (typeof message.id !== 'number') {
				console.warn(`Received a non-numeric Id: ${message.id}... Which doesn't make sense. `);
				return;
			}

			const resolvers = this._map.pull(message.id);

			if (!resolvers) {
				return;
			}

			if ('error' in message) {
				resolvers.reject(new QrcError(message.error));
				return;
			}

			try {
				resolvers.resolve(this.validator.parseResponseResult(resolvers.method, message.result));
			} catch (error) {
				resolvers.reject(error);
			}

			return;
		}

		this.requestHandlers.emit(message.method, message);
	};

	private readonly handleChangeGroupPoll = (message: JsonRpcRequest) => {
		const {params} = message;
		const update = this.validator.parseResponseResult('ChangeGroup.Poll', params);
		if (update?.Changes?.length > 0) {
			const pollGroup = this.pollGroups.get(update.Id);

			if (pollGroup) {
				pollGroup._handleAutoPollUpdate(update);
			}
		}
	};
}
