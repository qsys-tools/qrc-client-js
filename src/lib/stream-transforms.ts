import through2 from 'through2';
import split from 'split2';
import {inspect} from './utils';

type Transform = import('stream').Transform;

const NULL_CHAR = '\u0000';
const DEBUG = false;

// Converts a "Null Terminated JSON" byte stream into an object stream.
// @ts-expect-error
export const nullJsonDecoder = (): Transform => split(NULL_CHAR, JSON.parse, {trailing: false});

// Converts an object stream into a "Null Terminated JSON" byte stream.
export const nullJsonEncoder = (): Transform => through2.obj(function (object, enc, cb) {
	this.push(JSON.stringify(object));
	this.push(NULL_CHAR);
	cb();
});

// Spy on the stream (for debugging). `prefix` will be prepended in the logs.
export const log = (prefix = '', debug = DEBUG): Transform => through2.obj(function (chunk, enc, cb) {
	if (debug) {
		console.log(prefix, inspect(chunk));
	}

	this.push(chunk, enc);
	cb();
});

// Embeds the RPC version on the command object (so upstream objects don't have to).
export const addRpcVersion = (): Transform => through2.obj(function (object, enc, cb): void {
	this.push({jsonrpc: '2.0', ...object});
	cb();
});

export const timeout = (timeout: number, cb: () => void): Transform => {
	let id: any;

	const reset = (): void => {
		clearTimeout(id);
		id = setTimeout(handler, timeout);
	};

	const handler = (): void => {
		reset();
		cb();
	};

	const stream = through2.obj(function (object, enc, cb) {
		this.push(object, enc);
		reset();
		cb();
	});

	stream.on('close', () => {
		clearTimeout(id);
	});

	return stream;
};
