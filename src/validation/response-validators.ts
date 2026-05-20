import * as z from 'zod';
import type {CommandMethod} from './parse-request.ts';

const makeValidators = (strictObjects: boolean) => {
	const conditionalObject = strictObjects ? z.strictObject : z.object;

	const engineStatusMessageShape = {
		State: z.enum(['Idle', 'Active', 'Standby']),
		DesignName: z.string(),
		DesignCode: z.string(),
		IsRedundant: z.boolean(),
		IsEmulator: z.boolean(),
	};

	const controlStatus = conditionalObject({
		Name: z.string(),
		String: z.string(),
		Value: z.union([z.string(), z.boolean(), z.number()]),
		Position: z.number(),
	});

	const componentControlStatus = conditionalObject({
		Component: z.string(),
		Name: z.string(),
		String: z.string(),
		Value: z.union([z.string(), z.boolean(), z.number()]),
		Position: z.number(),
	});

	const componentControlReport = conditionalObject({
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

	return {
		'Logon': z.literal(true),
		'StatusGet': conditionalObject({
			...engineStatusMessageShape,
			Platform: z.string(),
			Status: conditionalObject({
				Code: z.number(),
				String: z.string(),
			}),
		}),
		'Control.Get': z.array(controlStatus),
		'Control.Set': controlStatus,
		'Component.Get': conditionalObject({
			Name: z.string(),
			Controls: z.array(controlStatus),
		}),
		'Component.GetControls': conditionalObject({
			Name: z.string(),
			Controls: z.array(componentControlReport),
		}),
		'Component.Set': z.union([z.literal(true), z.array(componentControlStatus)]),
		'Component.GetComponents': z.array(conditionalObject({
			ID: z.string(),
			Name: z.string(),
			Type: z.string(),
			Controls: z.null(),
			ControlSource: z.number(),
			Properties: z.array(conditionalObject({
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
		'ChangeGroup.Poll': conditionalObject({
			Id: z.string(),
			Changes: z.array(z.union([controlStatus, componentControlStatus])),
		}),
		'LoopPlayer.Start': z.undefined(),
		'LoopPlayer.Cancel': z.undefined(),
		'LoopPlayer.Stop': z.undefined(),
		'Snapshot.Load': z.literal(true),
		'Snapshot.Save': z.literal(true),
	} satisfies Partial<Record<CommandMethod, z.ZodType>>;
};

export const responseValidators = makeValidators(false);
export const strictResponseValidators = makeValidators(false);
