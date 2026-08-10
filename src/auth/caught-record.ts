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
   * The ball the catch was made with
   */
  ball: Balls;
  /**
   * Catch date, milliseconds since the epoch
   */
  caughtAt: number;
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
   * entry, trade date for later ones)
   */
  acquiredAt: number;
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

    return { owner: asString(record.owner), acquiredAt: asNumber(record.acquiredAt) };
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
    ball: asNumber(data.ball) as Balls,
    caughtAt: asNumber(data.caughtAt),
    effortValues: asStatRecord(data.effortValues),
    origin: {
      timestamp: asNumber(origin.timestamp),
      x: asNumber(origin.x),
      y: asNumber(origin.y),
      biome: asNumber(origin.biome) as Biome,
    },
  };
}
