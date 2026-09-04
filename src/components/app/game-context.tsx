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
import type Weather from '../../data/overworld/weather';
import type { EncounterRecord } from '../../auth/encounter-record';
import { type Notice, watchNotifications } from '../../auth/notifications';
import { claimRaidReward } from '../../auth/raids';
import { claimStopReward } from '../../auth/stops';
import { settleGymChallenge } from '../../auth/gym-seats';
import type { PositionRecord } from '../../auth/position-record';
import type { Species } from '../../data/ids/species';
import { getPosition, savePosition, watchPosition } from '../../auth/positions';
import { AWARD_NAMES } from '../../data/ids/awards';
import { getItemData } from '../../data/items';
import ItemSprite from '../items/ItemSprite';
import watchDueQuests from './due-quests';
import { useToast } from '../styled';
import type { AuctionSubject } from '../auctions/AuctionDialog';
import type ProfileSection from '../profile/sections';
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
  /**
   * The quest board: what the game asks, and what each ask pays
   */
  Quests = 9,
  /**
   * Battle lobbies: the private fights a player has been called into,
   * and the one they are hosting
   */
  Battles = 10,
  /**
   * How the game is set up for this player, and what it is made of
   */
  Settings = 11,
  /**
   * Everything waiting on the player, wherever it came from: the one
   * screen that says an invitation has landed
   */
  Notifications = 12,
  /**
   * What the game has shipped, newest first: the release pages, read
   * as a feed rather than as documentation
   */
  News = 13,
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
   * The stop the battle was accepted at, whoever was standing there
   */
  stop?: string;
  /**
   * Who the stop staged, for the screens that name the other side:
   * the summary, the title, the word a win is announced with. A stop
   * is not only a grunt (a duelling trainer, a gym leader, one of the
   * Elite Four, the Champion), and it is the overworld rather than the
   * battle that knows which, so the name and the face travel with the
   * fight rather than being worked out again from a stop id
   */
  opponent?: { name: string; sprite: string };
  /**
   * The gym seat the battle was a challenge for. A win moves the
   * seat, so the settlement is the seat's rather than a purse's
   */
  seat?: string;
}

/**
 * Something won and not yet collected: the overworld turns it into a
 * safari encounter the next time the player is standing there.
 *
 * Nothing about the prize travels in it — the species, the level,
 * whether it is shadowed, the chunk and window it comes from are all
 * read off the raid or the stop when it is claimed
 */
export type PendingReward =
  | { raid: string; stop?: undefined; seat?: undefined }
  | { stop: string; raid?: undefined; seat?: undefined }
  // A seat settles whichever way the fight went: a win moves it, a
  // loss counts towards the stand its holder is keeping
  | { seat: string; raid?: undefined; stop?: undefined };

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
   * Where the walk went when it went to another screen, or null while
   * this one still has it.
   *
   * A player signed in twice writes one row from two boards. Rather
   * than let the two drag each other back and forth, the screen that
   * finds the row standing in a chunk it is not in stands down: it
   * stops walking and says so, and stays that way until somebody takes
   * the walk back here
   */
  elsewhere: Accessor<PositionRecord | null>;
  /**
   * Take the walk back onto this screen. Writes where it stands, which
   * is what stands the other screen down in turn
   */
  takeWalk: () => void;
  /**
   * Stand where the row already says this player is.
   *
   * A staff teleport writes the row from the server, and a screen
   * that read it as a second screen's walk would fence itself off
   * instead of moving. The stamp is taken as this screen's own, so
   * the news of it arriving changes nothing
   */
  standHere: (at: PositionRecord) => void;
  /**
   * The last place the player was put by something other than a walk.
   *
   * The board keeps its own coordinates once it has been placed, so
   * being moved has to reach it as news rather than through the
   * position alone
   */
  moved: Accessor<PositionRecord | null>;
  /**
   * Write down where the player is standing. It goes through here
   * rather than straight to the store so the stamp is kept: a device
   * that could not recognise its own writes coming back around the
   * subscription would stand itself down mid-walk
   */
  saveWalk: (chunkX: number, chunkY: number, cellX: number, cellY: number) => void;
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
   * What the sky over that place is doing, travelling the same way the
   * words for the place do and for the same reason. Null while the
   * chunk is still being read
   */
  weather: Accessor<Weather | null>;
  setWeather: Setter<Weather | null>;
  /**
   * The raid lobby the player is in, shown inside the raids dialog
   */
  raid: Accessor<string | null>;
  setRaid: Setter<string | null>;
  /**
   * The battle lobby the player is in, shown inside the battles
   * dialog the same way a raid lobby fills the raids one
   */
  duel: Accessor<string | null>;
  setDuel: Setter<string | null>;
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
   * Which part of the player's **own** profile to open at, or null to
   * open it where it always opens.
   *
   * A notice about a trade says "Open trades", and the profile is
   * where trades are answered: without this it opened on the battles
   * tab and the button read as one that had done nothing
   */
  profileAt: Accessor<ProfileSection | null>;
  setProfileAt: Setter<ProfileSection | null>;
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
   * The species whose **forms** are being looked through, if any.
   *
   * A pokemon with forms has one row in the printed dex, so pressing
   * that row opens the forms rather than an entry: which of the
   * twenty-eight is meant has not been said yet, and each of them has
   * a page of its own on the other side of this one
   */
  dexForms: Accessor<Species | null>;
  setDexForms: Setter<Species | null>;
  /**
   * Bumped whenever a record changes under a list that is showing:
   * an evolution renames a row, a release takes one away, a listing
   * puts one in escrow. Lists watch it rather than being handed a
   * callback through every dialog between them and the change
   */
  records: Accessor<number>;
  touchRecords: () => void;
  /**
   * Everything waiting on the player: invitations, requests, offers
   * and whatever the auction house owes them.
   *
   * It is followed here rather than in the panel that lists it, for
   * the reason `position` is: a panel that is not open watches
   * nothing, and an invitation nobody is told about is one nobody
   * answers. The menu reads the count off it and the notifications
   * panel draws it
   */
  notices: Accessor<Notice[]>;
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
  const toast = useToast();
  const [dialog, setDialog] = createSignal(GameDialog.None);
  const [position, setPosition] = createSignal<PositionRecord | null>(null);
  const [elsewhere, setElsewhere] = createSignal<PositionRecord | null>(null);
  /**
   * The newest stamp this screen wrote. Every write comes back around
   * the subscription, and one mistaken for somebody else's would stand
   * this screen down in the middle of its own walk
   */
  let wroteAt = 0;

  const saveWalk = (chunkX: number, chunkY: number, cellX: number, cellY: number): void => {
    savePosition(chunkX, chunkY, cellX, cellY)
      .then((stamp) => {
        wroteAt = Math.max(wroteAt, stamp);
      })
      .catch(() => {
        // A position that did not save is a walk that will save it,
        // and there is nothing here worth interrupting a walk for
      });
  };

  const [moved, setMoved] = createSignal<PositionRecord | null>(null);

  const standHere = (at: PositionRecord): void => {
    wroteAt = Math.max(wroteAt, at.movedAt);
    setElsewhere(null);
    setPosition(at);
    setMoved(at);
  };

  const takeWalk = (): void => {
    const at = elsewhere();

    if (at == null) {
      return;
    }
    setElsewhere(null);
    setPosition(at);
    saveWalk(at.chunkX, at.chunkY, at.cellX, at.cellY);
  };
  const [place, setPlace] = createSignal<string | null>(null);
  const [weather, setWeather] = createSignal<Weather | null>(null);

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
        saveWalk(at.chunkX, at.chunkY, at.cellX, at.cellY);
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

  /**
   * And followed after that, for the one thing a second screen can do
   * to this one.
   *
   * Only a chunk counts. Two screens standing in the same chunk write
   * cells over each other and neither view moves, which is untidy and
   * harmless; a chunk written from somewhere else is a walk that has
   * gone on without this screen, and carrying on here would be two
   * boards pulling one player apart.
   *
   * It sticks once it is set. A write of this screen's own still in
   * flight when the news arrives would otherwise land, look newer, and
   * quietly start the walk up again under a player who never asked for
   * it back
   */
  createEffect(() => {
    const user = auth.user();

    if (user == null) {
      return;
    }

    const stop = watchPosition(user.uid, (record) => {
      const here = position();

      // A row nobody has written yet, this screen's own coming back
      // around, or news that arrived before there was anything to
      // compare it against
      if (record == null || record.movedAt <= wroteAt || here == null || elsewhere() != null) {
        return;
      }
      if (record.chunkX !== here.chunkX || record.chunkY !== here.chunkY) {
        setElsewhere(record);
      }
    });

    onCleanup(stop);
  });
  const [sheet, setSheet] = createSignal<OpenSheet | null>(null);
  const [listing, setListing] = createSignal<AuctionSubject | null>(null);
  const [visiting, setVisiting] = createSignal<string | null>(null);
  const [profileAt, setProfileAt] = createSignal<ProfileSection | null>(null);
  const [trading, setTrading] = createSignal<string | null>(null);
  const [dexEntry, setDexEntry] = createSignal<Species | null>(null);
  const [dexForms, setDexForms] = createSignal<Species | null>(null);
  const [records, setRecords] = createSignal(0);

  // Said wherever the player is, since the board is shut whenever it
  // is worth hearing
  watchDueQuests(
    () => auth.user()?.uid ?? null,
    records,
    (name) => {
      toast.push({ title: 'Quest complete', message: `${name} is ready to claim.`, tone: 'leaf' });
    },
  );

  /** What is waiting on them, for as long as they are signed in */
  const [notices, setNotices] = createSignal<Notice[]>([]);

  createEffect(() => {
    const user = auth.user();

    if (user == null) {
      setNotices([]);
      return;
    }

    const stop = watchNotifications(user.uid, (waiting) => {
      setNotices(waiting);
    });

    onCleanup(stop);
  });

  const [raid, setRaid] = createSignal<string | null>(null);
  const [duel, setDuel] = createSignal<string | null>(null);
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

    if (owed.seat != null) {
      const seat = owed.seat;

      settleGymChallenge(seat)
        .then((settled) => {
          if (settled == null) {
            return;
          }
          // Said the moment it happens, for the same reason the purse
          // is: the winner is still on the battle screen, and the
          // seat is the whole of what the fight was for
          // The seat is opened rather than handed over, so what is
          // said is that it is open. Sitting down on it is the
          // player's next move, back in the world
          if (settled.freed) {
            toast.push({
              title: 'The seat is open',
              message:
                settled.gold > 0
                  ? `You beat them off it. +${settled.gold} gold`
                  : 'You beat them off it. Sit down while it is free.',
              tone: 'leaf',
            });
            return;
          }
          toast.push({
            message:
              settled.gold > 0
                ? `Their line-up held. −${settled.gold} gold`
                : 'Their line-up held. The seat stays theirs.',
            tone: 'ember',
          });
        })
        .catch(() => {
          // Nothing is lost: the challenge stays unsettled until
          // somebody reports it, and the seat has not moved
        });
      return;
    }

    if (owed.stop == null) {
      claimRaidReward(owed.raid)
        .then((collected) => {
          if (collected?.encounter != null) {
            setEncounter(collected.encounter);
          }
        })
        .catch(() => {
          // Nothing is lost by a claim that failed: the raid keeps
          // what it owes until somebody collects it
        });
      return;
    }
    claimStopReward(owed.stop)
      .then((collected) => {
        if (collected == null) {
          return;
        }
        // The purse and the badge are said in passing the moment the
        // fight pays them: the winner is still on the battle screen,
        // and nothing else would tell them what the win was worth
        if (collected.gold > 0) {
          toast.push({ message: `The purse is yours. +${collected.gold} gold`, tone: 'leaf' });
        }
        if (collected.award != null) {
          toast.push({
            title: AWARD_NAMES[collected.award],
            message: 'Yours, for good.',
            tone: 'leaf',
          });
        }
        // What the fight left besides the purse rides the same claim as
        // the badge, and is already in the bag by the time there is
        // anything to say
        if (collected.item != null) {
          const won = collected.item;

          toast.push({
            title: getItemData(won).name,
            message: 'Left behind by the fight.',
            art: () => <ItemSprite item={won} size={24} label="" />,
            tone: 'leaf',
          });
        }
        // A duelling trainer pays a purse and leaves no pokemon, so
        // there is nothing to stand waiting in the overworld
        if (collected.encounter != null) {
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
        elsewhere,
        standHere,
        moved,
        takeWalk,
        saveWalk,
        place,
        weather,
        setWeather,
        setPlace,
        raid,
        setRaid,
        duel,
        setDuel,
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
        profileAt,
        setProfileAt,
        trading,
        setTrading,
        dexEntry,
        setDexEntry,
        dexForms,
        setDexForms,
        records,
        notices,
        touchRecords: () => {
          setRecords((count) => count + 1);
        },
      }}
    >
      {props.children}
    </GameContext.Provider>
  );
}
