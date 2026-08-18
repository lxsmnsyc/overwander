// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type Abilities from '../data/ids/abilities';
import type { Balls, Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import { type EncounterRecord, asEncounterRecord } from './encounter-record';
import { asBoolean, asNumber, asNumberArray, asRecord, asString } from './__normalize';

/**
 * What a mystery gift is, as both sides read it.
 *
 * A gift is something the game decides somebody is owed and then
 * waits with. It is offered — written down, whole, with whatever it
 * holds already decided — and claimed later from the gifts dialog, so
 * what the box showed is what the player ends up with.
 *
 * An offer is for **one player or for everybody**. A player's own is
 * written under their uid and is theirs alone; an open one names
 * nobody, stands on every shelf at once, and is taken once each. That
 * is why taking one is a document of its own rather than a stamp on
 * the offer: one gift has as many claims as there are players.
 */

export const enum GiftKind {
  /** A finished record, handed over whole */
  Catch = 0,
  Item = 1,
  /**
   * A meeting rather than a record: the pokemon is put in front of the
   * player and they throw their own ball at it. It cannot run and it
   * cannot break out — what the player brings to it is the ball the
   * record ends up naming
   */
  Encounter = 2,
}

interface GiftCommon {
  /**
   * Which gift this is, which is the id of the document holding it.
   * It is what a claim names, so the client never says whose gift it
   * is asking for
   */
  id: string;
  /**
   * Why it was given, in a sentence. It is the only thing on the card
   * that says where a gift came from
   */
  reason: string;
  /**
   * When it stops being takeable, or null for one that waits forever.
   * A gift past it is neither listed nor claimable — an offer is kept
   * afterwards rather than deleted, so what was given out is still
   * readable
   */
  expiresAt: number | null;
}

interface PokemonGift extends GiftCommon {
  species: Species;
  level: number;
  shiny: boolean;
  /**
   * Whether it arrives shadowed, which carries the Shadow ability for
   * good and starts it thinking nothing of anybody
   */
  shadow: boolean;
  /**
   * The two rolls it was made from, so the gift can be shown with the
   * sigil the catch sheet draws it by: the mark that says which
   * individual this is.
   *
   * An open gift carries zeroes here as it is stored — nobody has
   * rolled it yet — and the server fills them in per player, since the
   * pokemon two people take out of one offer are two pokemon
   */
  individualValue: number;
  traitValue: number;
  /**
   * What was asked for by hand rather than left to the roll. Null is
   * "whatever it rolled", which is what every gift the game itself
   * gives says
   */
  gender: Genders | null;
  nature: Natures | null;
  /**
   * Individual values, five bits per stat, or null to keep the ones
   * the roll produced
   */
  ivs: number | null;
  /**
   * What it walks in knowing and carrying. An empty list is the roll's
   * own answer rather than an instruction to arrive with nothing
   */
  abilities: Abilities[];
  moves: Moves[];
  items: Items[];
  /**
   * What the place is called, or an empty string for a gift that says
   * it happened nowhere. A fateful meeting has no coordinate anybody
   * walked to, so where it came from is a name — "Pallet Town" — and
   * the sheet reads it as one
   */
  place: string;
  /**
   * The room it walks in with, packed: abilities, held items and
   * moves. A distribution may be written with more than the game
   * gives, and the record has to say so
   */
  slots: number;
}

export interface CatchGift extends PokemonGift {
  kind: GiftKind.Catch;
  /**
   * The ball the record says it came in. Nothing was thrown at this
   * one, so it is a choice rather than a fact — the Premier Ball is
   * the commemorative one and the usual answer
   */
  ball: Balls;
  /**
   * Who owned it before this player, or an empty string for one that
   * was nobody's. It is a **name** rather than an account: "Red" is a
   * trainer in a story, and the record says so on the sheet
   */
  owner: string;
}

/**
 * A meeting waiting to happen. It carries no ball and no earlier
 * owner: the player throws what they are carrying, and what they
 * catch is theirs first
 */
export interface EncounterGift extends PokemonGift {
  kind: GiftKind.Encounter;
}

export interface ItemGift extends GiftCommon {
  kind: GiftKind.Item;
  item: Items;
  amount: number;
}

/**
 * A gift as the player sees it, before or after taking it
 */
export type MysteryGift = CatchGift | EncounterGift | ItemGift;

/**
 * A gift as it is stored at gifts/{giftId}
 */
export interface GiftRecord {
  /**
   * Whose it is, or **null** for one anybody may take. A personal
   * offer is written at "{gift}:{uid}" so a second one cannot be
   * opened for the same player; an open one is written under an id of
   * its own
   */
  player: string | null;
  gift: MysteryGift;
  offeredAt: number;
  /**
   * The pokemon exactly as it was rolled when a personal gift was
   * offered. It is frozen rather than rerolled on the way out: a
   * species day passing between the offer and the claim would
   * otherwise change the pokemon the box showed.
   *
   * Null for an item, and null for an open gift — one offer cannot
   * hold one pokemon for everybody, so those are rolled per player
   * from the id and the taker, which is stable for the same pair
   */
  encounter: EncounterRecord | null;
}

/**
 * Somebody having taken one, at giftClaims/{giftId}:{uid}.
 *
 * Writing it is what makes a claim happen: it is created inside the
 * transaction that hands the gift over, so a second press or a second
 * tab finds it already there rather than being paid twice
 */
export interface GiftClaimRecord {
  gift: string;
  player: string;
  claimedAt: number;
  /**
   * The record a pokemon landed in, so the sheet can be opened on it;
   * null for an item, and null for the moment between the claim being
   * written and the catch being recorded
   */
  catchId: string | null;
}

export function asMysteryGift(value: unknown): MysteryGift {
  const data = asRecord(value);
  const id = asString(data.id);
  const reason = asString(data.reason);
  const expiresAt = data.expiresAt == null ? null : asNumber(data.expiresAt);

  const kind = asNumber(data.kind) as GiftKind;

  if (kind === GiftKind.Item) {
    return {
      kind: GiftKind.Item,
      id,
      reason,
      expiresAt,
      item: asNumber(data.item) as Items,
      amount: asNumber(data.amount),
    };
  }

  const pokemon = {
    id,
    reason,
    expiresAt,
    species: asNumber(data.species) as Species,
    level: asNumber(data.level),
    shiny: asBoolean(data.shiny),
    shadow: asBoolean(data.shadow),
    individualValue: asNumber(data.individualValue),
    traitValue: asNumber(data.traitValue),
    gender: data.gender == null ? null : (asNumber(data.gender) as Genders),
    nature: data.nature == null ? null : (asNumber(data.nature) as Natures),
    ivs: data.ivs == null ? null : asNumber(data.ivs),
    abilities: asNumberArray(data.abilities) as Abilities[],
    moves: asNumberArray(data.moves) as Moves[],
    items: asNumberArray(data.items) as Items[],
    place: asString(data.place),
    slots: asNumber(data.slots),
  };

  if (kind === GiftKind.Encounter) {
    return { kind: GiftKind.Encounter, ...pokemon };
  }
  return {
    kind: GiftKind.Catch,
    ...pokemon,
    ball: asNumber(data.ball) as Balls,
    owner: asString(data.owner),
  };
}

export function asGiftRecord(value: unknown): GiftRecord {
  const data = asRecord(value);

  return {
    player: data.player == null ? null : asString(data.player),
    gift: asMysteryGift(data.gift),
    offeredAt: asNumber(data.offeredAt),
    encounter: data.encounter == null ? null : asEncounterRecord(data.encounter),
  };
}

export function asGiftClaimRecord(value: unknown): GiftClaimRecord {
  const data = asRecord(value);

  return {
    gift: asString(data.gift),
    player: asString(data.player),
    claimedAt: asNumber(data.claimedAt),
    catchId: data.catchId == null ? null : asString(data.catchId),
  };
}
