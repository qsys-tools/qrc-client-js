import { Socket } from 'node:net';
import pump from 'pump';
import AnyObservable from 'any-observable';
import { autoPollGroup, destroyGroup, noOp } from './commands.js';
import { log, nullJsonDecoder, nullJsonEncoder, addRpcVersion, timeout, } from './lib/stream-transforms.js';
import UidMap from './lib/uid-map.js';
import QrcError from './lib/qrc-error.js';
import SocketWrapper from './lib/socket-wrapper.js';
export default class QrcClient extends SocketWrapper {
    readStream;
    writeStream;
    socket = new Socket();
    _forwardedEvents = {};
    _map = new UidMap();
    constructor() {
        super();
        for (const eventName of ['close', 'connect', 'end', 'ready', 'lookup', 'timeout']) {
            this._forwardedEvents[eventName] = (...args) => this.emit(eventName, ...args);
        }
        this.once('error', () => {
            this.destroy();
        });
        this._connectForwardedEvents(this.socket);
        this.readStream = log('received: ');
        let finished = false;
        const errors = [];
        const finish = (error) => {
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
        pump(this.socket, nullJsonDecoder(), this.readStream, finish);
        this.writeStream = addRpcVersion();
        pump(this.writeStream, timeout(5000, () => {
            this.writeStream.write(noOp());
        }), log('sending: '), nullJsonEncoder(), this.socket, finish);
        this.readStream.on('data', this._data);
    }
    destroy = (error) => {
        this.socket.destroy(error);
        this.readStream.destroy(error);
        this._disconnectForwardedEvents(this.socket);
    };
    async send(command) {
        return new Promise((resolve, reject) => {
            const id = this._map.put((error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
            this.writeStream.write({ ...command, id });
        });
    }
    pollGroup(groupId, { rate = 0.2, autoDestroy = false } = {}) {
        return new AnyObservable((observer) => {
            const handler = ({ method, params }) => {
                if (method === 'ChangeGroup.Poll') {
                    const update = params;
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
    _data = (data) => {
        if (data.result || data.error) {
            const response = data;
            if (typeof response.id === 'number') {
                const callback = this._map.pull(data.id);
                if (callback) {
                    if (response.error) {
                        callback(new QrcError(response.error));
                    }
                    else {
                        callback(undefined, response.result);
                    }
                }
            }
        }
        else {
            const request = data;
            this.emit('request', request);
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXJjLWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvamFtZXN0YWxtYWdlL1dlYnN0b3JtUHJvamVjdHMvcXJjLWNsaWVudC1qcy8iLCJzb3VyY2VzIjpbInNyYy9xcmMtY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sYUFBYSxNQUFNLGdCQUFnQixDQUFDO0FBUzNDLE9BQU8sRUFBQyxhQUFhLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRSxPQUFPLEVBQ04sR0FBRyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLE9BQU8sR0FDN0QsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLE1BQU0sTUFBTSxrQkFBa0IsQ0FBQztBQUN0QyxPQUFPLFFBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUMxQyxPQUFPLGFBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRCxNQUFNLENBQUMsT0FBTyxPQUFPLFNBQVUsU0FBUSxhQUFhO0lBQzFDLFVBQVUsQ0FBVztJQUVyQixXQUFXLENBQVc7SUFFdEIsTUFBTSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7SUFFcEIsZ0JBQWdCLEdBQVEsRUFBRSxDQUFDO0lBRTdCLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBd0IsQ0FBQztJQUUzRDtRQUNDLEtBQUssRUFBRSxDQUFDO1FBRVIsS0FBSyxNQUFNLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUNuRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxT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