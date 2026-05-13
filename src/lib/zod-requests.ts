/* eslint-disable @typescript-eslint/naming-convention,unicorn/no-array-callback-reference,unicorn/no-array-for-each */
/* eslint-disable unicorn/prevent-abbreviations */
import z from 'zod';
import type {$ZodLooseShape} from 'zod/v4/core';

const noParams = z.undefined().optional();

const setControlValueSchema = z.object({
	Name: z.string(),
	Value: z.union([z.string(), z.boolean(), z.number()]),
	Ramp: z.number().optional(),
});

const withId = <T extends $ZodLooseShape>(obj: T) => z.object({
	Id: z.string(),
	...obj,
});

const withName = <T extends $ZodLooseShape>(obj: T) => z.object({
	Name: z.string(),
	...obj,
});

const basicParamValidators = {
	Logon: z.object({
		User: z.string(),
		Password: z.string(),
	}),
	NoOp: noParams,
	StatusGet: noParams,
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
	'Component.GetComponents': noParams,
};

const changeGroupParamValidators = {
	AddControl: withId({
		Controls: z.string().array().nonempty(),
	}),
	AddComponentControl: withId({
		Component: withName({
			Controls: withName({}).array().nonempty(),
		}),
	}),
	Remove: withId({
		Controls: z.string().array().nonempty(),
	}),
	Poll: withId({}),
	Destroy: withId({}),
	Invalidate: withId({}),
	Clear: withId({}),
	AutoPoll: withId({}),
};

const crossPointSpec = z.string();
const rampSpec = z.number().optional();

const mixerGainInputs = withName({
	Inputs: crossPointSpec,
	Value: z.number(),
	Ramp: rampSpec,
});

const mixerMuteInputs = withName({
	Inputs: crossPointSpec,
	Value: z.boolean(),
});

const mixerGainOutputs = withName({
	Outputs: crossPointSpec,
	Value: z.number(),
	Ramp: rampSpec,
});

const mixerMuteOutputs = withName({
	Outputs: crossPointSpec,
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

const mixerParamValidators = {
	SetCrossPointGain: mixerGainIO,
	SetCrossPointDelay: mixerGainIO,
	SetCrossPointMute: mixerMuteIO,
	SetCrossPointSolo: mixerMuteIO,
	SetInputGain: mixerGainInputs,
	SetInputMute: mixerMuteInputs,
	SetInputSolo: mixerMuteInputs,
	SetOutputGain: mixerGainOutputs,
	SetOutputMute: mixerMuteIO,
	SetCueMute: withName({
		Cues: crossPointSpec,
		Value: z.boolean(),
	}),
	SetCueGain: withName({
		Cues: crossPointSpec,
		Value: z.number(),
		Ramp: rampSpec,
	}),
	SetInputCueEnable: withName({
		Cues: crossPointSpec,
		Inputs: crossPointSpec,
		Value: z.boolean(),
	}),
	SetInputCueAfl: withName({
		Cues: crossPointSpec,
		Inputs: crossPointSpec,
		Value: z.boolean(),
	}),
};

type BasicMethods = keyof typeof basicParamValidators;
type MixerMethods = `Mixer.${keyof typeof mixerParamValidators}`;
type ChangeGroupMethods = `ChangeGroup.${keyof typeof changeGroupParamValidators}`;

type CommandMethods = BasicMethods | ChangeGroupMethods | MixerMethods;

type InferBasicValidator<T extends BasicMethods> = typeof basicParamValidators[T];
type InferMixerValidator<T extends MixerMethods>
	= T extends `Mixer.${infer Key extends keyof typeof mixerParamValidators}`
		? typeof mixerParamValidators[Key]
		: never;
type InferChangeGroupValidator<T extends ChangeGroupMethods>
	= T extends `ChangeGroup.${infer Key extends keyof typeof changeGroupParamValidators}`
		? typeof changeGroupParamValidators[Key]
		: never;

type InferCommandValidator<T extends CommandMethods>
	= T extends BasicMethods
		? InferBasicValidator<T>
		: T extends MixerMethods
			? InferMixerValidator<T>
			: T extends ChangeGroupMethods
				? InferChangeGroupValidator<T>
				: never;

type InferBasicParams<T extends BasicMethods> = z.infer<InferBasicValidator<T>>;
type InferMixerParams<T extends MixerMethods> = z.infer<InferMixerValidator<T>>;
type InferChangeGroupParams<T extends ChangeGroupMethods> = z.infer<InferChangeGroupValidator<T>>;
type InferCommandParams<T extends CommandMethods> = z.infer<InferCommandValidator<T>>;

// @ts-expect-error gets built below
const allValidators: {[key in CommandMethods]: InferCommandValidator<key>} = {};

// @ts-expect-error too hard to type
const copyValidators = ([key, value]) => {
	// @ts-expect-error too hard to type
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
	allValidators[key] = value;
};

Object.entries(basicParamValidators).forEach(copyValidators);
Object.entries(mixerParamValidators).forEach(copyValidators);
Object.entries(changeGroupParamValidators).forEach(copyValidators);
