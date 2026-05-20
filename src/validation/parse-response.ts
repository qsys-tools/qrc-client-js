import type z from 'zod';
import type {CommandMethod} from './parse-request.ts';
import {responseValidators, strictResponseValidators} from './response-validators.ts';
import {getParseLevel, handleError, type ParseOptions} from './validation-options.ts';

export type InferResponseResult<M extends CommandMethod>
	= M extends keyof typeof responseValidators
		? z.output<typeof responseValidators[M]>
		: unknown;

export const haseResponseValidator = (m: CommandMethod): m is keyof typeof responseValidators =>
	m in responseValidators;

export function safeParseResponseResult<M extends CommandMethod>(method: M, result: unknown, parseOptions?: ParseOptions): z.ZodSafeParseResult<InferResponseResult<M>> {
	const isStrict = getParseLevel(parseOptions, 'results') === 'strict';
	if (haseResponseValidator(method)) {
		const validator = (isStrict ? strictResponseValidators : responseValidators)[method];
		// @ts-expect-error types are hard
		return validator.safeParse(result);
	}

	return {
		success: true,
		// @ts-expect-error types are hard
		data: result,
	};
}

export const parseResponseResult = <M extends CommandMethod>(method: M, result: unknown, options?: ParseOptions): InferResponseResult<M> => {
	const validationResult = safeParseResponseResult(method, result, options);
	if (validationResult.success) {
		return validationResult.data;
	}

	return handleError(options, 'results', validationResult.error, method, result);
};
