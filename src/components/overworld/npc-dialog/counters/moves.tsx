import { For, type JSX, Show } from 'solid-js';
import { isGuarded } from '../../../../auth/caught-record';
import { isEgg } from '../../../../auth/egg';
import type { Items } from '../../../../data/ids/items';
import type { Moves } from '../../../../data/ids/moves';
import { getRecallableMoves, getTutorableMoves } from '../../../../data/overworld/npc';
import CatchPicker, { type CatchOption } from '../../../catches/catch-picker';
import { MoveLine } from '../../../catches/TeachMoveDialog';
import Price from './price';
import { DialogSection, List, ListRow, Meta, Note, RowButton } from '../../../styled';
import { CENTRED } from '../shared';

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
function Lessons(props: {
  moves: Moves[];
  chosen: Moves | null;
  busy: boolean;
  said: string;
  onChoose: (move: Moves) => void;
}): JSX.Element {
  return (
    <>
      <Meta>{props.said}</Meta>
      <List>
        <For each={props.moves}>
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
    </>
  );
}

export function ReminderCounter(props: MoveCounterProps): JSX.Element {
  const standing = (): CatchOption | null =>
    props.options.find((option) => option.id === props.picked) ?? null;

  /**
   * What he could give this one back: everything its species learns by
   * levelling up to its level, minus the moves it still knows
   */
  const forgotten = (option: CatchOption): Moves[] =>
    getRecallableMoves(option.caught.species, option.caught.level, option.caught.moves);

  return (
    <DialogSection class={CENTRED}>
      <Price fee={props.fee} scales={props.scales} />

      {/* Both inputs are on the counter the moment he is walked up to:
          the pokemon, and what that pokemon has lost. There is nothing
          to agree to first — what he offers *is* the two of them — so
          the button is the only step, and it stays dead until they are
          both filled in and a scale is in the bag.

          The pickers are inline rather than dialogs of their own,
          since this is already one */}
      <CatchPicker
        inline
        options={props.options}
        value={props.picked}
        verb="Remind"
        empty="You have nothing that has forgotten anything."
        filter={(option) =>
          !isEgg(option.caught) && !option.fighting && forgotten(option).length > 0
        }
        reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
        note={(option) => `${forgotten(option).length} forgotten`}
        onPick={props.onPick}
      />

      <Show when={standing()} fallback={<Note>Choose one of yours first.</Note>}>
        {(option) => (
          <Lessons
            moves={forgotten(option())}
            chosen={props.chosen}
            busy={props.busy}
            said="What it has learned and lost:"
            onChoose={props.onChoose}
          />
        )}
      </Show>
    </DialogSection>
  );
}

export function TutorCounter(props: MoveCounterProps): JSX.Element {
  const standing = (): CatchOption | null =>
    props.options.find((option) => option.id === props.picked) ?? null;

  const lessons = (option: CatchOption): Moves[] =>
    getTutorableMoves(option.caught.species, option.caught.moves);

  return (
    <DialogSection class={CENTRED}>
      <Price fee={props.fee} scales={props.scales} />

      {/* The same counter the reminder keeps: both inputs on it at
          once, and the button dead until they are filled in and the
          fee is in the purse */}
      <CatchPicker
        inline
        options={props.options}
        value={props.picked}
        verb="Teach"
        empty="You have nothing he could teach."
        filter={(option) => !isEgg(option.caught) && !option.fighting && lessons(option).length > 0}
        reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
        note={(option) => `${lessons(option).length} to learn`}
        onPick={props.onPick}
      />

      <Show when={standing()} fallback={<Note>Choose one of yours first.</Note>}>
        {(option) => (
          <Lessons
            moves={lessons(option())}
            chosen={props.chosen}
            busy={props.busy}
            said="What he could teach it:"
            onChoose={props.onChoose}
          />
        )}
      </Show>
    </DialogSection>
  );
}
