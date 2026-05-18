import AnyObservable from 'any-observable/optional';
import type QrcClient from '../qrc-client.ts';
import type {CommandMethod, InferCommandParams, InferResponseResult} from '../validation/index.ts';
import type {AutoPollUpdate} from '../types.ts';
import type {
	ObservableConstructor, SubscriptionObserver,
} from './observable.ts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const Observable = AnyObservable as ObservableConstructor;
const BaseClass = (Observable ?? Object);

type ChangeGroupCommand = Extract<CommandMethod, `ChangeGroup.${string}`>;

const warnObservable = () => {
	throw new Error('No observable implementation found. Please add one via `npm install zen-observable`, or install any implementation. See the `any-observable` package on npm for more details');
};

export class QrcPollGroup extends BaseClass<AutoPollUpdate> {
	private readonly client: QrcClient;
	private readonly id: string;

	private readonly updateListeners: Array<(update: AutoPollUpdate) => void> = [];

	public constructor(client: QrcClient, id: string) {
		// @ts-expect-error AnyObservable might actually be undefined, but that's too hard for Typescript to figure out
		super(BaseClass === Object
			? undefined
			: (observer: SubscriptionObserver<AutoPollUpdate>) => {
				const handler = (update: AutoPollUpdate) => {
					observer.next(update);
				};

				this.updateListeners.push(handler);

				return () => {
					this.updateListeners.splice(this.updateListeners.indexOf(handler), 1);
				};
			});
		this.client = client;
		this.id = id;
		if (!this.subscribe) {
			this.subscribe = warnObservable;
			this[Symbol.observable] = warnObservable;
		}
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

	/**
	 * To be called from QRC client, users should not use.
	 * @param update
	 */
	_handleAutoPollUpdate(update: AutoPollUpdate) {
		for (const handler of this.updateListeners) {
			handler(update);
		}
	}

	private async send<M extends ChangeGroupCommand>(method: M, parameters: Omit<InferCommandParams<M>, 'Id'>): Promise<InferResponseResult<M>> {
		// @ts-expect-error TypeScript cannot detect that Omit<type, 'Id'> & {Id: string} is the same as the full type.
		return this.client.send<M>(method, {...parameters, Id: this.id} satisfies InferCommandParams<M>);
	}
}
