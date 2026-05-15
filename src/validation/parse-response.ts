import type z from 'zod';
import {captureStackTrace} from '../lib/utils.ts';
import type {CommandMethod} from './parse-request.ts';
import {responseValidators} from './response-validators.ts';

export type InferResponseResult<M extends CommandMethod>
	= M extends keyof typeof responseValidators
		? z.output<typeof responseValidators[M]>
		: unknown;

export const haseResponseValidator = (m: CommandMethod): m is keyof typeof responseValidators =>
	m in responseValidators;

function _safeParseResponseResult<M extends CommandMethod>(strict: boolean, method: M, result: unknown): z.ZodSafeParseResult<InferResponseResult<M>> {
	if (haseResponseValidator(method)) {
		let validator = responseValidators[method];
		if (strict && 'strict' in validator && typeof validator.strict === 'function') {
			// @ts-expect-error types are hard
			validator = validator.strict();
		}

		// @ts-expect-error types are hard
		return validator.safeParse(result);
	}

	return {
		success: true,
		// @ts-expect-error types are hard
		data: result,
	};
}

const _parseResponseResult = <M extends CommandMethod>(strict: boolean, method: M, result: unknown): InferResponseResult<M> => {
	const validationResult = _safeParseResponseResult(strict, method, result);
	if (validationResult.success) {
		return validationResult.data;
	}

	const {error} = validationResult;
	captureStackTrace(error);
	throw error;
};

export function safeParseResponseResult<M extends CommandMethod>(method: M, result: unknown): z.ZodSafeParseResult<InferResponseResult<M>> {
	return _safeParseResponseResult(false, method, result);
}

export function strictlySafeParseResponseResult<M extends CommandMethod>(method: M, result: unknown): z.ZodSafeParseResult<InferResponseResult<M>> {
	return _safeParseResponseResult(true, method, result);
}

export const parseResponseResult = <M extends CommandMethod>(method: M, result: unknown): InferResponseResult<M> =>
	_parseResponseResult(false, method, result);

export const strictlyParseResponseResult = <M extends CommandMethod>(method: M, result: unknown): InferResponseResult<M> =>
	_parseResponseResult(true, method, result);

