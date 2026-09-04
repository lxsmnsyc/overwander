import 'server-only';
import { Acquisition, asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import {
  EGG_LEVEL,
  MAX_STEP_REPORT,
  creditableSteps,
  creditedEggSteps,
  getEggHatchSteps,
  stepsRemaining,
} from '../auth/egg';
import { getMaxHealth } from '../auth/health';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
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
  inheritAbility,
  inheritBall,
  inheritIVs,
  inheritMoves,
  inheritNature,
  inheritsShadow,
  rollEggSpecies,
} from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { Spawn } from '../overworld/chunk-snapshot';
import { Metric } from '../auth/quest-record';
import deriveEncounter, { EncounterType, deriveEggMoves } from '../overworld/encounter';
import { grantCatchCandy } from './candy';
import { bumpProgress } from './quest-progress';
import { newDocId, tx } from './db';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { ITEM_STACKS } from '../auth/stacks';
import { readStacksIn, writeStackIn } from './stacks';
import { asLocale, isEggRecord, zeroEffortValues } from './catch-fields';
import {
  BASE_FRIENDSHIP,
  FRIENDSHIP_STEP_INTERVAL,
  HATCHED_FRIENDSHIP,
  SHADOW_FRIENDSHIP,
  friendshipFactor,
  gainFriendship,
} from '../data/constants/friendship';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { isCatchLocked } from './locks';
import { recordFoundSpecies } from './pokedex';

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
   * The ball the egg is recorded under: a nest's own, or the mother's
   * when the egg was bred
   */
  ball: Balls;
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
  const id = newDocId();
  const zone = asOffset(offset);
  const foundAt = toLocalISO(now, zone);
  // Whatever was walking beside the player when they picked it up has
  // its say on how far it has to be carried — a Flame Body buddy warms
  // it. It is asked here, once, because from now on the egg is what
  // walks beside them
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const hatchSteps = overworld.checkEggSteps(
    `${snapshot.key}${fields.timestamp}egg`,
    fields.hatchSteps,
  );

  await tx(async (transaction) => {
    await transaction`
      insert into caught (
        id, owner, type, species, nickname, level, individual_value, trait_value,
        ivs, gender, nature, shiny, shadow, egg, favorite, guarded, traded,
        auctionable, slots, locked_at, steps, hatch_steps, stepped_at, health,
        statuses, lair, ball, caught_at_local, caught_at_offset, locale,
        effort_bonus, walked, friendship,
        origin_timestamp, origin_x, origin_y, origin_biome, origin_place
      ) values (
        ${id}, ${uid}, ${EncounterType.Hatched}, ${fields.species}, '',
        ${EGG_LEVEL}, ${fields.individualValue}, ${fields.traitValue},
        ${fields.ivs}, ${fields.gender}, ${fields.nature},
        ${fields.shiny}, ${fields.shadow}, true, false, false, false,
        ${isAuctionableCatch({
          ivs: fields.ivs,
          shiny: fields.shiny,
          species: fields.species,
        })},
        ${packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS)},
        0, 0, ${hatchSteps}, ${now},
        ${getMaxHealth({
          species: fields.species,
          level: EGG_LEVEL,
          ivs: fields.ivs,
          effortValues: zeroEffortValues(),
        })},
        0, null, ${fields.ball},
        ${new Date(toLocalTime(now, zone))}, ${zone}, ${asLocale(locale)},
        0, 0, ${fields.shadow ? SHADOW_FRIENDSHIP : BASE_FRIENDSHIP},
        ${fields.timestamp}, ${snapshot.chunk.x}, ${snapshot.chunk.y},
        ${snapshot.chunk.biome}, null
      )
    `;

    await updateCaughtIn(transaction, id, {
      moves: fields.moves,
      movePoints: {},
      // A shadow keeps its Shadow ability for good, the way a shadow
      // raid's prize does
      abilities: fields.shadow ? [fields.ability, Abilities.Shadow] : [fields.ability],
      items: [],
      // It was never anybody else's: this owner is where the pokemon
      // begins, egg and all
      history: [{ owner: uid, acquiredAt: foundAt, kind: Acquisition.Egg, ball: fields.ball }],
    });
  });

  return id;
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
  const rng = new AleaRNG(`${snapshot.groundKey}${snapshot.nestTimestamp}nest${cell}egg:${uid}`);
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
      hatchSteps: getEggHatchSteps(species),
      // Nothing laid it: the ball is the one named for where eggs
      // come from
      ball: Balls.NestBall,
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
 * and passed in; what it rolls for itself — whether it sparkles, and
 * an ability its mother did not pass — comes from the same trait value
 * any hatchling would have.
 *
 * `line` is the mother's line rather than the egg's own species: a
 * Nidoran is one of two, and which one is the first thing the stream
 * decides.
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
  line: Species,
  parents: [BreedingParent, BreedingParent],
  now: number,
  offset: number,
  locale: string,
): Promise<string> {
  const rng = new AleaRNG(seed);
  // The draws land in order: which half of the line it is, the
  // individual value it would have rolled, its trait value, the
  // inheritance, the shadow, the nature, then the ability. Anything
  // new goes on the end, so adding it moves nothing already decided
  const species = rollEggSpecies(line, () => rng.random());
  const spawn: Spawn = [species, rng.int32(), rng.int32()];
  const hatchling = deriveEncounter(snapshot, spawn, uid, {
    type: EncounterType.Hatched,
    level: EGG_LEVEL,
  });
  const ivs = inheritIVs(parents[0], parents[1], () => rng.random());
  const shadow = inheritsShadow(parents[0], parents[1], () => rng.random());
  const nature = inheritNature(parents[0], parents[1], () => rng.random());
  const ability = inheritAbility(species, parents[0], parents[1], () => rng.random());

  return writeEgg(
    uid,
    snapshot,
    {
      species,
      // Three of the six come off the parents, or five under a Destiny
      // Knot; the rest are the egg's own
      ivs,
      gender: hatchling.gender,
      // Its own, unless a parent was holding an Everstone
      nature: nature ?? hatchling.nature,
      // It sparkles if it was going to, and carries the shadow if it
      // inherited one
      shiny: hatchling.shiny,
      shadow,
      moves: inheritMoves(species, parents[0], parents[1], EGG_LEVEL),
      // Its mother's, most of the time; its own when she did not pass
      // it on
      ability: ability ?? hatchling.ability,
      individualValue: hatchling.individualValue,
      traitValue: hatchling.traitValue,
      // Something that should not be in there takes twice as long to
      // come out
      hatchSteps: getEggHatchSteps(species) * (shadow ? SHADOW_HATCH_FACTOR : 1),
      ball: inheritBall(parents[0], parents[1]),
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
  return tx(async (transaction) => {
    const profiles = await transaction`select buddy_id from profiles where id = ${uid}`;
    const catchId: unknown = profiles.at(0)?.buddy_id;

    if (typeof catchId !== 'string' || catchId === '') {
      return null;
    }

    const stored = await readCaughtIn(transaction, catchId);

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
      const held = await readStacksIn(transaction, ITEM_STACKS, uid, [...found.keys()]);
      const stacks: [Items, number][] = [...found.keys()].map((item) => [
        item,
        held.get(item) ?? 0,
      ]);

      await updateCaughtIn(transaction, catchId, {
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
        await writeStackIn(transaction, ITEM_STACKS, uid, item, carried + (found.get(item) ?? 0));
      }
      await bumpProgress(uid, [[Metric.Steps, 0, credited]]);
      return { egg: null, picked: [...found].map(([item, amount]) => ({ item, amount })) };
    }

    const remaining = stepsRemaining(caught);
    const paced = creditableSteps(reported, now - caught.steppedAt, remaining);
    // An egg of the day's own family walks further on the same paces.
    // The credit is clamped again afterwards, since the pacing was
    // measured against what is left rather than what it is worth
    const steps = caught.steps + Math.min(remaining, creditedEggSteps(caught.species, paced, now));

    // The stamp moves whether or not anything was credited: it is
    // what the next report is measured from, and a refused report
    // should not leave time banked for the one after it
    await updateCaughtIn(transaction, catchId, { steps, steppedAt: now });
    await bumpProgress(uid, [[Metric.Steps, 0, paced]]);
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
  const hatched = await tx(async (transaction) => {
    const stored = await readCaughtIn(transaction, catchId);

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
    await updateCaughtIn(transaction, catchId, {
      egg: false,
      steps: caught.hatchSteps,
      // Everything that hatches has already been carried every step
      // of the way, and thinks of whoever carried it accordingly — a
      // shadow excepted, which the carrying does nothing for
      friendship: caught.shadow ? SHADOW_FRIENDSHIP : HATCHED_FRIENDSHIP,
      // The walking starts over: what it did in the shell bought the
      // hatching, and what it does now buys friendship
      walked: 0,
    });
    return { species: caught.species, shiny: caught.shiny };
  });

  if (hatched == null) {
    return null;
  }
  await grantCatchCandy(uid, hatched.species, toLocalTime(now, asOffset(offset)));
  // The dex is told here rather than where the egg was picked up:
  // what is inside a shell is not something the player has met, and an
  // egg that never hatches is a species they never saw. Both tallies
  // are written, since the hatching is the meeting
  await recordFoundSpecies(uid, hatched.species, hatched.shiny);
  await bumpProgress(uid, [[Metric.Hatches, hatched.species, 1]]);
  return hatched.species;
}
