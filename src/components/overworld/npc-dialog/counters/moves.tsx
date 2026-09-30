import { For, type JSX, Show, createEffect, createSignal, on } from 'solid-js';
import { isEgg } from '../../../../auth/egg';
import type { Items } from '../../../../data/ids/items';
import type { Moves } from '../../../../data/ids/moves';
import {
  getRecallableMoves,
  getTutorableMoves,
  tutorRefuses,
} from '../../../../data/overworld/npc';
import type { CatchOption } from '../../../catches/catch-picker';
import { getMoveData } from '../../../../data/moves';
import { TYPE_NAMES } from '../../../../data/constants/types';
import MoveHoverCard from '../../../moves/MoveHoverCard';
import { MoveLabel } from '../../../catches/MovePicker';
import { CounterStep, CounterTerms, PickOne } from '../terms';
import { isGuarded } from '../../../../auth/caught-record';
import {
  DialogSection,
  LIST_PAGE,
  ListRow,
  Meta,
  Note,
  RowButton,
  SEARCH_FROM,
  Search,
  createPager,
} from '../../../styled';

/**
 * The two counters that sell a move: the reminder, who gives back what
 * a pokemon has outgrown, and the tutor, who teaches what it never
 * knew. Both take one heart scale and ask the same two questions in
 * the same order — which pokemon, then which move.
 */

interface MoveCounterProps {
  options: CatchOption[];
  /** How many heart scales are in the bag, which is the whole price */
  scales: number;
  fee: Items;
  /** Which pokemon is on the counter, and which of its moves */
  picked: string | null;
  chosen: Moves | null;
  busy: boolean;
  onPick: (catchId: string | null) => void;
  onChoose: (move: Moves) => void;
}

/**
 * The moves a counter is offering for the pokemon on it, and nothing
 * until one is on it: what has been forgotten, or what can be taught,
 * is a question about a particular pokemon
 */
function pickedOf(props: MoveCounterProps): CatchOption | null {
  for (const option of props.options) {
    if (option.id === props.picked) {
      return option;
    }
  }
  return null;
}

/**
 * The counter both of them keep, in two steps: the box to pick from,
 * then that pokemon on its own with the moves on offer, so the choice
 * never scrolls away under the list
 */
function MoveCounter(
  props: MoveCounterProps & {
    verb: string;
    empty: string;
    heading: string;
    counted: string;
    movesOf: (option: CatchOption) => Moves[];
    /** Why a move on offer cannot be taught to this one yet, or null */
    refuses?: (option: CatchOption, move: Moves) => string | null;
  },
): JSX.Element {
  const standing = (): CatchOption | null => pickedOf(props);
  const moves = (): Moves[] => {
    const option = standing();

    return option == null ? [] : props.movesOf(option);
  };
  const [query, setQuery] = createSignal('');
  // A search for the last pokemon's moves means nothing for the next one
  createEffect(
    on(
      () => props.picked,
      () => {
        setQuery('');
      },
    ),
  );
  /** The moves on offer whose name or type holds what was typed */
  const found = (): Moves[] => {
    const typed = query().trim().toLowerCase();

    if (typed === '') {
      return moves();
    }
    const matched: Moves[] = [];

    for (const move of moves()) {
      const data = getMoveData(move);

      if (
        data.name.toLowerCase().includes(typed) ||
        TYPE_NAMES[data.type].toLowerCase().includes(typed)
      ) {
        matched.push(move);
      }
    }
    return matched;
  };
  const page = createPager(found, LIST_PAGE);

  return (
    <DialogSection class="flex flex-col gap-3">
      <CounterTerms
        cost={{ item: props.fee }}
        have={{
          amount: props.scales,
          short: props.scales < 1,
          unit: props.scales === 1 ? 'Heart Scale' : 'Heart Scales',
        }}
      />
      <PickOne
        options={props.options}
        picked={props.picked}
        onPick={props.onPick}
        busy={props.busy}
        verb={props.verb}
        empty={props.empty}
        filter={(option) =>
          !isEgg(option.caught) && !option.fighting && props.movesOf(option).length > 0
        }
        reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
        note={(option) => `${props.movesOf(option).length} ${props.counted}`}
      />
      <Show when={standing() != null}>
        <>
          <CounterStep>
            {props.heading} · {moves().length}
          </CounterStep>
          <Show when={moves().length >= SEARCH_FROM}>
            <Search
              value={query()}
              placeholder="Name or type"
              onChange={(typed) => {
                setQuery(typed);
              }}
            />
          </Show>
          {/* Name, type and category at a glance, as the catch sheet
              draws them; what the move does is on the card over it */}
          <ul class="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            <For
              each={page.shown()}
              fallback={
                <li class="col-span-full">
                  <Note>No move matches that.</Note>
                </li>
              }
            >
              {(move) => {
                const refused = (): string | null => {
                  const option = standing();

                  return option == null ? null : (props.refuses?.(option, move) ?? null);
                };

                return (
                  <ListRow class="flex-nowrap p-0" selected={props.chosen === move}>
                    <MoveHoverCard class="block grow" move={move}>
                      <RowButton
                        class="flex w-full items-center gap-2 px-3 py-2"
                        pressed={props.chosen === move}
                        disabled={props.busy || refused() != null}
                        onClick={() => {
                          props.onChoose(move);
                        }}
                      >
                        <MoveLabel move={move} />
                      </RowButton>
                    </MoveHoverCard>
                    <Show when={refused()}>
                      {(why) => <Meta class="shrink-0 pr-3">{why()}</Meta>}
                    </Show>
                  </ListRow>
                );
              }}
            </For>
          </ul>
          {page.controls()}
        </>
      </Show>
    </DialogSection>
  );
}

export function ReminderCounter(props: MoveCounterProps): JSX.Element {
  return (
    <MoveCounter
      {...props}
      verb="Remind"
      empty="You have nothing that has forgotten anything."
      heading="What it has learned and lost"
      counted="forgotten"
      movesOf={(option) =>
        getRecallableMoves(option.caught.species, option.caught.level, option.caught.moves)
      }
    />
  );
}

export function TutorCounter(props: MoveCounterProps): JSX.Element {
  return (
    <MoveCounter
      {...props}
      verb="Teach"
      empty="You have nothing he could teach."
      heading="What he could teach it"
      counted="to learn"
      movesOf={(option) => getTutorableMoves(option.caught.species, option.caught.moves)}
      refuses={(option, move) =>
        tutorRefuses(move, option.caught.friendship) ? 'Needs max friendship' : null
      }
    />
  );
}
