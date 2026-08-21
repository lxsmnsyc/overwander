import { Title } from '@solidjs/meta';
import { type JSX, type ParentProps, Show, createSignal, from } from 'solid-js';
import { AuctionLot } from '../auth/auctions';
import { type Profile, watchProfile } from '../auth/profile';
import { signOut } from '../auth/actions';
import { useAuth } from '../auth/context';
import type { PlayerIdentity } from '../auth/user';
import AuctionDialog from '../components/auctions/AuctionDialog';
import AuctionTab from '../components/auctions/AuctionTab';
import BattleView from '../components/battle/BattleView';
import CatchDialog from '../components/catches/CatchDialog';
import CatchesList from '../components/catches/CatchesList';
import GameMenu from '../components/app/GameMenu';
import GameProvider, { GameDialog, useGame } from '../components/app/game-context';
import InventoryList from '../components/items/InventoryList';
import LoginForm from '../components/app/LoginForm';
import GiftsTab from '../components/gifts/GiftsTab';
import DexEntryDialog from '../components/dex/DexEntryDialog';
import OverworldTab from '../components/overworld/OverworldTab';
import PokedexTab from '../components/dex/PokedexTab';
import ProfileDialog from '../components/profile/ProfileDialog';
import ProfileTab from '../components/profile/ProfileTab';
import RaidsTab from '../components/raids/RaidsTab';
import { ThemeToggle } from '../components/app/theme';
import WorldMapDialog from '../components/overworld/WorldMapDialog';
import { Button, Dialog, DialogActions, Note } from '../components/styled';

/**
 * The game is the world.
 *
 * There is one page and it is the chunk the player is standing in,
 * drawn to fill whatever screen they are on. Their own things, the
 * lobbies gathering and the auction board are all pulled over it by
 * the menu at the bottom and put away again — none of them is
 * somewhere to *be*, and a set of tabs said otherwise by making the
 * world one quarter of the game.
 */

/**
 * What a dialog is announced as. Each one is a heading and a sentence
 * for a screen reader and nothing on the screen: the player pressed a
 * button that says Profile, so a panel captioned Profile is a line of
 * text telling them what they just did
 */
type Panelled =
  | GameDialog.Profile
  | GameDialog.Raids
  | GameDialog.Auctions
  | GameDialog.Catches
  | GameDialog.Inventory
  | GameDialog.Pokedex
  | GameDialog.Gifts;

const TITLES: Record<Panelled, string> = {
  [GameDialog.Profile]: 'Profile',
  [GameDialog.Raids]: 'Raids',
  [GameDialog.Auctions]: 'Auctions',
  [GameDialog.Catches]: 'Catches',
  [GameDialog.Inventory]: 'Inventory',
  [GameDialog.Pokedex]: 'Pokedex',
  [GameDialog.Gifts]: 'Gifts',
};

const DESCRIPTIONS: Record<Panelled, string> = {
  [GameDialog.Profile]:
    'Your details, your buddy, your friends, your battles and what you have bid on.',
  [GameDialog.Raids]: 'Every lobby still gathering in the current window.',
  [GameDialog.Auctions]: 'What is up for auction, and what you have to sell.',
  [GameDialog.Catches]: 'Every pokemon you have caught, as a box of squares.',
  [GameDialog.Inventory]: 'Everything you are carrying.',
  [GameDialog.Pokedex]: 'Every pokemon there is, and how many of them you have met.',
  [GameDialog.Gifts]: 'What the game is holding for you, until you come for it.',
};

/**
 * The signed-in view: the world, unless a battle has taken the page
 */
function GameView(props: { user: PlayerIdentity }): JSX.Element {
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
          <GameMenu />

          {/* The two that came out of the profile. Each is one list and
              nothing else, so each is its own panel rather than a tab
              of a page about somebody */}
          <Dialog
            isOpen={showing(GameDialog.Catches)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Catches]}
            description={DESCRIPTIONS[GameDialog.Catches]}
          >
            <CatchesList player={props.user.uid} />
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* The dex: what there is, beside the box of what they have */}
          <Dialog
            isOpen={showing(GameDialog.Pokedex)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Pokedex]}
            description={DESCRIPTIONS[GameDialog.Pokedex]}
          >
            <PokedexTab player={props.user.uid} />
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          <Dialog
            isOpen={showing(GameDialog.Inventory)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Inventory]}
            description={DESCRIPTIONS[GameDialog.Inventory]}
          >
            <InventoryList player={props.user.uid} />
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* What the game owes them, which is a shelf rather than an
              announcement: nothing is theirs until they take it */}
          <Dialog
            isOpen={showing(GameDialog.Gifts)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Gifts]}
            description={DESCRIPTIONS[GameDialog.Gifts]}
          >
            <GiftsTab />
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

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
            // The one thing the board is for that is not looking at
            // it. Selling takes the whole panel rather than a card on
            // top of the lots, so the key that opened it is also the
            // way back out
            aside={
              <Button
                onClick={() => {
                  setSelling(!selling());
                }}
              >
                {selling() ? 'Board' : 'Add'}
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
            useItem={game.sheet()?.useItem ?? null}
            onClose={() => {
              game.setSheet(null);
            }}
            onChange={game.touchRecords}
            // The pokemon either side of this one in the box, opened
            // from the arrows beside the sprite
            onCatch={(catchId) => {
              game.setSheet({ catchId });
            }}
            onAuction={(catchId) => {
              game.setListing({ lot: AuctionLot.Catch, catchId });
            }}
            // Whoever had it before them, opened from the history the
            // record carries: the profile goes over the sheet, the way
            // it goes over the board and the lobby
            onTrainer={(uid) => {
              game.setVisiting(uid);
            }}
          />

          {/* One species in full, opened out of the dex and over it:
              an entry is a screen rather than a panel on a panel */}
          <DexEntryDialog
            player={props.user.uid}
            species={game.dexEntry()}
            onClose={() => {
              game.setDexEntry(null);
            }}
            onSpecies={(species) => {
              game.setDexEntry(species);
            }}
          />

          {/* Somebody else met on the board or in a lobby, opened over
              the panel that named them: the same profile, with nothing
              on it that writes */}
          <ProfileDialog
            player={game.visiting()}
            onClose={() => {
              game.setVisiting(null);
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
        </div>
      }
    >
      {/* A battle is the whole page while it is running, the same way
          the world is when one is not */}
      {(active) => <BattleView active={active} />}
    </Show>
  );
}

/**
 * The game, unless the account has been shut out of it.
 *
 * A ban is enforced on the server — every privileged call refuses a
 * banned account before it reads anything — and this is so the player
 * is told rather than left pressing buttons that quietly do nothing.
 * The profile is followed rather than read once, so a ban lifted while
 * somebody is sitting here opens the world under them
 */
function Banned(props: ParentProps<{ uid: string }>): JSX.Element {
  const profile = from<Profile | null>((set) =>
    watchProfile(props.uid, (record) => {
      set(record);
    }),
  );

  return (
    <Show when={profile()?.banned === true} fallback={props.children}>
      <div class="flex h-full items-center justify-center px-4">
        <div
          class="flex max-w-md flex-col gap-3 rounded-panel border-4 border-ember bg-paper p-4
          text-center shadow-pop"
        >
          <h1>This account is banned.</h1>
          <Note>
            {profile()?.banReason === '' ? 'Nothing else was said about it.' : profile()?.banReason}
          </Note>
          <Button
            onClick={() => {
              signOut().catch(() => undefined);
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
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
                  and the one thing there is to do about it. It is drawn
                  as a title screen — the game's own window, with the
                  name across the top of it — because it is the first
                  thing anybody sees of the game and a bare form says
                  nothing about what they are signing in to */}
              <div
                class="flex w-full max-w-sm flex-col gap-4 overflow-hidden rounded-panel border-4
                  border-tide bg-paper text-center shadow-window"
              >
                <header class="relative flex flex-col gap-1 bg-tide px-4 py-4 text-on-accent">
                  <h1 class="text-3xl">Poketerra</h1>
                  <p class="text-sm text-on-accent/85">Sign in to walk the overworld.</p>
                  {/* The theme is worth changing before signing in as
                      much as after it — the menu that carries it is
                      behind the sign-in, and this is the whole game
                      until somebody does */}
                  <ThemeToggle class="absolute top-3 right-3 px-2.5 text-ink" />
                </header>
                <div class="px-4 pb-4">
                  <LoginForm />
                </div>
              </div>
            </Show>
          </div>
        }
      >
        {(user) => (
          <Banned uid={user().uid}>
            <GameProvider>
              <GameView user={user()} />
            </GameProvider>
          </Banned>
        )}
      </Show>
    </main>
  );
}
