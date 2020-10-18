/* eslint-disable  @typescript-eslint/dot-notation */
import test from 'ava';
import UidMap from './uid-map';

test('you can get what you put in', t => {
	const map = new UidMap<string>();
	const id = map.put('foo');

	t.is(map.get(id), 'foo');
});

test('returns discrete id\'s', t => {
	const map = new UidMap<string>();
	const fooId = map.put('foo');
	const barId = map.put('bar');

	t.is(map.get(fooId), 'foo');
	t.is(map.get(barId), 'bar');
});

test('pull removes the item', t => {
	const map = new UidMap<string>();
	const fooId = map.put('foo');

	t.true(map.has(fooId));
	t.is(map.pull(fooId), 'foo');
	t.false(map.has(fooId));
});

test('will skip over existing id\'s', t => {
	const map = new UidMap<string>();

	const nextId = map['_currentId'] + 1;
	map['_map'].set(nextId, 'baz');

	t.not(map.put('foo'), nextId);
	t.not(map.put('bar'), nextId);
	t.not(map.put('quz'), nextId);
});

test('will skip over multiple existing id\'s', t => {
	const map = new UidMap<string>();

	const nextId = map['_currentId'] + 1;
	map['_map'].set(nextId, 'baz');
	map['_map'].set(nextId + 1, 'baz');

	const id1 = map.put('foo');
	t.not(id1, nextId);
	t.not(id1, nextId + 1);

	const id2 = map.put('bar');
	t.not(id2, nextId);
	t.not(id2, nextId + 1);
});

test('will wrap after reaching MAX_SAFE_INTEGER', t => {
	const map = new UidMap<string>();

	map['_currentId'] = Number.MAX_SAFE_INTEGER;

	t.is(map.put('foo'), 1);
});

test('will wrap and skip used id\'s', t => {
	const map = new UidMap<string>();

	map['_currentId'] = Number.MAX_SAFE_INTEGER;
	map['_map'].set(1, 'bar');

	t.is(map.put('foo'), 2);
});

test('size', t => {
	const map = new UidMap<string>();

	t.is(map.size, 0);

	map.put('foo');

	t.is(map.size, 1);
});

test('clear', t => {
	const map = new UidMap<string>();

	map.put('foo');
	map.put('bar');
	map.clear();

	t.is(map.size, 0);
});

test('entries', t => {
	const map = new UidMap<string>();

	t.deepEqual([...map.entries()], []);

	map.put('foo');

	t.deepEqual([...map.entries()], [[1, 'foo']]);
});

test('values', t => {
	const map = new UidMap<string>();

	t.deepEqual([...map.values()], []);

	map.put('foo');

	t.deepEqual([...map.values()], ['foo']);
});

test('keys', t => {
	const map = new UidMap<string>();

	t.deepEqual([...map.keys()], []);

	map.put('foo');

	t.deepEqual([...map.keys()], [1]);
});

test('forEach', t => {
	t.plan(4);
	const map = new UidMap<string>();
	const thisArg = {};

	map.put('foo');

	map.forEach(function (this: any, value, key, map) {
		t.is(value, 'foo');
		t.is(key, 1);
		t.is(map, map);
		t.is(this, thisArg);
	}, thisArg);
});
