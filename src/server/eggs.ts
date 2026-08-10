import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { BUDDY_COLLECTION, CAUGHT_COLLECTION } from '../auth/collections';
import { EGG_HATCH_STEPS, EGG_LEVEL, creditableSteps, stepsRemaining } from '../auth/egg';
import { asOffset, toLocalISO, toLocalTime } from '../auth/local-time';
import AleaRNG from '../core/alea';
import { Balls } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { Spawn } from '../overworld/chunk-snapshot';
import deriveEncounter, { EncounterType, deriveEggMoves } from '../overworld/encounter';
import { grantCatchCandy } from './candy';
import { getAdminFirestore } from './firebase';
import { asLocale, zeroEffortValues } from './catch-fields';
import { freeFields, isCatchLocked } from './locks';
import { docData } from './read';

/**
 * Eggs, written with admin credentials.
 *
 * An egg is a catch record that already knows everything about the
 * pokemon inside it — the species, its rolls, the move it inherited —
 * and shows none of it. That is deliberate: deciding it here, once,
 * means hatching cannot be re-rolled by asking again, and the reveal
 * is the client's business rather than a second draw.
 *
 * The only thing an egg needs from the player is distance. Steps are
 * reported by the client, since it is the one holding the keyboard,
 * and credited against the server's own clock: what a report can buy
 * is bounded by how long it has been since the last one, so claiming
 * a thousand paces in a second buys four.
 */

/**
 * What one report of walking came to
 */
export interface EggWalk {
  /**
   * The egg the steps went to
   */
  caught: string;
  steps: number;
  hatchSteps: number;
}

/**
 * Lay a nest's egg into the player's collection. The species is the
 * one the nest is holding; everything else is rolled from the nest,
 * the day and the player, so the egg is theirs alone and re-deriving
 * it gives the same pokemon.
 *
 * Resolves the new catch id
 */
export async function grantNestEgg(
  uid: string,
  snapshot: ChunkSnapshot,
  cell: number,
  species: Species,
  now: number,
  offset: number,
  locale: string,
): Promise<string> {
  const db = getAdminFirestore();
  const ref = db.collection(CAUGHT_COLLECTION).doc();
  const zone = asOffset(offset);
  const foundAt = toLocalISO(now, zone);
  // The draws land in order: the individual value, the trait value,
  // then the move the hatchling inherits
  const rng = new AleaRNG(`${snapshot.key}${snapshot.nestTimestamp}nest${cell}egg:${uid}`);
  const spawn: Spawn = [species, rng.int32(), rng.int32()];
  const hatchling = deriveEncounter(snapshot, spawn, uid, {
    type: EncounterType.Hatched,
    level: EGG_LEVEL,
  });

  await ref.set({
    owner: uid,
    type: EncounterType.Hatched,
    species,
    level: EGG_LEVEL,
    individualValue: hatchling.individualValue,
    traitValue: hatchling.traitValue,
    ivs: hatchling.ivs,
    gender: hatchling.gender,
    nature: hatchling.nature,
    shiny: hatchling.shiny,
    // Nothing shadowed comes out of a nest
    shadow: false,
    // A nest guarantees the inherited move; the rest is what the
    // species knows at the level it hatches
    moves: deriveEggMoves(species, EGG_LEVEL, () => rng.random()),
    abilities: [hatchling.ability],
    // An egg holds nothing, and cannot be handed anything until it
    // has hatched
    items: [],
    history: [{ owner: uid, acquiredAt: foundAt }],
    ...freeFields(),
    egg: true,
    steps: 0,
    // Frozen here, so a later change to what hatching costs cannot
    // move the finish line on an egg already being carried
    hatchSteps: EGG_HATCH_STEPS,
    steppedAt: now,
    // A nest egg was never thrown at; the ball it is recorded under
    // is the one named for where it came from
    ball: Balls.NestBall,
    caughtAt: foundAt,
    locale: asLocale(locale),
    effortValues: zeroEffortValues(),
    origin: {
      timestamp: snapshot.nestTimestamp,
      x: snapshot.chunk.x,
      y: snapshot.chunk.y,
      biome: snapshot.chunk.biome,
    },
  });

  return ref.id;
}

/**
 * Credit steps walked with the buddy. Only the buddy walks, and only
 * an egg has anywhere to walk to, so a player with no buddy — or one
 * whose buddy has already hatched — reports into nothing.
 *
 * The report is measured against the stamp the last one left: a
 * client that saves steps up, or invents them, is credited whatever
 * the elapsed time could really have been walked in and no more.
 *
 * Resolves how far along the egg now is, or null when nothing was
 * being carried
 */
export async function recordSteps(
  uid: string,
  reported: number,
  now: number,
): Promise<EggWalk | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const buddy = docData(await transaction.get(db.collection(BUDDY_COLLECTION).doc(uid)));
    const catchId = buddy?.caught;

    if (typeof catchId !== 'string' || catchId === '') {
      return null;
    }

    const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const stored = docData(await transaction.get(ref));

    if (stored == null || stored.owner !== uid || stored.egg !== true) {
      return null;
    }

    const caught = asCaughtPokemon(stored);
    const credited = creditableSteps(reported, now - caught.steppedAt, stepsRemaining(caught));
    const steps = caught.steps + credited;

    // The stamp moves whether or not anything was credited: it is
    // what the next report is measured from, and a refused report
    // should not leave time banked for the one after it
    transaction.update(ref, { steps, steppedAt: now });
    return { caught: catchId, steps, hatchSteps: caught.hatchSteps };
  });
}

/**
 * Open an egg that has been carried far enough. What comes out was
 * decided when the egg was found, so this only takes the flag off —
 * and pays the family's candy, the way meeting the pokemon any other
 * way would have.
 *
 * Resolves the species that hatched, or null when the egg is not the
 * player's, is not an egg, or has not been walked far enough
 */
export async function hatchEgg(
  uid: string,
  catchId: string,
  now: number,
  offset: number,
): Promise<Species | null> {
  const db = getAdminFirestore();
  const species = await db.runTransaction(async (transaction) => {
    const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const stored = docData(await transaction.get(ref));

    if (stored == null || stored.owner !== uid || stored.egg !== true || isCatchLocked(stored)) {
      return null;
    }

    const caught = asCaughtPokemon(stored);

    if (caught.steps < caught.hatchSteps) {
      return null;
    }

    transaction.update(ref, { egg: false, steps: caught.hatchSteps });
    return caught.species;
  });

  if (species == null) {
    return null;
  }
  await grantCatchCandy(uid, species, toLocalTime(now, asOffset(offset)));
  return species;
}
