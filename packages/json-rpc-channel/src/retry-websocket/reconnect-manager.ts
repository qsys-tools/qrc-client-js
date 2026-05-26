export const enum ReconnectState {
	CONNECTING = 0,
	OPEN = 1,
	CLOSING = 2,
	CLOSED = 3,
	RECONNECTING = 4,
	IDLE = 5,
}

type ReconnectableListeners<Message> = {
	open: () => void;
	close: () => void;
	error: (error: Error) => void;
	message: (event: Message) => void;
};

export type Reconnectable<Channel, ReceiveMessage, SendMessage = ReceiveMessage, CreateArgs = unknown, ConnectArgs = unknown> = {
	makeCreateArgs: () => Promise<CreateArgs> | CreateArgs;
	createChannel: (createArgs: CreateArgs, lastChannel: Channel) => Channel;
	attachListeners: (channel: Channel, listeners: ReconnectableListeners<ReceiveMessage>) => () => void;
	closeChannel: (channel: Channel) => void;
	send: (channel: Channel, message: SendMessage) => void;
} & ({
	connectsAtCreation: true;
} | {
	connectsAtCreation: false;
	makeConnectArgs: () => Promise<ConnectArgs> | ConnectArgs;
	connectChannel: (channel: Channel, connect: ConnectArgs) => void;
});
