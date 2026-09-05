import 'server-only';
import { asCaughtPokemon, isShadow } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import Npc, { BREEDING_FEE } from '../../data/overworld/npc';
import { Items } from '../../data/ids/items';
import type { Species } from '../../data/ids/species';
import { getHeldPowerStat } from '../../data/items/power-items';
import { type BreedingParent, getEggSpecies } from '../../overworld/breeding';
import { grantBredEgg } from '../eggs';
import { readCaughtMany } from '../caught-io';
import { getSql } from '../db';
import { isCatchLocked } from '../locks';
import { grantGold, spendGold } from '../profile';
import { Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { releaseVisit, resolveNpc, takeVisit } from './visits';

/** The breeder: two parents in, an egg out */
/**
 * One parent as the breeding rules read it, from a stored catch the
 * player must own and must not have fighting
 */
function asParent(caught: Record<string, unknown> | null, uid: string): BreedingParent | null {
  // One fighting right now is refused: its battle runs on a frozen
  // snapshot, and reading it mid-fight would breed from a record the
  // fight is about to rewrite. A *guarded* pokemon is a different
  // lock and is welcome, since standing as a parent is one of the few
  // things putting one away leaves open
  if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
    return null;
  }

  const record = asCaughtPokemon(caught);
  const held = new Set(record.items);

  return {
    species: record.species,
    gender: record.gender,
    ivs: record.ivs,
    moves: record.moves,
    shadow: isShadow(record),
    nature: record.nature,
    // The one it is actually fielding. A pokemon with room for several
    // passes the first, which is the one it leads with
    ability: record.abilities[0],
    ball: record.ball,
    // Read off the stored record, like everything else here: what the
    // egg inherits is decided by what the pokemon is actually holding
    everstone: held.has(Items.Everstone),
    destinyKnot: held.has(Items.DestinyKnot),
    powerStat: getHeldPowerStat(record.items),
    egg: isEgg(record),
  };
}

/**
 * Leave two pokemon with the breeder. The pair is checked from the
 * stored records rather than the caller's word, and the fee is taken
 * only once they are known to be compatible. Neither parent is
 * consumed or held.
 *
 * Resolves the new egg's catch id, or null when the pair cannot breed,
 * the player cannot pay, or no breeder is standing there
 */
export default async function breedCatches(
  uid: string,
  x: number,
  y: number,
  cell: number,
  parents: [string, string],
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const [left, right] = parents;

  // A pokemon cannot be both parents; the pair has to be two
  if (left === right || left === '' || right === '') {
    return null;
  }

  const snapshot = resolveNpc(x, y, cell, now, offset, Npc.Breeder);

  if (snapshot == null) {
    return null;
  }

  // Both parents in one question, and no transaction round them: they
  // are read rather than read-then-written, so a BEGIN and a COMMIT
  // would be two round trips buying no lock
  const found = await readCaughtMany(getSql(), [left, right]);
  const pair = [left, right].map((id) => asParent(found.get(id) ?? null, uid));
  const [first, second] = pair;

  if (first == null || second == null) {
    return null;
  }

  const species: Species | null = getEggSpecies(first, second);

  if (species == null) {
    return null;
  }

  // Claimed before the fee, since a player already seen this window
  // should not be charged to be told so
  const visit = await takeVisit(snapshot, 'breed', cell, uid, { parents: [left, right] });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, BREEDING_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  // Seeded by the pair and the window, so this visit's egg is this
  // visit's egg — and by the instant, so the same pair left again is
  // a different one
  const seed = `${snapshot.key}${snapshot.npcTimestamp}breed${cell}:${uid}:${left}:${right}:${now}`;

  let egg: string;

  try {
    egg = await grantBredEgg(uid, snapshot, seed, species, [first, second], now, offset, locale);
  } catch (error) {
    // The fee bought an egg that was never written; the player keeps
    // their gold and their visit rather than the breeder keeping both
    await grantGold(uid, BREEDING_FEE);
    await releaseVisit(visit);
    throw error;
  }
  await bumpProgress(uid, [[Metric.GoldSpent, 0, BREEDING_FEE]]);
  return egg;
}
