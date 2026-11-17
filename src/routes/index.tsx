import { Title } from '@solidjs/meta';
import { clientOnly } from '@solidjs/start';
import { type Accessor, type JSX, Show, createEffect, createSignal, from } from 'solid-js';
import { AuctionLot } from '../auth/auctions';
import { type Profile, watchProfile } from '../auth/profile';
import { signOut } from '../auth/actions';
import CommandBar from '../components/app/command-bar';
import { runsTheGame } from '../model/staff';
import { useAuth } from '../auth/context';
import type { PlayerIdentity } from '../auth/user';
import AuctionDialog from '../components/auctions/AuctionDialog';
import AuctionTab from '../components/auctions/auction-tab';
import { SellHint } from '../components/auctions/auction-tab/sell';
import BattleData from '../components/app/BattleData';
import CatchDialog from '../components/catches/catch-dialog';
import CatchesList from '../components/catches/catches-list';
import GameMenu from '../components/app/GameMenu';
import GameProvider, { GameDialog, useGame } from '../components/app/game-context';
import BagDialog from '../components/items/inventory-list';
import LoginForm, { TitleCard } from '../components/app/LoginForm';
import GiftsTab from '../components/gifts/GiftsTab';
import NotificationsTab from '../components/notifications/NotificationsTab';
import DexEntryDialog from '../components/dex/dex-entry-dialog';
import SpeciesFormsDialog from '../components/dex/SpeciesFormsDialog';
import DuelsTab from '../components/duels/DuelsTab';
import type { DuelLobbyReport } from '../components/duels/duel-lobby';
import OverworldTab from '../components/overworld/overworld-tab';
import PokedexDialog from '../components/dex/PokedexDialog';
import ProfileDialog from '../components/profile/ProfileDialog';
import ProfileSheet from '../components/profile/profile-sheet';
import QuestsTab from '../components/quests/quests-tab';
import QuestHint from '../components/quests/quests-tab/hint';
import SettingsTab from '../components/settings/settings-tab';
import RaidsTab from '../components/raids/RaidsTab';
import type { RaidLobbyReport } from '../components/raids/raid-lobby';
import TradeOfferDialog from '../components/trades/TradeOfferDialog';
import WorldMapDialog from '../components/overworld/WorldMapDialog';
import { Button, Dialog, DialogActions, Meta, Note } from '../components/styled';
import {
  AuctionIcon,
  BellIcon,
  BookmarkIcon,
  FireIcon,
  GiftIcon,
  PageIcon,
  SettingsIcon,
  SwordsIcon,
} from '../components/icons';
import { m } from '../i18n/paraglide/messages.js';

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
 * The news feed, fetched when it is opened.
 *
 * It carries every release page there has ever been, compiled: a panel
 * that grows with the game, opened when a release lands rather than
 * while playing
 */
const NewsTab = clientOnly(async () => import('../components/news/NewsTab'));

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
  | GameDialog.Settings
  | GameDialog.News;

const TITLES: Record<Panelled, () => string> = {
  [GameDialog.Notifications]: m.panel_notifications,
  [GameDialog.Profile]: m.panel_profile,
  [GameDialog.Raids]: m.panel_raids,
  [GameDialog.Auctions]: m.panel_auctions,
  [GameDialog.Catches]: m.panel_boxes,
  [GameDialog.Inventory]: m.panel_bag,
  [GameDialog.Pokedex]: m.panel_pokedex,
  [GameDialog.Gifts]: m.panel_gifts,
  [GameDialog.Quests]: m.panel_quests,
  [GameDialog.Battles]: m.panel_battle,
  [GameDialog.Settings]: m.panel_settings,
  [GameDialog.News]: m.panel_news,
};

const DESCRIPTIONS: Record<Panelled, () => string> = {
  [GameDialog.Notifications]: m.panel_notifications_description,
  [GameDialog.Profile]: m.panel_profile_description,
  [GameDialog.Raids]: m.panel_raids_description,
  [GameDialog.Auctions]: m.panel_auctions_description,
  [GameDialog.Catches]: m.panel_boxes_description,
  [GameDialog.Inventory]: m.panel_bag_description,
  [GameDialog.Pokedex]: m.panel_pokedex_description,
  [GameDialog.Gifts]: m.panel_gifts_description,
  [GameDialog.Quests]: m.panel_quests_description,
  [GameDialog.Battles]: m.panel_battle_description,
  [GameDialog.Settings]: m.panel_settings_description,
  [GameDialog.News]: m.panel_news_description,
};

/**
 * The signed-in view: the world, unless a battle has taken the page
 */
function GameView(props: { user: PlayerIdentity }): JSX.Element {
  const game = useGame();
  // The friend being offered a trade, kept until the dialog's fade is over
  const [lastTrading, setLastTrading] = createSignal<string | null>(null);

  createEffect(() => {
    const friend = game.trading();

    if (friend != null) {
      setLastTrading(friend);
    }
  });
  /**
   * Whether the seller's side of the auction board is open. It lives
   * here because the button that opens it is in the dialog's top bar
   */
  const [selling, setSelling] = createSignal(false);
  /**
   * The raid lobby the player is standing in, or null on the list. A
   * lobby is a lair, and the lair is what a player travelled to, so it
   * names the panel rather than the word "Raids". A host who dismisses
   * the panel leaves a lobby standing with their name on it and nobody
   * in it, and for a mythical the relic that opened it is already
   * spent, so while hosting the overlay and Escape are refused and the
   * way out is the button that actually walks them out
   */
  const [raidLobby, setRaidLobby] = createSignal<RaidLobbyReport | null>(null);
  /** The same, for the battle lobby a player is standing in */
  const [duelLobby, setDuelLobby] = createSignal<DuelLobbyReport | null>(null);
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
          {/* Its own dialog: what stands in its header changes as it is used */}
          <CatchesList
            isOpen={showing(GameDialog.Catches)}
            player={props.user.uid}
            onClose={close}
          />

          {/* The dex: what there is, beside the box of what they have */}
          <PokedexDialog
            isOpen={showing(GameDialog.Pokedex)}
            onClose={close}
            player={props.user.uid}
            title={TITLES[GameDialog.Pokedex]()}
            description={DESCRIPTIONS[GameDialog.Pokedex]()}
          />

          <BagDialog
            isOpen={showing(GameDialog.Inventory)}
            onClose={close}
            player={props.user.uid}
            title={TITLES[GameDialog.Inventory]()}
            description={DESCRIPTIONS[GameDialog.Inventory]()}
          />

          {/* What the game owes them, which is a shelf rather than an
              announcement: nothing is theirs until they take it */}
          <Dialog
            isOpen={showing(GameDialog.Gifts)}
            onClose={close}
            width="rail"
            terse
            lead={<GiftIcon class="size-4" aria-hidden="true" />}
            title={TITLES[GameDialog.Gifts]()}
            description={DESCRIPTIONS[GameDialog.Gifts]()}
          >
            <BattleData>
              <GiftsTab />
            </BattleData>
            <DialogActions note={<Meta class="hidden md:block">{m.gifts_dock_note()}</Meta>} stack>
              <Button onClick={close}>{m.ui_close()}</Button>
            </DialogActions>
          </Dialog>

          {/* The quest board: chained asks and their pay, read beside
              the gifts it pays through */}
          <Dialog
            isOpen={showing(GameDialog.Quests)}
            onClose={close}
            width="rail"
            terse
            lead={<BookmarkIcon class="size-4" aria-hidden="true" />}
            aside={<QuestHint />}
            title={TITLES[GameDialog.Quests]()}
            description={DESCRIPTIONS[GameDialog.Quests]()}
          >
            <BattleData>
              <QuestsTab isOpen={showing(GameDialog.Quests)} onClose={close} />
            </BattleData>
            <DialogActions note={<Meta class="hidden md:block">{m.quest_hint_claim()}</Meta>}>
              <Button onClick={close}>{m.ui_close()}</Button>
            </DialogActions>
          </Dialog>

          {/* What has been offered to the player, from every corner of
              the game at once. It notices; the panels behind it are
              where each is answered */}
          <Dialog
            isOpen={showing(GameDialog.Notifications)}
            onClose={close}
            width="wider"
            terse
            lead={<BellIcon class="size-4" aria-hidden="true" />}
            title={TITLES[GameDialog.Notifications]()}
            description={DESCRIPTIONS[GameDialog.Notifications]()}
          >
            <NotificationsTab notices={game.notices()} />
            <DialogActions
              note={<Meta class="hidden md:block">{m.notices_dock_note()}</Meta>}
              stack
            >
              <Button onClick={close}>{m.ui_close()}</Button>
            </DialogActions>
          </Dialog>

          {/* Nothing in here is earned or spent, so it is the one
              panel that never waits on the server */}
          <Dialog
            isOpen={showing(GameDialog.Settings)}
            onClose={close}
            width="rail"
            terse
            lead={<SettingsIcon class="size-4" aria-hidden="true" />}
            title={TITLES[GameDialog.Settings]()}
            description={DESCRIPTIONS[GameDialog.Settings]()}
          >
            <SettingsTab />
            <DialogActions note={<Meta class="hidden md:block">{m.settings_dock_note()}</Meta>}>
              <Button onClick={close}>{m.ui_close()}</Button>
            </DialogActions>
          </Dialog>

          {/* The release pages, read as a feed. Like the settings, it
              is written into the build rather than fetched */}
          <Dialog
            isOpen={showing(GameDialog.News)}
            onClose={close}
            width="rail"
            layout="sheet"
            terse
            lead={<PageIcon class="size-4" aria-hidden="true" />}
            title={TITLES[GameDialog.News]()}
            description={DESCRIPTIONS[GameDialog.News]()}
          >
            <NewsTab />
            <DialogActions note={<Meta class="hidden md:block">{m.news_dock_note()}</Meta>}>
              <Button onClick={close}>{m.ui_close()}</Button>
            </DialogActions>
          </Dialog>

          <ProfileSheet
            player={props.user.uid}
            section={game.profileAt() ?? undefined}
            isOpen={showing(GameDialog.Profile)}
            onClose={close}
          />

          <Dialog
            isOpen={showing(GameDialog.Raids)}
            onClose={close}
            insistent={raidLobby()?.hosting === true}
            // Broad: lair cards two across in the list, and in a lobby
            // the boss beside the trainer list
            width="broad"
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
            lead={raidLobby() == null ? <FireIcon class="size-4" aria-hidden="true" /> : undefined}
            title={raidLobby()?.title ?? TITLES[GameDialog.Raids]()}
            description={DESCRIPTIONS[GameDialog.Raids]()}
          >
            <RaidsTab
              user={props.user}
              onLobby={(standing) => {
                setRaidLobby(standing);
              }}
            />
            <Show when={raidLobby() == null}>
              <DialogActions note={<Meta class="hidden md:block">{m.raid_dock_note()}</Meta>}>
                <Button onClick={close}>{m.ui_close()}</Button>
              </DialogActions>
            </Show>
          </Dialog>

          {/* Battle lobbies. A duel is private, so there is no board
              of them to browse: what is here is what somebody offered
              this player, and the one they staged themselves */}
          <Dialog
            isOpen={showing(GameDialog.Battles)}
            onClose={close}
            // A seated player leaves by Leave, which takes their party out
            insistent={duelLobby()?.seated === true}
            // The list is a narrower sheet; a lobby needs the field's width
            width={duelLobby() == null ? 'wider' : 'rail'}
            terse
            lead={
              duelLobby() == null ? <SwordsIcon class="size-4" aria-hidden="true" /> : undefined
            }
            title={duelLobby()?.title ?? TITLES[GameDialog.Battles]()}
            description={DESCRIPTIONS[GameDialog.Battles]()}
          >
            <DuelsTab
              user={props.user}
              onClose={close}
              onLobby={(standing) => {
                setDuelLobby(standing);
              }}
            />
          </Dialog>

          <Dialog
            isOpen={showing(GameDialog.Auctions)}
            onClose={close}
            width="rail"
            terse
            aside={selling() ? <SellHint /> : undefined}
            lead={<AuctionIcon class="size-4" aria-hidden="true" />}
            title={TITLES[GameDialog.Auctions]()}
            description={DESCRIPTIONS[GameDialog.Auctions]()}
          >
            {/* The board draws pokemon as squares and searches them
                by move and by held item, which are names out of the
                registries loaded behind the first frame */}
            <BattleData>
              <AuctionTab
                player={props.user.uid}
                adding={selling()}
                onAdding={(open) => {
                  setSelling(open);
                }}
              />
            </BattleData>
            <DialogActions
              stack
              note={
                <Show when={!selling()}>
                  <Meta class="hidden md:block">{m.auction_dock_note()}</Meta>
                </Show>
              }
            >
              {/* The one thing the board is for that is not looking
                  at it. Selling takes the whole panel rather than a
                  card on top of the lots, so the key that opened it
                  is also the way back out */}
              <Button
                tone={selling() ? 'ghost' : 'primary'}
                onClick={() => {
                  setSelling(!selling());
                }}
              >
                {selling() ? m.auctions_board() : m.auctions_add()}
              </Button>
              <Button onClick={close}>{m.ui_close()}</Button>
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
            // The entry opens over the sheet, the way a profile does
            onDex={(species) => {
              game.setDexEntry(species);
            }}
          />

          {/* Which form was meant, for a row that stands for several.
              It hands over to the entry rather than opening beside it:
              the two are one road, not two screens */}
          <SpeciesFormsDialog
            player={props.user.uid}
            species={game.dexForms()}
            onClose={() => {
              game.setDexForms(null);
            }}
            onSpecies={(species) => {
              game.setDexForms(null);
              game.setDexEntry(species);
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
          {/* Made when the offer starts rather than with the page: dialogs stack in
              the order they were made, and the profile it is opened from is made when
              it first opens, so an offer made with the page sat behind it */}
          <Show when={lastTrading()}>
            {(friend) => (
              <TradeOfferDialog
                player={props.user.uid}
                friend={friend()}
                isOpen={game.trading() != null}
                onClose={() => {
                  game.setTrading(null);
                }}
                onGone={() => {
                  if (game.trading() == null) {
                    setLastTrading(null);
                  }
                }}
              />
            )}
          </Show>

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
          <BattleView
            active={active}
            onLeave={() => {
              // The lobby goes too, since one watching its own record
              // reopens the fight, and so does the panel Start was
              // pressed in: leaving means standing in the overworld
              game.setRaid(null);
              game.setDuel(null);
              game.setDialog(GameDialog.None);
              game.setBattle(null);
            }}
            onReward={(reward) => {
              game.setReward(reward);
            }}
            spoils={game.spoils}
          />
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
          class="flex w-full max-w-105 flex-col gap-3 overflow-hidden rounded-sheet border-2
            border-line bg-paper pb-[22px] text-center shadow-sheet"
        >
          <header class="bg-linear-to-b from-ember-soft to-paper px-6 pt-[30px] pb-5">
            <h1 class="font-display text-3xl leading-tight font-semibold">{m.refusal_banned()}</h1>
          </header>
          <div class="flex flex-col gap-3 px-6">
            <Note>{profile()?.banReason === '' ? m.banned_no_reason() : profile()?.banReason}</Note>
            <Button
              class="h-11 justify-center"
              onClick={() => {
                signOut().catch(() => undefined);
              }}
            >
              {m.ui_sign_out()}
            </Button>
          </div>
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
            <Show when={!auth.loading()} fallback={<Note>{m.landing_loading()}</Note>}>
              {/* The title screen: the game's name and what it is, then
                  the one thing there is to do about it, on a card with
                  a tinted header */}
              <TitleCard>
                <LoginForm />
              </TitleCard>
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
