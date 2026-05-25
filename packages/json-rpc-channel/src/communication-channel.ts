import type {TypedEventTarget} from 'typescript-event-target';
import type {JsonRpcMessage} from './json-rpc.ts';
import type {CommunicationChannelEventMap} from './events.ts';

export type CommunicationChannel = TypedEventTarget<CommunicationChannelEventMap> & {
	send: (message: JsonRpcMessage) => void;
	close: () => void;
	connect: () => void;
};
