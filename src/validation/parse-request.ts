/* eslint-disable unicorn/prevent-abbreviations */
import type z from 'zod';
import {requestValidators, strictRequestValidators} from './request-validators.ts';
import {getParseLevel, handleError, type ParseOptions} from './validation-options.ts';

export type CommandMethod = keyof typeof requestValidators;

export type InferCommandParams<M extends CommandMethod>
	= z.output<typeof requestValidators[M]>;

export type QRCCommand<M extends CommandMethod> = {
	jsonrpc: '2.0';
	method: M;
	params: InferCommandParams<M>;
};

export function safeParseCommandParameters<M extends CommandMethod>(method: M, params: unknown, parseOptions?: ParseOptions): z.ZodSafeParseResult<InferCommandParams<M>> {
	const parseLevel = getParseLevel(parseOptions, 'commands');
	// @ts-expect-error Types Are Hard
	return (parseLevel === 'strict' ? strictRequestValidators : requestValidators)[method].safeParse(params);
}

export function parseCommandParameters<M extends CommandMethod>(method: M, params: unknown, parseOptions?: ParseOptions): InferCommandParams<M> {
	const validationResult = safeParseCommandParameters(method, params, parseOptions);
	if (validationResult.success) {
		return validationResult.data;
	}

	return handleError<InferCommandParams<M>>(parseOptions, 'commands', validationResult.error, method, params);
}

function wrap<M extends CommandMethod>(method: M, params: InferCommandParams<M>): QRCCommand<M> {
	return {
		jsonrpc: '2.0',
		method,
		params,
	};
}

export function createCommand<M extends CommandMethod>(method: M, params?: unknown, parseOptions?: ParseOptions): QRCCommand<M> {
	return wrap(method, parseCommandParameters(method, params, parseOptions));
}
