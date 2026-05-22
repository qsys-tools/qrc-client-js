import {v4 as uuidv4} from 'uuid';

class UidMap<T> {
	private readonly _map = new Map<string, T>();

	put(value: T) {
		const id = uuidv4();

		this._map.set(id, value);

		return id;
	}

	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	looseHas(id: string | number | null | undefined): id is string {
		if (typeof id !== 'string') {
			return false;
		}

		return this._map.has(id);
	}

	has(id: string): boolean {
		return this._map.has(id);
	}

	get(id: string): T | undefined {
		return this._map.get(id);
	}

	pull(id: string): T | undefined {
		const returnValue = this.get(id);
		this._map.delete(id);
		return returnValue;
	}

	delete(id: string): boolean {
		return this._map.delete(id);
	}

	get size(): number {
		return this._map.size;
	}

	clear(): void {
		this._map.clear();
	}

	keys(): IterableIterator<string> {
		return this._map.keys();
	}

	entries(): IterableIterator<[string, T]> {
		return this._map.entries();
	}

	values(): IterableIterator<T> {
		return this._map.values();
	}

	forEach(callbackFn: (value: T, key: string, map: UidMap<T>) => void, thisArg?: any): void {
		for (const [key, value] of this._map.entries()) {
			callbackFn.call(thisArg, value, key, this);
		}
	}
}

export default UidMap;
