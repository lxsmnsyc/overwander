import 'server-only';
import AleaRNG from '../../core/alea';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import type { Spawn } from '../../overworld/chunk-snapshot';
import { grantNestEgg } from '../eggs';
import { getSql } from '../db';
import { asString } from '../read';
import { Landmark, Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { grantStash } from './caches';
import { claim, resolveSnapshot } from './claims';
import type { NestOffer, PhenomenonClaim } from './nests';
import { startEncounter } from './spawns';

/** What is going on in a chunk: a grotto, a ripple, a dust cloud */
/**
 * Whether what is going on at a cell is an egg, without walking into
 * it.
 *
 * Only the egg is asked about, and only the egg is answered. An item
 * and a pokemon are things a player walks into and deals with; an egg
 * is a thing they have to decide to carry, and the deciding has to
 * happen before it is theirs. Everything else about the hour stays
 * unsaid, so pressing a cell to see whether it is worth pressing is
 * not a way of reading the world for free
 */
export async function peekPhenomenonEgg(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<NestOffer | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const reward = snapshot?.getPhenomenonReward(cell) ?? null;

  if (snapshot == null || reward?.kind !== 'egg') {
    return null;
  }
  const rows = await getSql()`
    select 1 from phenomenon_claims
    where marker = ${phenomenonKey(snapshot, cell)} and player = ${uid}
  `;

  return { taken: rows.length > 0 };
}

/**
 * What one hour of one phenomenon cell is called. The claim marker
 * hangs off it, and so does the seed the startled pokemon is rolled
 * from — both the peek and the claim name it the same way
 */
function phenomenonKey(snapshot: ChunkSnapshot, cell: number): string {
  return `${phenomenonPrefix(snapshot)}${cell}`;
}

/**
 * Everything this hour's markers share, which is everything but the
 * cell. It is what lets one query ask which of them a player has
 * already had
 */
function phenomenonPrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.phenomenonTimestamp}$happening`;
}

/**
 * Which cells of this chunk this player has already taken what was
 * happening on, inside the hour it is happening in.
 *
 * The board draws a phenomenon only until its player has had it: a
 * cloud somebody has already dug through is a cell they would press
 * for nothing. It is per player, so what one walks into is still
 * there for the next
 */
export async function listClaimedPhenomena(
  uid: string,
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<number[]> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return [];
  }

  const prefix = phenomenonPrefix(snapshot);
  const rows = await getSql()`
    select marker from phenomenon_claims
    where player = ${uid} and marker like ${`${prefix}%`}
  `;

  return rows
    .map((row) => Number(asString(row.marker).slice(prefix.length)))
    .filter((cell) => Number.isInteger(cell));
}

/**
 * Walk into whatever is going on at a cell.
 *
 * What is happening there and what it turns out to be are both the
 * world's, derived from the chunk, the hour and the cell — so the
 * pokemon a phenomenon startles out is the one it hid, not one the
 * caller named, and every visitor of that cell this hour meets the
 * same individual.
 *
 * **One successful interaction per player per hour.** The marker is
 * taken before anything is handed over and only where something is
 * actually there to hand over, so a phenomenon the biome could not
 * fill costs the player nothing
 */
export async function claimPhenomenon(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  locale: string,
): Promise<PhenomenonClaim | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const reward = snapshot?.getPhenomenonReward(cell) ?? null;

  if (snapshot == null || reward == null) {
    return null;
  }

  const key = phenomenonKey(snapshot, cell);

  if (!(await claim('phenomenon_claims', key, { player: uid, kind: reward.kind }))) {
    return null;
  }
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Phenomenon, 1]]);

  if (reward.kind === 'item') {
    await grantStash(uid, reward.items);
    return { kind: 'item', items: reward.items };
  }

  if (reward.kind === 'egg') {
    return {
      kind: 'egg',
      catchId: await grantNestEgg(uid, snapshot, cell, reward.species, now, offset, locale),
    };
  }

  // The pokemon needs the two rolls a snapshot spawn would have; they
  // derive from the same chunk, hour and cell, so what the phenomenon
  // startled out is one pokemon rather than one per player
  const rng = new AleaRNG(
    `${snapshot.groundKey}${snapshot.phenomenonTimestamp}happening${cell}spawn`,
  );
  const spawn: Spawn = [reward.species, rng.int32(), rng.int32()];

  // What startled it out travels with the meeting: the Lure Ball is
  // thrown at whatever came up out of a ripple, and by the time it is
  // thrown the cell is long behind the player
  return {
    kind: 'encounter',
    encounter: await startEncounter(uid, snapshot, key, spawn, {
      phenomenon: snapshot.getPhenomena().get(cell),
    }),
  };
}
