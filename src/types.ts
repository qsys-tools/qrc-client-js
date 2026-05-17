import type QrcError from './lib/qrc-error.ts';

export type StatusCode = {
	Code: number;
	String: string;
};

export type HasStatusCode = {
	Status: StatusCode;
};

// eslint-disable-next-line @typescript-eslint/no-restricted-types
type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
	jsonrpc: '2.0';
	method: string;
	params?: any[] | Record<string, any>;
	id?: JsonRpcId;
};

type JsonRpcBaseResponse = {
	jsonrpc: '2.0';
	id: JsonRpcId;
};

export type JsonRpcSuccessResponse<T = any> = JsonRpcBaseResponse & {
	result: T;
};

export type JsonRpcError = {
	code: number;
	message?: string;
	data?: any;
};

export type JsonRpcErrorResponse = JsonRpcBaseResponse & {
	error: {
		code: number;
		message: string;
		data?: any;
	};
};

// The union type for any response
export type JsonRpcResponse<T = any> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse;

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
