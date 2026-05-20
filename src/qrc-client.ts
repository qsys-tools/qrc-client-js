/* eslint-disable unicorn/prefer-event-target */
import EventEmitter from 'node:events';
import type {
	JsonRpcMessage,
	JsonRpcRequest,
} from './json-rpc.ts';
import {type PartialQrcCommand} from './commands.ts';
import UidMap from './lib/uid-map.ts';
import QrcError from './lib/qrc-error.ts';
import {
	noopValidator,
	type Validator,
	type CommandMethod,
	type InferCommandParams,
	type InferResponseResult,
} from './validation/index.ts';
import {QrcPollGroup} from './lib/poll-group.ts';
import type {CommunicationChannel} from './socket-channel/communication-channel.ts';
import {promiseWithResolvers, type PromiseWithResolvers} from './lib/utils.ts';

type SendArgs<M extends CommandMethod>
	= [PartialQrcCommand<M>]
		| (undefined extends InferCommandParams<M>
			? [M] | [M, undefined]
			: [M, InferCommandParams<M>]
	);

export type QrcClientOptions = {
	channel: CommunicationChannel & EventEmitter;
	validator?: Validator;
};

type ResolversWithMethod = PromiseWithResolvers<any> & {method: CommandMethod};

export default class QrcClient {
	readonly validator: Validator;

	readonly channel: CommunicationChannel & EventEmitter;
	readonly channelUnsub: () => void;

	private readonly _map = new UidMap<ResolversWithMethod>();
	private readonly pollGroups = new Map<string, QrcPollGroup>();

	private readonly requestHandlers = new EventEmitter();

	constructor({validator = noopValidator, channel}: QrcClientOptions) {
		this.validator = validator;
		this.channel = channel;
		this.channelUnsub = channel.subscribe(this._data);
		this.requestHandlers.on('ChangeGroup.Poll', this.handleChangeGroupPoll);
	}

	async send<M extends CommandMethod>(method: M, parameters: InferCommandParams<M>): Promise<InferResponseResult<M>>;
	async send<M extends CommandMethod>(method: undefined extends InferCommandParams<M> ? M : never): Promise<InferResponseResult<M>>;
	async send<M extends CommandMethod>(command: PartialQrcCommand<M>): Promise<InferResponseResult<M>>;
	async send<M extends CommandMethod>(...args: SendArgs<M>) {
		const method = typeof args[0] === 'string' ? args[0] : args[0].method;
		// @ts-expect-error types are hard
		const parameters: InferCommandParams<M> = typeof args[0] === 'string' ? args[1] : ('params' in args[0] ? args[0].params : undefined);

		const {resolve, reject, promise: rawPromise} = promiseWithResolvers<InferResponseResult<M>>();
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
			this.channel.send({...this.validator.createCommand(method, parameters), id});
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

	private readonly _data = (message: JsonRpcMessage) => {
		if ('result' in message || 'error' in message || ('id' in message && this._map.looseHas(message.id))) {
			if (typeof message.id !== 'string') {
				console.warn(`Received a non-string Id: ${message.id}... Which doesn't make sense. `);
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
				const result: unknown = 'result' in message ? message.result : undefined;
				resolvers.resolve(this.validator.parseResponseResult(resolvers.method, result));
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
