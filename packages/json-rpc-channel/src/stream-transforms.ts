import {type Transform} from 'node:stream';
import {objectTransform} from 'through2';
import split from 'split2';

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
