import {JsonRpcError} from '../types';

class QrcError extends Error {
	readonly code: number;

	readonly data?: any;

	constructor({code, message, data}: JsonRpcError) {
		super(message);
		this.name = 'QrcError';
		this.code = code;
		this.data = data;
	}

	toString(): string {
		const object = Object(this); // eslint-disable-line unicorn/new-for-builtins
		if (object !== this) {
			throw new TypeError('Error creating QrcError');
		}

		let {name, message} = this;
		name = (name === undefined) ? 'QrcError' : String(name);

		if (name === '') {
			name = 'QrcError';
		}

		const code = (this.code === undefined) ? '' : String(this.code);

		if (code !== '') {
			name = `${name}(${code})`;
		}

		message = (message === undefined) ? '' : String(message);

		if (message === '') {
			return name;
		}

		return `${name}:${message}`;
	}
}

export default QrcError;
