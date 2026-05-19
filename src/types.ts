export type StatusCode = {
	Code: number;
	String: string;
};

export type HasStatusCode = {
	Status: StatusCode;
};

export type EngineStatus = {
	Platform: string;
	State: 'Idle' | 'Active' | 'Standby';
	DesignName: string;
	DesignCode: string;
	IsRedundant: boolean;
	IsEmulator: boolean;
} & HasStatusCode;

export type ControlStatus = {
	Name: string;
	Value: number | string | boolean;
	String: string;
	Position: number;
};

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
