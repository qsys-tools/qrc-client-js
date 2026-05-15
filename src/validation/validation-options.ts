import type {ZodError} from 'zod';
import {captureStackTrace} from '../lib/utils.ts';
import type {CommandMethod} from './parse-request.ts';

export type ParseFailureOption = 'throw' | 'log' | 'logAndThrow' | 'ignore' | ((error: ZodError, method: CommandMethod, parametersOrResult: unknown) => unknown);
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

export const handleError = (options: ParseOptions | undefined, direction: ParseDirection, error: ZodError, method: CommandMethod, parametersOrResult: unknown) => {
	const failureOption = getFailureOption(options, direction);
	captureStackTrace(error);
	switch (failureOption) {
		case 'throw': {
			throw error;
		}

		case 'logAndThrow': {
			console.warn(error);
			throw error;
		}

		case 'log': {
			console.warn(error);
			break;
		}

		case 'ignore': {
			return parametersOrResult;
		}

		default: {
			return failureOption(error, method, parametersOrResult);
		}
		// No default
	}
};
