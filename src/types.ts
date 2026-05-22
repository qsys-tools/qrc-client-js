export type ControlSetSpec = {
	Value: number | string | boolean;
	Ramp?: number;
} | {
	Position: number;
	Ramp?: number;
};

export type ComponentControlSetSpec = {
	Name: string;
} & ControlSetSpec;

export type AutoPollUpdate = {
	Id: string;
	Changes: AutoPollChange[];
};

export type AutoPollChange = {
	Component?: string;
	Name: string;
	String: string;
	Value: number | string | boolean;
	Position: number;
	Strings?: string[];
};
