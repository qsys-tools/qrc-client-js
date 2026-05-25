/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion,unicorn/prefer-spread */
import fs from 'node:fs';
import {Socket} from 'node:net';
import path from 'node:path';
import {pEvent} from 'p-event';
import {makeDirectorySync} from 'make-dir';
import {SocketChannel} from '@qsys-tools/json-rpc-channel';
import QrcClient from '../src/qrc-client.ts';
import {
	getComponents,
} from '../src/commands.ts';

let connectionJSON;

try {
	connectionJSON = fs.readFileSync(path.join(import.meta.dirname, 'design-location.json'), 'utf8');
} catch {
	connectionJSON = '{"host": "127.0.0.1", "port": 1710}';
}

const connectionInfo: {host: string; port: number} = JSON.parse(connectionJSON);
const socket = new Socket();
const channel = new SocketChannel(socket, connectionInfo);
const client = new QrcClient({channel});
channel.addEventListener('error', ({error}) => {
	console.error(error);
});

const connectEvent = pEvent(channel, 'connect');

socket.connect(connectionInfo);
await connectEvent;

const dataDir = path.join(import.meta.dirname, 'data');

makeDirectorySync(dataDir);

const components: any = await client.send(getComponents());

fs.writeFileSync(path.join(dataDir, 'component-manifest.json'), JSON.stringify(components, null, 2));

const componentTypes = new Set<string>();

const componentControlTypes = new Set<string>();
const allShapes = new Set<string>();
const componentDirections = new Set<string>();
const componentControlTypeShapes = new Map<string, Set<string>>();
const shapeKeys = new Set<string>();
const shapeKeyTypes = new Map<string, Set<string>>();

const createShapeString = (object: Record<string, unknown>) => {
	for (const key of Object.keys(object)) {
		shapeKeys.add(key);
		let keyTypes = shapeKeyTypes.get(key);
		if (!keyTypes) {
			keyTypes = new Set<string>();
			shapeKeyTypes.set(key, keyTypes);
		}

		const type = typeof object[key];

		if (type === 'object') {
			if (Array.isArray(object[key])) {
				const arrayTypes = Array.from(new Set(object[key].map(member => typeof (member))));
				keyTypes.add(`Array<${arrayTypes.join('|')}>`);
			} else {
				keyTypes.add('object');
			}
		} else {
			keyTypes.add(typeof object[key]);
		}
	}

	const line = Object.keys(object).toSorted().map(k => `${JSON.stringify(k)}: ${JSON.stringify(typeof object[k])}`).join(',');
	return `{${line}}`;
};

for (const component of components) {
	if (componentTypes.has(component.Type)) {
		continue;
	}

	componentTypes.add(component.Type as string);

	try {
		// eslint-disable-next-line no-await-in-loop
		const componentDetails: any = await client.send({
			method: 'Component.GetControls',
			params: {
				Name: component.Name,
			},
		});

		for (const componentControl of componentDetails.Controls) {
			componentControlTypes.add(componentControl.Type);
			componentDirections.add(componentControl.Direction);
			let shapeSet = componentControlTypeShapes.get(componentControl.Type);
			if (!shapeSet) {
				shapeSet = new Set<string>();
				componentControlTypeShapes.set(componentControl.Type, shapeSet);
			}

			shapeSet.add(createShapeString(componentControl));
			allShapes.add(createShapeString(componentControl));
		}

		fs.writeFileSync(path.join(dataDir, `${component.Type}.json`), JSON.stringify(componentDetails, null, 2));
	} catch (error) {
		console.error(error);
	}
}

console.log(Array.from(componentDirections).join(', '));
console.log(Array.from(componentControlTypes).join(', '));

for (const [componentType, shapeSet] of componentControlTypeShapes) {
	if (shapeSet.size > 1) {
		console.log(`${componentType} has multiple Shape definitions:\n\t ${Array.from(shapeSet).join('\n\t ')}\n\n`);
	}
}

console.log(`\n\n Total of ${allShapes.size} shapes`);

const shapeKeyDescription = {};

for (const [key, types] of shapeKeyTypes) {
	// @ts-ignore
	shapeKeyDescription[key] = types.size > 1 ? Array.from(types) : Array.from(types)[0];
}

console.log(`\n\n ${JSON.stringify(shapeKeyDescription, null, 2)}`);

channel.close();
