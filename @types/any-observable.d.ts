declare module 'any-observable' {
	const OC: ObservableConstructor;
	export default OC;

	export type Observer<T> = {
		// Receives the subscription object when `subscribe` is called
		start(subscription: Subscription): void;

		// Receives the next value in the sequence
		next(value: T): void;

		// Receives the sequence error
		error(errorValue: Error): void;

		// Receives a completion notification
		complete(): void;
	};

	export type ObservableConstructor = {
		new<T>(subscriber: SubscriberFunction<T>): ObservableInstance<T>;

		// Converts items to an Observable
		of<T>(...items: T[]): ObservableInstance<T>;

		// Converts an observable or iterable to an Observable
		from<T>(observable: ObservableInstance<T> | Iterable<T>): ObservableInstance<T>;
	};

	export type ObservableInstance<T> = {
		// Subscribes to the sequence with an observer
		subscribe(observer: Observer<T>): Subscription;

		// Subscribes to the sequence with callbacks
		subscribe(
			onNext: (value: T) => void,
			onError?: (errorValue: Error) => void,
			onComplete?: () => void
		): Subscription;

		// Returns itself
		[Symbol.observable](): ObservableInstance<T>;
	};

	export type Subscription = {
		// A boolean value indicating whether the subscription is closed
		readonly closed: boolean;

		// Cancels the subscription
		unsubscribe(): void;
	};

	export type SubscriberFunction<T> = (observer: SubscriptionObserver<T>) => () => void | Subscription;

	export type SubscriptionObserver<T> = {
		// A boolean value indicating whether the subscription is closed
		readonly closed: boolean;

		// Sends the next value in the sequence
		next(value: T): void;

		// Sends the sequence error
		error(errorValue: Error): void;

		// Sends the completion notification
		complete(): void;
	};
}
