import type { AuctionLot } from '../../auth/auctions';
import type Npc from '../../data/overworld/npc';
import type Awards from '../../data/ids/awards';
import type { Items } from '../../data/ids/items';
import type { Species } from '../../data/ids/species';
import type { ItemStack } from '../../data/overworld/item-pool';

/**
 * What is open over the world.
 *
 * The overworld is not one of these: it is the page, and everything
 * else is something pulled over the top of it and put away again
 */
export const enum GameDialog {
  None = 0,
  Profile = 1,
  Raids = 2,
  Auctions = 3,
  Map = 4,
  /** The player's pokemon, one press from the menu rather than a tab of the profile */
  Catches = 5,
  Inventory = 6,
  /** Every pokemon there is, beside the catches: a box is what somebody has, a dex is what there is */
  Pokedex = 7,
  /** What the game is holding for the player until they come for it */
  Gifts = 8,
  /** The quest board: what the game asks, and what each ask pays */
  Quests = 9,
  /** The private fights a player has been called into, and the one they are hosting */
  Battles = 10,
  Settings = 11,
  /** Everything waiting on the player, wherever it came from */
  Notifications = 12,
  /** The release pages, newest first, read as a feed */
  News = 13,
}

/**
 * A battle the player is watching. A raid battle settles the raid it
 * was fought for and a stop fight settles its stop; a replay settles
 * nothing, re-running a finished battle from its seed for the record
 */
export interface ActiveBattle {
  id: string;
  replay: boolean;
  raid?: string;
  /** The stop the battle was accepted at, whoever was standing there */
  stop?: string;
  /**
   * Who the stop staged, for the screens that name the other side. It
   * is the overworld rather than the battle that knows, so the name and
   * the face travel with the fight
   */
  opponent?: { name: string; sprite: string };
  /** What kind of person the stop staged, which is what a win may promise */
  npc?: Npc;
  /** The gym seat the battle was a challenge for; a win moves the seat */
  seat?: string;
}

/**
 * What a settled fight paid, for the battle's own summary to lay out.
 * Gold is negative for a purse lost at a gym seat
 */
export interface Spoils {
  gold: number;
  award: Awards | null;
  items: ItemStack[];
  /** What the fight left standing in the overworld, to be met there */
  waiting: Species | null;
  seat: 'freed' | 'held' | null;
}

export const NO_SPOILS: Spoils = { gold: 0, award: null, items: [], waiting: null, seat: null };

/**
 * Something won and not yet collected. Nothing about the prize travels
 * in it: it is all read off the raid, the stop or the seat when claimed
 */
export type PendingReward =
  | { raid: string; stop?: undefined; seat?: undefined }
  | { stop: string; raid?: undefined; seat?: undefined }
  // A seat settles whichever way the fight went: a win moves it, a
  // loss counts towards the stand its holder is keeping
  | { seat: string; raid?: undefined; stop?: undefined };

/**
 * A catch opened in full. Somebody else's pokemon, a lot on the block,
 * is read-only: the whole record, and nothing to press
 */
export interface OpenSheet {
  catchId: string;
  readOnly?: boolean;
}

/**
 * One field move the board can use where the player stands, for the
 * menu bar to offer. `active` is Surf or Fly in use, and `busy` is a
 * Dig or Teleport still on its way
 */
export interface FieldMoveOffer {
  name: string;
  active: boolean;
  busy: boolean;
  use: () => void;
}

/**
 * What is being put up for auction, in the shape the auction record
 * uses to say what a lot holds
 */
export type AuctionSubject =
  | { lot: AuctionLot.Catch; catchId: string }
  | { lot: AuctionLot.Item; item: Items };
