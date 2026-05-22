import type {JsonRpcMessage} from '../json-rpc.ts';

export type CommunicationChannel = {
	send: (message: JsonRpcMessage) => void;
	subscribe: (callback: (message: JsonRpcMessage) => void) => () => void;
	end: () => void;
	connect: () => void;
};
