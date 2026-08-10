// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import AleaRNG from '../core/alea';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import type { Spawn } from '../overworld/chunk-snapshot';
import { asNumber, asRecord, asString, asStringArray } from './__normalize';

/**
 * What a raid lobby is, how a stored one is read back, and what
 * clearing it pays. The privileged server settles raids and the
 * client watches them, so the shape sits apart from both
 */

/**
 * What a lobby is staging
 */
export const enum RaidKind {
  /**
   * The biome's legendary, from a LegendaryRaid landmark
   */
  Legendary = 0,
  /**
   * A shadow boss — usually one of the biome's rare species, one
   * draw in eight a legendary
   */
  Shadow = 1,
}

/**
 * One raid lobby at raids/{raidId}. The id is derived from the chunk,
 * the raid hour, the landmark cell and the kind, so every player who
 * walks into the same lobby in the same hour joins one raid
 */
export interface RaidRecord {
  kind: RaidKind;
  species: Species;
  /**
   * The 32-bit roll the boss' nature and ability derive from
   */
  traitValue: number;
  /**
   * The player who opened the lobby; only they may start it
   */
  host: string;
  /**
   * teams/{teamId} ids that have joined, host first
   */
  teams: string[];
  /**
   * The battles/{battleId} the host started, or null while the lobby
   * is still gathering
   */
  battle: string | null;
  /**
   * The raid hour this lobby belongs to; a listing of live raids
   * matches on it, and the landmark reopens when the hour turns over
   */
  timestamp: number;
  /**
   * Where the lobby stands, for a listing that has no chunk in hand
   */
  chunk: { seed: string; x: number; y: number };
  cell: number;
  /**
   * Set once the boss goes down. A cleared raid keeps its landmark
   * shut for the rest of the hour — the legendary has been met
   */
  cleared: boolean;
}

/**
 * Restore a raid from an untyped Firestore value; the client and the
 * privileged server read through the same normalizer
 */
export function asRaidRecord(value: unknown): RaidRecord {
  const data = asRecord(value);
  const chunk = asRecord(data.chunk);

  return {
    kind: asNumber(data.kind) as RaidKind,
    species: asNumber(data.species) as Species,
    traitValue: asNumber(data.traitValue),
    host: asString(data.host),
    teams: asStringArray(data.teams),
    battle: typeof data.battle === 'string' ? data.battle : null,
    timestamp: asNumber(data.timestamp),
    chunk: { seed: asString(chunk.seed), x: asNumber(chunk.x), y: asNumber(chunk.y) },
    cell: asNumber(data.cell),
    cleared: data.cleared === true,
  };
}
/**
 * The lobby id of a raid landmark in a given raid hour. The kind is
 * part of it, so the two landmark types never collide on a cell
 */
export function raidId(
  chunk: Chunk,
  raidTimestamp: number,
  cell: number,
  kind: RaidKind = RaidKind.Legendary,
): string {
  const tag = kind === RaidKind.Shadow ? 'shadow' : 'raid';

  return `${chunk.seed}@${raidTimestamp}$${tag}${cell}`;
}
/**
 * The reward for clearing a raid: the legendary as a meetable spawn.
 * The chunk, biome and window are the raid's, but the two rolls are
 * seeded per player, so everyone in the lobby meets their own
 * individual — different IVs, different traits, its own shiny odds
 */
export function deriveRaidReward(raid: RaidRecord, id: string, uid: string): [string, Spawn] {
  // The raid's own seed material — the lobby it was staged in and the
  // trait value it rolled — mixed with the player, so every fighter
  // walks away with their own individual of the same legendary
  const rng = new AleaRNG(`${id}:${raid.traitValue}:reward:${uid}`);

  return [`${id}$reward`, [raid.species, rng.int32(), rng.int32()]];
}
