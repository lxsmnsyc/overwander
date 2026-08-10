import 'server-only';
import { HELD_ITEM_LIMIT } from '../auth/caught-record';
import {
  BUDDY_COLLECTION,
  CAUGHT_COLLECTION,
  ENCOUNTER_COLLECTION,
  INVENTORY_COLLECTION,
  inventoryEntryId,
} from '../auth/collections';
import { asEncounterRecord } from '../auth/encounter-record';
import Abilities from '../data/ids/abilities';
import type { Balls, Items } from '../data/ids/items';
import { ItemFlags } from '../data/ids/items';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { grantCandy, grantCatchCandy } from './candy';
import { asLocale, isEggRecord, zeroEffortValues } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { asOffset, toLocalISO, toLocalTime } from '../auth/local-time';
import { freeFields, isCatchLocked } from './locks';
import { asNumber, asNumberArray, docData } from './read';

/**
 * Catch records, written with admin credentials. A catch is the most
 * forgeable thing in the game — a client that could write one would
 * write itself a shiny level-100 legendary — so the record is built
 * here from the encounter the overworld actually staged, never from
 * what the caller describes
 */

/**
 * What a catch is holding, restored from the stored document
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asHeldItems = (value: unknown): Items[] => asNumberArray(value) as Items[];

/**
 * Whether the player owns any pokemon at all. A raid asks this of
 * everyone who walks in, and the answer is a yes or no, so it reads a
 * single document
 */
export async function hasAnyCaught(uid: string): Promise<boolean> {
  const owned = await getAdminFirestore()
    .collection(CAUGHT_COLLECTION)
    .where('owner', '==', uid)
    .limit(1)
    .get();

  return !owned.empty;
}

/**
 * Record the catch of an encounter the player is already in. The
 * encounter is read from `encounters/{spawnId}:{uid}` — the document
 * the server itself wrote when the meeting started — so the species,
 * level, IVs and shininess are the ones that were staged, whatever
 * the client believes.
 *
 * Every catch pays its family's candy, fourfold on the family's own
 * day, in the same call: the reward cannot be skipped or claimed
 * twice by a client that stops asking.
 *
 * Resolves the new catch id, or null when the player is not in that
 * encounter
 */
export async function recordCatch(
  uid: string,
  spawnId: string,
  ball: Balls,
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const db = getAdminFirestore();
  const stored = docData(await db.collection(ENCOUNTER_COLLECTION).doc(`${spawnId}:${uid}`).get());

  if (stored == null) {
    return null;
  }

  const encounter = asEncounterRecord(stored);
  const ref = db.collection(CAUGHT_COLLECTION).doc();
  // The instant is the server's, the calendar the catcher's: the
  // stamp is written in their zone, and the species day is the day it
  // was where they were standing
  const zone = asOffset(offset);
  const caughtAt = toLocalISO(now, zone);

  await ref.set({
    owner: uid,
    type: encounter.type,
    species: encounter.species,
    level: encounter.level,
    individualValue: encounter.individualValue,
    traitValue: encounter.traitValue,
    ivs: encounter.ivs,
    gender: encounter.gender,
    nature: encounter.nature,
    shiny: encounter.shiny,
    shadow: encounter.shadow,
    moves: encounter.moves,
    // A shadow raid's reward keeps its Shadow ability for good, on
    // top of the one it rolled
    abilities: encounter.shadow ? [encounter.ability, Abilities.Shadow] : [encounter.ability],
    items: [],
    history: [{ owner: uid, acquiredAt: caughtAt }],
    // A fresh catch has fought nothing
    ...freeFields(),
    // Something met in the world arrives already out of its shell,
    // so it has nowhere to be walked to
    egg: false,
    steps: 0,
    hatchSteps: 0,
    steppedAt: 0,
    ball,
    caughtAt,
    locale: asLocale(locale),
    effortValues: zeroEffortValues(),
    origin: {
      timestamp: encounter.timestamp,
      x: encounter.x,
      y: encounter.y,
      biome: encounter.biome,
    },
  });
  await grantCatchCandy(uid, encounter.species, toLocalTime(now, zone));

  // And then whatever the player was carrying when they caught it.
  // These are paid flat: the species day is already worth four times
  // the catch's own candy, and a bonus that multiplied with it would
  // make one day worth a week of them
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const family = getSpeciesData(encounter.species).family;

  for (const [owed, count] of overworld.checkCatchCandy(spawnId, family)) {
    await grantCandy(uid, owed, count);
  }

  return ref.id;
}

/**
 * Hand an item from the bag to one of the player's catches. The stack
 * and the catch move in one transaction, so an item is never in both
 * places or neither. Resolves false when the catch is not theirs, the
 * item is not carried, the catch already holds its limit, or the item
 * is not holdable
 */
export async function giveItem(uid: string, catchId: string, item: Items): Promise<boolean> {
  if ((getItemData(item).flags & ItemFlags.Holdable) === 0) {
    return false;
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    // An egg has no hands: nothing is handed to one until it hatches
    if (caught == null || caught.owner !== uid || isCatchLocked(caught) || isEggRecord(caught)) {
      return false;
    }

    const held = asHeldItems(caught.items);

    if (held.length >= HELD_ITEM_LIMIT) {
      return false;
    }

    const stackRef = db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, item));
    const amount = asNumber(docData(await transaction.get(stackRef))?.amount);

    if (amount < 1) {
      return false;
    }

    transaction.set(stackRef, { user: uid, item, amount: amount - 1 });
    transaction.update(caughtRef, { items: [...held, item] });
    return true;
  });
}

/**
 * Take a held item back into the bag. Resolves false when the catch
 * is not the player's or is not holding that item
 */
export async function takeItem(uid: string, catchId: string, item: Items): Promise<boolean> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
      return false;
    }

    const held = asHeldItems(caught.items);
    const index = held.indexOf(item);

    if (index < 0) {
      return false;
    }

    const stackRef = db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, item));
    const amount = asNumber(docData(await transaction.get(stackRef))?.amount);

    // Only the one copy comes off, so a future stack of duplicates
    // still gives back exactly what it took
    transaction.update(caughtRef, { items: held.filter((_, at) => at !== index) });
    transaction.set(stackRef, { user: uid, item, amount: amount + 1 });
    return true;
  });
}

/**
 * Let a pokemon go. The record is deleted outright rather than
 * flagged: a released pokemon is gone, and nothing in the game reads
 * a catch it no longer owns.
 *
 * Three things go with it, in the same transaction, so the record
 * cannot vanish while something still points at it. Whatever it was
 * holding goes back to the bag — the item was the player's, not the
 * pokemon's. A buddy record naming it is cleared, so the player is
 * not walking with a document that is gone. And a pokemon in a live
 * battle is refused outright: the fight is running on a snapshot of a
 * record that has to still be there when it ends.
 *
 * Resolves false when the catch is not the player's or is fighting
 */
export async function releaseCatch(uid: string, catchId: string): Promise<boolean> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const buddyRef = db.collection(BUDDY_COLLECTION).doc(uid);
    const [caughtDoc, buddyDoc] = await transaction.getAll(caughtRef, buddyRef);
    const caught = docData(caughtDoc);

    if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
      return false;
    }

    // One copy back per copy held, counted before anything is read:
    // two of the same item share a stack, and reading that stack
    // twice would give back only one of them
    const returning = new Map<Items, number>();

    for (const item of asHeldItems(caught.items)) {
      returning.set(item, (returning.get(item) ?? 0) + 1);
    }

    const stacks = await Promise.all(
      [...returning.keys()].map(async (item) => {
        const ref = db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, item));

        return [item, ref, asNumber(docData(await transaction.get(ref))?.amount)] as const;
      }),
    );

    for (const [item, ref, amount] of stacks) {
      transaction.set(ref, { user: uid, item, amount: amount + (returning.get(item) ?? 0) });
    }

    if (docData(buddyDoc)?.caught === catchId) {
      transaction.delete(buddyRef);
    }
    transaction.delete(caughtRef);
    return true;
  });
}
