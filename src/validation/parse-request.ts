/* eslint-disable unicorn/prevent-abbreviations */
import type z from 'zod';
import type {EmptyObject} from 'type-fest';
import {noParameterMethods, requestValidators, strictRequestValidators} from './request-validators.ts';
import {getParseLevel, handleError, type ParseOptions} from './validation-options.ts';

export type MethodWithoutParams = typeof noParameterMethods[number];
export type MethodWithParams = keyof typeof requestValidators;
export type CommandMethod = MethodWithoutParams | MethodWithParams;

export type InferCommandParams<M extends CommandMethod>
	= M extends MethodWithoutParams
		? EmptyObject
		: M extends MethodWithParams
			? z.output<typeof requestValidators[M]>
			: never;

export type QRCCommand<M extends CommandMethod> = {
	jsonrpc: '2.0';
	method: M;
	params: InferCommandParams<M>;
};

export const methodHasParams = (method: CommandMethod): method is MethodWithParams =>
	method in requestValidators;

export const methodHasNoParams = (m: CommandMethod): m is MethodWithoutParams =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-argument
	noParameterMethods.includes(m as any);

export function safeParseCommandParameters<M extends CommandMethod>(method: M, params: unknown, parseOptions?: ParseOptions): z.ZodSafeParseResult<InferCommandParams<M>> {
	const parseLevel = getParseLevel(parseOptions, 'commands');
	if (methodHasParams(method)) {
		// @ts-expect-error types are hard
		return (parseLevel === 'strict' ? strictRequestValidators : requestValidators)[method].safeParse(params);
	}

	if (methodHasNoParams(method)) {
		return {
			success: true,
			// @ts-expect-error types are hard
			data: {},
		};
	}

	throw new TypeError(`Unknown command ${method}`);
}

export function parseCommandParameters<M extends MethodWithParams, O extends InferCommandParams<M>>(method: M, params: O, parseOptions?: ParseOptions): InferCommandParams<M>;
export function parseCommandParameters<M extends MethodWithoutParams>(method: M, params?: unknown, parseOptions?: ParseOptions): InferCommandParams<M>;
export function parseCommandParameters<M extends CommandMethod, O extends InferCommandParams<M>>(method: M, params?: O, parseOptions?: ParseOptions): InferCommandParams<M> {
	const validationResult = safeParseCommandParameters(method, params, parseOptions);
	if (validationResult.success) {
		return validationResult.data;
	}

	// @ts-expect-error types are hard
	return handleError(parseOptions, 'commands', validationResult.error, method, params);
}

function wrap<M extends CommandMethod>(method: M, params: InferCommandParams<M>): QRCCommand<M> {
	return {
		jsonrpc: '2.0',
		method,
		params,
	};
}

export function createCommand<M extends CommandMethod>(method: M, params?: unknown, parseOptions?: ParseOptions): QRCCommand<M> {
	// @ts-expect-error Don't understand why the typeguard isn't sufficient here
	return wrap(method, parseCommandParameters(method, params, parseOptions));
}
