// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import { PokemonFlags, hasFlag } from '../data/constants/flags';
import type { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Balls, Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type Lairs from '../data/overworld/lair';
import type { EncounterType } from '../overworld/encounter';
import { asNumber, asNumberArray, asRecord, asStatRecord, asString } from './__normalize';
import { getMaxHealth } from './health';

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
   * Individual values, five bits per stat packed into one integer.
   * These are what every reader uses: for a wild catch they are
   * slices of `individualValue`, but a bred egg inherits three of
   * them from its parents and a bottle cap raises them, so the two
   * fields disagree and this one is what counts
   */
  ivs: number;
  gender: Genders;
  nature: Natures;
  /**
   * What is true about it, as `PokemonFlags` bits: shiny, shadow,
   * egg, locked. They were four fields; a record answers half a dozen
   * yes-or-no questions in one now, and the next question costs a bit
   * rather than a migration
   */
  flags: number;
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
   * The `startedAt` of the battle that locked it, zero when free. The
   * lock expires on its own `BATTLE_TIMEOUT` after this, so a party
   * walked out on is not held forever, and the stamp tells one
   * battle's lock from a later one's when the fight releases it
   */
  lockedAt: number;
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
   * How much health it has left. A battle leaves it where it left it,
   * so a party is looked after between fights rather than reset
   * between them; zero means fainted, and a fainted pokemon cannot be
   * fielded until something heals it.
   *
   * The maximum is derived rather than stored — see
   * [`src/auth/health.ts`](./health.ts) — so anything that changes the
   * maximum moves this in proportion
   */
  health: number;
  /**
   * The non-volatile statuses it walked out of its last battle with,
   * as a mask of `StatusFlags`. A pokemon can carry several at once —
   * poisoned and asleep is an ordinary way to come out of a raid —
   * while everything else a fight does (confusion, flinching, a
   * substitute) belongs to the fight and ends with it
   */
  statuses: number;
  /**
   * The lair it was fought in, for a raid prize. It is what the raid
   * was called, so a record can say where it came from rather than
   * only what kind of raid it was — null for everything met any other
   * way
   */
  lair: Lairs | null;
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

/**
 * Whether the catch sparkles, as its original catcher saw it
 */
export function isShiny(caught: { flags: number }): boolean {
  return hasFlag(caught.flags, PokemonFlags.Shiny);
}

/**
 * Whether it carries a shadow: the Shadow ability for good, and
 * double candy at every level
 */
export function isShadow(caught: { flags: number }): boolean {
  return hasFlag(caught.flags, PokemonFlags.Shadow);
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
  const species = asNumber(data.species) as Species;
  const level = asNumber(data.level);
  const ivs = asNumber(data.ivs);
  const effortValues = asStatRecord(data.effortValues);

  return {
    owner: asString(data.owner),
    type: asNumber(data.type) as EncounterType,
    species,
    level,
    individualValue: asNumber(data.individualValue),
    traitValue: asNumber(data.traitValue),
    ivs,
    gender: asNumber(data.gender) as Genders,
    nature: asNumber(data.nature) as Natures,
    flags: asNumber(data.flags),
    moves: asNumberArray(data.moves) as Moves[],
    abilities: asNumberArray(data.abilities) as Abilities[],
    items: asNumberArray(data.items) as Items[],
    history: asOwnershipHistory(data.history),
    lockedAt: asNumber(data.lockedAt),
    steps: asNumber(data.steps),
    hatchSteps: asNumber(data.hatchSteps),
    steppedAt: asNumber(data.steppedAt),
    // A record written before a fight could hurt anything has no
    // health field, and reading that as zero would faint every
    // pokemon caught until now. Missing means whole, which is what
    // those records meant
    health:
      data.health == null
        ? getMaxHealth({ species, level, ivs, effortValues })
        : asNumber(data.health),
    statuses: asNumber(data.statuses),
    lair: data.lair == null ? null : (asNumber(data.lair) as Lairs),
    ball: asNumber(data.ball) as Balls,
    caughtAt: asString(data.caughtAt),
    locale: asString(data.locale),
    effortValues,
    origin: {
      timestamp: asNumber(origin.timestamp),
      x: asNumber(origin.x),
      y: asNumber(origin.y),
      biome: asNumber(origin.biome) as Biome,
    },
  };
}
