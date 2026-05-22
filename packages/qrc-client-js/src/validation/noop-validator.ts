import type {Validator} from './validator.ts';
import type {QrcMethod, InferQrcRequest, InferResponseResult} from './generated-types.ts';

export class NoopValidator implements Validator {
	createCommand<M extends QrcMethod>(method: M, parameters: unknown): InferQrcRequest<M> {
		// @ts-expect-error Types are hard.
		return {
			jsonrpc: '2.0',
			method,
			params: parameters,
		};
	}

	parseResponseResult<M extends QrcMethod>(_method: M, result: unknown): InferResponseResult<M> {
		// @ts-expect-error We know we aren't validating it.
		return result;
	}
}

const instance = new NoopValidator();
export default instance;
