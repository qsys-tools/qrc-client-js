import {
	type ComponentControlSetSpec, type ComponentStatus, type ControlSetSpec, type ControlStatus, type EngineStatus, type CmdP,
} from './types.ts';

export const getStatus = (): CmdP<EngineStatus> => ({
	method: 'StatusGet',
});

export const logon = (username: string, password: string): CmdP<true> => ({
	method: 'Logon',
	params: {
		User: username,
		Password: password,
	},
});

export const getNamedControls = (...controlNames: string[]): CmdP<ControlStatus[]> => ({
	method: 'Control.Get',
	params: controlNames,
});

export const setNamedControl = (controlName: string, spec: ControlSetSpec | boolean | string | number): CmdP<ControlStatus> => {
	const t = typeof spec;

	if (typeof spec === 'number' || typeof spec === 'boolean' || typeof spec === 'string') {
		spec = {Value: spec};
	}

	return {
		method: 'Control.Set',
		params: {
			...spec,
			Name: controlName,
		},
	};
};

export const getComponents = (): CmdP<any> => ({
	method: 'Component.GetComponents',
});

export const getComponentControls = (componentName: string, controlNames: string[]): CmdP<ComponentStatus> => ({
	method: 'Component.Get',
	params: {
		Name: componentName,
		Controls: controlNames.map(Name => ({Name})),
	},
});

export const setComponentControls = (componentName: string, controls: ComponentControlSetSpec[]): CmdP<true> => ({
	method: 'Component.Set',
	params: {
		Name: componentName,
		Controls: controls,
	},
});

export const addNamedControlToGroup = (groupId: string, controlNames: string[]): CmdP<ComponentStatus> => ({
	method: 'ChangeGroup.AddControl',
	params: {
		Id: groupId,
		Controls: controlNames,
	},
});

export const addComponentControlsToGroup = (groupId: string, componentName: string, controlNames: string[]): CmdP<true> => ({
	method: 'ChangeGroup.AddComponentControl',
	params: {
		Id: groupId,
		Component: {
			Name: componentName,
			Controls: controlNames.map(Name => ({Name})),
		},
	},
});

// TODO: Not any
export const pollGroup = (groupId: string): CmdP<any> => ({
	method: 'ChangeGroup.Poll',
	params: {
		Id: groupId,
	},
});

export const invalidateGroup = (groupId: string): CmdP<true> => ({
	method: 'ChangeGroup.Invalidate',
	params: {
		Id: groupId,
	},
});

export const clearGroup = (groupId: string): CmdP<true> => ({
	method: 'ChangeGroup.Clear',
	params: {
		Id: groupId,
	},
});

export const destroyGroup = (groupId: string): CmdP<true> => ({
	method: 'ChangeGroup.Destroy',
	params: {
		Id: groupId,
	},
});

export const removeNamedControlsFromGroup = (groupId: string, controlNames: string[]): CmdP<true> => ({
	method: 'ChangeGroup.Remove',
	params: {
		Id: groupId,
		Controls: controlNames,
	},
});

// TODO: Not any
export const autoPollGroup = (groupId: string, rate: number): CmdP<true> => ({
	method: 'ChangeGroup.AutoPoll',
	params: {
		Id: groupId,
		Rate: rate,
	},
});

export const noOp = (): CmdP<true> => ({
	method: 'NoOp',
});
