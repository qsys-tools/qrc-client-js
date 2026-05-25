import {
	expect,
	test,
} from 'vitest';
import {getNextDelay, type RetryDelayOptions} from './retry-delay.ts';

test('retry delay', () => {
	const options = {
		maxReconnectionDelay: 300,
		minReconnectionDelay: 20,
		reconnectionDelayGrowFactor: 2,
	} satisfies RetryDelayOptions;

	const expectedDelays = [0, 20, 40, 80, 160, 300, 300];

	for (const [retryCount, expectedDelay] of expectedDelays.entries()) {
		expect(getNextDelay(retryCount, options), `retryCount ${retryCount}`).toBe(expectedDelay);
	}
});
