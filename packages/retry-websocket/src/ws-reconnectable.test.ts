import {test, expect} from 'vitest';
import {getNextDelay} from '@qsys-tools/reconnectable';
import {getNextUrl, getNextProtocols} from './ws-reconnectable.ts';

test('URL provider', async () => {
	const url = 'example.com';

	expect(await getNextUrl(url)).toBe(url);

	expect(await getNextUrl(() => url)).toBe(url);

	expect(await getNextUrl(async () => url)).toBe(url);

	// @ts-expect-error - We know it wrong
	await expect(async () => getNextUrl(123)).rejects.toThrow();

	// @ts-expect-error - We know it wrong
	await expect(async () => getNextDelay(() => 123)).rejects.toThrow();
});

test('websocket invalid protocolsProvider', async () => {
	// @ts-expect-error - accessing private property
	await expect(async () => getNextProtocols(() => /Hahaha/v)).rejects.toThrow();
});
