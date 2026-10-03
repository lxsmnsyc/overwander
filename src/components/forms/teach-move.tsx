import {
  type Accessor,
  For,
  Index,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  untrack,
} from 'solid-js';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import { getCatchSlots, isShiny } from '../../auth/caught-record';
import { Slots } from '../../data/constants/slots';
import { isEgg } from '../../auth/egg';
import teachMove, { learnLevelUpMove } from '../../auth/moves';
import type { Moves } from '../../data/ids/moves';
import { type Items, getMachineItem } from '../../data/ids/items';
import { Species } from '../../data/ids/species';
import { getMoveData } from '../../data/moves';
import { getSpeciesData } from '../../data/species';
import { type LearnResult, describeLearnRefusal } from '../../auth/learn-refusal';
import { MOVE_SLOT, MOVE_SLOTS, MoveLine } from '../catches/MovePicker';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { type CounterCost, CounterStep, CounterTerms, HeadingPortrait } from './terms';
import { Button, DialogActions, Meta, Note, Status } from '../styled';
import playEffect, { Effect } from '../app/sound';
import { type FormProps, defineForm } from './form';
import { openForm } from './stack';

/**
 * Teaching one move to one pokemon.
 *
 * A list with room asks only whether; a full one asks which move goes.
 * The record decides which a player sees. The caller passes its own
 * `teach` and its own word for the price, so the Move Reminder shares
 * this rather than owning a lookalike
 */
export interface TeachMoveInput {
  catchId: string;
  /** The move being taught. Its machine is derived from it: there is exactly one per move */
  move: Moves;
  /** What is being spent, as the form says it: "The machine is spent teaching it" */
  cost?: string;
  /** The item it spends, drawn as a chip. Defaults to the move's machine */
  price?: Items;
  /**
   * How the teaching is paid for and written. Defaults to using the
   * machine for the move out of the player's bag
   */
  teach?: (catchId: string, move: Moves, replaces: number) => Promise<LearnResult | null>;
}

function TeachBody(
  props: FormProps<TeachMoveInput, true> & { caught: Resource<CaughtPokemon | null> },
): JSX.Element {
  const [forgetting, setForgetting] = createSignal(0);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  /** Read in a memo so the first read suspends, rather than drawing the roomy list first */
  const record = createMemo(() => props.caught());

  const known = (): Moves[] => record()?.moves ?? [];

  /**
   * Whether the list is full: the **record's** own room rather than the
   * game's, so a pokemon with a fifth slot is offered a fifth move
   */
  const full = (): boolean => {
    const loaded = record();

    return loaded != null && known().length >= getCatchSlots(loaded, Slots.Move);
  };

  const taught = (): string => getMoveData(props.input.move).name;

  /**
   * What it is paid with: the caller's item, or the machine for the
   * move. A caller teaching its own way pays its own way
   */
  const costOf = (): CounterCost | undefined => {
    if (props.input.price != null) {
      return { item: props.input.price };
    }
    return props.input.teach == null ? { item: getMachineItem(props.input.move) } : undefined;
  };

  const room = (): number => {
    const loaded = record();

    return loaded == null ? 0 : getCatchSlots(loaded, Slots.Move);
  };

  const named = (): string => {
    const loaded = record();

    if (loaded == null) {
      return 'This pokemon';
    }
    return isEgg(loaded) ? 'Egg' : getSpeciesData(loaded.species).name;
  };

  /** What the press does: give up a move for it, or only take it */
  const action = (): string =>
    full() ? `Forget ${getMoveData(known()[forgetting()] ?? 0).name}` : 'Teach it';

  const teach = (): void => {
    const { catchId, move } = props.input;

    setStatus(null);
    setBusy(true);
    (
      props.input.teach?.(catchId, move, forgetting()) ??
      teachMove(catchId, getMachineItem(move), forgetting())
    )
      .then((result) => {
        setBusy(false);

        // The server says which rule refused, so the form says one true
        // sentence. A null is nobody refusing: whoever would have
        // taught it is no longer standing there
        if (result == null) {
          setStatus(`${named()} could not be taught ${taught()} just now.`);
          return;
        }
        if ('refused' in result) {
          setStatus(describeLearnRefusal(result.refused, named(), taught()));
          return;
        }
        playEffect(Effect.MoveLearned);
        props.submit(true);
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  return (
    <>
      <Meta class="block">
        {full()
          ? `${named()} already knows ${known().length}. Choose the one it forgets.`
          : `${named()} has room for it.`}
      </Meta>
      <CounterTerms
        cost={costOf()}
        rows={[{ label: named(), value: `knows ${known().length} of ${room()}` }]}
      />

      {/* The move on offer, set apart from the ones it already knows */}
      <div class="flex flex-col gap-2 rounded-2xl border-2 border-tide bg-tide-soft px-3 py-2.5">
        <div class="flex items-center gap-2">
          <span
            class="shrink-0 rounded-full bg-tide px-2 py-0.5 text-[10px] font-extrabold
              tracking-wide text-white uppercase"
          >
            New
          </span>
          <MoveLine move={props.input.move} />
        </div>
        <CounterTerms
          rows={[
            ...(getMoveData(props.input.move).power == null
              ? []
              : [{ label: 'Power', value: String(getMoveData(props.input.move).power) }]),
            { label: 'PP', value: String(getMoveData(props.input.move).pp) },
          ]}
        />
      </div>

      <Show
        when={full()}
        fallback={
          <>
            <CounterStep>Its moves</CounterStep>
            <ul class={MOVE_SLOTS}>
              <For each={known()}>
                {(move) => (
                  <li class={`${MOVE_SLOT} border-line bg-paper`}>
                    <MoveLine move={move} />
                  </li>
                )}
              </For>
              {/* Where the new one will go */}
              <li
                class={`${MOVE_SLOT} border-dashed border-leaf bg-leaf-soft font-bold text-leaf-dark`}
              >
                + {taught()}
              </li>
            </ul>
          </>
        }
      >
        <CounterStep>Choose one to forget</CounterStep>
        <ul class={MOVE_SLOTS}>
          <Index each={known()}>
            {(move, at) => (
              <li>
                <button
                  type="button"
                  aria-pressed={forgetting() === at}
                  class={`${MOVE_SLOT} w-full cursor-pointer ${
                    forgetting() === at
                      ? 'border-ember bg-ember-soft text-ember-dark [&_.truncate]:line-through'
                      : 'border-line bg-paper hover:border-tide'
                  }`}
                  onClick={() => {
                    setForgetting(at);
                  }}
                >
                  <MoveLine move={move()} />
                </button>
              </li>
            )}
          </Index>
        </ul>
        <Meta>
          {getMoveData(known()[forgetting()] ?? 0).name} → {taught()}. Only a level-up move comes
          back, and only from the Move Reminder.
        </Meta>
      </Show>

      <Status message={status()} />

      <DialogActions>
        <Button tone="primary" disabled={busy() || record() == null} onClick={teach}>
          {busy() ? 'Teaching…' : action()}
        </Button>
        <Button disabled={busy()} onClick={props.cancel}>
          {props.leave}
        </Button>
      </DialogActions>
    </>
  );
}

function TeachView(props: FormProps<TeachMoveInput, true>): JSX.Element {
  const [caught] = createResource(() => props.input.catchId, getCaught);

  return (
    <Suspense fallback={<Note class="text-center">Looking it over…</Note>}>
      <TeachBody {...props} caught={caught} />
    </Suspense>
  );
}

/** The pokemon's face, for the nameplate, read on its own */
function CatchFace(props: { catchId: string }): JSX.Element {
  const [caught] = createResource(() => props.catchId, getCaught);

  return (
    <Suspense>
      <Show when={caught()}>
        {(loaded) => (
          <HeadingPortrait>
            <AnimatedSprite
              species={isEgg(loaded()) ? Species.Egg : loaded().species}
              shiny={!isEgg(loaded()) && isShiny(loaded())}
              direction="Down"
              still
              fill
              label=""
            />
          </HeadingPortrait>
        )}
      </Show>
    </Suspense>
  );
}

/** Teaching a move, answered with true once it is learned */
export const TeachMoveForm = defineForm<TeachMoveInput, true>({
  title: (input) => `Teach ${getMoveData(input.move).name}?`,
  prompt: (input) => `${input.cost ?? 'The machine'} is spent teaching it.`,
  lead: (input) => <CatchFace catchId={input.catchId} />,
  width: 'wide',
  // Answered by its buttons alone: a level hands a move over once
  insistent: true,
  view: (props) => <TeachView {...props} />,
});

/** A move about to be learned, with whatever else the same level offered queued behind it */
export interface Teaching {
  catchId: string;
  move: Moves;
  rest: Moves[];
  /** Grown into rather than taught: the candy already paid for it */
  levelled: boolean;
}

/**
 * Ask each teaching as it comes to the front of the queue, one form at
 * a time. Keyed by who and what, so a level queueing more moves behind
 * the one being asked does not ask it twice
 */
export function askTeachings(
  teaching: Accessor<Teaching | null>,
  next: () => void,
  onTaught: (levelled: boolean) => void,
): void {
  const asking = createMemo(() => {
    const current = teaching();

    return current == null ? null : `${current.catchId}:${current.move}`;
  });

  createEffect(
    on(asking, (key) => {
      const current = untrack(teaching);

      if (key == null || current == null) {
        return;
      }
      openForm(TeachMoveForm, {
        catchId: current.catchId,
        move: current.move,
        cost: current.levelled ? 'Nothing' : undefined,
        teach: current.levelled ? learnLevelUpMove : undefined,
      })
        .then((taught) => {
          if (taught === true) {
            onTaught(current.levelled);
          }
          next();
        })
        .catch(() => undefined);
    }),
  );
}
