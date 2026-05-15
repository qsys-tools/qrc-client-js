/* eslint-disable @typescript-eslint/ban-ts-comment */
import test from 'ava';
import {ZodError} from 'zod';
import {createCommand} from './parse-request.ts';

test('should create commands that do not require params', t => {
	t.deepEqual(createCommand('NoOp'), {
		jsonrpc: '2.0',
		method: 'NoOp',
		params: {},
	});
});

test('should create commands that do require params', t => {
	t.deepEqual(createCommand('Control.Set', {
		Name: 'My Control',
		Value: 30,
	}), {
		jsonrpc: '2.0',
		method: 'Control.Set',
		params: {
			Name: 'My Control',
			Value: 30,
		},
	});
});

test('should create Mixer and ChangeGroup commands', t => {
	t.deepEqual(createCommand('Mixer.SetCrossPointDelay', {
		Name: 'My Mixer',
		Inputs: '3,4',
		Outputs: '5',
		Value: 6,
	}), {
		jsonrpc: '2.0',
		method: 'Mixer.SetCrossPointDelay',
		params: {
			Name: 'My Mixer',
			Inputs: '3,4',
			Outputs: '5',
			Value: 6,
		},
	});

	t.deepEqual(createCommand('ChangeGroup.AddControl', {
		Id: 'My Group',
		Controls: ['My Control'],
	}), {
		jsonrpc: '2.0',
		method: 'ChangeGroup.AddControl',
		params: {
			Id: 'My Group',
			Controls: ['My Control'],
		},
	});
});

test('should throw an error if params are incorrect', t => {
	// @ts-expect-error
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const error: ZodError = t.throws(() => createCommand('ChangeGroup.AddControl', {
		Id: 'My Control',
	}, {onParseFailure: 'throw'}), {
		instanceOf: ZodError,
	});
	t.is(error.issues.length, 1);
	t.is(error.issues[0].code, 'invalid_type');
	t.deepEqual(error.issues[0].path, ['Controls']);
});
