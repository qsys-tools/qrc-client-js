import {ComponentControlSetSpec, ComponentStatus, ControlSetSpec, ControlStatus, EngineStatus, CMDp} from './types';

export const getStatus = (): CMDp<EngineStatus> => ({
	method: 'StatusGet'
});

export const logon = (username: string, password: string): CMDp<true> => ({
	method: 'Logon',
	params: {
		User: username,
		Password: password
	}
});

export const getNamedControls = (...controlNames: string[]): CMDp<ControlStatus[]> => ({
	method: 'Control.Get',
	params: controlNames
});

export const setNamedControl = (controlName: string, spec: ControlSetSpec | boolean | string | number): CMDp<ControlStatus> => {
	const t = typeof spec;

	if (t === 'string' || t === 'boolean' || t === 'number') {
		spec = {Value: (spec as number | boolean | string)};
	}

	return {
		method: 'Control.Set',
		params: {
			...(spec as ControlSetSpec),
			Name: controlName
		}
	};
};

export const getComponents = (): CMDp<any> => ({
	method: 'Component.GetComponents'
});

export const getComponentControls = (componentName: string, controlNames: string[]): CMDp<ComponentStatus> => ({
	method: 'Component.Get',
	params: {
		Name: componentName,
		Controls: controlNames.map(Name => ({Name}))
	}
});

export const setComponentControls = (componentName: string, controls: ComponentControlSetSpec[]): CMDp<true> => ({
	method: 'Component.Set',
	params: {
		Name: componentName,
		Controls: controls
	}
});

export const addNamedControlToGroup = (groupId: string, controlNames: string[]): CMDp<ComponentStatus> => ({
	method: 'ChangeGroup.AddControl',
	params: {
		Id: groupId,
		Controls: controlNames
	}
});

export const addComponentControlsToGroup = (groupId: string, componentName: string, controlNames: string[]): CMDp<true> => ({
	method: 'ChangeGroup.AddComponentControl',
	params: {
		Id: groupId,
		Component: {
			Name: componentName,
			Controls: controlNames.map(Name => ({Name}))
		}
	}
});

// TODO: Not any
export const pollGroup = (groupId: string): CMDp<any> => ({
	method: 'ChangeGroup.Poll',
	params: {
		Id: groupId
	}
});

export const invalidateGroup = (groupId: string): CMDp<true> => ({
	method: 'ChangeGroup.Invalidate',
	params: {
		Id: groupId
	}
});

export const clearGroup = (groupId: string): CMDp<true> => ({
	method: 'ChangeGroup.Clear',
	params: {
		Id: groupId
	}
});

export const destroyGroup = (groupId: string): CMDp<true> => ({
	method: 'ChangeGroup.Destroy',
	params: {
		Id: groupId
	}
});

export const removeNamedControlsFromGroup = (groupId: string, controlNames: string[]): CMDp<true> => ({
	method: 'ChangeGroup.Remove',
	params: {
		Id: groupId,
		Controls: controlNames
	}
});

// TODO: Not any
export const autoPollGroup = (groupId: string, rate: number): CMDp<true> => ({
	method: 'ChangeGroup.AutoPoll',
	params: {
		Id: groupId,
		Rate: rate
	}
});

export const noOp = (): CMDp<true> => ({
	method: 'NoOp'
});
