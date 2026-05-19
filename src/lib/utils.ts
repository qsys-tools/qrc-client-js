import {inspect as insp} from 'node:util';
import supportsColor from 'supports-color';

const colors = Boolean(supportsColor.stdout ?? supportsColor.stderr);

export const inspect = (object: any): string => insp(object, {colors, depth: Infinity});

export const log = (...args: any[]): void => {
	console.log(...args.map(value => typeof value === 'string' ? value : inspect(value)));
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-function-type,@typescript-eslint/no-restricted-types,@typescript-eslint/no-unsafe-type-assertion
export const captureStackTrace: (targetObject: object, constructorOpt?: Function) => void = (
	'captureStackTrace' in Error
		? Error.captureStackTrace
		: (..._args: any[]) => {
			/* Empty */
		}) as any;

export type PromiseWithResolvers<T> = {
	readonly promise: Promise<T>;
	readonly resolve: (value: T | PromiseLike<T>) => void;
	readonly reject: (reason?: any) => void;
};

export const promiseWithResolvers = <T>(): PromiseWithResolvers<T> => {
	let resolve: (value: T | PromiseLike<T>) => void;
	let reject: (reason?: any) => void;
	const promise = new Promise<T>((_resolve, _reject) => {
		reject = _reject;
		resolve = _resolve;
	});

	// @ts-expect-error Promise callback happens synchronous.
	return {promise, resolve, reject};
};
