import { For, type JSX, Show } from 'solid-js';
import { isEgg } from '../../../../auth/egg';
import type { Items } from '../../../../data/ids/items';
import type { Moves } from '../../../../data/ids/moves';
import { getRecallableMoves, getTutorableMoves } from '../../../../data/overworld/npc';
import CatchPicker, { type CatchOption } from '../../../catches/catch-picker';
import { MoveLine } from '../../../catches/TeachMoveDialog';
import FeeLine from './price';
import AnimatedSprite from '../../../sprites/AnimatedSprite';
import { getCatchName, isGuarded, isShiny } from '../../../../auth/caught-record';
import { Genders } from '../../../../data/ids/species';
import {
  Button,
  DialogSection,
  LIST_PAGE,
  List,
  ListRow,
  RowButton,
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
  },
): JSX.Element {
  const standing = (): CatchOption | null => pickedOf(props);
  const moves = (): Moves[] => {
    const option = standing();

    return option == null ? [] : props.movesOf(option);
  };
  const page = createPager(moves, LIST_PAGE);

  return (
    <DialogSection class="flex flex-col gap-3">
      <FeeLine fee={props.fee} scales={props.scales} />

      <Show
        when={standing()}
        fallback={
          <>
            <span class="text-xs font-semibold text-muted uppercase">Choose a pokemon</span>
            <CatchPicker
              inline
              options={props.options}
              value={props.picked}
              verb={props.verb}
              empty={props.empty}
              filter={(option) =>
                !isEgg(option.caught) && !option.fighting && props.movesOf(option).length > 0
              }
              reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
              note={(option) => `${props.movesOf(option).length} ${props.counted}`}
              onPick={props.onPick}
            />
          </>
        }
      >
        {(option) => (
          <>
            <ListRow class="flex-nowrap">
              <span class="flex size-12 shrink-0 items-center justify-center">
                <AnimatedSprite
                  species={option().caught.species}
                  shiny={isShiny(option().caught)}
                  female={option().caught.gender === Genders.Female}
                  direction="DownLeft"
                  still
                  fill
                  label=""
                />
              </span>
              <span class="min-w-0 grow truncate text-left font-semibold">
                Lv. {option().caught.level} {getCatchName(option().caught)}
              </span>
              <Button
                disabled={props.busy}
                onClick={() => {
                  props.onPick(null);
                }}
              >
                Change
              </Button>
            </ListRow>

            <span class="text-xs font-semibold text-muted uppercase">
              {props.heading} · {moves().length}
            </span>
            <List>
              <For each={page.shown()}>
                {(move) => (
                  <ListRow selected={props.chosen === move}>
                    <RowButton
                      pressed={props.chosen === move}
                      disabled={props.busy}
                      onClick={() => {
                        props.onChoose(move);
                      }}
                    >
                      <MoveLine move={move} />
                    </RowButton>
                  </ListRow>
                )}
              </For>
            </List>
            {page.controls()}
          </>
        )}
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
    />
  );
}
