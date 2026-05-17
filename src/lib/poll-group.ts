import AnyObservable from 'any-observable';
import type QrcClient from '../qrc-client.ts';
import type {CommandMethod, InferCommandParams, InferResponseResult} from '../validation/index.ts';
import type {AutoPollUpdate} from '../types.ts';
import type {ObservableConstructor, SubscriptionObserver} from './observable.ts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const Observable = AnyObservable as ObservableConstructor;

type ChangeGroupCommand = Extract<CommandMethod, `ChangeGroup.${string}`>;

export class QrcPollGroup extends Observable<AutoPollUpdate> {
	private readonly client: QrcClient;
	private readonly id: string;
	private observer?: SubscriptionObserver<AutoPollUpdate>;

	public constructor(client: QrcClient, id: string) {
		super(observer => {
			this.observer = observer;
			void this.autoPoll();
			return () => {
				this.observer = undefined;
				void this.clear();
			};
		});
		this.client = client;
		this.id = id;
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
