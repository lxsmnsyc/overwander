import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { BUDDY_COLLECTION, CAUGHT_COLLECTION } from '../auth/collections';
import {
  EGG_HATCH_STEPS,
  EGG_LEVEL,
  MAX_STEP_REPORT,
  creditableSteps,
  stepsRemaining,
} from '../auth/egg';
import { getMaxHealth } from '../auth/health';
import { PokemonFlags, hasFlag, withFlag } from '../data/constants/flags';
import { asOffset, toLocalISO, toLocalTime } from '../auth/local-time';
import AleaRNG from '../core/alea';
import Abilities from '../data/ids/abilities';
import { Balls } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import {
  type BreedingParent,
  SHADOW_HATCH_FACTOR,
  inheritIVs,
  inheritMoves,
  inheritsShadow,
} from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { Spawn } from '../overworld/chunk-snapshot';
import deriveEncounter, { EncounterType, deriveEggMoves } from '../overworld/encounter';
import { grantCatchCandy } from './candy';
import { getAdminFirestore } from './firebase';
import { asLocale, isEggRecord, zeroEffortValues } from './catch-fields';
import {
  BASE_FRIENDSHIP,
  FRIENDSHIP_STEP_INTERVAL,
  HATCHED_FRIENDSHIP,
  gainFriendship,
} from '../data/constants/friendship';
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
 * What one egg is, beyond the parts every egg shares
 */
interface EggFields {
  species: Species;
  /**
   * The packed individual values the hatchling will have
   */
  ivs: number;
  gender: Genders;
  nature: Natures;
  /**
   * What is true of the pokemon inside, as `PokemonFlags` bits: it
   * sparkles, or it carries a shadow. One that does hatches with the
   * Shadow ability for good, and takes twice as long to open
   */
  flags: number;
  moves: Moves[];
  ability: Abilities;
  individualValue: number;
  traitValue: number;
  hatchSteps: number;
  /**
   * The window the egg belongs to, recorded as its origin
   */
  timestamp: number;
}

/**
 * Write an egg into the player's collection. Everything about the
 * pokemon inside is settled by the caller — a nest rolls it, a
 * breeder inherits it — and everything an egg has in common with
 * every other egg is here
 */
async function writeEgg(
  uid: string,
  snapshot: ChunkSnapshot,
  fields: EggFields,
  now: number,
  offset: number,
  locale: string,
): Promise<string> {
  const db = getAdminFirestore();
  const ref = db.collection(CAUGHT_COLLECTION).doc();
  const foundAt = toLocalISO(now, asOffset(offset));

  await ref.set({
    owner: uid,
    type: EncounterType.Hatched,
    species: fields.species,
    level: EGG_LEVEL,
    individualValue: fields.individualValue,
    traitValue: fields.traitValue,
    ivs: fields.ivs,
    gender: fields.gender,
    nature: fields.nature,
    moves: fields.moves,
    // A shadow keeps its Shadow ability for good, the way a shadow
    // raid's prize does
    abilities: hasFlag(fields.flags, PokemonFlags.Shadow)
      ? [fields.ability, Abilities.Shadow]
      : [fields.ability],
    // An egg holds nothing, and cannot be handed anything until it
    // has hatched
    items: [],
    history: [{ owner: uid, acquiredAt: foundAt }],
    // An egg on top of whatever the pokemon inside is, and never
    // locked: an egg cannot be fielded
    ...freeFields(fields.flags | PokemonFlags.Egg),
    // Whole and clean: nothing has fought with it, and an egg cannot
    // be fought with. The figure is what the hatchling will have,
    // since an egg is already the pokemon inside it
    health: getMaxHealth({
      species: fields.species,
      level: EGG_LEVEL,
      ivs: fields.ivs,
      effortValues: zeroEffortValues(),
    }),
    statuses: 0,
    // Nothing hatched was fought for in a lair
    lair: null,
    steps: 0,
    // Frozen here, so a later change to what hatching costs cannot
    // move the finish line on an egg already being carried
    hatchSteps: fields.hatchSteps,
    steppedAt: now,
    // An egg was never thrown at; the ball it is recorded under is
    // the one named for where eggs come from
    ball: Balls.NestBall,
    caughtAt: foundAt,
    locale: asLocale(locale),
    effortValues: zeroEffortValues(),
    effortBonus: 0,
    friendship: BASE_FRIENDSHIP,
    origin: {
      timestamp: fields.timestamp,
      x: snapshot.chunk.x,
      y: snapshot.chunk.y,
      biome: snapshot.chunk.biome,
    },
  });

  return ref.id;
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
  // The draws land in order: the individual value, the trait value,
  // then the move the hatchling inherits
  const rng = new AleaRNG(`${snapshot.key}${snapshot.nestTimestamp}nest${cell}egg:${uid}`);
  const spawn: Spawn = [species, rng.int32(), rng.int32()];
  const hatchling = deriveEncounter(snapshot, spawn, uid, {
    type: EncounterType.Hatched,
    level: EGG_LEVEL,
  });

  return writeEgg(
    uid,
    snapshot,
    {
      species,
      ivs: hatchling.ivs,
      gender: hatchling.gender,
      nature: hatchling.nature,
      // It sparkles if it was going to; nothing shadowed comes out of
      // a nest
      flags: withFlag(hatchling.flags, PokemonFlags.Shadow, false),
      // A nest guarantees the inherited move; the rest is what the
      // species knows at the level it hatches
      moves: deriveEggMoves(species, EGG_LEVEL, () => rng.random()),
      ability: hatchling.ability,
      individualValue: hatchling.individualValue,
      traitValue: hatchling.traitValue,
      hatchSteps: EGG_HATCH_STEPS,
      timestamp: snapshot.nestTimestamp,
    },
    now,
    offset,
    locale,
  );
}

/**
 * Lay the egg a breeder made of two pokemon. What it inherits is
 * decided in [`src/overworld/breeding.ts`](../overworld/breeding.ts)
 * and passed in; what it rolls for itself — its nature, its ability,
 * whether it sparkles — comes from the same trait value any hatchling
 * would have.
 *
 * The stream is seeded by the pair and the window, so the egg is this
 * visit's egg rather than one a player can re-roll by asking again.
 *
 * Resolves the new catch id
 */
export async function grantBredEgg(
  uid: string,
  snapshot: ChunkSnapshot,
  seed: string,
  species: Species,
  parents: [BreedingParent, BreedingParent],
  now: number,
  offset: number,
  locale: string,
): Promise<string> {
  const rng = new AleaRNG(seed);
  // The draws land in order: the individual value the egg would have
  // rolled, its trait value, the inheritance, then the shadow
  const spawn: Spawn = [species, rng.int32(), rng.int32()];
  const hatchling = deriveEncounter(snapshot, spawn, uid, {
    type: EncounterType.Hatched,
    level: EGG_LEVEL,
  });
  const ivs = inheritIVs(parents[0], parents[1], () => rng.random());
  const shadow = inheritsShadow(parents[0], parents[1], () => rng.random());

  return writeEgg(
    uid,
    snapshot,
    {
      species,
      // Three of the six come off the parents; the rest are the
      // egg's own
      ivs,
      gender: hatchling.gender,
      nature: hatchling.nature,
      // It sparkles if it was going to, and carries the shadow if it
      // inherited one
      flags: withFlag(hatchling.flags, PokemonFlags.Shadow, shadow),
      moves: inheritMoves(species, parents[0], parents[1], EGG_LEVEL),
      ability: hatchling.ability,
      individualValue: hatchling.individualValue,
      traitValue: hatchling.traitValue,
      // Something that should not be in there takes twice as long to
      // come out
      hatchSteps: shadow ? EGG_HATCH_STEPS * SHADOW_HATCH_FACTOR : EGG_HATCH_STEPS,
      timestamp: snapshot.npcTimestamp,
    },
    now,
    offset,
    locale,
  );
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

    if (stored == null || stored.owner !== uid) {
      return null;
    }

    const caught = asCaughtPokemon(stored);

    /**
     * A hatched buddy has nowhere to walk to, but it is still walking
     * with somebody: the same steps that would have opened an egg buy
     * a point of friendship every `FRIENDSHIP_STEP_INTERVAL`. What is
     * walked past a point is kept, so a player who reports in small
     * handfuls is not quietly robbed of the remainder
     */
    if (!isEggRecord(stored)) {
      const credited = creditableSteps(reported, now - caught.steppedAt, MAX_STEP_REPORT);
      const walked = caught.walked + credited;
      const earned =
        Math.floor(walked / FRIENDSHIP_STEP_INTERVAL) -
        Math.floor(caught.walked / FRIENDSHIP_STEP_INTERVAL);

      transaction.update(ref, {
        walked,
        steppedAt: now,
        ...(earned > 0 ? { friendship: gainFriendship(caught.friendship, 'walk', earned) } : {}),
      });
      return null;
    }

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

    if (stored == null || stored.owner !== uid || !isEggRecord(stored) || isCatchLocked(stored)) {
      return null;
    }

    const caught = asCaughtPokemon(stored);

    if (caught.steps < caught.hatchSteps) {
      return null;
    }

    // The shell comes off the flags rather than a field of its own, so
    // whatever else is true of it — that it sparkles, that it is a
    // shadow — comes through the hatching untouched
    transaction.update(ref, {
      flags: withFlag(caught.flags, PokemonFlags.Egg, false),
      steps: caught.hatchSteps,
      // Everything that hatches has already been carried every step
      // of the way, and thinks of whoever carried it accordingly
      friendship: HATCHED_FRIENDSHIP,
      // The walking starts over: what it did in the shell bought the
      // hatching, and what it does now buys friendship
      walked: 0,
    });
    return caught.species;
  });

  if (species == null) {
    return null;
  }
  await grantCatchCandy(uid, species, toLocalTime(now, asOffset(offset)));
  return species;
}
