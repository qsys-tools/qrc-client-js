import z from 'zod';
import type {$ZodLooseShape} from 'zod/v4/core';

export const noParameterMethods = ['NoOp', 'StatusGet', 'Component.GetComponents'] as const;

const makeValidators = (strictObjects: boolean) => {
	const conditionalObject = strictObjects ? z.strictObject : z.object;

	const setControlValueSchema = z.union([
		conditionalObject({
			Name: z.string(),
			Value: z.union([z.string(), z.boolean(), z.number()]),
			Ramp: z.number().optional(),
		}),
		conditionalObject({
			Name: z.string(),
			Position: z.number(),
			Ramp: z.number().optional(),
		}),
	]);

	const withId = <T extends $ZodLooseShape>(object: T) => conditionalObject({
		Id: z.string(),
		...object,
	});

	const withName = <T extends $ZodLooseShape>(object: T) => conditionalObject({
		Name: z.string(),
		...object,
	});

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
	} satisfies Record<string, z.ZodType>;
};

export const requestValidators = makeValidators(false);
export const strictRequestValidators = makeValidators(true);
