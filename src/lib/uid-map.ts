class UidMap<T> {
	private readonly _map = new Map<number, T>();

	private _currentId = 0;

	put(value: T): number {
		do {
			this._currentId++;
			if (this._currentId >= Number.MAX_SAFE_INTEGER) {
				this._currentId = 1;
			}
		} while (this._map.has(this._currentId));

		this._map.set(this._currentId, value);

		return this._currentId;
	}

	has(id: number): boolean {
		return this._map.has(id);
	}

	get(id: number): T | undefined {
		return this._map.get(id);
	}

	pull(id: number): T | undefined {
		const returnValue = this.get(id);
		this._map.delete(id);
		return returnValue;
	}

	delete(id: number): boolean {
		return this._map.delete(id);
	}

	get size(): number {
		return this._map.size;
	}

	clear(): void {
		this._map.clear();
	}

	keys(): IterableIterator<number> {
		return this._map.keys();
	}

	entries(): IterableIterator<[number, T]> {
		return this._map.entries();
	}

	values(): IterableIterator<T> {
		return this._map.values();
	}

	forEach(callbackFn: (value: T, key: number, map: UidMap<T>) => void, thisArg?: any): void {
		this._map.forEach((value, key) => {
			callbackFn.call(thisArg, value, key, this);
		});
	}
}

export default UidMap;
