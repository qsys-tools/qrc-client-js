export type RetryDelayOptions = {
	maxReconnectionDelay?: number;
	minReconnectionDelay?: number;
	reconnectionDelayGrowFactor?: number;
};

const DEFAULT = {
	maxReconnectionDelay: 10_000,
	minReconnectionDelay: 3000,
	reconnectionDelayGrowFactor: 1.3,
} satisfies Required<RetryDelayOptions>;

export const getNextDelay = (retryCount: number, options: RetryDelayOptions) => {
	const {
		reconnectionDelayGrowFactor = DEFAULT.reconnectionDelayGrowFactor,
		minReconnectionDelay = DEFAULT.minReconnectionDelay,
		maxReconnectionDelay = DEFAULT.maxReconnectionDelay,
	} = options;
	let delay = 0;
	if (retryCount > 0) {
		delay
			= minReconnectionDelay
				* (reconnectionDelayGrowFactor ** (retryCount - 1));
		if (delay > maxReconnectionDelay) {
			delay = maxReconnectionDelay;
		}
	}

	return delay;
};
