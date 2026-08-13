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
import { useAuth } from '../auth/context';
import type { EncounterRecord } from '../auth/encounter-record';
import { claimRaidReward } from '../auth/raids';
import { claimRocketReward } from '../auth/rockets';
import type { PositionRecord } from '../auth/position-record';
import { getPosition, savePosition } from '../auth/positions';
import type { AuctionSubject } from './AuctionDialog';
import type { MysteryGift } from '../auth/gift-record';
import claimMysteryGift from '../auth/gifts';
import { ensureProfile } from '../auth/profile';
import getWorld from '../overworld/current';
import pickStartPosition, { type StartPosition } from '../overworld/start';
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
   * belongs on the bar with the rest of the furniture, and the bar is
   * a sibling of the overworld rather than a child of it, so the words
   * travel through here.
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
   * What the game has just given them, until they have seen it. Empty
   * whenever there is nothing to show, which is nearly always
   */
  gifts: Accessor<MysteryGift[]>;
  setGifts: Setter<MysteryGift[]>;
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
  // already knows. The game reads a profile everywhere — the balance
  // sits over the auction board and the player's own name is on their
  // catches — so a player the store has never heard of would leave
  // every one of those readings waiting on a document that is never
  // coming
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
  const [gifts, setGifts] = createSignal<MysteryGift[]>([]);
  const [sheet, setSheet] = createSignal<OpenSheet | null>(null);
  const [listing, setListing] = createSignal<AuctionSubject | null>(null);
  const [records, setRecords] = createSignal(0);

  // Whether the game owes them anything, asked once a session. Today
  // that is the pokemon somebody with none is handed: a player who
  // has walked out of their last one is otherwise standing in a world
  // they cannot do anything in — no raid to join, nothing to bring to
  // a grunt, and a safari they can throw nothing at.
  //
  // Asked the moment there is somebody to ask for, rather than after
  // they have been put on the map. The record is stamped `Beyond` —
  // a fateful encounter happened nowhere, and the sheet shows no
  // place for one — so nothing about it needs a position, and waiting
  // for one put a second round trip in front of the first thing a new
  // player ever sees
  createEffect(() => {
    if (auth.user() == null) {
      return;
    }
    claimMysteryGift()
      .then((given) => {
        if (given.length > 0) {
          setGifts(given);
        }
      })
      .catch(() => {
        // A gift that could not be asked for is one the next sign-in
        // asks for again: nothing has been given, so nothing is lost
      });
  });

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
        gifts,
        setGifts,
        sheet,
        setSheet,
        listing,
        setListing,
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
