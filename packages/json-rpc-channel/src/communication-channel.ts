import type {JsonRpcMessage} from './json-rpc.ts';
import type {IntermediateEventTarget, CommunicationChannelEventMap} from './events.ts';

export type CommunicationChannel = IntermediateEventTarget<CommunicationChannelEventMap> & {
	send: (message: JsonRpcMessage) => void;
	close: () => void;
	connect: () => void;
};
