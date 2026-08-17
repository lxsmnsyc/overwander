import { For, type JSX, Show } from 'solid-js';
import { RadioGroup, RadioGroupOption } from 'terracotta';
import { MOVE_CATEGORY_COLORS, MOVE_CATEGORY_NAMES, type Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import TypeBadge from '../sprites/TypeBadge';
import { Badge, Meta } from '../styled';

/**
 * Choosing one of a pokemon's moves.
 *
 * Two different things ask it. A machine asks which move is **given
 * up** when the list is full, and a PP Up asks which move is **spent
 * on** — opposite questions with the same shape: here are the four it
 * knows, pick one. They were the same twenty lines written twice, so
 * they are this.
 *
 * What differs between the two callers is what a row says beside the
 * move and which rows are refused, so both are the caller's to supply.
 */

/**
 * One move as the game draws it: what it is, what kind it is, and what
 * it is worth
 */
export function MoveLine(props: { move: Moves }): JSX.Element {
  return (
    <span class="flex flex-col gap-0.5 text-left">
      <span class="flex flex-wrap items-center gap-2">
        <TypeBadge type={getMoveData(props.move).type} />
        <span
          class="size-3 shrink-0 rounded-sm"
          style={{ 'background-color': MOVE_CATEGORY_COLORS[getMoveData(props.move).category] }}
          title={MOVE_CATEGORY_NAMES[getMoveData(props.move).category]}
          aria-label={MOVE_CATEGORY_NAMES[getMoveData(props.move).category]}
          role="img"
        />
        <span class="font-medium">{getMoveData(props.move).name}</span>
        <Meta>
          {getMoveData(props.move).power == null ? '' : `${getMoveData(props.move).power} power · `}
          {getMoveData(props.move).pp} PP
        </Meta>
      </span>
      {/* What it actually does, which is what a player is choosing
          between — the figures above only say how hard and how often */}
      <Meta>{getMoveData(props.move).description}</Meta>
    </span>
  );
}

const OPTION =
  'flex cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-sm' +
  ' shadow-pop-sm transition-colors border-line bg-paper hover:border-tide' +
  ' aria-checked:border-leaf aria-checked:bg-leaf-soft focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide aria-disabled:cursor-not-allowed' +
  ' aria-disabled:opacity-55 aria-disabled:hover:border-line';

export interface MovePickerProps {
  moves: Moves[];
  /**
   * Which one is chosen, as an index into `moves`. Indexes rather than
   * move ids, because a pokemon may know the same move twice as far as
   * this control is concerned — and the callers write the slot back
   */
  value: number;
  onPick: (at: number) => void;
  /**
   * Something to say about a row that is still choosable — what a
   * move's points come to today, say
   */
  aside?: (move: Moves, at: number) => JSX.Element;
  /**
   * Why a row cannot be chosen. A refused row is drawn and said rather
   * than left out: a player looking for a move wants to be told it is
   * already full, not left wondering where it went
   */
  refused?: (move: Moves, at: number) => string | null;
}

export default function MovePicker(props: MovePickerProps): JSX.Element {
  return (
    // The type argument is written out because the options are
    // indexes: without it the group's value is inferred from the DOM
    // handler rather than from what is being picked
    <RadioGroup<number>
      toggleable={false}
      value={props.value}
      onChange={(picked) => {
        if (picked !== undefined) {
          props.onPick(picked);
        }
      }}
      class="flex flex-col gap-2"
    >
      <For each={props.moves}>
        {(move, at) => (
          <RadioGroupOption
            value={at()}
            disabled={props.refused?.(move, at()) != null}
            class={OPTION}
          >
            <MoveLine move={move} />
            {/* The reason it is refused, or — where it is not — whatever
                the caller has to say about it */}
            <Show when={props.refused?.(move, at())} fallback={props.aside?.(move, at())}>
              {(why) => <Badge>{why()}</Badge>}
            </Show>
          </RadioGroupOption>
        )}
      </For>
    </RadioGroup>
  );
}
