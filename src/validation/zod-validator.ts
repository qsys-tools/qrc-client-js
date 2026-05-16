import type {Validator} from './validator.ts';
import {
	createCommand, type CommandMethod, type QRCCommand,
} from './parse-request.ts';
import type {ParseOptions} from './validation-options.ts';
import {parseResponseResult, type InferResponseResult} from './parse-response.ts';

export class ZodValidator implements Validator {
	private readonly options: ParseOptions;

	constructor(options: ParseOptions) {
		this.options = options;
	}

	createCommand<M extends CommandMethod>(method: M, parameters: unknown): QRCCommand<M> {
		return createCommand(method, parameters, this.options);
	}

	parseResponseResult<M extends CommandMethod>(method: M, result: unknown): InferResponseResult<M> {
		return parseResponseResult(method, result, this.options);
	}
}
