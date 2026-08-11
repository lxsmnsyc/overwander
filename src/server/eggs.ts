import 'server-only';
import { Acquisition, asCaughtPokemon } from '../auth/caught-record';
import { CAUGHT_COLLECTION, PROFILE_COLLECTION } from '../auth/collections';
import {
  EGG_HATCH_STEPS,
  EGG_LEVEL,
  MAX_STEP_REPORT,
  creditableSteps,
  stepsRemaining,
} from '../auth/egg';
import { getMaxHealth } from '../auth/health';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  SHADOW_ABILITY_SLOTS,
  packSlots,
} from '../data/constants/slots';
import { asOffset, toLocalISO, toLocalTime } from '../auth/local-time';
import AleaRNG from '../core/alea';
import Abilities from '../data/ids/abilities';
import { Balls, type Items } from '../data/ids/items';
import { ITEM_POOL, type ItemStack, PICKUP_BAND_ODDS, pickItem } from '../data/overworld/item-pool';
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
import { ITEM_STACKS } from '../auth/stacks';
import { readStackIn, writeStackIn } from './stacks';
import { asLocale, isEggRecord, zeroEffortValues } from './catch-fields';
import {
  BASE_FRIENDSHIP,
  FRIENDSHIP_STEP_INTERVAL,
  HATCHED_FRIENDSHIP,
  friendshipFactor,
  gainFriendship,
} from '../data/constants/friendship';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
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
 * Everything one report of walking was worth: how far along the egg
 * is, and whatever the buddy scuffed up off the path while it walked.
 * The two travel together because they come out of the same steps
 */
export interface WalkReport {
  /**
   * The egg being carried, or null when the buddy is a pokemon rather
   * than an egg — that walk buys friendship instead
   */
  egg: EggWalk | null;
  /**
   * What Pickup found, ready to be shown. Empty for every buddy that
   * does not have it, which is nearly all of them
   */
  picked: ItemStack[];
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
   * What is true of the pokemon inside: whether it sparkles, and
   * whether it carries a shadow. One that does hatches with the
   * Shadow ability for good, and takes twice as long to open
   */
  shiny: boolean;
  shadow: boolean;
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
  // Whatever was walking beside the player when they picked it up has
  // its say on how far it has to be carried — a Flame Body buddy warms
  // it. It is asked here, once, because from now on the egg is what
  // walks beside them
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const hatchSteps = overworld.checkEggSteps(
    `${snapshot.key}${fields.timestamp}egg`,
    fields.hatchSteps,
  );

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
    abilities: fields.shadow ? [fields.ability, Abilities.Shadow] : [fields.ability],
    // The room it will have when it comes out of the shell. A shadow
    // egg hatches carrying two abilities, so it is written with two
    slots: packSlots(
      fields.shadow ? SHADOW_ABILITY_SLOTS : DEFAULT_ABILITY_SLOTS,
      DEFAULT_ITEM_SLOTS,
      DEFAULT_MOVE_SLOTS,
    ),
    // An egg holds nothing, and cannot be handed anything until it
    // has hatched
    items: [],
    // It was never anybody else's: this owner is where the pokemon
    // begins, egg and all
    history: [{ owner: uid, acquiredAt: foundAt, kind: Acquisition.Egg }],
    // An egg on top of whatever the pokemon inside is, and never
    // locked: an egg cannot be fielded
    shiny: fields.shiny,
    shadow: fields.shadow,
    egg: true,
    favorite: false,
    guarded: false,
    ...freeFields(),
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
    // move the finish line on an egg already being carried — nor can
    // picking up a Ponyta afterwards
    hatchSteps,
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
      shiny: hatchling.shiny,
      shadow: false,
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
      shiny: hatchling.shiny,
      shadow,
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
 * What a Pickup buddy actually found, rolled from the walk it found
 * them on. Which item is luck; how many were found is not, and that
 * part was already decided by the ability
 */
function pickedUp(uid: string, walked: number, finds: number): Map<Items, number> {
  const rng = new AleaRNG(`${uid}pickup${walked}`);
  const found = new Map<Items, number>();

  for (let at = 0; at < finds; at++) {
    const item = pickItem(ITEM_POOL, () => rng.random(), PICKUP_BAND_ODDS);

    if (item != null) {
      found.set(item, (found.get(item) ?? 0) + 1);
    }
  }
  return found;
}

/**
 * Credit steps walked with the buddy. Only the buddy walks, and only
 * an egg has anywhere to walk to, so a player whose buddy has already
 * hatched walks for friendship instead — and, with the right buddy,
 * for whatever is lying on the path.
 *
 * The report is measured against the stamp the last one left: a
 * client that saves steps up, or invents them, is credited whatever
 * the elapsed time could really have been walked in and no more.
 *
 * Resolves what the walk came to, or null when nothing was being
 * walked with at all
 */
export async function recordSteps(
  uid: string,
  reported: number,
  now: number,
): Promise<WalkReport | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const profile = docData(await transaction.get(db.collection(PROFILE_COLLECTION).doc(uid)));
    const catchId = profile?.buddy;

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
      // The same walk, asked of whatever is doing it: a Pickup buddy
      // turns something up every so many paces, and everything else
      // answers nothing
      const overworld = createOverworld(uid, {
        species: caught.species,
        abilities: caught.abilities,
        items: caught.items,
        nature: caught.nature,
        gender: caught.gender,
      });
      const found = pickedUp(
        uid,
        walked,
        overworld.checkWalkPickup(catchId, caught.walked, walked),
      );
      // Every stack is read before anything is written, the way a
      // transaction requires
      const stacks = await Promise.all(
        [...found.keys()].map(
          async (item) => [item, await readStackIn(transaction, ITEM_STACKS, uid, item)] as const,
        ),
      );

      transaction.update(ref, {
        walked,
        steppedAt: now,
        // A Luxury Ball's comfort is what the pokemon remembers the
        // walk by, so it warms to the player twice as fast
        ...(earned > 0
          ? {
              friendship: gainFriendship(
                caught.friendship,
                'walk',
                earned,
                friendshipFactor(caught.ball),
              ),
            }
          : {}),
      });

      for (const [item, carried] of stacks) {
        writeStackIn(transaction, ITEM_STACKS, uid, item, carried + (found.get(item) ?? 0));
      }
      return { egg: null, picked: [...found].map(([item, amount]) => ({ item, amount })) };
    }

    const credited = creditableSteps(reported, now - caught.steppedAt, stepsRemaining(caught));
    const steps = caught.steps + credited;

    // The stamp moves whether or not anything was credited: it is
    // what the next report is measured from, and a refused report
    // should not leave time banked for the one after it
    transaction.update(ref, { steps, steppedAt: now });
    // An egg finds nothing: whatever is inside it is not out here
    // looking at the ground
    return { egg: { caught: catchId, steps, hatchSteps: caught.hatchSteps }, picked: [] };
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

    // Only the shell comes off: whatever else is true of it — that it
    // sparkles, that it is a shadow — is a field of its own and comes
    // through the hatching untouched
    transaction.update(ref, {
      egg: false,
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
