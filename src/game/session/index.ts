import type { Notice } from '../../auth/notifications';
import { ensureProfile } from '../../auth/profile';
import type { PlayerIdentity } from '../../auth/user';
import type { Species } from '../../data/ids/species';
import type Weather from '../../data/overworld/weather';
import { type WritableStore, createStore } from '../store';
import followDueQuests from './due-quests';
import followNotices from './notices';
import type ProfileSection from './profile-section';
import { type RewardEvents, type Rewards, createRewards } from './rewards';
import type { AuctionSubject, FieldMoveOffer, OpenSheet } from './types';
import { GameDialog } from './types';
import { type Walk, createWalk } from './walk';

export * from './types';
export type { Walk } from './walk';
export type { Rewards } from './rewards';

/**
 * What the game knows about the signed-in player's session: where they
 * stand, what is open over the world, the battle on the page and what
 * is waiting on them. The interface reads it and calls into it, and
 * hears back through `SessionEvents` for what it should say or play
 */
export interface Session extends Walk, Rewards {
  dialog: WritableStore<GameDialog>;
  /** The country and the chunk's coordinates in words, for the menu; null while the chunk is read */
  place: WritableStore<string | null>;
  /** What the sky over that place is doing; null while the chunk is read */
  weather: WritableStore<Weather | null>;
  /** The buddy's field moves usable right here, travelling from the board to the menu bar */
  fieldMoves: WritableStore<FieldMoveOffer[]>;
  /** The raid lobby the player is in */
  raid: WritableStore<string | null>;
  /** The battle lobby the player is in */
  duel: WritableStore<string | null>;
  /**
   * The screens that open over whatever named them rather than inside
   * it, so none is a panel boxed inside another panel's room: a catch
   * sheet, a lot being put up, somebody else's profile (never the
   * reader's own), a trade offer, a dex entry and a species' forms
   */
  sheet: WritableStore<OpenSheet | null>;
  listing: WritableStore<AuctionSubject | null>;
  visiting: WritableStore<string | null>;
  trading: WritableStore<string | null>;
  dexEntry: WritableStore<Species | null>;
  dexForms: WritableStore<Species | null>;
  /** Which part of the player's own profile to open at, or null for where it always opens */
  profileAt: WritableStore<ProfileSection | null>;
  /**
   * Bumped whenever a record changes under a list that is showing.
   * Lists watch it rather than being handed a callback through every
   * dialog between them and the change
   */
  records: WritableStore<number>;
  touchRecords: () => void;
  /** Everything waiting on the player, followed whether or not its panel is open */
  notices: WritableStore<Notice[]>;
  /** Start following a signed-in player; returns the stop */
  start: (user: PlayerIdentity) => () => void;
}

export interface SessionEvents extends RewardEvents {
  questDue: (name: string) => void;
  /** A report of notices that brought something new */
  notice: () => void;
}

export default function createSession(events: SessionEvents): Session {
  const walk = createWalk();
  const rewards = createRewards(events);
  const records = createStore(0);
  const notices = createStore<Notice[]>([]);

  const start = (user: PlayerIdentity): (() => void) => {
    // The game reads a profile everywhere, so a player the database
    // has never heard of would leave every one of those readings
    // waiting on a row that is never coming
    ensureProfile(user).catch(() => {
      // The profile is read through a subscription that picks it up
      // whenever it does appear
    });

    const stops = [
      walk.follow(user),
      followNotices(user.uid, notices, events.notice),
      followDueQuests(records, events.questDue),
    ];

    return () => {
      for (const stop of stops) {
        stop();
      }
      notices.set([]);
    };
  };

  return {
    ...walk,
    ...rewards,
    dialog: createStore<GameDialog>(GameDialog.None),
    place: createStore<string | null>(null),
    weather: createStore<Weather | null>(null),
    fieldMoves: createStore<FieldMoveOffer[]>([]),
    raid: createStore<string | null>(null),
    duel: createStore<string | null>(null),
    sheet: createStore<OpenSheet | null>(null),
    listing: createStore<AuctionSubject | null>(null),
    visiting: createStore<string | null>(null),
    trading: createStore<string | null>(null),
    dexEntry: createStore<Species | null>(null),
    dexForms: createStore<Species | null>(null),
    profileAt: createStore<ProfileSection | null>(null),
    records,
    touchRecords: () => {
      records.update((count) => count + 1);
    },
    notices,
    start,
  };
}
