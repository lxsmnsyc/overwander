// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import AleaRNG from '../core/alea';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import { RocketRank, type Spawn } from '../overworld/chunk-snapshot';
import { asNumber, asRecord, asString } from './__normalize';
import { toZoneKey } from './local-time';

/**
 * What a fighting stop is, and how a stored one is read back.
 *
 * One shape for every landmark that bars the way with somebody who
 * fights: a Team Rocket grunt or Giovanni, a duelling trainer, a gym
 * leader, one of the Elite Four, the Champion, a Frontier Brain. All
 * of them keep the NPC window and turn their party over with it.
 *
 * Unlike a raid lobby, a stop is **per player**: whoever stands at
 * the cell fights each passer-by on their own. A player who loses may
 * try again while the window lasts; one who wins is done with that
 * stop until the next window. One player's victory closes nothing for
 * anybody else.
 */

/**
 * One pokemon of a stop's party as stored. The spawn tuple is kept
 * rather than re-derived so a party frozen at the fight stays what it
 * was, whatever the window does afterwards
 */
export interface StopPokemon {
  species: Species;
  individualValue: number;
  traitValue: number;
}

export interface StopRecord {
  /**
   * The uid this stop's state belongs to
   */
  player: string;
  /**
   * The party fielded, weakest first. Six of them, whoever is standing
   * there
   */
  party: StopPokemon[];
  /**
   * The fight under way, or the last one fought; null before the
   * player has accepted
   */
  battle: string | null;
  /**
   * The local NPC window the stop belongs to
   */
  timestamp: number;
  /**
   * Minutes east of UTC the window was read in
   */
  offset: number;
  /**
   * Where the stop stands, so a reward derives against the cell it
   * was won at rather than wherever the player is now
   */
  chunk: { seed: string; x: number; y: number };
  cell: number;
  /**
   * Set when whoever stands there goes down. A beaten stop is shut for
   * this player for the rest of the window; a lost one is not
   */
  defeated: boolean;
}

function asStopParty(value: unknown): StopPokemon[] {
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
 * Restore a stop from an untyped row; the client and the
 * privileged server read through the same normalizer
 */
export function asStopRecord(value: unknown): StopRecord {
  const data = asRecord(value);
  const chunk = asRecord(data.chunk);

  return {
    player: asString(data.player),
    party: asStopParty(data.party),
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
export function toSpawns(party: StopPokemon[]): Spawn[] {
  return party.map((entry): Spawn => [entry.species, entry.individualValue, entry.traitValue]);
}

/**
 * The stop's id for a given window: the chunk, the zone, the window
 * and the cell. The player is not part of it, the caller appends
 * their uid, so the stop is one landmark whose state each player
 * keeps their own copy of.
 *
 * The `rocket` in the middle is a stored key rather than a word: it
 * is the primary key of every stop row already written, and changing
 * it would strand all of them
 */
export function stopIdOf(chunk: Chunk, npcTimestamp: number, cell: number, offset = 0): string {
  return `${chunk.seed}${toZoneKey(offset)}@${npcTimestamp}$rocket${cell}`;
}

/**
 * How many of a Team Rocket stop's six are on offer once it is
 * beaten. A grunt hands over the weaker half of what they were
 * carrying, which is the commoner and the two uncommons rather than
 * the three they were actually fighting with; an executive and the
 * boss put their whole party up, the legendary among Giovanni's.
 *
 * Nobody else leaves a pokemon behind, so nobody else asks
 */
export function stopRewardOffer(rank: RocketRank): number {
  return rank === RocketRank.Grunt ? 3 : 6;
}

/**
 * What a beaten stop leaves behind, as a spawn the player then has to
 * catch.
 *
 * The rolls are seeded by the stop and the player, so each winner
 * meets their own individual of it, and meeting it again resolves the
 * same one
 */
export function deriveStopReward(
  record: StopRecord,
  id: string,
  uid: string,
  rank: RocketRank,
): [string, Spawn] {
  const rng = new AleaRNG(`${id}:reward:${uid}`);
  const offered = toSpawns(record.party).slice(0, stopRewardOffer(rank));
  const [species] = offered[Math.floor(rng.random() * offered.length)];

  return [`${id}$reward`, [species, rng.int32(), rng.int32()]];
}
