import { Title } from '@solidjs/meta';
import { clientOnly } from '@solidjs/start';
import { type Accessor, type JSX, Show, createSignal, from } from 'solid-js';
import { AuctionLot } from '../auth/auctions';
import { type Profile, watchProfile } from '../auth/profile';
import { signOut } from '../auth/actions';
import CommandBar from '../components/app/command-bar';
import { runsTheGame } from '../auth/staff';
import { useAuth } from '../auth/context';
import type { PlayerIdentity } from '../auth/user';
import AuctionDialog from '../components/auctions/AuctionDialog';
import AuctionTab from '../components/auctions/auction-tab';
import BattleData from '../components/app/battle-data';
import CatchDialog from '../components/catches/catch-dialog';
import CatchesList from '../components/catches/catches-list';
import GameMenu from '../components/app/GameMenu';
import GameProvider, { GameDialog, useGame } from '../components/app/game-context';
import InventoryList from '../components/items/InventoryList';
import LoginForm from '../components/app/LoginForm';
import GiftsTab from '../components/gifts/GiftsTab';
import NotificationsTab from '../components/notifications/NotificationsTab';
import DexEntryDialog from '../components/dex/dex-entry-dialog';
import DuelsTab from '../components/duels/DuelsTab';
import OverworldTab from '../components/overworld/overworld-tab';
import PokedexTab from '../components/dex/PokedexTab';
import ProfileDialog from '../components/profile/ProfileDialog';
import ProfileTab from '../components/profile/ProfileTab';
import QuestsTab from '../components/quests/quests-tab';
import SettingsTab from '../components/settings/SettingsTab';
import RaidsTab from '../components/raids/RaidsTab';
import TradeOfferDialog from '../components/trades/TradeOfferDialog';
import { ThemeToggle } from '../components/app/theme';
import WorldMapDialog from '../components/overworld/WorldMapDialog';
import { Button, Dialog, DialogActions, Note } from '../components/styled';

/**
 * The fight, fetched when there is one, and only in a browser.
 *
 * It pulls the engine, its canvas and the registries behind them: the
 * largest thing in the app, none of it read to walk around, and none
 * of it able to run on the server — a battle is played rather than
 * rendered
 */
const BattleView = clientOnly(async () => import('../components/battle/battle-view'));

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
  | GameDialog.Notifications
  | GameDialog.Profile
  | GameDialog.Raids
  | GameDialog.Auctions
  | GameDialog.Catches
  | GameDialog.Inventory
  | GameDialog.Pokedex
  | GameDialog.Gifts
  | GameDialog.Quests
  | GameDialog.Battles
  | GameDialog.Settings;

const TITLES: Record<Panelled, string> = {
  [GameDialog.Notifications]: 'Notifications',
  [GameDialog.Profile]: 'Profile',
  [GameDialog.Raids]: 'Raids',
  [GameDialog.Auctions]: 'Auctions',
  [GameDialog.Catches]: 'Catches',
  [GameDialog.Inventory]: 'Inventory',
  [GameDialog.Pokedex]: 'Pokedex',
  [GameDialog.Gifts]: 'Gifts',
  [GameDialog.Quests]: 'Quests',
  [GameDialog.Battles]: 'Battle',
  [GameDialog.Settings]: 'Settings',
};

const DESCRIPTIONS: Record<Panelled, string> = {
  [GameDialog.Notifications]: 'Everything waiting on you, wherever it came from.',
  [GameDialog.Profile]:
    'Your details, your buddy, your friends, your battles, your bids and your trades.',
  [GameDialog.Raids]: 'Every lobby still gathering in the current window.',
  [GameDialog.Auctions]: 'What is up for auction, and what you have to sell.',
  [GameDialog.Catches]: 'Every pokemon you have caught, as a box of squares.',
  [GameDialog.Inventory]: 'Everything you are carrying.',
  [GameDialog.Pokedex]: 'Every pokemon there is, and how many of them you have met.',
  [GameDialog.Gifts]: 'What the game is holding for you, until you come for it.',
  [GameDialog.Quests]: 'What the game asks of you, and what each ask pays.',
  [GameDialog.Battles]:
    'The private fights you have been called into, and the one you are hosting.',
  [GameDialog.Settings]: 'How the game is set up for you, and what it is made of.',
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
  /** The same, for the battle lobby a player is standing in */
  const [duelling, setDuelling] = createSignal<string | null>(null);
  const close = (): void => {
    // Wherever the profile was sent to open is spent once it closes:
    // the next player to open it from the menu wants it as they left
    // it, not on the tab a week-old notice named
    game.setProfileAt(null);
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
            <BattleData>
              <CatchesList player={props.user.uid} />
            </BattleData>
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
            <BattleData>
              <PokedexTab player={props.user.uid} />
            </BattleData>
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
            <BattleData>
              <InventoryList player={props.user.uid} />
            </BattleData>
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
            <BattleData>
              <GiftsTab />
            </BattleData>
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* The quest board: chained asks and their pay, read beside
              the gifts it pays through */}
          <Dialog
            isOpen={showing(GameDialog.Quests)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Quests]}
            description={DESCRIPTIONS[GameDialog.Quests]}
          >
            <BattleData>
              <QuestsTab isOpen={showing(GameDialog.Quests)} onClose={close} />
            </BattleData>
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* What has been offered to the player, from every corner of
              the game at once. It notices; the panels behind it are
              where each is answered */}
          <Dialog
            isOpen={showing(GameDialog.Notifications)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Notifications]}
            description={DESCRIPTIONS[GameDialog.Notifications]}
          >
            <NotificationsTab notices={game.notices()} />
            <DialogActions>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Nothing in here is earned or spent, so it is the one
              panel that never waits on the server */}
          <Dialog
            isOpen={showing(GameDialog.Settings)}
            onClose={close}
            width="wide"
            terse
            title={TITLES[GameDialog.Settings]}
            description={DESCRIPTIONS[GameDialog.Settings]}
          >
            <SettingsTab />
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
            <ProfileTab player={props.user.uid} section={game.profileAt() ?? undefined} />
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

          {/* Battle lobbies. A duel is private, so there is no board
              of them to browse: what is here is what somebody offered
              this player, and the one they staged themselves */}
          <Dialog
            isOpen={showing(GameDialog.Battles)}
            onClose={close}
            width="wide"
            terse
            title={duelling() ?? TITLES[GameDialog.Battles]}
            description={DESCRIPTIONS[GameDialog.Battles]}
          >
            <DuelsTab
              user={props.user}
              onTitle={(named) => {
                setDuelling(named);
              }}
            />
            <Show when={duelling() == null}>
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
              {/* The one thing the board is for that is not looking
                  at it. Selling takes the whole panel rather than a
                  card on top of the lots, so the key that opened it
                  is also the way back out */}
              <Button
                onClick={() => {
                  setSelling(!selling());
                }}
              >
                {selling() ? 'Board' : 'Add'}
              </Button>
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

          {/* An offer to a friend, opened over wherever they were
              found: their row in the list, or their profile */}
          <TradeOfferDialog
            player={props.user.uid}
            friend={game.trading()}
            onClose={() => {
              game.setTrading(null);
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
      {(active) => (
        <BattleData>
          <BattleView active={active} />
        </BattleData>
      )}
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
 * somebody is sitting here opens the world under them.
 *
 * The staff command bar hangs here for the same reason: this is the
 * one place in the game the profile is already being read, and what
 * the bar needs from it is the role
 */
function Banned(props: {
  uid: string;
  /**
   * The game, given the role the account holds. A function rather
   * than plain children because the command bar is built inside the
   * game and offered by what is read here
   */
  children: (role: Accessor<string>) => JSX.Element;
}): JSX.Element {
  const profile = from<Profile | null>((set) =>
    watchProfile(props.uid, (record) => {
      set(record);
    }),
  );

  return (
    <Show when={profile()?.banned === true} fallback={props.children(() => profile()?.role ?? '')}>
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
      <Title>Overwander</Title>
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
                  <h1 class="text-3xl">Overwander</h1>
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
            {(role) => (
              <GameProvider>
                <GameView user={user()} />
                {/* Offered to an account that runs the game, and
                    refused again on the server for one that only
                    claims to. It stands inside the game because a
                    command may open what the game already has */}
                <CommandBar allowed={runsTheGame(role())} player={user().uid} />
              </GameProvider>
            )}
          </Banned>
        )}
      </Show>
    </main>
  );
}
