import type { JSX } from 'solid-js';
import { TYPE_COLORS } from '../../data/constants/types';
import type { Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';

/**
 * A move as the catch sheet's move card: a keyline card with the move's
 * type in colour down its left edge. The words and marks inside are
 * `MoveLine`'s; this is the frame and the stripe.
 */
export const MOVE_CARD =
  'relative flex min-h-12 items-center gap-2 overflow-hidden rounded-button border-2 py-1.5' +
  ' pr-2.5 pl-4 text-left text-sm font-extrabold';

/** The type's colour, along the card's left edge */
export function MoveStripe(props: { move: Moves }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="absolute inset-y-0 left-0 w-1.5"
      style={{ background: TYPE_COLORS[getMoveData(props.move).type] }}
    />
  );
}
