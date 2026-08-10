// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import AleaRNG from '../core/alea';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import type { Spawn } from '../overworld/chunk-snapshot';
import { asNumber, asRecord, asString } from './__normalize';
import { toZoneKey } from './local-time';

/**
 * What a Team Rocket stop is, and how a stored one is read back.
 *
 * Unlike a raid lobby, a stop is **per player**: the grunt stands at
 * the cell for the hour and fights each passer-by on their own. A
 * player who loses may try again while the hour lasts; one who wins
 * is done with that stop until the next hour rolls a new grunt. One
 * player's victory closes nothing for anybody else.
 */

/**
 * One pokemon of a grunt's party as stored. The spawn tuple is kept
 * rather than re-derived because Firestore holds no array of arrays,
 * and because a party frozen at the fight should stay what it was
 */
export interface RocketPokemon {
  species: Species;
  individualValue: number;
  traitValue: number;
}

export interface RocketRecord {
  /**
   * The uid this stop's state belongs to
   */
  player: string;
  /**
   * The grunt's three pokemon, weakest first: base, uncommon, rare
   */
  party: RocketPokemon[];
  /**
   * The fight under way, or the last one fought; null before the
   * player has accepted
   */
  battle: string | null;
  /**
   * The local raid hour the stop belongs to
   */
  timestamp: number;
  /**
   * Minutes east of UTC the hour was read in
   */
  offset: number;
  /**
   * Where the stop stands, so a reward derives against the cell it
   * was won at rather than wherever the player is now
   */
  chunk: { seed: string; x: number; y: number };
  cell: number;
  /**
   * Set when the grunt goes down. A beaten stop is shut for this
   * player for the rest of the hour; a lost one is not
   */
  defeated: boolean;
}

function asRocketParty(value: unknown): RocketPokemon[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    const data = asRecord(entry);

    return {
      species: asNumber(data.species) as Species,
      individualValue: asNumber(data.individualValue),
      traitValue: asNumber(data.traitValue),
    };
  });
}

/**
 * Restore a stop from an untyped Firestore value; the client and the
 * privileged server read through the same normalizer
 */
export function asRocketRecord(value: unknown): RocketRecord {
  const data = asRecord(value);
  const chunk = asRecord(data.chunk);

  return {
    player: asString(data.player),
    party: asRocketParty(data.party),
    battle: typeof data.battle === 'string' ? data.battle : null,
    timestamp: asNumber(data.timestamp),
    offset: asNumber(data.offset),
    chunk: { seed: asString(chunk.seed), x: asNumber(chunk.x), y: asNumber(chunk.y) },
    cell: asNumber(data.cell),
    defeated: data.defeated === true,
  };
}

/**
 * A stored party back as spawn tuples, which is what stages a battle
 * or an encounter
 */
export function toSpawns(party: RocketPokemon[]): Spawn[] {
  return party.map((entry): Spawn => [entry.species, entry.individualValue, entry.traitValue]);
}

/**
 * The stop's id for a given hour: the chunk, the zone, the hour and
 * the cell. The player is not part of it — the caller appends their
 * uid — so the stop is one landmark whose state each player keeps
 * their own copy of
 */
export function rocketStopId(
  chunk: Chunk,
  raidTimestamp: number,
  cell: number,
  offset = 0,
): string {
  return `${chunk.seed}${toZoneKey(offset)}@${raidTimestamp}$rocket${cell}`;
}

/**
 * What a beaten grunt leaves behind: one of the two commoner species
 * it fielded, as a spawn the player then has to catch. The rare one
 * is not on offer — a grunt does not hand over its best.
 *
 * The rolls are seeded by the stop and the player, so each winner
 * meets their own individual of it, and meeting it again resolves the
 * same one
 */
export function deriveRocketReward(record: RocketRecord, id: string, uid: string): [string, Spawn] {
  const rng = new AleaRNG(`${id}:reward:${uid}`);
  const offered = toSpawns(record.party).slice(0, 2);
  const [species] = offered[Math.floor(rng.random() * offered.length)];

  return [`${id}$reward`, [species, rng.int32(), rng.int32()]];
}
