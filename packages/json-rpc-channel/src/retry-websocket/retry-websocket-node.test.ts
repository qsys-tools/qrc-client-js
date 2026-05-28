/**
 * @vitest-environment node
 */
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	test,
	vitest,
} from 'vitest';
import NodeWebSocket, {WebSocketServer, type Server} from 'ws';
import ReconnectingWebSocket from './retry-websocket.ts';
import {wsReconnectable} from './ws-reconnectable.ts';

const PORT = 50_122;
const URL = `ws://localhost:${PORT}/`;

let wss: Server;
const originalWebSocket = globalThis.WebSocket;

function testDone(
	name: string,
	fn: (resolve: () => void, reject: (error: unknown) => void) => void,
) {
	test(name, toPromise(fn));
}

function toPromise(fn: (resolve: () => void, reject: (error: unknown) => void) => void) {
	return async () =>
		new Promise<void>((resolve, reject) => {
			fn(resolve, reject);
		});
}

beforeAll(() => {
	wss = new WebSocketServer({port: PORT});
});

beforeEach(() => {
	globalThis.WebSocket = originalWebSocket;
});

afterEach(() => {
	vitest.restoreAllMocks();
});

afterAll(async () =>
	new Promise<void>(resolve => {
		for (const client of wss.clients) {
			client.terminate();
		}

		wss.close(() => {
			resolve();
		});
	}));

test('throws with invalid constructor', () => {
	// @ts-expect-error We're doing it anyway
	delete globalThis.WebSocket;
	expect(() => {
		// @ts-expect-error That's what we're testing
		const wsRc = wsReconnectable(URL, undefined, 123);
		wsRc.createChannel(`ws://localhost:${PORT}/`, null);
	}).toThrow();
});

test('throws with missing constructor', () => {
	// @ts-expect-error We're doing it anyway
	delete globalThis.WebSocket;
	expect(() => {
		const wsRc = wsReconnectable(URL, undefined);
		wsRc.createChannel(`ws://localhost:${PORT}/`, null);
	}).toThrow();
});

test('throws with non-constructor object', () => {
	// @ts-expect-error We're doing it anyway
	globalThis.WebSocket = {};
	expect(() => {
		const wsRc = wsReconnectable(URL, undefined);
		wsRc.createChannel(`ws://localhost:${PORT}/`, null);
	}).toThrow();
});

test('will allow ws to be created', () => {
	// @ts-expect-error We're doing it anyway
	globalThis.WebSocket = {};
	expect(() => {
		// @ts-expect-error - Fix this
		const wsRc = wsReconnectable(URL, undefined, NodeWebSocket);
		wsRc.createChannel(`ws://localhost:${PORT}/`, null);
	}).not.toThrow();
});

testDone('pass WebSocket via options', done => {
	// @ts-expect-error We're doing it anyway
	delete globalThis.WebSocket;
	const ws = new ReconnectingWebSocket(URL, undefined, {
		WebSocket: NodeWebSocket,
		maxRetries: 0,
	});
	ws.reconnect();
	ws.addEventListener('open', () => {
		// @ts-expect-error - accessing private property
		expect(ws._ws instanceof NodeWebSocket).toBe(true);
		ws.close();
		done();
	});
});
