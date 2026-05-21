import type {Validator} from './validator.ts';
import {createCommand} from './parse-request.ts';
import type {ParseOptions} from './validation-options.ts';
import {parseResponseResult} from './parse-response.ts';
import type {QrcMethod, InferQrcRequest, InferResponseResult} from './generated-types.ts';

export class ZodValidator implements Validator {
	private readonly options: ParseOptions;

	constructor(options: ParseOptions) {
		this.options = options;
	}

	createCommand<M extends QrcMethod>(method: M, parameters: unknown): InferQrcRequest<M> {
		return createCommand(method, parameters, this.options);
	}

	parseResponseResult<M extends QrcMethod>(method: M, result: unknown): InferResponseResult<M> {
		return parseResponseResult(method, result, this.options);
	}
}
