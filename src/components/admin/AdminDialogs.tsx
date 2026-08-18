import type { JSX } from 'solid-js';
import CatchDialog from '../catches/CatchDialog';
import ProfileDialog from '../profile/ProfileDialog';
import { useGame } from '../app/game-context';

/**
 * The two screens the dashboard's reused panels can open: one
 * pokemon in full, and whoever owns it.
 *
 * The panels ask for them through the game's own state — the auction
 * board opens a sheet the same way whether it is being shopped or
 * read — so the dashboard has to draw them, or the buttons that ask
 * would do nothing. Both are read-only here: staff looking at a
 * record are not its owner
 */
export default function AdminDialogs(props: { player: string }): JSX.Element {
  const game = useGame();

  return (
    <>
      <CatchDialog
        player={props.player}
        catchId={game.sheet()?.catchId ?? null}
        readOnly
        onClose={() => {
          game.setSheet(null);
        }}
        onCatch={(catchId) => {
          game.setSheet({ catchId });
        }}
        onTrainer={(uid) => {
          game.setVisiting(uid);
        }}
      />
      <ProfileDialog
        player={game.visiting()}
        onClose={() => {
          game.setVisiting(null);
        }}
      />
    </>
  );
}
