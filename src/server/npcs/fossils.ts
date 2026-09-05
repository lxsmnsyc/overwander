import 'server-only';
import { Acquisition } from '../../auth/caught-record';
import Npc from '../../data/overworld/npc';
import { FOSSIL_REVIVE_LEVEL, getFossilPrice } from '../../data/overworld/fossil';
import AleaRNG from '../../core/alea';
import { Balls, type Items, getApricornBall } from '../../data/ids/items';
import type { Species } from '../../data/ids/species';
import { FOSSIL_SPECIES } from '../../data/items/fossils';
import deriveEncounter, { EncounterType } from '../../overworld/encounter';
import { writeCaughtRecord } from '../caught';
import { consumeItem, grantItem } from '../inventory';
import type { TradeResult } from './moves';
import { trade } from './vendor';
import { releaseVisit, resolveNpc, takeVisit } from './visits';

/** The fossil maniac, the scientist, and Kurt at his lathe */
/**
 * Buy a fossil off the Fossil Maniac.
 *
 * What he is carrying is not the caller's to say: the pair is derived
 * from the window he was, so a fossil he is not holding is refused
 * rather than sold. One per visit, and one visit per window — he is
 * the only place a fossil can be bought, and a maniac who sold three
 * in an hour would make digging one up pointless.
 *
 * The gold and the rock move in the same transaction the vendor's
 * trades move in, so a player is never charged for a fossil that
 * never reached the bag.
 *
 * Resolves the balance and how many of that fossil are now carried,
 * or null when he is not standing there, is not holding it, the purse
 * will not cover it, or he has already sold to this player
 */
export async function buyFossil(
  uid: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  now: number,
  offset: number,
): Promise<TradeResult | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.FossilManiac);

  if (snapshot == null) {
    return null;
  }

  const owed = getFossilPrice(item);

  if (owed <= 0 || !new Set(snapshot.getFossilOffer(cell)).has(item)) {
    return null;
  }

  // Claimed before the trade, since a player already seen this window
  // should not have their purse touched to be told so
  const visit = await takeVisit(snapshot, 'fossil', cell, uid, { item });

  if (visit == null) {
    return null;
  }

  const sold = await trade(uid, [[item, 1]], -owed);

  if (sold == null) {
    // He was asked and sold nothing — the purse would not stretch —
    // so the window is given back rather than spent on a refusal
    await releaseVisit(visit);
  }
  return sold;
}

/**
 * What came out of a fossil: the catch record it was written to, and
 * what the rock turned out to hold
 */
export interface RevivedFossil {
  catchId: string;
  species: Species;
  level: number;
  shiny: boolean;
}

/**
 * Have the Fossil Scientist open a fossil.
 *
 * Which species comes out is the fossil's rather than the caller's,
 * and the level is fixed, so the only thing a player decides is which
 * rock they hand over. He is **not** once a window: what paces him is
 * how many fossils have been dug up, and turning away the second of
 * two would only be a walk to the next cell to do the same thing.
 *
 * The fossil leaves the bag first and is put back if the record is
 * never written, since a fossil spent on nothing is the one outcome
 * that cannot be walked off.
 *
 * Resolves what came out, or null when he is not standing there, the
 * item is not a fossil, or the player is not carrying one
 */
/**
 * Kurt's counter: apricorns in, the balls their colours make out.
 *
 * One apricorn is one ball and there is no fee, since the picking was
 * the price. He works through as many of one colour as a player is
 * carrying, so a basket of nine reds is nine Level Balls in one
 * handover rather than nine walks back.
 *
 * The apricorns leave the bag first and go back if the balls are
 * never granted: apricorns spent on nothing is the one outcome that
 * cannot be walked off.
 *
 * Resolves how many were carved, or null when he is not standing
 * there, the item is not an apricorn, or the player is not carrying
 * that many
 */
export async function carveApricorns(
  uid: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  amount: number,
  now: number,
  offset: number,
): Promise<{ ball: Items; amount: number } | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Kurt);
  const ball = getApricornBall(item);
  const carving = Math.floor(amount);

  if (snapshot == null || ball == null || carving < 1) {
    return null;
  }
  if (!(await consumeItem(uid, item, carving))) {
    return null;
  }

  try {
    await grantItem(uid, ball, carving);
    return { ball, amount: carving };
  } catch (error) {
    // The apricorns bought nothing, so the player keeps them
    await grantItem(uid, item, carving);
    throw error;
  }
}

export async function reviveFossil(
  uid: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  now: number,
  offset: number,
  locale: string,
): Promise<RevivedFossil | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.FossilScientist);
  const species = FOSSIL_SPECIES.get(item);

  if (snapshot == null || species == null) {
    return null;
  }
  if (!(await consumeItem(uid, item))) {
    return null;
  }

  // Seeded by the player, the fossil and the instant: two of the same
  // rock opened one after the other are two different pokemon, and
  // re-running a call that failed on the way out gives the same one
  const rng = new AleaRNG(
    `${snapshot.key}${snapshot.npcTimestamp}revive${cell}:${uid}:${item}:${now}`,
  );
  const encounter = deriveEncounter(snapshot, [species, rng.int32(), rng.int32()], uid, {
    type: EncounterType.Revived,
    level: FOSSIL_REVIVE_LEVEL,
  });

  try {
    // Nothing was thrown at it, and the record still has to name a
    // ball: the commemorative one, which is what every pokemon that
    // arrived without a throw is written under
    const catchId = await writeCaughtRecord(
      uid,
      { ...encounter, spawn: `fossil${cell}:${uid}:${item}:${now}`, player: uid },
      Balls.PremierBall,
      Acquisition.Revived,
      now,
      offset,
      locale,
    );

    return {
      catchId,
      species: encounter.species,
      level: encounter.level,
      shiny: encounter.shiny,
    };
  } catch (error) {
    // The rock bought nothing, so the player keeps the rock
    await grantItem(uid, item);
    throw error;
  }
}
