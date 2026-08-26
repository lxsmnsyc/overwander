import type { JSX } from 'solid-js';
import CatchPicker from './catch-picker';
import { useGame } from '../app/game-context';

export interface CatchesListProps {
  player: string;
  /**
   * Whether this is somebody else's box. Catch records are readable by
   * every signed-in player — that is what makes a lot on the block
   * worth bidding on — so the box draws the same either way, and what
   * changes is what opening a square leads to: the whole record, and
   * nothing on it to press
   */
  viewOnly?: boolean;
}

/**
 * The player's pokemon, in boxes of thirty.
 *
 * It is the picker, browsing. This was a second copy of the same
 * screen — the same box of squares, the same search over it, the same
 * paging under it, the same three empty states — kept beside the
 * picker's copy and drifting from it. The search was the plainest
 * sign: two of them, written against the same collection, in the same
 * dialog stack.
 *
 * Picking one of your pokemon and looking at one of your pokemon are
 * the same act with different consequences, so it is the same list,
 * and what a press opens is the caller's business.
 */
export default function CatchesList(props: CatchesListProps): JSX.Element {
  const game = useGame();

  return (
    <CatchPicker
      inline
      player={props.player}
      viewOnly={props.viewOnly}
      value={null}
      verb="Open"
      empty={props.viewOnly === true ? 'Nothing caught yet.' : 'No catches yet.'}
      // A record changed under it — an evolution, a release, a lot put
      // on the block — and the box reads itself again
      revision={game.records()}
      onPick={(catchId) => {
        if (catchId != null) {
          game.setSheet({ catchId, readOnly: props.viewOnly === true });
        }
      }}
    />
  );
}
