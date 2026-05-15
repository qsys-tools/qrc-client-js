import * as z from 'zod';
import type {CommandMethod} from './zod-requests.ts';

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
	'StatusGet': z.object({
		...engineStatusMessageShape,
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
	'Component.Set': z.array(componentControlStatus),
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
	'ChangeGroup.Poll': z.object({
		Id: z.string(),
		Changes: z.union([controlStatus, componentControlReport]),
	}),
} satisfies Partial<Record<CommandMethod, z.ZodType>>;

export type InferResponseResult<M extends CommandMethod>
	= M extends keyof typeof responseValidators
		? z.output<typeof responseValidators[M]>
		: unknown;

export const hasValidator = (m: CommandMethod): m is keyof typeof responseValidators =>
	m in responseValidators;

export const validateResponseResult = <M extends CommandMethod>(method: M, result: unknown): InferResponseResult<M> => {
	if (hasValidator(method)) {
		// @ts-expect-error Force it
		return responseValidators[method].parse(result);
	}

	// @ts-expect-error Force it
	return result;
};
