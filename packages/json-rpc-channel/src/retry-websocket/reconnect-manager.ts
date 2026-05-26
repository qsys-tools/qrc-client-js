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

export type Reconnectable<Channel, SendMessage, EventMap extends ReconnectableEventMap, CreateArgs = unknown, ConnectArgs = unknown> = {
	makeCreateArgs: () => Promise<CreateArgs> | CreateArgs;
	createChannel: (createArgs: CreateArgs, lastChannel?: Channel) => Channel;
	attachListeners: (channel: Channel, listeners: ReconnectableListeners<EventMap>) => () => void;
	closeChannel: (channel: Channel) => void;
	send: (channel: Channel, message: SendMessage) => void;
} & ({
	connectsAtCreation: true;
} | {
	connectsAtCreation: false;
	makeConnectArgs: () => Promise<ConnectArgs> | ConnectArgs;
	connectChannel: (channel: Channel, connect: ConnectArgs) => void;
});
