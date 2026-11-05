import { type JSX, Show, createSignal } from 'solid-js';
import { useAuth } from '../../auth/context';
import AuctionDialog from '../auctions/AuctionDialog';
import AuctionTab from '../auctions/auction-tab';
import BattleData from '../app/BattleData';
import GameProvider, { useGame } from '../app/game-context';
import { Button, Dialog, DialogActions, Note } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The auction panel as the game draws it, without the game around it.
 *
 * The provider is mounted as the staff dashboard mounts it, `managing`,
 * so nothing is walked or written for the player: no position, no
 * start town. The panel has no way out, since there is no world to go
 * back to
 */
function Board(props: { player: string }): JSX.Element {
  const game = useGame();
  const [selling, setSelling] = createSignal(false);

  return (
    <>
      <Dialog
        isOpen
        onClose={() => undefined}
        width="wide"
        terse
        title={m.panel_auctions()}
        description={m.panel_auctions_description()}
      >
        <BattleData>
          <AuctionTab
            player={props.player}
            adding={selling()}
            onAdding={(open) => {
              setSelling(open);
            }}
          />
        </BattleData>
        <DialogActions>
          <Button
            onClick={() => {
              setSelling(!selling());
            }}
          >
            {selling() ? m.auctions_board() : m.auctions_add()}
          </Button>
        </DialogActions>
      </Dialog>

      <AuctionDialog
        subject={game.listing()}
        onClose={() => {
          game.setListing(null);
        }}
        onListed={game.touchRecords}
      />
    </>
  );
}

export default function AuctionDemo(): JSX.Element {
  const auth = useAuth();

  return (
    <Show when={auth.user()} fallback={<Note>Sign in on the home page first.</Note>}>
      {(user) => (
        <GameProvider managing>
          <Board player={user().uid} />
        </GameProvider>
      )}
    </Show>
  );
}
