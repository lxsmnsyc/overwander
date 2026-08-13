import type { JSX } from 'solid-js';
import CatchPicker from './CatchPicker';
import { useGame } from './game-context';

export interface CatchesListProps {
  player: string;
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
      value={null}
      verb="Open"
      empty="No catches yet."
      // A record changed under it — an evolution, a release, a lot put
      // on the block — and the box reads itself again
      revision={game.records()}
      onPick={(catchId) => {
        if (catchId != null) {
          game.setSheet({ catchId });
        }
      }}
    />
  );
}
