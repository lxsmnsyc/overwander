import type { JSX, ParentProps } from 'solid-js';
import { TYPE_NAMES } from '../../data/constants/types';
import type { Moves } from '../../data/ids/moves';
import { MOVE_CATEGORY_LABELS } from '../sprites/MoveCategorySprite';
import { type MoveData, getMoveCooldown, getMoveData, getMovePP } from '../../data/moves';
import { detailMove } from '../details';
import { Detail, TooltipHost } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';

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
          <Detail label={m.tooltip_kind_type()}>
            {data() == null ? NONE : TYPE_NAMES[data()?.type ?? 0]}
          </Detail>
          <Detail label={m.move_category()}>
            {data() == null ? NONE : MOVE_CATEGORY_LABELS[data()?.category ?? 0]()}
          </Detail>
          <Detail label={m.teach_power()}>{data()?.power ?? NONE}</Detail>
          <Detail label={m.move_accuracy()}>
            {data()?.accuracy == null ? NONE : `${data()?.accuracy}%`}
          </Detail>
          <Detail label={m.teach_pp()}>
            {data() == null ? NONE : getMovePP(props.move, props.points ?? 0)}
          </Detail>
          <Detail label={m.move_cooldown()}>
            {data() == null
              ? NONE
              : m.move_seconds({
                  seconds: (
                    getMoveCooldown(props.move, props.points ?? 0, props.speed ?? 0) / 1000
                  ).toFixed(1),
                })}
          </Detail>
        </>
      )}
    >
      {props.children}
    </TooltipHost>
  );
}
