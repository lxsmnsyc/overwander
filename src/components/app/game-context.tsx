import {
  type Accessor,
  type JSX,
  type ParentProps,
  type Setter,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';
import { useAuth } from '../../auth/context';
import type { EncounterRecord } from '../../auth/encounter-record';
import { claimRaidReward } from '../../auth/raids';
import { claimRocketReward } from '../../auth/rockets';
import type { PositionRecord } from '../../auth/position-record';
import type { Items } from '../../data/ids/items';
import type { Species } from '../../data/ids/species';
import { getPosition, savePosition } from '../../auth/positions';
import type { AuctionSubject } from '../auctions/AuctionDialog';
import { ensureProfile } from '../../auth/profile';
import getWorld from '../../overworld/current';
import pickStartPosition, { type StartPosition } from '../../overworld/start';
/**
 * What is open over the world.
 *
 * The overworld is not one of these: it is the page, and everything
 * else is something pulled over the top of it and put away again. A
 * player is always standing somewhere, so there is no state in which
 * the map is not what they are looking at — only states where
 * something is covering it
 */
export const enum GameDialog {
  None = 0,
  Profile = 1,
  Raids = 2,
  Auctions = 3,
  Map = 4,
  /**
   * The player's pokemon and the player's bag, which were two tabs
   * inside the profile.
   *
   * They are the two things a player opens most and the two that had
   * least to do with the page they were on: a profile is who somebody
   * is, and their box of pokemon is not that. Behind the menu they are
   * one press rather than two, and the profile is left with what it
   * was always about
   */
  Catches = 5,
  Inventory = 6,
  /**
   * Every pokemon there is, and how much of each the player has met.
   *
   * It is beside the catches rather than inside them: a box is what
   * somebody has and a dex is what there is, and the difference
   * between the two is the game
   */
  Pokedex = 7,
  /**
   * What the game is holding for the player until they come for it
   */
  Gifts = 8,
}

/**
 * A battle the player is watching. A raid battle settles the raid it
 * was fought for and a Team Rocket fight settles its stop; a replay
 * settles nothing — it re-runs a finished battle from its seed and
 * frozen teams for the record alone
 */
export interface ActiveBattle {
  id: string;
  replay: boolean;
  /**
   * The raid the battle belongs to, for a raid battle
   */
  raid?: string;
  /**
   * The Team Rocket stop the battle was accepted at
   */
  rocket?: string;
}

/**
 * Something won and not yet collected: the overworld turns it into a
 * safari encounter the next time the player is standing there.
 *
 * Nothing about the prize travels in it — the species, the level,
 * whether it is shadowed, the chunk and window it comes from are all
 * read off the raid or the stop when it is claimed
 */
export type PendingReward = { raid: string; stop?: undefined } | { stop: string; raid?: undefined };

/**
 * A catch opened in full, and whether it is being read or handled.
 * Somebody else's pokemon — a lot on the block — is read-only: the
 * whole record, and nothing to press
 */
export interface OpenSheet {
  catchId: string;
  readOnly?: boolean;
  /**
   * Something out of the bag to spend on it as the sheet opens: the
   * bag chooses the item first and the pokemon second
   */
  useItem?: Items;
}

export interface GameState {
  dialog: Accessor<GameDialog>;
  setDialog: Setter<GameDialog>;
  /**
   * Where the player is standing, or null while it is still being
   * found out.
   *
   * It lives above the overworld because the map dialog needs it too
   * and a dialog is not mounted until it is opened. It is read once
   * here, and the overworld publishes every step back to it
   */
  position: Accessor<PositionRecord | null>;
  setPosition: Setter<PositionRecord | null>;
  /**
   * Where that is, in words: the country and the chunk's coordinates.
   *
   * It was painted into the corner of the map, which is the one place
   * on the screen the map cannot spare — a caption over the board sits
   * on top of whatever cell is under it, and the board is the game. It
   * belongs in the menu with the rest of the furniture, and the menu
   * is a sibling of the overworld rather than a child of it, so the
   * words travel through here.
   *
   * Null while the chunk is still being read
   */
  place: Accessor<string | null>;
  setPlace: Setter<string | null>;
  /**
   * The raid lobby the player is in, shown inside the raids dialog
   */
  raid: Accessor<string | null>;
  setRaid: Setter<string | null>;
  /**
   * The battle in progress. While one is set, it takes the whole
   * page — world, bar and all
   */
  battle: Accessor<ActiveBattle | null>;
  setBattle: Setter<ActiveBattle | null>;
  reward: Accessor<PendingReward | null>;
  setReward: Setter<PendingReward | null>;
  /**
   * What a cleared raid or a beaten grunt left standing, once it has
   * been collected: the encounter the player is about to meet.
   *
   * It is claimed here rather than in the overworld because the
   * overworld is not on screen when it is won — the battle has the
   * page — and an effect that only runs once its component mounts
   * turns "the moment you leave the fight" into "a moment after the
   * world has drawn itself again"
   */
  encounter: Accessor<EncounterRecord | null>;
  setEncounter: Setter<EncounterRecord | null>;
  /**
   * The catch sheet, which is a screen rather than a panel.
   *
   * It lives here because of where it is opened from: a list inside
   * the profile dialog, and another inside the auctions dialog. A
   * sheet rendered where it was opened is a dialog inside a dialog —
   * a panel on a panel, boxed into whatever room the one underneath
   * left it. Opened from here it is the only thing on the screen,
   * which is what a whole record needs
   */
  sheet: Accessor<OpenSheet | null>;
  setSheet: Setter<OpenSheet | null>;
  /**
   * A lot being put up, from wherever it was chosen
   */
  listing: Accessor<AuctionSubject | null>;
  setListing: Setter<AuctionSubject | null>;
  /**
   * Somebody else's profile, by uid, or null when nobody's is open.
   *
   * It lives here for the reason the catch sheet does: a trainer is
   * met in the middle of something — a lobby they have joined, a lot
   * they listed — and their profile opens over the panel that named
   * them rather than inside it. It is never the reader's own uid; the
   * player's own profile is the menu's, with everything that can be
   * pressed still on it
   */
  visiting: Accessor<string | null>;
  setVisiting: Setter<string | null>;
  /**
   * The friend a trade is being offered to, or null when none is.
   *
   * It lives here for the reason `visiting` does: the offer starts
   * wherever the friend was found — their row in the list, their
   * profile — and the dialog opens over that rather than inside it
   */
  trading: Accessor<string | null>;
  setTrading: Setter<string | null>;
  /**
   * The species whose dex entry is open, or null when none is.
   *
   * It travels the same road the catch sheet does and for the same
   * reason: an entry is a screen rather than a panel, and it is opened
   * from the dex — which is itself a dialog — so drawn where it was
   * asked for it would be a panel boxed inside another panel's room
   */
  dexEntry: Accessor<Species | null>;
  setDexEntry: Setter<Species | null>;
  /**
   * Bumped whenever a record changes under a list that is showing:
   * an evolution renames a row, a release takes one away, a listing
   * puts one in escrow. Lists watch it rather than being handed a
   * callback through every dialog between them and the change
   */
  records: Accessor<number>;
  touchRecords: () => void;
}

const GameContext = createContext<GameState>();

export function useGame(): GameState {
  const state = useContext(GameContext);

  if (state == null) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return state;
}

/**
 * Where the signed-in player is: what is open over the world, which
 * raid lobby they are in, and whether a battle has taken the page. It
 * lives above all of it because the overworld opens lobbies the raids
 * dialog shows, and both raids and replays open battles that replace
 * everything
 */
export default function GameProvider(props: ParentProps): JSX.Element {
  const auth = useAuth();
  const [dialog, setDialog] = createSignal(GameDialog.None);
  const [position, setPosition] = createSignal<PositionRecord | null>(null);
  const [place, setPlace] = createSignal<string | null>(null);

  // A profile on first sight, seeded from whatever the sign-in
  // already knows. The game reads a profile everywhere, so a player
  // the database has never heard of would leave every one of those
  // readings waiting on a row that is never coming
  createEffect(() => {
    const user = auth.user();

    if (user == null) {
      return;
    }
    ensureProfile(user).catch(() => {
      // Nothing to do about it here: the profile is read through a
      // subscription that will pick it up whenever it does appear,
      // and a sign-in is not worth interrupting over a nickname
    });
  });

  // Where they left off, or — for somebody who has never walked
  // anywhere — somewhere random in the starting region, written down
  // at once so the dice are rolled for them exactly once
  createEffect(() => {
    const user = auth.user();

    if (user == null || position() != null) {
      return;
    }

    let cancelled = false;

    const standAt = (at: PositionRecord | StartPosition, store: boolean): void => {
      if (cancelled) {
        return;
      }
      setPosition({
        player: user.uid,
        chunkX: at.chunkX,
        chunkY: at.chunkY,
        cellX: at.cellX,
        cellY: at.cellY,
        movedAt: 'movedAt' in at ? at.movedAt : 0,
      });

      if (store) {
        savePosition(at.chunkX, at.chunkY, at.cellX, at.cellY).catch(() => {
          // A first position that did not save is a walk that will
          // save it: nothing here is worth interrupting a sign-in for
        });
      }
    };

    getPosition(user.uid)
      .then((stored) => {
        if (stored != null) {
          standAt(stored, false);
          return;
        }
        standAt(pickStartPosition(getWorld(), `${user.uid}:${Date.now()}:${Math.random()}`), true);
      })
      .catch(() => {
        // Their position could not be read, which is no reason to keep
        // them out of the world. Nothing is written for it either: a
        // save on top of a failed read could move somebody whose real
        // record was there all along
        standAt(pickStartPosition(getWorld(), `${user.uid}:${Date.now()}:${Math.random()}`), false);
      });

    onCleanup(() => {
      cancelled = true;
    });
  });
  const [sheet, setSheet] = createSignal<OpenSheet | null>(null);
  const [listing, setListing] = createSignal<AuctionSubject | null>(null);
  const [visiting, setVisiting] = createSignal<string | null>(null);
  const [trading, setTrading] = createSignal<string | null>(null);
  const [dexEntry, setDexEntry] = createSignal<Species | null>(null);
  const [records, setRecords] = createSignal(0);

  const [raid, setRaid] = createSignal<string | null>(null);
  const [battle, setBattle] = createSignal<ActiveBattle | null>(null);
  const [reward, setReward] = createSignal<PendingReward | null>(null);
  const [encounter, setEncounter] = createSignal<EncounterRecord | null>(null);

  /**
   * Collect what a won fight left behind, the moment it is won.
   *
   * The prize is claimed here rather than by the overworld: the
   * overworld is unmounted while the battle has the page, so an effect
   * living there could not start until the player had already left the
   * fight and the world had drawn itself again. Claimed here, the
   * pokemon is standing there waiting by the time they arrive
   */
  createEffect(() => {
    const owed = reward();

    if (owed == null) {
      return;
    }
    setReward(null);
    (owed.stop == null ? claimRaidReward(owed.raid) : claimRocketReward(owed.stop))
      .then((collected) => {
        if (collected != null) {
          setEncounter(collected.encounter);
        }
      })
      .catch(() => {
        // Nothing is lost by a claim that failed: the raid keeps what
        // it owes until somebody collects it, and the overworld says
        // so when they walk back to it
      });
  });

  return (
    <GameContext.Provider
      value={{
        dialog,
        setDialog,
        position,
        setPosition,
        place,
        setPlace,
        raid,
        setRaid,
        battle,
        setBattle,
        reward,
        setReward,
        encounter,
        setEncounter,
        sheet,
        setSheet,
        listing,
        setListing,
        visiting,
        setVisiting,
        trading,
        setTrading,
        dexEntry,
        setDexEntry,
        records,
        touchRecords: () => {
          setRecords((count) => count + 1);
        },
      }}
    >
      {props.children}
    </GameContext.Provider>
  );
}
