/* eslint-disable unicorn/prevent-abbreviations */
import z, {type ZodSafeParseResult} from 'zod';
import type {$ZodLooseShape} from 'zod/v4/core';
import type {EmptyObject} from 'type-fest';
import {captureStackTrace} from './utils.ts';

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

const noParamMethods = ['NoOp', 'StatusGet', 'Component.GetComponents'] as const;

const requestValidators = {
	'Logon': z.object({
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
	'ChangeGroup.AutoPoll': withId({}),
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
} satisfies Record<string, z.ZodObject<Record<string, z.ZodType>> | z.ZodArray<z.ZodString>>;

type MethodWithoutParams = typeof noParamMethods[number];
type MethodWithParams = keyof typeof requestValidators;
export type CommandMethod = MethodWithoutParams | MethodWithParams;

export type ParamTypeMap = {
	[Key in CommandMethod]:
	Key extends MethodWithoutParams
		? EmptyObject
		: Key extends MethodWithParams
			? z.output<typeof requestValidators[Key]>
			: never;
};

export type InferCommandParams<M extends CommandMethod> = ParamTypeMap[M];

export type QRCCommand<M extends CommandMethod> = {
	jsonrpc: '2.0';
	method: M;
	params: ParamTypeMap[M];
};

export const methodHasParams = (method: CommandMethod): method is MethodWithParams =>
	method in requestValidators;

export const methodHasNoParams = (m: CommandMethod): m is MethodWithoutParams =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-argument
	noParamMethods.includes(m as any);

export function safeParseCommandParameters<M extends CommandMethod>(method: M, params: unknown): ZodSafeParseResult<InferCommandParams<M>> {
	if (methodHasParams(method)) {
		// @ts-expect-error types are hard
		return requestValidators[method].safeParse(params);
	}

	if (methodHasNoParams(method)) {
		return {
			success: true,
			// @ts-expect-error types are hard
			data: {},
		};
	}

	throw new TypeError(`Unknown command ${method}`);
}

export function parseCommandParameters<M extends MethodWithParams, O extends InferCommandParams<M>>(method: M, params: O): InferCommandParams<M>;
export function parseCommandParameters<M extends MethodWithoutParams>(method: M, params?: unknown): InferCommandParams<M>;
export function parseCommandParameters<M extends CommandMethod, O extends InferCommandParams<M>>(method: M, params?: O): InferCommandParams<M> {
	const validationResult = safeParseCommandParameters(method, params);
	if (validationResult.success) {
		return validationResult.data;
	}

	const {error} = validationResult;
	captureStackTrace(error);
	throw error;
}

function wrap<M extends CommandMethod>(method: M, params: InferCommandParams<M>): QRCCommand<M> {
	return {
		jsonrpc: '2.0',
		method,
		params,
	};
}

export function createCommand<M extends MethodWithParams, O extends InferCommandParams<M>>(method: M, params: O): QRCCommand<M>;
export function createCommand<M extends MethodWithoutParams>(method: M, params?: unknown): QRCCommand<M>;
export function createCommand<M extends CommandMethod, O extends InferCommandParams<M>>(method: M, params?: O): QRCCommand<M> {
	// @ts-expect-error Don't understand why the typeguard isn't sufficient here
	return wrap(method, parseCommandParameters(method, params));
}
