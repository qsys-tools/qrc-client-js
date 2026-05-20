/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-confusing-void-expression */
import {Socket} from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type EventEmitter from 'node:events';
import ava, {type ExecutionContext, type SerialFn} from 'ava'; // eslint-disable-line ava/use-test
import delay from 'delay';
import isCI from 'is-ci';
import {pEvent} from 'p-event';
import {WebSocket} from 'ws';
import {v4 as uuidV4} from 'uuid';
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
import {SocketChannel} from '../src/socket-channel/socket-channel.ts';
import {WebsocketChannel} from '../src/socket-channel/websocket-channel.ts';
import type {CommunicationChannel} from '../src/socket-channel/communication-channel.ts';

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

const USE_WEBSOCKET = false;

const connectionInfo: {host: string; port: number} = USE_WEBSOCKET ? {host: '127.0.0.1', port: '8080'} : JSON.parse(connectionJSON);

const groupIds: string[] = [];

const getUniqueGroupId = () => {
	const id = uuidV4();
	groupIds.push(id);
	return id;
};

const withEmulator = async (t: ExecutionContext, run: (t: ExecutionContext, client: QrcClient) => unknown): Promise<any> => {
	const {title} = t;

	let channel: CommunicationChannel & EventEmitter;

	if (USE_WEBSOCKET) {
		const websocket = new WebSocket(`ws://${connectionInfo.host}:${connectionInfo.port}/qrc-public-api/v0`);
		const wsChannel = new WebsocketChannel(websocket);
		channel = wsChannel;
	} else {
		const socket = new Socket();
		const socketChannel = new SocketChannel(socket, connectionInfo);

		socketChannel.on('error', error => {
			console.error(`Error in ${title}`);
			console.error(error);
			t.fail(`Error was thrown in ${title}: ${String(error)}`);
		});

		channel = socketChannel;
	}

	const client = new QrcClient({
		validator: useNoopValidator ? undefined : new ZodValidator({parseLevel: 'strict', onParseFailure: 'throw'}),
		channel,
	});

	const connectEvent = pEvent(channel, 'connect');
	const closeEvent = pEvent(channel, 'close');

	channel.connect();
	await connectEvent;
	await client.send(setNamedControl('AllOff', true));

	t.teardown(async () => {
		await Promise.all(groupIds.map(async id => client.send(destroyGroup(id))));
		groupIds.splice(0);
		await delay(200);
		channel.end();
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
	t.true(await client.send(addNamedControlToGroup(getUniqueGroupId(), ['GainGain', 'GainMute'])));
});

test('addComponentControlsToGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.true(await client.send(addComponentControlsToGroup(getUniqueGroupId(), 'MyGain', ['bypass', 'invert'])));
});

test('pollGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const groupId = getUniqueGroupId();
	t.true(await client.send(addNamedControlToGroup(groupId, ['GainGain', 'GainMute'])));

	const {Id, Changes: [gain, mute]} = await client.send(pollGroup(groupId));

	t.is(Id, groupId);
	t.is(gain.Name, 'GainGain');
	t.is(gain.Value, -100);
	t.is(mute.Name, 'GainMute');
	t.is(mute.Value, 0);

	const {Changes: {length}} = await client.send(pollGroup(groupId));

	t.is(length, 0);
});

test('invalidateGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const groupId = getUniqueGroupId();
	t.true(await client.send(addNamedControlToGroup(groupId, ['GainGain'])));

	await client.send(pollGroup(groupId));

	const {Changes: {length}} = await client.send(pollGroup(groupId));
	t.is(length, 0);

	t.true(await client.send(invalidateGroup(groupId)));

	const {Id, Changes: [gain]} = await client.send(pollGroup(groupId));

	t.is(Id, groupId);
	t.is(gain.Name, 'GainGain');
	t.is(gain.Value, -100);
});

test('clearGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const groupId = getUniqueGroupId();
	t.true(await client.send(addNamedControlToGroup(groupId, ['GainGain', 'GainBypass'])));
	t.true(await client.send(clearGroup(groupId)));
	t.true(await client.send(invalidateGroup(groupId)));

	const {Changes: {length}} = await client.send(pollGroup(groupId));
	t.is(length, 0);
});

test('destroyGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const groupId = getUniqueGroupId();
	t.true(await client.send(addNamedControlToGroup(groupId, ['GainGain', 'GainBypass'])));
	t.true(await client.send(destroyGroup(groupId)));

	await t.throwsAsync(async () => client.send(pollGroup(groupId)), {message: /group.*does not exist/v}, 'foo');
});

test('removeNamedControlsFromGroup', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const groupId = getUniqueGroupId();
	t.true(await client.send(addNamedControlToGroup(groupId, ['GainGain', 'GainBypass'])));
	t.true(await client.send(removeNamedControlsFromGroup(groupId, ['GainBypass'])));
	t.true(await client.send(invalidateGroup(groupId)));

	const {Changes} = await client.send(pollGroup(groupId));
	t.is(Changes.length, 1);
	t.is(Changes[0].Name, 'GainGain');
});

test('pollGroups', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	const groupId = getUniqueGroupId();
	const group = client.pollGroup(groupId);
	t.true(await group.addControl('GainGain', 'GainBypass'));

	const changes: unknown[] = [];
	group.subscribe(value => {
		changes.push(value.Changes);
	});

	t.true(await group.autoPoll());

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

test('LoopPlayer.start', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.is(await client.send('LoopPlayer.Start', {
		Name: 'Loop_Player',
		Files: [{
			Name: '/media/foo.mp3',
			Output: 1,
		}],
	}), undefined);
});

test('LoopPlayer.Start', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	t.is(await client.send('LoopPlayer.Start', {
		Name: 'Loop_Player',
		Files: [{
			Name: '/media/foo.mp3',
			Output: 1,
		}],
	}), undefined);
});

test.failing('LoopPlayer.Stop', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	await client.send('LoopPlayer.Stop', {
		Name: 'Loop_Player',
		Outputs: [1],
	});
	t.pass('If this passes, it means the emulator is better handling loop players. Update the test');
});

test.failing('LoopPlayer.Cance', withEmulator, async (t: ExecutionContext, client: QrcClient) => {
	await client.send('LoopPlayer.Cancel', {
		Name: 'Loop_Player',
		Outputs: [1],
	});
	t.pass('If this passes, it means the emulator is better handling loop players. Update the test');
});
