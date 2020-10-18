import {inspect as insp} from 'util';
import {stderr, stdout} from 'supports-color';

const colors = Boolean(stdout || stderr);

export const inspect = (object: any): string => {
	return insp(object, {colors, depth: Infinity});
};

export const log = (...args: any[]): void => {
	console.log(...args.map(value => typeof value === 'string' ? value : inspect(value)));
};
