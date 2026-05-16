import type {Validator} from './validator.ts';
import type {CommandMethod, QRCCommand} from './parse-request.ts';
import type {InferResponseResult} from './parse-response.ts';

export class NoopValidator implements Validator {
	createCommand<M extends CommandMethod>(method: M, parameters: unknown): QRCCommand<M> {
		return {
			jsonrpc: '2.0',
			method,
			// @ts-expect-error We know we aren't validating it.
			params: parameters,
		};
	}

	parseResponseResult<M extends CommandMethod>(_method: M, result: unknown): InferResponseResult<M> {
		// @ts-expect-error We know we aren't validating it.
		return result;
	}
}

const instance = new NoopValidator();
export default instance;
