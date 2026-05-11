import {inspect as insp} from 'node:util';
import supportsColor from 'supports-color';

const colors = Boolean(supportsColor.stdout ?? supportsColor.stderr);

export const inspect = (object: any): string => insp(object, {colors, depth: Infinity});

export const log = (...args: any[]): void => {
	console.log(...args.map(value => typeof value === 'string' ? value : inspect(value)));
};
