import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import { isLockLive } from '../../auth/battle-lock';
import readBox from '../../auth/box';
import { syncServerClock } from '../../auth/clock';
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import { Button, DialogActions, DialogSection, Note, Status } from '../styled';
import { CostBadge, type CounterCost, CounterStep, CounterTerms, PickOne } from './terms';
import { type FormProps, defineForm } from './form';

/** The player's pokemon, each with whether it is locked in a battle by the server's clock */
export async function loadCatchOptions(player: string): Promise<CatchOption[]> {
  const [owned, now] = await Promise.all([readBox(player), syncServerClock()]);
  const options: CatchOption[] = [];

  for (const [id, caught] of owned) {
    options.push({ id, caught, fighting: isLockLive(caught, now) });
  }
  return options;
}

export interface PickCatchInput {
  player: string;
  title?: string;
  prompt?: string;
  /** What the dock's button says, which is what the pick is for */
  action: string;
  /** What a row's button says, before the pokemon's name */
  verb: string;
  empty: string;
  /** Which pokemon can be picked at all */
  filter: (option: CatchOption) => boolean;
  /** Why one in the list cannot be picked, which shows it greyed */
  reason?: (option: CatchOption) => string | null;
  /** What picking this one would do, on its square */
  note?: (option: CatchOption) => string | null;
  /** And under its name, once picked */
  detail?: (option: CatchOption) => string;
  /** How many may be picked; one unless it says */
  max?: number;
  /** How many must be; one unless it says */
  min?: number;
  /** The label over the box */
  step?: string;
  cost?: CounterCost;
  /** What the player carries of what is charged; short greys the button */
  have?: { amount: number; short: boolean; unit: string };
  /** Why these picks cannot go ahead together, or null */
  check?: (picked: CatchOption[]) => string | null;
}

function PickCatchBody(
  props: FormProps<PickCatchInput, CatchOption[]> & { options: Resource<CatchOption[]> },
): JSX.Element {
  const [picked, setPicked] = createSignal<string[]>([]);

  const max = (): number => props.input.max ?? 1;
  const options = (): CatchOption[] => props.options.latest ?? [];

  const chosen = (): CatchOption[] => {
    const ids = new Set(picked());
    const found: CatchOption[] = [];

    for (const option of options()) {
      if (ids.has(option.id)) {
        found.push(option);
      }
    }
    return found;
  };

  const refused = (): string | null =>
    chosen().length >= (props.input.min ?? 1) ? (props.input.check?.(chosen()) ?? null) : null;

  const ready = (): boolean =>
    chosen().length >= (props.input.min ?? 1) &&
    refused() == null &&
    props.input.have?.short !== true;

  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        <Show when={props.input.cost != null || props.input.have != null}>
          <CounterTerms cost={props.input.cost} have={props.input.have} />
        </Show>
        <Show
          when={max() > 1}
          fallback={
            <PickOne
              options={options()}
              picked={picked()[0] ?? null}
              onPick={(id) => {
                setPicked(id == null ? [] : [id]);
              }}
              verb={props.input.verb}
              empty={props.input.empty}
              filter={props.input.filter}
              note={props.input.note}
              reason={props.input.reason}
              detail={props.input.detail}
            />
          }
        >
          <CounterStep>{props.input.step ?? 'Choose your pokemon'}</CounterStep>
          {/* Live, so the picker draws no confirm of its own: the dock's button is the one press */}
          <CatchPicker
            inline
            multiple
            live
            max={max()}
            options={options()}
            value={picked()}
            verb={props.input.verb}
            empty={props.input.empty}
            filter={props.input.filter}
            note={props.input.note}
            reason={props.input.reason}
            onPick={(next) => {
              setPicked(next);
            }}
          />
        </Show>
        <Status message={refused()} />
      </DialogSection>
      <DialogActions>
        <Button
          tone="primary"
          disabled={!ready()}
          onClick={() => {
            props.submit(chosen());
          }}
        >
          {props.input.action}
          <Show when={max() > 1 && chosen().length > 0}> {chosen().length}</Show>
          <Show when={props.input.cost}>{(cost) => <CostBadge cost={cost()} />}</Show>
        </Button>
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </>
  );
}

function PickCatchView(props: FormProps<PickCatchInput, CatchOption[]>): JSX.Element {
  const [options] = createResource(() => props.input.player, loadCatchOptions);

  return (
    <Suspense fallback={<Note class="text-center">Looking them over…</Note>}>
      <PickCatchBody {...props} options={options} />
    </Suspense>
  );
}

/** Some of the player's pokemon, picked for a purpose */
export const PickCatchForm = defineForm<PickCatchInput, CatchOption[]>({
  title: (input) => input.title ?? 'Your pokemon',
  prompt: (input) => input.prompt ?? 'Choose one of your pokemon.',
  view: (props) => <PickCatchView {...props} />,
});
