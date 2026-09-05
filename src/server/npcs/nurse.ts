import 'server-only';
import { asCaughtPokemon } from '../../auth/caught-record';
import { boostedSteps, stepsRemaining } from '../../auth/egg';
import { getMaxHealth } from '../../auth/health';
import Npc, { DAYCARE_FEE, NURSE_CARE_LIMIT } from '../../data/overworld/npc';
import { isPurifiable, purifyIVs } from '../../data/items/purifying-gem';
import { isEggRecord, isGuardedRecord } from '../catch-fields';
import { readCaughtIn, readCaughtMany, updateCaughtIn } from '../caught-io';
import { getSql, tx } from '../db';
import { isCatchLocked } from '../locks';
import { grantGold, spendGold } from '../profile';
import { purifiedFields } from '../purify';
import { Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { releaseVisit, resolveNpc, takeVisit } from './visits';

/** The nurse, who mends a party and hurries an egg along */
/**
 * What Nurse Joy did to one pokemon — and whether the doing included
 * a purification, which is counted apart — or null when there was
 * nothing of hers to do for it
 */
function tended(
  caught: Record<string, unknown>,
  uid: string,
): { fields: Record<string, unknown>; purifies: boolean } | null {
  // She heals and purifies, and a guarded pokemon is to be left alone
  // on both counts; it is simply not one of the ones she takes
  if (
    caught.owner !== uid ||
    isCatchLocked(caught) ||
    isEggRecord(caught) ||
    isGuardedRecord(caught)
  ) {
    return null;
  }

  const record = asCaughtPokemon(caught);
  const whole = getMaxHealth(record);
  // A shadow is put right as well as patched up, which is the reason
  // to walk to her with one rather than with a potion in hand
  const purified = isPurifiable(record) ? purifiedFields(caught) : null;
  const healed = record.health < whole || record.statuses !== 0;

  if (purified == null && !healed) {
    return null;
  }
  // Purifying raises the pool, and she fills whatever the pool ends up
  // being: the two are one visit, so the order they are written in
  // must not leave the pokemon short
  return {
    fields: {
      ...purified,
      health: getMaxHealth({ ...record, ivs: purifyIVs(record.ivs) }),
      statuses: 0,
    },
    purifies: purified != null,
  };
}

/**
 * Walk a party up to Nurse Joy. She takes up to `NURSE_CARE_LIMIT` in
 * one handover, hands every one back at full health with nothing left
 * on it, and purifies any shadow among them — all of it for nothing,
 * as often as she is asked. The cap is the handover's, not hers: she
 * turns nobody away while she is standing there.
 *
 * Resolves the ids she tended, or null when she is not standing there,
 * none of them are the player's to hand over, or there was nothing to
 * do
 */
export async function visitNurse(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  now: number,
  offset: number,
): Promise<string[] | null> {
  if (catches.length === 0 || catches.length > NURSE_CARE_LIMIT) {
    return null;
  }
  // The same pokemon twice would be one write racing another
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.NurseJoy);

  if (snapshot == null) {
    return null;
  }

  // The whole handover in one read: she takes six at once, and asking
  // for them one at a time is two round trips each
  const stored = await readCaughtMany(getSql(), catches);
  const care: [string, Record<string, unknown>, boolean][] = [];

  for (const id of catches) {
    const caught = stored.get(id);
    const done = caught == null ? null : tended(caught, uid);

    if (done != null) {
      care.push([id, done.fields, done.purifies]);
    }
  }

  // Nothing of hers to do: a party already whole is handed straight
  // back
  if (care.length === 0) {
    return null;
  }

  await tx(async (transaction) => {
    for (const [id, fields] of care) {
      await updateCaughtIn(transaction, id, fields);
    }
  });

  const purified = care.filter(([, , purifies]) => purifies).length;

  await bumpProgress(uid, [[Metric.Purifies, 0, purified]]);

  return care.map(([id]) => id);
}

/**
 * Have the daycare lady warm an egg along: half of what hatching
 * costs is added to wherever it already was, so an egg a quarter of
 * the way along comes out three quarters of the way.
 *
 * The boost is a share of the requirement rather than a place on it,
 * which means an egg past the half-way mark is finished by one and
 * any egg is finished by two. That is what the fee is for.
 *
 * Resolves how far along the egg now is, or null when it is not the
 * player's, is not an egg, is already ready to hatch, or no daycare
 * lady is standing there
 */
export async function boostEgg(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<number | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.DaycareLady);

  if (snapshot == null) {
    return null;
  }

  const stored = await readCaughtIn(getSql(), catchId, false);

  if (stored == null || stored.owner !== uid || !isEggRecord(stored) || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);

  // An egg already at the finish line has nothing left to buy
  if (stepsRemaining(caught) === 0) {
    return null;
  }

  const warmed = boostedSteps(caught);
  const visit = await takeVisit(snapshot, 'daycare', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, DAYCARE_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  try {
    // The stamp moves with it: the steps were not walked, so the time
    // they would have taken must not be banked for the next report
    await getSql()`
      update caught set steps = ${warmed}, stepped_at = ${now} where id = ${catchId}
    `;
  } catch (error) {
    await grantGold(uid, DAYCARE_FEE);
    await releaseVisit(visit);
    throw error;
  }
  await bumpProgress(uid, [[Metric.GoldSpent, 0, DAYCARE_FEE]]);
  return warmed;
}
