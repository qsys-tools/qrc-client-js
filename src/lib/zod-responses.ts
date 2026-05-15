import * as z from 'zod';
import type {CommandMethod} from './zod-requests.ts';
import {captureStackTrace} from './utils.ts';

const engineStatusMessageShape = {
	State: z.enum(['Idle', 'Active', 'Standby']),
	DesignName: z.string(),
	DesignCode: z.string(),
	IsRedundant: z.boolean(),
	IsEmulator: z.boolean(),
};

const engineStatusMessage = z.object({
	...engineStatusMessageShape,
});

const controlStatus = z.object({
	Name: z.string(),
	String: z.string(),
	Value: z.union([z.string(), z.boolean(), z.number()]),
	Position: z.number(),
});

const componentControlStatus = z.object({
	Component: z.string(),
	Name: z.string(),
	String: z.string(),
	Value: z.union([z.string(), z.boolean(), z.number()]),
	Position: z.number(),
});

const componentControlReport = z.object({
	Name: z.string(),
	Type: z.enum(['Float', 'Boolean', 'Array', 'Integer', 'Text', 'Time', 'State Trigger', 'Trigger', 'Virtual', 'Json Vector', 'Priority', 'Status']),
	Value: z.union([z.boolean(), z.number()]),
	ValueMin: z.number(),
	ValueMax: z.number(),
	StringMin: z.string(),
	StringMax: z.string(),
	String: z.string(),
	Position: z.number(),
	Direction: z.enum(['Read Only', 'Write Only', 'Read/Write']),
});

const responseValidators = {
	'Logon': z.literal(true),
	'StatusGet': z.object({
		...engineStatusMessageShape,
		Platform: z.string(),
		Status: z.object({
			Code: z.number(),
			String: z.string(),
		}),
	}),
	'Control.Get': z.array(controlStatus),
	'Control.Set': controlStatus,
	'Component.Get': z.object({
		Name: z.string(),
		Controls: z.array(controlStatus),
	}),
	'Component.GetControls': z.object({
		Name: z.string(),
		Controls: z.array(componentControlReport),
	}),
	'Component.Set': z.union([z.literal(true), z.array(componentControlStatus)]),
	'Component.GetComponents': z.array(z.object({
		ID: z.string(),
		Name: z.string(),
		Type: z.string(),
		Controls: z.null(),
		ControlSource: z.number(),
		Properties: z.array(z.object({
			Name: z.string(),
			Value: z.string(),
			PrettyName: z.string(),
		})),
	})),
	'ChangeGroup.AddControl': z.literal(true),
	'ChangeGroup.Remove': z.literal(true),
	'ChangeGroup.Invalidate': z.literal(true),
	'ChangeGroup.Clear': z.literal(true),
	'ChangeGroup.Destroy': z.literal(true),
	'ChangeGroup.AddComponentControl': z.literal(true),
	'ChangeGroup.AutoPoll': z.literal(true),
	'ChangeGroup.Poll': z.object({
		Id: z.string(),
		Changes: z.array(controlStatus),
	}),
} satisfies Partial<Record<CommandMethod, z.ZodType>>;

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

