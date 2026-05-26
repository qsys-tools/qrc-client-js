export const enum ReconnectState {
	CONNECTING = 0,
	OPEN = 1,
	CLOSING = 2,
	CLOSED = 3,
	RECONNECTING = 4,
	IDLE = 5,
}

export type RcEventNames = 'open' | 'close' | 'error' | 'message';
export type ReconnectableEventMap = Record<RcEventNames, Event>;

type ReconnectableListeners<Map extends ReconnectableEventMap> = {
	[K in RcEventNames]: (event: Map[K]) => void;
};

export type ArgTypes = 'create' | 'connect' | 'close';
export type RcArgMap = {
	create: unknown[];
	connect: unknown[];
	close: unknown[];
};

export type OptionalArgs<T extends unknown[]>
	= T extends [... infer Rest, infer Last]
		? (undefined extends Last
			? T | OptionalArgs<[...Rest]>
			: T)
		: T;

export type Reconnectable<Channel, SendMessage, EventMap extends ReconnectableEventMap, ArgMap extends RcArgMap> = {
	makeCreateArgs: () => Promise<ArgMap['create']> | ArgMap['create'];
	createChannel: (...args: OptionalArgs<ArgMap['create']>) => Channel;
	attachListeners: (channel: Channel, listeners: ReconnectableListeners<EventMap>) => () => void;
	closeChannel: (channel: Channel, ...args: OptionalArgs<ArgMap['close']>) => void;
	send: (channel: Channel, message: SendMessage) => void;
} & ({
	connectsAtCreation: true;
} | {
	connectsAtCreation: false;
	makeConnectArgs: () => Promise<OptionalArgs<ArgMap['connect']>> | OptionalArgs<ArgMap['connect']>;
	connectChannel: (channel: Channel, ...args: OptionalArgs<ArgMap['connect']>) => void;
});
