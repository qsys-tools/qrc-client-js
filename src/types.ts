import type QrcError from './lib/qrc-error.ts';

export type CmdP<T> = {
	method: string;
	params?: Record<string, any>;
};

export type StatusCode = {
	Code: number;
	String: string;
};

export type HasStatusCode = {
	Status: StatusCode;
};

export type JsonRpcRequest = {
	jsonrpc?: '2.0';
	id?: number | string;
	method: string;
	params?: Record<string, any>;
};

export type JsonRpcResponse<T> = {
	jsonrpc: '2.0';
	id?: number | string;
	result?: T;
	error?: JsonRpcError;
};

export type JsonRpcError = {
	code: number;
	message?: string;
	data?: any;
};

export type EngineStatus = {
	Platform: string;
	State: 'Idle' | 'Active' | 'Standby';
	DesignName: string;
	DesignCode: string;
	IsRedundant: boolean;
	IsEmulator: boolean;
} & HasStatusCode;

export type ResponseHandler<T> = (error: QrcError | undefined, response?: T) => void;

export type ControlStatus = {
	Name: string;
	Value: number | string | boolean;
	String: string;
	Position: number;
};

export type ControlSetSpec = {
	Value?: number | string | boolean;
	Position?: number;
	Ramp?: number;
};

export type ComponentStatus = {
	Name: string;
	Controls: ControlStatus[];
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
