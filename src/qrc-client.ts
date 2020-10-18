import {Readable, Writable} from 'stream';
import {Socket} from 'net';
import pump from 'pump';
// @ts-expect-error
import AnyObservable from 'any-observable';
import {
	Observable,
	AutoPollUpdate,
	JsonRpcError,
	JsonRpcRequest,
	JsonRpcResponse,
	ResponseHandler,
	CMDp, Observer
} from './types';
import {autoPollGroup, destroyGroup, noOp} from './commands';
import {log, nullJsonDecoder, nullJsonEncoder, addRpcVersion, timeout} from './lib/stream-transforms';
import UidMap from './lib/uid-map';
import QrcError from './lib/qrc-error';
import SocketWrapper from './lib/socket-wrapper';

export default class QrcClient extends SocketWrapper {
	readonly readStream: Readable;

	readonly writeStream: Writable;

	readonly socket: Socket = new Socket();

	protected readonly _forwardedEvents: any = {};

	private readonly _map = new UidMap<ResponseHandler<any>>();

	constructor() {
		super();

		['close', 'connect', 'end', 'ready', 'lookup', 'timeout'].forEach(eventName => {
			this._forwardedEvents[eventName] = (...args: any[]) => this.emit(eventName, ...args);
		});

		this.once('error', () => this.destroy());

		this._connectForwardedEvents(this.socket);

		this.readStream = log('received: ');

		let finished = false;
		const errors: any[] = [];

		const finish = (err: any): void => {
			if (err && !errors.includes(err)) {
				errors.push(err);
				this.emit('error', err);
			}

			if (finished) {
				return;
			}

			finished = true;
			this.emit('finish', err);
		};

		pump(
			this.socket,
			nullJsonDecoder(),
			this.readStream,
			finish
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
			finish
		);

		this.readStream.on('data', this._data);
	}

	destroy = (error?: Error): void => {
		this.socket.destroy(error);
		this.readStream.destroy(error);
		this._disconnectForwardedEvents(this.socket);
	};

	async send<T>(command: CMDp<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			const id = this._map.put((err: JsonRpcError | null, result?: T): void => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});

			this.writeStream.write({...command, id});
		});
	}

	pollGroup(groupId: string, {rate = 0.2, autoDestroy = false}: {rate?: number; autoDestroy?: boolean} = {}): Observable<AutoPollUpdate> {
		return new AnyObservable((observer: Observer<AutoPollUpdate>) => {
			const handler = ({method, params}: JsonRpcRequest): void => {
				if (method === 'ChangeGroup.Poll') {
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
		if (data.result || data.error) {
			const response = (data as JsonRpcResponse<any>);
			if (typeof response.id === 'number') {
				const callback: ResponseHandler<any> | undefined = this._map.pull(data.id);
				if (callback) {
					if (response.error) {
						callback(new QrcError(response.error));
					} else {
						callback(null, response.result);
					}
				}
			}
		} else {
			const request = (data as JsonRpcRequest);
			this.emit('request', request);
		}
	};
}
