import {inspect as insp} from 'node:util';
import {type Transform} from 'node:stream';
import {objectTransform} from 'through2';
import supportsColor from 'supports-color';
import split from 'split2';

const NULL_CHAR = '\u0000';

const DEBUG = false;

const colors = Boolean(supportsColor.stdout ?? supportsColor.stderr);
const inspect = (object: any): string => insp(object, {colors, depth: Infinity});

// Converts a "Null Terminated JSON" byte stream into an object stream.
export const nullJsonDecoder = (): Transform => split(NULL_CHAR, JSON.parse);

// Converts an object stream into a "Null Terminated JSON" byte stream.
export const nullJsonEncoder = (): Transform => objectTransform(async function * (src: AsyncIterable<any>) {
	for await (const object of src) {
		yield JSON.stringify(object);
		yield NULL_CHAR;
	}
});

// Spy on the stream (for debugging). `prefix` will be prepended in the logs.
export const log = (prefix = '', debug = DEBUG): Transform => objectTransform(async function * (src: AsyncIterable<any>) {
	for await (const object of src) {
		if (debug) {
			console.log(prefix, inspect(object));
		}

		yield object;
	}
});

// Embeds the RPC version on the command object (so upstream objects don't have to).
export const addRpcVersion = (): Transform => objectTransform(async function * (src: AsyncIterable<any>) {
	for await (const object of src) {
		yield {jsonrpc: '2.0', ...object};
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
