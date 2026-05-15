import * as z from 'zod';
import type {CommandMethod} from './parse-request.ts';

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

export const responseValidators = {
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
