import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';

/**
 * What a mystery gift is, as both sides read it.
 *
 * A gift is the one thing in the game that arrives without being
 * worked for: the server decides there is one, writes whatever it is
 * into the player's collection or their bag, and hands back this —
 * enough to show them what they were given and nothing they could
 * have asked for. There is no accepting it and no refusing it, so
 * this carries no id to confirm with; by the time the player sees it,
 * it is already theirs.
 *
 * One giving may be several things — a first pokemon arrives with
 * balls to throw — so what crosses the wire is a list of them.
 */

export const enum GiftKind {
  Catch = 0,
  Item = 1,
}

export interface CatchGift {
  kind: GiftKind.Catch;
  /**
   * The record it was written to, so the dialog can offer to open it
   */
  catchId: string;
  species: Species;
  level: number;
  shiny: boolean;
  /**
   * The two rolls it was made from. They are carried so the gift can
   * be shown with the sigil the catch sheet draws it by: the mark
   * that says which individual this is, and the first thing about it
   * a player will recognise later
   */
  individualValue: number;
  traitValue: number;
}

export interface ItemGift {
  kind: GiftKind.Item;
  item: Items;
  amount: number;
}

export type MysteryGift = CatchGift | ItemGift;
