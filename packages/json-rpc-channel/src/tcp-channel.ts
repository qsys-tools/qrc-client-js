// Import type {CommunicationChannel} from './communication-channel.ts';

export type Options = {
	maxReconnectionDelay?: number;
	minReconnectionDelay?: number;
	reconnectionDelayGrowFactor?: number;
	minUptime?: number;
	connectionTimeout?: number;
	maxRetries?: number;
	maxEnqueuedMessages?: number;
	debug?: boolean;
	debugLogger?: (...args: any[]) => void;
};

/**
Export class TcpChannel extends EventTarget implements CommunicationChannel {

} */
