import { Title } from '@solidjs/meta';
import type { User } from 'firebase/auth';
import { type JSX, Show, createSignal } from 'solid-js';
import { AuctionLot } from '../auth/auctions';
import { useAuth } from '../auth/context';
import ActionBar from '../components/ActionBar';
import AuctionDialog from '../components/AuctionDialog';
import AuctionTab from '../components/AuctionTab';
import BattleView from '../components/BattleView';
import CatchDialog from '../components/CatchDialog';
import GameProvider, { GameDialog, useGame } from '../components/game-context';
import LoginForm from '../components/LoginForm';
import MysteryGiftDialog from '../components/MysteryGiftDialog';
import OverworldTab from '../components/OverworldTab';
import ProfileTab from '../components/ProfileTab';
import RaidsTab from '../components/RaidsTab';
import WorldMapDialog from '../components/WorldMapDialog';
import { Button, Dialog, DialogActions, Note } from '../components/styled';

/**
 * The game is the world.
 *
 * There is one page and it is the chunk the player is standing in,
 * drawn to fill whatever screen they are on. Their own things, the
 * lobbies gathering and the auction board are all pulled over it by
 * the bar at the bottom and put away again — none of them is
 * somewhere to *be*, and a set of tabs said otherwise by making the
 * world one quarter of the game.
 */

/**
 * What a dialog is announced as. Each one is a heading and a sentence
 * for a screen reader and nothing on the screen: the player pressed a
 * button that says Profile, so a panel captioned Profile is a line of
 * text telling them what they just did
 */
const TITLES: Record<GameDialog.Profile | GameDialog.Raids | GameDialog.Auctions, string> = {
  [GameDialog.Profile]: 'Profile',
  [GameDialog.Raids]: 'Raids',
  [GameDialog.Auctions]: 'Auctions',
};

const DESCRIPTIONS: Record<GameDialog.Profile | GameDialog.Raids | GameDialog.Auctions, string> = {
  [GameDialog.Profile]: 'Your details, your catches, what you carry and what you have bid on.',
  [GameDialog.Raids]: 'Every lobby still gathering in the current window.',
  [GameDialog.Auctions]: 'What is up for auction, and what you have to sell.',
};

/**
 * The signed-in view: the world, unless a battle has taken the page
 */
function GameView(props: { user: User }): JSX.Element {
  const game = useGame();
  /**
   * Whether the seller's side of the auction board is open. It lives
   * here because the button that opens it is in the dialog's top bar
   */
  const [selling, setSelling] = createSignal(false);
  /**
   * What the raids panel is called. A lobby is a lair, and the lair is
   * what a player travelled to — so while they are standing in one, it
   * names the panel rather than the word "Raids"
   */
  const [lobby, setLobby] = createSignal<string | null>(null);
  const close = (): void => {
    game.setDialog(GameDialog.None);
  };
  const showing = (which: GameDialog): boolean => game.dialog() === which;

  return (
    <Show
      when={game.battle()}
      // Keyed, so the battle is handed over as itself rather than as a
      // reader of a signal that is about to be empty.
      //
      // Leaving is the one press that unsets the thing the view is
      // built from, and an unkeyed `Show` hands its child an accessor
      // that throws the moment the condition goes false. The button's
      // own handler read `props.active` to work out whether there was
      // a prize to collect, so pressing Leave threw before it had done
      // anything — which is why Leave appeared to do nothing at all
      keyed
      fallback={
        <div class="relative h-full">
          <OverworldTab />
          <ActionBar />

          <Dialog
            isOpen={showing(GameDialog.Profile)}
            onClose={close}
            width="wide"
            quiet
            title={TITLES[GameDialog.Profile]}
            description={DESCRIPTIONS[GameDialog.Profile]}
          >
            <ProfileTab player={props.user.uid} />
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          <Dialog
            isOpen={showing(GameDialog.Raids)}
            onClose={close}
            width="wide"
            // Named for the lair while the player is standing in one,
            // and "Raids" while they are only looking at the list.
            //
            // It used to draw no heading at all for the list, on the
            // grounds that the button they pressed already said the
            // word — but a panel that opens with a row of lobbies and
            // no title reads as something half-loaded, and a lobby
            // opened from the *world* rather than from that button
            // arrives with no word about where it came from
            terse
            title={lobby() ?? TITLES[GameDialog.Raids]}
            description={DESCRIPTIONS[GameDialog.Raids]}
          >
            <RaidsTab
              user={props.user}
              onTitle={(named) => {
                setLobby(named);
              }}
            />
            <Show when={lobby() == null}>
              <DialogActions>
                <Button onClick={close}>Close</Button>
              </DialogActions>
            </Show>
          </Dialog>

          <Dialog
            isOpen={showing(GameDialog.Auctions)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Auctions]}
            // The one thing the board is for that is not looking at it
            aside={
              <Button
                onClick={() => {
                  setSelling(true);
                }}
              >
                Add
              </Button>
            }
            description={DESCRIPTIONS[GameDialog.Auctions]}
          >
            <AuctionTab
              player={props.user.uid}
              adding={selling()}
              onAdding={(open) => {
                setSelling(open);
              }}
            />
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* The map is a dialog of its own rather than one of the
              three above: it is a picture, and it says so itself */}
          <WorldMapDialog isOpen={showing(GameDialog.Map)} onClose={close} />

          {/* One pokemon in full, over everything rather than inside
              whichever list it was opened from — a record is a screen,
              not a panel on a panel */}
          <CatchDialog
            player={props.user.uid}
            catchId={game.sheet()?.catchId ?? null}
            readOnly={game.sheet()?.readOnly === true}
            onClose={() => {
              game.setSheet(null);
            }}
            onChange={game.touchRecords}
            onAuction={(catchId) => {
              game.setListing({ lot: AuctionLot.Catch, catchId });
            }}
          />

          {/* Listing is its own dialog, opened as the sheet closes:
              the pokemon is about to leave the records it was read from */}
          <AuctionDialog
            subject={game.listing()}
            onClose={() => {
              game.setListing(null);
            }}
            onListed={game.touchRecords}
          />

          {/* And this one is nobody's doing: it opens when the game
              has given them something, over whatever else is open */}
          <MysteryGiftDialog
            gifts={game.gifts()}
            onClose={() => {
              game.setGifts([]);
            }}
          />
        </div>
      }
    >
      {/* A battle is the whole page while it is running, the same way
          the world is when one is not */}
      {(active) => <BattleView active={active} />}
    </Show>
  );
}

export default function Home(): JSX.Element {
  const auth = useAuth();

  return (
    <main class="fixed inset-0 overflow-hidden">
      <Title>Poketerra</Title>
      <Show
        when={auth.user()}
        fallback={
          <div class="flex h-full items-center justify-center px-4">
            <Show when={!auth.loading()} fallback={<Note>Loading session…</Note>}>
              {/* The whole of the game before signing in: what it is,
                  and the one thing there is to do about it */}
              <div class="flex w-full max-w-sm flex-col gap-4 text-center">
                <h1>Poketerra</h1>
                <Note>Sign in to walk the overworld.</Note>
                <LoginForm />
              </div>
            </Show>
          </div>
        }
      >
        {(user) => (
          <GameProvider>
            <GameView user={user()} />
          </GameProvider>
        )}
      </Show>
    </main>
  );
}
