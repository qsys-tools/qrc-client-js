/* eslint-disable unicorn/prevent-abbreviations */
import type z from 'zod';
import {requestValidators, strictRequestValidators} from './request-validators.ts';
import {getParseLevel, handleError, type ParseOptions} from './validation-options.ts';
import type {QrcMethod, InferQrcParams, InferQrcRequest} from './generated-types.ts';

export function safeParseCommandParameters<M extends QrcMethod>(method: M, params: unknown, parseOptions?: ParseOptions): z.ZodSafeParseResult<InferQrcParams<M>> {
	const parseLevel = getParseLevel(parseOptions, 'commands');
	// @ts-expect-error Types Are Hard
	return (parseLevel === 'strict' ? strictRequestValidators : requestValidators)[method].safeParse(params);
}

export function parseCommandParameters<M extends QrcMethod>(method: M, params: unknown, parseOptions?: ParseOptions) {
	const validationResult = safeParseCommandParameters(method, params, parseOptions);
	if (validationResult.success) {
		return validationResult.data;
	}

	return handleError<InferQrcParams<M>>(parseOptions, 'commands', validationResult.error, method, params);
}

export function createCommand<M extends QrcMethod>(method: M, params?: unknown, parseOptions?: ParseOptions): InferQrcRequest<M> {
	return {
		jsonrpc: '2.0',
		method,
		params: parseCommandParameters(method, params, parseOptions),
	};
}
