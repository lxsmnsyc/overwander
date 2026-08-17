// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { type EncounterRecord, asEncounterRecord } from './encounter-record';
import { asBoolean, asNumber, asRecord, asString } from './__normalize';

/**
 * What a mystery gift is, as both sides read it.
 *
 * A gift is something the game decides a player is owed and then
 * waits with. It is offered — written down, whole, with whatever it
 * holds already rolled — and claimed later from the gifts dialog, so
 * what the box showed is exactly what the player ends up with.
 *
 * One giving may be several gifts: a first pokemon and the balls to
 * throw at the next one are two entries a player takes one at a time.
 */

export const enum GiftKind {
  Catch = 0,
  Item = 1,
}

interface GiftCommon {
  /**
   * Which gift this is. It is unique per player and it is what a
   * claim names, so the client never says whose gift it is asking for
   */
  id: string;
  /**
   * Why it was given, in a sentence. It is the only thing on the card
   * that says where a gift came from
   */
  reason: string;
}

export interface CatchGift extends GiftCommon {
  kind: GiftKind.Catch;
  species: Species;
  level: number;
  shiny: boolean;
  /**
   * The two rolls it was made from, so the gift can be shown with the
   * sigil the catch sheet draws it by: the mark that says which
   * individual this is
   */
  individualValue: number;
  traitValue: number;
}

export interface ItemGift extends GiftCommon {
  kind: GiftKind.Item;
  item: Items;
  amount: number;
}

/**
 * A gift as the player sees it, before or after taking it
 */
export type MysteryGift = CatchGift | ItemGift;

/**
 * A gift as it is stored at gifts/{gift}:{uid}
 */
export interface GiftRecord {
  player: string;
  gift: MysteryGift;
  offeredAt: number;
  /**
   * When it was taken, or null while it is still waiting. A gift is
   * kept rather than deleted so what the game has given somebody is
   * still readable afterwards
   */
  claimedAt: number | null;
  /**
   * The pokemon exactly as it was rolled when the gift was offered,
   * for a catch gift and nothing else. It is frozen rather than
   * rerolled on the way out: a species day passing between the offer
   * and the claim would otherwise change the pokemon the box showed
   */
  encounter: EncounterRecord | null;
}

export function asMysteryGift(value: unknown): MysteryGift {
  const data = asRecord(value);
  const id = asString(data.id);
  const reason = asString(data.reason);

  if ((asNumber(data.kind) as GiftKind) === GiftKind.Item) {
    return {
      kind: GiftKind.Item,
      id,
      reason,
      item: asNumber(data.item) as Items,
      amount: asNumber(data.amount),
    };
  }
  return {
    kind: GiftKind.Catch,
    id,
    reason,
    species: asNumber(data.species) as Species,
    level: asNumber(data.level),
    shiny: asBoolean(data.shiny),
    individualValue: asNumber(data.individualValue),
    traitValue: asNumber(data.traitValue),
  };
}

export function asGiftRecord(value: unknown): GiftRecord {
  const data = asRecord(value);

  return {
    player: asString(data.player),
    gift: asMysteryGift(data.gift),
    offeredAt: asNumber(data.offeredAt),
    claimedAt: data.claimedAt == null ? null : asNumber(data.claimedAt),
    encounter: data.encounter == null ? null : asEncounterRecord(data.encounter),
  };
}
