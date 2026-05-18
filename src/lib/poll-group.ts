import AnyObservable from 'any-observable/optional';
import type QrcClient from '../qrc-client.ts';
import type {CommandMethod, InferCommandParams, InferResponseResult} from '../validation/index.ts';
import type {AutoPollUpdate} from '../types.ts';
import type {
	ObservableConstructor, SubscriptionObserver, ObservableInstance, Observer, Subscription,
} from './observable.ts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const Observable = AnyObservable as ObservableConstructor;

type ChangeGroupCommand = Extract<CommandMethod, `ChangeGroup.${string}`>;

const assertObservable = () => {
	if (!Observable) {
		throw new Error('No observable implementation found. Please add one via `npm install zen-observable`, or install any implementation. See the `any-observable` package on npm for more details');
	}
};

export class QrcPollGroup implements ObservableInstance<AutoPollUpdate> {
	private readonly client: QrcClient;
	private readonly id: string;
	private readonly observable?: ObservableInstance<AutoPollUpdate>;
	private observer?: SubscriptionObserver<AutoPollUpdate>;

	public constructor(client: QrcClient, id: string) {
		this.observable
			= typeof Observable === 'function'
				? new Observable(observer => {
					this.observer = observer;
					void this.autoPoll();
					return () => {
						this.observer = undefined;
						void this.clear();
					};
				})
				: undefined;
		this.client = client;
		this.id = id;
	}
	subscribe(
		onNext: (value: AutoPollUpdate) => void,
		onError?: (errorValue: Error) => void,
		onComplete?: () => void
	): Subscription;
	subscribe(observer: Observer<AutoPollUpdate>): Subscription;

	subscribe(...args: [Observer<AutoPollUpdate>] | [
		onNext: (value: AutoPollUpdate) => void,
		onError?: (errorValue: Error) => void,
		onComplete?: () => void,
	]) {
		assertObservable();
		// @ts-expect-error types are hard
		return this.observable?.subscribe(...args);
	}

	// Returns itself
	[Symbol.observable]() {
		assertObservable();
		return this.observable!;
	}

	async send<M extends ChangeGroupCommand>(method: M, parameters: Omit<InferCommandParams<M>, 'Id'>): Promise<InferResponseResult<M>> {
		// @ts-expect-error TypeScript cannot detect that Omit<type, 'Id'> & {Id: string} is the same as the full type.
		return this.client.send<M>(method, {...parameters, Id: this.id} satisfies InferCommandParams<M>);
	}

	async addControl(...controls: string[]) {
		return this.send('ChangeGroup.AddControl', {
			Controls: controls,
		});
	}

	async addComponentControls(component: string, ...controls: string[]) {
		return this.send('ChangeGroup.AddComponentControl', {
			Component: {
				Name: component,
				Controls: controls.map(name => ({Name: name})),
			},
		});
	}

	async remove(...controls: string[]) {
		return this.send('ChangeGroup.Remove', {
			Controls: controls,
		});
	}

	async poll() {
		return this.send('ChangeGroup.Poll', {});
	}

	async invalidate() {
		return this.send('ChangeGroup.Invalidate', {});
	}

	async clear() {
		return this.send('ChangeGroup.Clear', {});
	}

	async autoPoll(rate = 0.3) {
		return this.send('ChangeGroup.AutoPoll', {
			Rate: rate,
		});
	}

	_handleAutoPollUpdate(update: AutoPollUpdate) {
		if (this.observer) {
			this.observer.next(update);
		}
	}
}
