import type { JSX, ParentProps } from 'solid-js';
import { TYPE_NAMES } from '../../data/constants/types';
import { MOVE_CATEGORY_NAMES, type Moves } from '../../data/ids/moves';
import { type MoveData, getMoveCooldown, getMoveData, getMovePP } from '../../data/moves';
import { detailMove } from '../details';
import { Detail, TooltipHost } from '../styled';

/**
 * A move name with its entry in a tooltip: what it does, then its
 * numbers as rows. A tooltip rather than a card, since there is nothing
 * in it to press
 */
export interface MoveTooltipProps extends ParentProps {
  move: Moves;
  /** What the pokemon showing this move has spent on it */
  points?: number;
  /** How fast that pokemon is, which is part of the wait */
  speed?: number;
  /** How the wrapped name sits in its row */
  class?: string;
}

/** What is written where a move has no number, such as a status move's power */
const NONE = '—';

export default function MoveTooltip(props: MoveTooltipProps): JSX.Element {
  // A move the registry does not know is named rather than thrown
  const data = (): MoveData | null => {
    try {
      return getMoveData(props.move);
    } catch {
      return null;
    }
  };

  return (
    <TooltipHost
      class={props.class}
      kind="move"
      {...detailMove(props.move)}
      extra={() => (
        <>
          <Detail label="Type">{data() == null ? NONE : TYPE_NAMES[data()?.type ?? 0]}</Detail>
          <Detail label="Category">
            {data() == null ? NONE : MOVE_CATEGORY_NAMES[data()?.category ?? 0]}
          </Detail>
          <Detail label="Power">{data()?.power ?? NONE}</Detail>
          <Detail label="Accuracy">
            {data()?.accuracy == null ? NONE : `${data()?.accuracy}%`}
          </Detail>
          <Detail label="PP">
            {data() == null ? NONE : getMovePP(props.move, props.points ?? 0)}
          </Detail>
          <Detail label="Cooldown">
            {data() == null
              ? NONE
              : `${(getMoveCooldown(props.move, props.points ?? 0, props.speed ?? 0) / 1000).toFixed(1)}s`}
          </Detail>
        </>
      )}
    >
      {props.children}
    </TooltipHost>
  );
}
