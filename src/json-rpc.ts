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
	error: JsonRpcError;
};

// The union type for any response
export type JsonRpcResponse<T = any> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse;

export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse;
