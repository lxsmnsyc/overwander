import type { JSX, ParentProps } from 'solid-js';
import type { Moves } from '../../data/ids/moves';
import { describeMove } from '../details';
import { HoverCard } from '../styled';
import MoveCard from './MoveCard';

/**
 * A move name with its entry over it. What is wrapped is the name as
 * the list draws it; the card is the same window every other one in
 * the game opens in
 */
export interface MoveHoverCardProps extends ParentProps {
  move: Moves;
  /** How the wrapped name sits in its row */
  class?: string;
}

export default function MoveHoverCard(props: MoveHoverCardProps): JSX.Element {
  return (
    <HoverCard
      class={props.class}
      title="Info"
      // The move's own name, since the bar says what the card is and
      // the trigger underneath is about to be covered by it
      description={describeMove(props.move)}
      trigger={props.children}
    >
      <MoveCard move={props.move} />
    </HoverCard>
  );
}
