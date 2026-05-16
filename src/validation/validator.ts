import type {CommandMethod, QRCCommand} from './parse-request.ts';
import type {InferResponseResult} from './parse-response.ts';

export type Validator = {
	createCommand<M extends CommandMethod>(method: M, parameters: unknown): QRCCommand<M>;

	parseResponseResult<M extends CommandMethod>(method: M, result: unknown): InferResponseResult<M>;
};
