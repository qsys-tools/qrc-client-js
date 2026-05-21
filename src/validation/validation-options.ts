import type {ZodError} from 'zod';
import {captureStackTrace} from '../lib/utils.ts';
import type {QrcMethod} from './generated-types.ts';

export type ParseFailureOption = 'throw' | 'log' | 'logAndThrow' | 'ignore' | (<T>(error: ZodError, method: QrcMethod, parametersOrResult: T) => T);
export type ParseLevel = 'strict' | 'loose';

export type ValidationFailureOptions = ParseFailureOption | {
	commands: ParseFailureOption;
	results: ParseFailureOption;
};

export type ParseLevels = ParseLevel | {
	commands: ParseLevel;
	results: ParseLevel;
};

export type ParseDirection = 'commands' | 'results';

export type ParseOptions = {
	onParseFailure?: ValidationFailureOptions;
	parseLevel?: ParseLevels;
};

const defaultOptions = {
	onParseFailure: {
		commands: 'logAndThrow',
		results: 'log',
	},
	parseLevel: {
		commands: 'loose',
		results: 'strict',
	},
} as const;

export const getParseLevel = (options: ParseOptions | undefined, direction: ParseDirection) =>
	(options && (typeof options.parseLevel === 'object' ? options.parseLevel[direction] : options.parseLevel)) ?? defaultOptions.parseLevel[direction];

export const getFailureOption = (options: ParseOptions | undefined, direction: ParseDirection) =>
	(options && (typeof options.onParseFailure === 'object' ? options.onParseFailure[direction] : options.onParseFailure)) ?? defaultOptions.onParseFailure[direction];

export const handleError = <T>(options: ParseOptions | undefined, direction: ParseDirection, error: ZodError, method: QrcMethod, parametersOrResult: unknown): T => {
	const failureOption = getFailureOption(options, direction);
	switch (failureOption) {
		case 'throw': {
			captureStackTrace(error);
			throw error;
		}

		case 'logAndThrow': {
			captureStackTrace(error);
			console.warn(error);
			throw error;
		}

		case 'log': {
			captureStackTrace(error);
			console.warn(error);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			return parametersOrResult as T;
		}

		case 'ignore': {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			return parametersOrResult as T;
		}

		default: {
			captureStackTrace(error);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			return failureOption(error, method, parametersOrResult) as T;
		}
		// No default
	}
};
