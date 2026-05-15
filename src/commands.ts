import type {
	ComponentControlSetSpec, ControlSetSpec,
} from './types.ts';
import type {
	CommandMethod, InferCommandParams, MethodWithoutParams, MethodWithParams,
} from './validation/parse-request.ts';

export type PartialQrcCommand<M extends CommandMethod>
	= M extends MethodWithoutParams
		? {method: M}
		: M extends MethodWithParams
			? {method: M; params: InferCommandParams<M>}
			: never;

export const getStatus = () => ({
	method: 'StatusGet',
} satisfies PartialQrcCommand<'StatusGet'>);

export const logon = (username: string, password: string) => ({
	method: 'Logon',
	params: {
		User: username,
		Password: password,
	},
} satisfies PartialQrcCommand<'Logon'>);

export const getNamedControls = (...controlNames: string[]) => ({
	method: 'Control.Get',
	params: controlNames,
} satisfies PartialQrcCommand<'Control.Get'>);

export const setNamedControl = (controlName: string, spec: ControlSetSpec | boolean | string | number) => {
	if (typeof spec === 'number' || typeof spec === 'boolean' || typeof spec === 'string') {
		spec = {Value: spec};
	}

	return {
		method: 'Control.Set',
		params: {
			...spec,
			Name: controlName,
		},
	} satisfies PartialQrcCommand<'Control.Set'>;
};

export const getComponents = () => ({
	method: 'Component.GetComponents',
} satisfies PartialQrcCommand<'Component.GetComponents'>);

export const getComponentControls = (componentName: string, controlNames: string[]) => ({
	method: 'Component.Get',
	params: {
		Name: componentName,
		Controls: controlNames.map(Name => ({Name})),
	},
} satisfies PartialQrcCommand<'Component.Get'>);

export const setComponentControls = (componentName: string, controls: ComponentControlSetSpec[]) => ({
	method: 'Component.Set',
	params: {
		Name: componentName,
		Controls: controls,
	},
} satisfies PartialQrcCommand<'Component.Set'>);

export const addNamedControlToGroup = (groupId: string, controlNames: string[]) => ({
	method: 'ChangeGroup.AddControl',
	params: {
		Id: groupId,
		Controls: controlNames,
	},
} satisfies PartialQrcCommand<'ChangeGroup.AddControl'>);

export const addComponentControlsToGroup = (groupId: string, componentName: string, controlNames: string[]) => ({
	method: 'ChangeGroup.AddComponentControl',
	params: {
		Id: groupId,
		Component: {
			Name: componentName,
			Controls: controlNames.map(Name => ({Name})),
		},
	},
} satisfies PartialQrcCommand<'ChangeGroup.AddComponentControl'>);

// TODO: Not any
export const pollGroup = (groupId: string) => ({
	method: 'ChangeGroup.Poll',
	params: {
		Id: groupId,
	},
} satisfies PartialQrcCommand<'ChangeGroup.Poll'>);

export const invalidateGroup = (groupId: string) => ({
	method: 'ChangeGroup.Invalidate',
	params: {
		Id: groupId,
	},
} satisfies PartialQrcCommand<'ChangeGroup.Invalidate'>);

export const clearGroup = (groupId: string) => ({
	method: 'ChangeGroup.Clear',
	params: {
		Id: groupId,
	},
} satisfies PartialQrcCommand<'ChangeGroup.Clear'>);

export const destroyGroup = (groupId: string) => ({
	method: 'ChangeGroup.Destroy',
	params: {
		Id: groupId,
	},
} satisfies PartialQrcCommand<'ChangeGroup.Destroy'>);

export const removeNamedControlsFromGroup = (groupId: string, controlNames: string[]) => ({
	method: 'ChangeGroup.Remove',
	params: {
		Id: groupId,
		Controls: controlNames,
	},
} satisfies PartialQrcCommand<'ChangeGroup.Remove'>);

// TODO: Not any
export const autoPollGroup = (groupId: string, rate: number) => ({
	method: 'ChangeGroup.AutoPoll',
	params: {
		Id: groupId,
		Rate: rate,
	},
} satisfies PartialQrcCommand<'ChangeGroup.AutoPoll'>);

export const noOp = () => ({
	method: 'NoOp',
} satisfies PartialQrcCommand<'NoOp'>);
