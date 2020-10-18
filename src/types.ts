export interface CMDp<T> {
	method: string;
	params?: Record<string, any>;
}

export interface StatusCode {
	Code: number;
	String: string;
}

export interface HasStatusCode {
	Status: StatusCode;
}

export interface JsonRpcRequest {
	jsonrpc?: '2.0';
	id?: number | string;
	method: string;
	params?: Record<string, any>;
}

export interface JsonRpcResponse<T> {
	jsonrpc: '2.0';
	id?: number | string;
	result?: T;
	error?: JsonRpcError;
}

export interface JsonRpcError {
	code: number;
	message: string;
	data?: any;
}

export interface EngineStatus extends HasStatusCode {
	Platform: string;
	State: 'Idle' | 'Active' | 'Standby';
	DesignName: string;
	DesignCode: string;
	IsRedundant: boolean;
	IsEmulator: boolean;
}

export type ResponseHandler<T> = (err: JsonRpcError | null, response?: T) => void;

export interface ControlStatus {
	Name: string;
	Value: number | string | boolean;
	String: string;
	Position: number;
}

export interface ControlSetSpec {
	Value?: number | string | boolean;
	Position?: number;
	Ramp?: number;
}

export interface ComponentStatus {
	Name: string;
	Controls: ControlStatus[];
}

export interface ComponentControlSetSpec extends ControlSetSpec {
	Name: string;
}

export interface AutoPollUpdate {
	Id: string;
	Changes: AutoPollChange[];
}

export interface AutoPollChange {
	Component?: string;
	Name: string;
	String: string;
	Value: number | string | boolean;
	Position: number;
}

// T39 - Observable - https://github.com/tc39/proposal-observable

export interface Observer<T> {
	// Receives the subscription object when `subscribe` is called
	start(subscription: Subscription): void;

	// Receives the next value in the sequence
	next(value: T): void;

	// Receives the sequence error
	error(errorValue: Error): void;

	// Receives a completion notification
	complete(): void;
}

export interface ObservableConstructor {
	new <T>(subscriber: SubscriberFunction<T>): Observable<T>;

	// Converts items to an Observable
	of<T>(...items: T[]): Observable<T>;

	// Converts an observable or iterable to an Observable
	from<T>(observable: Observable<T> | Iterable<T>): Observable<T>;
}

export interface Observable<T> {
	// Subscribes to the sequence with an observer
	subscribe(observer: Observer<T>): Subscription;

	// Subscribes to the sequence with callbacks
	subscribe(
		onNext: (value: T) => void,
		onError?: (errorValue: Error) => void,
		onComplete?: () => void
	): Subscription;

	// Returns itself
	[Symbol.observable](): Observable<T>;
}

export interface Subscription {
	// A boolean value indicating whether the subscription is closed
	readonly closed: boolean;

	// Cancels the subscription
	unsubscribe(): void;
}

export type SubscriberFunction<T> = (observer: SubscriptionObserver<T>) => () => void | Subscription;

export interface SubscriptionObserver<T> {
	// A boolean value indicating whether the subscription is closed
	readonly closed: boolean;

	// Sends the next value in the sequence
	next(value: T): void;

	// Sends the sequence error
	error(errorValue: Error): void;

	// Sends the completion notification
	complete(): void;
}
