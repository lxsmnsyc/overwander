// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Balls, Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type { EncounterType } from '../overworld/encounter';
import { asNumber, asNumberArray, asRecord, asStatRecord, asString } from './__normalize';

/**
 * What a catch is, and how a stored one is read back. It lives apart
 * from the store that queries it because the privileged server writes
 * catches too: both sides need the shape, and neither should have to
 * import the other to get it
 */

/**
 * How many items one pokemon can hold at a time, matching the
 * battle's per-unit item limit
 */
export const HELD_ITEM_LIMIT = 1;

/**
 * A caught encounter, permanently recorded. The IVs, gender and
 * nature are stored explicitly (even though they re-derive from the
 * individual and trait values) so records are readable and queryable
 * on their own.
 *
 * Everything about one catch lives in this one document: its
 * abilities, what it holds and whose hands it has passed through were
 * once three side stores keyed by the same id, which meant four reads
 * to show a pokemon and four documents to keep in step. They are
 * fields now, and a catch is read, written and secured as a whole
 */
export interface CaughtPokemon {
  /**
   * The current owner's uid
   */
  owner: string;
  /**
   * How the pokemon was originally encountered
   */
  type: EncounterType;
  species: Species;
  level: number;
  individualValue: number;
  traitValue: number;
  /**
   * Individual values per stat (0-31)
   */
  ivs: Record<Stats, number>;
  gender: Genders;
  nature: Natures;
  /**
   * The shiny verdict as seen by the original catcher, frozen at
   * catch time so trades cannot change it
   */
  shiny: boolean;
  /**
   * Whether it came out of a shadow raid. A shadow keeps its Shadow
   * ability and costs twice the candy to raise
   */
  shadow: boolean;
  moves: Moves[];
  /**
   * The abilities the catch has: the rolled one, plus Shadow for a
   * shadow catch, which it keeps for good
   */
  abilities: Abilities[];
  /**
   * What it is holding, up to HELD_ITEM_LIMIT; a fresh catch holds
   * nothing
   */
  items: Items[];
  /**
   * Whose hands it has passed through, oldest first: the catcher, and
   * an entry per trade
   */
  history: OwnershipRecord[];
  /**
   * Whether the catch is fielded in a battle. While it holds, the
   * record cannot be edited — the fight runs on a frozen snapshot, so
   * an item handed back or a level taken mid-battle would leave the
   * two disagreeing
   */
  lock: boolean;
  /**
   * The `startedAt` of the battle that locked it, zero when free. The
   * lock expires on its own `BATTLE_TIMEOUT` after this, so a party
   * walked out on is not held forever, and the stamp tells one
   * battle's lock from a later one's when the fight releases it
   */
  lockedAt: number;
  /**
   * Whether it is still an egg. Everything about the pokemon inside
   * is already written — the species, its rolls, its moves — but an
   * egg shows none of it, cannot be edited, and cannot be fielded in
   * a battle. Hatching is what takes the flag off
   */
  egg: boolean;
  /**
   * How far the egg has been carried. Only steps walked while it is
   * the player's buddy count, and only at a walking pace
   */
  steps: number;
  /**
   * How far it has to be carried, frozen when the egg was found: a
   * later change to what hatching costs cannot strand an egg somebody
   * is already halfway through
   */
  hatchSteps: number;
  /**
   * When steps were last credited, on the server's clock. It is what
   * the next report is measured against, so it is written by the
   * server and never by the walker
   */
  steppedAt: number;
  /**
   * The ball the catch was made with
   */
  ball: Balls;
  /**
   * When it was caught, as an ISO 8601 string in the catcher's own
   * zone — `2026-08-10T22:14:03.123+08:00`. The local date is what a
   * player means by "when I caught it", and the offset keeps the
   * instant behind it recoverable
   */
  caughtAt: string;
  /**
   * The catcher's locale tag, e.g. `en-PH`. A record carries where it
   * came from, so a date or a number shown alongside it can be read
   * the way its catcher would read it
   */
  locale: string;
  /**
   * Effort values per stat; a fresh catch starts at zero
   */
  effortValues: Record<Stats, number>;
  /**
   * Where and when the spawn appeared
   */
  origin: {
    timestamp: number;
    x: number;
    y: number;
    biome: Biome;
  };
}

export interface OwnershipRecord {
  owner: string;
  /**
   * When this owner obtained the pokemon (catch date for the first
   * entry, trade date for later ones), as a local ISO 8601 string in
   * that owner's own zone
   */
  acquiredAt: string;
}

/**
 * Restore an ownership history from an untyped Firestore value
 */
function asOwnershipHistory(value: unknown): OwnershipRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    const record = asRecord(entry);

    return { owner: asString(record.owner), acquiredAt: asString(record.acquiredAt) };
  });
}

/**
 * Restore a catch from an untyped Firestore value. The client's
 * converter and the privileged server both read through here, so the
 * two agree on what a stored catch means
 */
export function asCaughtPokemon(value: unknown): CaughtPokemon {
  const data = asRecord(value);
  const origin = asRecord(data.origin);

  return {
    owner: asString(data.owner),
    type: asNumber(data.type) as EncounterType,
    species: asNumber(data.species) as Species,
    level: asNumber(data.level),
    individualValue: asNumber(data.individualValue),
    traitValue: asNumber(data.traitValue),
    ivs: asStatRecord(data.ivs),
    gender: asNumber(data.gender) as Genders,
    nature: asNumber(data.nature) as Natures,
    shiny: data.shiny === true,
    shadow: data.shadow === true,
    moves: asNumberArray(data.moves) as Moves[],
    abilities: asNumberArray(data.abilities) as Abilities[],
    items: asNumberArray(data.items) as Items[],
    history: asOwnershipHistory(data.history),
    lock: data.lock === true,
    lockedAt: asNumber(data.lockedAt),
    egg: data.egg === true,
    steps: asNumber(data.steps),
    hatchSteps: asNumber(data.hatchSteps),
    steppedAt: asNumber(data.steppedAt),
    ball: asNumber(data.ball) as Balls,
    caughtAt: asString(data.caughtAt),
    locale: asString(data.locale),
    effortValues: asStatRecord(data.effortValues),
    origin: {
      timestamp: asNumber(origin.timestamp),
      x: asNumber(origin.x),
      y: asNumber(origin.y),
      biome: asNumber(origin.biome) as Biome,
    },
  };
}
