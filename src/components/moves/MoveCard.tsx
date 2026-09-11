import { type JSX, Show } from 'solid-js';
import type { Moves } from '../../data/ids/moves';
import type { MoveData } from '../../data/moves';
import { getMoveCooldown, getMoveData, getMovePP } from '../../data/moves';
import MoveCategorySprite from '../sprites/MoveCategorySprite';
import TypeBadge from '../sprites/TypeBadge';
import { Detail } from '../styled';

/**
 * What a move is, in the shape a player already reads it in: what it
 * fights as, what it costs, and what it does.
 *
 * A move is a name in a list wherever it appears — a card over a box
 * square, a party row, a sheet — and the name is the half that says
 * the least. This is the rest of the entry, small enough to float over
 * the name it belongs to.
 */

/**
 * What is written where a move has no number. A status move has no
 * power and one that cannot miss has no accuracy, and both are facts
 * about the move rather than gaps in the entry
 */
const NONE = '—';

export interface MoveCardProps {
  move: Moves;
  /**
   * What the pokemon reading this card has spent on the move. PP is
   * how often the move comes back rather than a pool that drains, so
   * a PP Up shows up here as a shorter wait
   */
  points?: number;
  /**
   * How fast the pokemon reading this card is. Speed buys part of a
   * wait off, so a card shown against a pokemon says what that
   * pokemon actually waits; a card with no pokemon behind it shows
   * the move's own
   */
  speed?: number;
}

export default function MoveCard(props: MoveCardProps): JSX.Element {
  /**
   * A move the registry does not know is drawn rather than thrown: the
   * card floats over a list that would otherwise go down with it
   */
  const data = (): MoveData | null => {
    try {
      return getMoveData(props.move);
    } catch {
      return null;
    }
  };

  return (
    <div class="flex flex-col gap-1.5">
      {/* What it fights as and how it fights, one at each end: the two
          pictures a move list is scanned by, and neither is read as
          part of the other */}
      <Show when={data()}>
        {(known) => (
          <div class="flex items-center justify-between gap-2">
            <TypeBadge type={known().type} />
            <MoveCategorySprite category={known().category} />
          </div>
        )}
      </Show>
      <div class="grid grid-cols-3 gap-1.5">
        <Detail label="Power">{data()?.power ?? NONE}</Detail>
        <Detail label="Accuracy">
          {data() == null || data()?.accuracy == null ? NONE : `${data()?.accuracy}%`}
        </Detail>
        {/* Its own PP with whatever has been spent on it, and what
            that comes to at the field: the number a player is deciding
            with is the wait, not the count behind it */}
        <Detail label="PP">
          {data() == null ? NONE : getMovePP(props.move, props.points ?? 0)}
        </Detail>
      </div>
      <div class="grid grid-cols-1 gap-1.5">
        <Detail label="Cooldown">
          {data() == null
            ? NONE
            : `${(getMoveCooldown(props.move, props.points ?? 0, props.speed ?? 0) / 1000).toFixed(1)}s`}
        </Detail>
      </div>
      <Detail label="Description">{data()?.description ?? 'Nothing is known about this.'}</Detail>
    </div>
  );
}
