import fs from 'fs';
import path from 'path';
import {ExecutionContext, serial as rawTest} from 'ava'; // eslint-disable-line ava/use-test
import delay from 'delay';
import isCI from 'is-ci';
import pEvent from 'p-event';
import QrcClient from '../src/qrc-client';
import {
	getStatus,
	logon,
	getNamedControls,
	setNamedControl,
	getComponentControls,
	setComponentControls,
	addNamedControlToGroup,
	addComponentControlsToGroup,
	pollGroup,
	invalidateGroup,
	clearGroup,
	destroyGroup,
	removeNamedControlsFromGroup
} from '../src/commands';

const test = isCI ? rawTest.skip : rawTest;

let connectionJSON;

try {
	connectionJSON = fs.readFileSync(path.join(__dirname, 'design-location.json'), 'utf8');
} catch {
	connectionJSON = '{"host": "127.0.0.1", "port": 1710}';
}

const connectionInfo: {host: string; port: number} = JSON.parse(connectionJSON);

const withEmulator = async (t: ExecutionContext, run: (t: ExecutionContext, client: QrcClient) => any): Promise<any> => {
	const client = new QrcClient();
	client.on('error', error => t.fail(`Error was thrown: ${String(error)}`));

	const connectEvent = pEvent(client, 'connect');
	const closeEvent = pEvent(client, 'close');

	client.connect(connectionInfo);
	await connectEvent;
	await client.send(setNamedControl('AllOff', true));
	await run(t, client);
	client.end();
	await closeEvent;
};

test('getStatus', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const status = await client.send(getStatus());

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
	t.true(await client.send(logon('james', 'password')));
});

test('getNamedControls', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const [gain, mute] = await client.send(getNamedControls('GainGain', 'GainMute'));

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
	let gain = await client.send(setNamedControl('GainGain', {Value: 20}));

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
	const component = await client.send(getComponentControls('MyGain', ['mute', 'gain']));

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
	t.true(await client.send(setComponentControls('MyGain', [
		{Name: 'mute', Value: 1},
		{Name: 'gain', Position: 1}
	])));

	const {Controls: [gain]} = await client.send(getComponentControls('MyGain', ['gain']));

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

	// TODO: We are currently relying on ordering for this test that is not guaranteed by the API.
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

	// TODO: fix types and expand this test
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
	await t.throwsAsync(async () => client.send(pollGroup('my group')), {message: /group.*does not exist/}, 'foo');
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

	const changes: any = [];
	observable.subscribe(value => changes.push(value.Changes));

	await delay(500);

	await client.send(setNamedControl('GainGain', {Position: 1}));

	await delay(500);

	t.deepEqual(changes, [
		[
			{Name: 'GainGain', String: '-100dB', Value: -100, Position: 0},
			{Name: 'GainBypass', String: 'no', Value: 0, Position: 0}
		],
		[
			{Name: 'GainGain', String: '20.0dB', Value: 20, Position: 1}
		]
	]);
});
