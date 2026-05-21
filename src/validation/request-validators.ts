import z from 'zod';
import type {$ZodLooseShape} from 'zod/v4/core';

const makeValidators = (strictObjects: boolean) => {
	const conditionalObject = strictObjects ? z.strictObject : z.object;

	const noParameters = conditionalObject({}).optional();

	const withId = <T extends $ZodLooseShape>(object: T) => conditionalObject({
		Id: z.string(),
		...object,
	});

	const withName = <T extends $ZodLooseShape>(object: T) => conditionalObject({
		Name: z.string(),
		...object,
	});

	const loopCommand = <T extends $ZodLooseShape>(object: T) => withName({
		Log: z.boolean().optional(),
		RefId: z.string().optional(),
		...object,
	});

	const setControlValueSchema = z.union([
		withName({
			Value: z.union([z.string(), z.boolean(), z.number()]),
			Ramp: z.number().optional(),
		}),
		withName({
			Name: z.string(),
			Position: z.number(),
			Ramp: z.number().optional(),
		}),
	]);

	const crossPointSpec = z.string();

	const rampSpec = z.number().optional();

	const mixerMuteInputs = withName({
		Inputs: crossPointSpec,
		Value: z.boolean(),
	});

	const mixerGainIO = withName({
		Inputs: crossPointSpec,
		Outputs: crossPointSpec,
		Value: z.number(),
		Ramp: rampSpec,
	});

	const mixerMuteIO = withName({
		Inputs: crossPointSpec,
		Outputs: crossPointSpec,
		Value: z.boolean(),
	});

	return {
		'NoOp': noParameters,
		'StatusGet': noParameters,
		'Component.GetComponents': noParameters,
		'Logon': conditionalObject({
			User: z.string(),
			Password: z.string(),
		}),
		'Control.Get': z.string().array().nonempty(),
		'Control.Set': setControlValueSchema,
		'Component.Get': withName({
			Controls: withName({}).array().nonempty(),
		}),
		'Component.GetControls': withName({}),
		'Component.Set': withName({
			Controls: setControlValueSchema.array().nonempty(),
			ResponseValues: z.boolean().optional(),
		}),
		'ChangeGroup.AddControl': withId({
			Controls: z.string().array().nonempty(),
		}),
		'ChangeGroup.AddComponentControl': withId({
			Component: withName({
				Controls: withName({}).array().nonempty(),
			}),
		}),
		'ChangeGroup.Remove': withId({
			Controls: z.string().array().nonempty(),
		}),
		'ChangeGroup.Poll': withId({}),
		'ChangeGroup.Destroy': withId({}),
		'ChangeGroup.Invalidate': withId({}),
		'ChangeGroup.Clear': withId({}),
		'ChangeGroup.AutoPoll': withId({
			Rate: z.number(),
		}),
		'Mixer.SetCrossPointGain': mixerGainIO,
		'Mixer.SetCrossPointDelay': mixerGainIO,
		'Mixer.SetCrossPointMute': mixerMuteIO,
		'Mixer.SetCrossPointSolo': mixerMuteIO,
		'Mixer.SetInputGain': withName({
			Inputs: crossPointSpec,
			Value: z.number(),
			Ramp: rampSpec,
		}),
		'Mixer.SetInputMute': mixerMuteInputs,
		'Mixer.SetInputSolo': mixerMuteInputs,
		'Mixer.SetOutputGain': withName({
			Outputs: crossPointSpec,
			Value: z.number(),
			Ramp: rampSpec,
		}),
		'Mixer.SetOutputMute': withName({
			Outputs: crossPointSpec,
			Value: z.boolean(),
		}),
		'Mixer.SetCueMute': withName({
			Cues: crossPointSpec,
			Value: z.boolean(),
		}),
		'Mixer.SetCueGain': withName({
			Cues: crossPointSpec,
			Value: z.number(),
			Ramp: rampSpec,
		}),
		'Mixer.SetInputCueEnable': withName({
			Cues: crossPointSpec,
			Inputs: crossPointSpec,
			Value: z.boolean(),
		}),
		'Mixer.SetInputCueAfl': withName({
			Cues: crossPointSpec,
			Inputs: crossPointSpec,
			Value: z.boolean(),
		}),
		'LoopPlayer.Start': loopCommand({
			StartTime: z.number().optional(),
			Files: withName({
				Output: z.int().gte(1),
			}).array(),
			Loop: z.boolean().optional(),
			Seek: z.number().optional(),
		}),
		'LoopPlayer.Stop': loopCommand({
			Outputs: z.int().gte(1).array(),
		}),
		'LoopPlayer.Cancel': loopCommand({
			Outputs: z.number().gte(1).array(),
		}),
		'Snapshot.Load': withName({
			Bank: z.int().gte(1),
			Ramp: z.number().gte(0).optional(),
		}),
		'Snapshot.Save': withName({
			Bank: z.int().gte(1),
		}),
	} satisfies Record<string, z.ZodType>;
};

export const requestValidators = makeValidators(false);
export const strictRequestValidators = makeValidators(true);
