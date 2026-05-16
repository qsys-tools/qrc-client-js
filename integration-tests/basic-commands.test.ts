/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ava, {type ExecutionContext, type SerialFn} from 'ava'; // eslint-disable-line ava/use-test
import delay from 'delay';
import isCI from 'is-ci';
import {pEvent} from 'p-event';
import QrcClient, {ZodValidator} from '../src/index.ts';
import {
	setNamedControl,
	getComponentControls,
	addNamedControlToGroup,
	addComponentControlsToGroup,
	pollGroup,
	invalidateGroup,
	clearGroup,
	destroyGroup,
	removeNamedControlsFromGroup,
} from '../src/commands.ts';

// @ts-expect-error Just making `.only` work for local testing
const test: SerialFn = isCI ? ava.serial.skip : ava.serial;

const useNoopValidator = process.argv.includes('--noop-validator');

if (useNoopValidator) {
	console.log('Using the noop validator');
}

let connectionJSON;

try {
	connectionJSON = fs.readFileSync(path.join(import.meta.dirname, 'design-location.json'), 'utf8');
} catch {
	connectionJSON = '{"host": "127.0.0.1", "port": 1710}';
}

const connectionInfo: {host: string; port: number} = JSON.parse(connectionJSON);

const withEmulator = async (t: ExecutionContext, run: (t: ExecutionContext, client: QrcClient) => unknown): Promise<any> => {
	const {title} = t;

	const client = new QrcClient({
		validator: useNoopValidator ? undefined : new ZodValidator({parseLevel: 'strict', onParseFailure: 'throw'}),
	});
	client.on('error', error => {
		console.error(`Error in ${title}`);
		console.error(error);
		t.fail(`Error was thrown in ${title}: ${String(error)}`);
	});

	const connectEvent = pEvent(client, 'connect');
	const closeEvent = pEvent(client, 'close');

	client.connect(connectionInfo);
	await connectEvent;
	await client.send(setNamedControl('AllOff', true));

	t.teardown(async () => {
		await delay(200);
		client.end();
		await closeEvent;
	});
	await run(t, client);
};

test('getStatus', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const status = await client.send('StatusGet');

	t.is(status.DesignName, 'Basic-Commands-Test');
	t.is(status.IsRedundant, false);
	t.is(status.IsEmulator, true);
	t.is(status.State, 'Active');
	t.is(status.Platform, 'Emulator');
	t.true(typeof status.DesignCode === 'string');

	t.is(status.Status.Code, 0);
	t.is(status.Status.String, 'OK');
});

test('logon', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const result = await client.send('Logon', {User: 'james', Password: '123456'});
	t.true(result);
});

test('getNamedControls', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const [gain, mute] = await client.send('Control.Get', ['GainGain', 'GainMute']);
	t.is(gain.String, '-100dB');
	t.is(gain.Value, -100);
	t.is(gain.Position, 0);
	t.is(gain.Name, 'GainGain');

	t.is(mute.String, 'unmuted');
	t.is(mute.Value, 0);
	t.is(mute.Position, 0);
	t.is(mute.Name, 'GainMute');
});

test('setNamedControl', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	let gain = await client.send('Control.Set', {
		Name: 'GainGain',
		Value: 20,
	});

	t.is(gain.String, '20.0dB');
	t.is(gain.Value, 20);
	t.is(gain.Position, 1);
	t.is(gain.Name, 'GainGain');

	gain = await client.send(setNamedControl('GainGain', {Position: 0.5}));

	t.is(gain.Value, -40);
	t.is(gain.Position, 0.5);

	// Shorthand for Value
	gain = await client.send(setNamedControl('GainGain', 0));
	t.is(gain.Value, 0);
});

test('getComponentControls', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const component = await client.send('Component.Get', {
		Name: 'MyGain',
		Controls: [
			{Name: 'mute'},
			{Name: 'gain'},
		],
	});

	t.is(component.Name, 'MyGain');

	const [mute, gain] = component.Controls;

	t.is(gain.String, '-100dB');
	t.is(gain.Value, -100);
	t.is(gain.Position, 0);
	t.is(gain.Name, 'gain');

	t.is(mute.String, 'unmuted');
	t.is(mute.Value, 0);
	t.is(mute.Position, 0);
	t.is(mute.Name, 'mute');
});

test('setComponentControls', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send('Component.Set', {
		Name: 'MyGain',
		Controls: [
			{Name: 'mute', Value: 1},
			{Name: 'gain', Position: 1},
		],
	}));

	const {Controls: [gain]} = await client.send(getComponentControls('MyGain', ['gain']));

	t.is(gain.Value, 20);
});

test('setComponentControls with Results', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const result = await client.send('Component.Set', {
		Name: 'MyGain',
		Controls: [
			{Name: 'mute', Value: 1},
			{Name: 'gain', Position: 1},
		],
		ResponseValues: true,
	});
	if (result === true) {
		return t.fail('should return an object');
	}

	const [, gain] = result;

	t.is(gain.Value, 20);
});

test('addNamedControlToGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addNamedControlToGroup('my group', ['GainGain', 'GainMute'])));
});

test('addComponentControlsToGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addComponentControlsToGroup('my group', 'MyGain', ['bypass', 'invert'])));
});

test('pollGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addNamedControlToGroup('my group', ['GainGain', 'GainMute'])));

	const {Id, Changes: [gain, mute]} = await client.send(pollGroup('my group'));

	t.is(Id, 'my group');
	t.is(gain.Name, 'GainGain');
	t.is(gain.Value, -100);
	t.is(mute.Name, 'GainMute');
	t.is(mute.Value, 0);

	const {Changes: {length}} = await client.send(pollGroup('my group'));

	t.is(length, 0);
});

test('invalidateGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addNamedControlToGroup('my group', ['GainGain'])));

	await client.send(pollGroup('my group'));

	const {Changes: {length}} = await client.send(pollGroup('my group'));
	t.is(length, 0);

	t.true(await client.send(invalidateGroup('my group')));

	const {Id, Changes: [gain]} = await client.send(pollGroup('my group'));

	t.is(Id, 'my group');
	t.is(gain.Name, 'GainGain');
	t.is(gain.Value, -100);
});

test('clearGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addNamedControlToGroup('my group', ['GainGain', 'GainBypass'])));
	t.true(await client.send(clearGroup('my group')));
	t.true(await client.send(invalidateGroup('my group')));

	const {Changes: {length}} = await client.send(pollGroup('my group'));
	t.is(length, 0);
});

test('destroyGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addNamedControlToGroup('my group', ['GainGain', 'GainBypass'])));
	t.true(await client.send(destroyGroup('my group')));

	await t.throwsAsync(async () => client.send(pollGroup('my group')), {message: /group.*does not exist/v}, 'foo');
});

test('removeNamedControlsFromGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addNamedControlToGroup('my group', ['GainGain', 'GainBypass'])));
	t.true(await client.send(removeNamedControlsFromGroup('my group', ['GainBypass'])));
	t.true(await client.send(invalidateGroup('my group')));

	const {Changes} = await client.send(pollGroup('my group'));
	t.is(Changes.length, 1);
	t.is(Changes[0].Name, 'GainGain');
});

test('pollGroups', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addNamedControlToGroup('my group', ['GainGain', 'GainBypass'])));

	const observable = client.pollGroup('my group');

	const changes: unknown[] = [];
	observable.subscribe(value => {
		changes.push(value.Changes);
	});

	await delay(500);

	await client.send(setNamedControl('GainGain', {Position: 1}));

	await delay(500);

	t.deepEqual(changes, [
		[
			{
				Name: 'GainGain', String: '-100dB', Value: -100, Position: 0,
			},
			{
				Name: 'GainBypass', String: 'no', Value: 0, Position: 0,
			},
		],
		[
			{
				Name: 'GainGain', String: '20.0dB', Value: 20, Position: 1,
			},
		],
	]);
});
