/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable unicorn/no-array-method-this-argument */
import test from 'ava';
import UidMap from './uid-map.ts';

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

	const entries = [...map.entries()];
	t.is(entries.length, 1);
	t.is(typeof entries[0][0], 'string');
	t.is(entries[0][1], 'foo');
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

	const keys = [...map.keys()];
	t.is(keys.length, 1);
});

test('forEach', t => {
	t.plan(3);
	const map = new UidMap<string>();
	const thisArg = {};

	map.put('foo');

	// eslint-disable-next-line unicorn/no-array-for-each
	map.forEach(
		function (this: any, value, _key, map) {
			t.is(value, 'foo');
			t.is(map, map);
			t.is(this, thisArg); // eslint-disable unicorn/no-array-method-this-argument
		},
		thisArg,
	);
});
