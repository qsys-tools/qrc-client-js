/* eslint-disable @typescript-eslint/naming-convention */
import {type JsonRpcError} from '../types.ts';

export const ErrorCodes = {
	[-32_700]: 'Parse error.', // Invalid JSON was received by the server.
	[-32_600]: 'Invalid request.', // The JSON sent is not a valid Request object.
	[-32_601]: 'Method not found.',
	[-32_602]: 'Invalid params.',
	[-32_603]: 'Server error.',
	[-32_604]: 'Core is on Standby.', // This code is returned when a QRC command is received while the Core is not the active Core in a redundant Core configuration.
	2: 'Invalid Page Request ID.',
	3: 'Bad Page Request.', // - could not create the requested Page Request,
	4: 'Missing file',
	5: 'Change Groups exhausted',
	6: 'Unknown change group.',
	7: 'Unknown component name.',
	8: 'Unknown control.',
	9: 'Illegal mixer channel index',
	10: 'Logon required',
} as const;

export const isKnownQrcErrorCode = (code: number): code is keyof typeof ErrorCodes => code in ErrorCodes;

const prefixColon = (s = '') =>
	s.trim() === ''
		? ''
		: `: ${s.trim()}`;

export const describeQrcErrorCode = (code: number) =>
	isKnownQrcErrorCode(code)
		? `${code} - ${ErrorCodes[code]}`
		: String(code);

class QrcError extends Error {
	readonly code: number;

	readonly data?: unknown;

	constructor({code, message, data}: JsonRpcError) {
		super(`${describeQrcErrorCode(code)}${prefixColon(message)}`);
		this.name = 'QrcError';
		this.code = code;
		this.data = data;
	}
}

export default QrcError;
