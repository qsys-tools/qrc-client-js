import {
	type Readable, type Writable, type Duplex, type Transform, pipeline,
} from 'node:stream';
import {objectTransform} from 'through2';
import split from 'split2';
import duplexify from 'duplexify';

const NULL_CHAR = '\u0000';

// Converts a "Null Terminated JSON" byte stream into an object stream.
export const nullJsonDecoder = (): Transform => split(NULL_CHAR, JSON.parse);

// Converts an object stream into a "Null Terminated JSON" byte stream.
export const nullJsonEncoder = (): Transform => objectTransform(async function * (src: AsyncIterable<any>) {
	for await (const object of src) {
		yield JSON.stringify(object);
		yield NULL_CHAR;
	}
});

export const timeout = (timeout: number, cb: () => void): Transform => {
	let id: NodeJS.Timeout;

	const reset = (): void => {
		clearTimeout(id);
		id = setTimeout(handler, timeout);
	};

	const handler = (): void => {
		reset();
		cb();
	};

	const stream = objectTransform(async function * (src: AsyncIterable<any>) {
		for await (const object of src) {
			reset();
			yield object;
		}
	});

	stream.on('close', () => {
		clearTimeout(id);
	});

	return stream;
};

export const rpcNoOpTimeout = (timeoutMs = 5000) => {
	const stream = timeout(timeoutMs, () => {
		stream.write({
			jsonrpc: '2.0',
			method: 'NoOp',
			params: {},
		});
	});

	return stream;
};

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type FinishCallback = (error: Error | null) => void;
// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type DirectionalFinishCallback = (direction: 'read' | 'write', error: Error | null) => void;

export const buildReadStream = (socket: Readable, finish: FinishCallback) => pipeline(
	socket,
	nullJsonDecoder(),
	finish,
);

export const buildWriteStream = (socket: Writable, finish: FinishCallback) => {
	const writeStream = rpcNoOpTimeout();
	pipeline(writeStream, nullJsonEncoder(), socket, finish);
	return writeStream;
};

export const buildDuplexStream = (socket: Duplex, finish: DirectionalFinishCallback) => {
	const readStream = buildReadStream(socket, error => {
		finish('read', error);
	});

	const writeStream = buildWriteStream(socket, error => {
		finish('write', error);
	});

	return duplexify.obj(writeStream, readStream);
};
