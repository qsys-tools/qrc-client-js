import type {
	QrcMethod,
	InferQrcRequest,
	InferResponseResult,
} from './generated-types.ts';

export type Validator = {
	createCommand<M extends QrcMethod>(method: M, parameters: unknown): InferQrcRequest<M>;

	parseResponseResult<M extends QrcMethod>(method: M, result: unknown): InferResponseResult<M>;
};
