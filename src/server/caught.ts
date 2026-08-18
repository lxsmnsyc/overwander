import 'server-only';
import {
  Acquisition,
  asCaughtPokemon,
  asNickname,
  isAuctionableCatch,
} from '../auth/caught-record';
import { CAUGHT_COLLECTION, ENCOUNTER_COLLECTION, PROFILE_COLLECTION } from '../auth/collections';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import { getMaxHealth, needsCare } from '../auth/health';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  Slots,
  getSlots,
  packSlots,
} from '../data/constants/slots';
import Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import { Balls, ItemFlags } from '../data/ids/items';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';
import createOverworld from '../overworld/setup';
import resolveBuddy, { resolveBuddyCatch } from './buddy';
import { grantCandy, grantCatchCandy } from './candy';
import { getCatchCandy } from '../auth/candy-rules';
import {
  asLocale,
  isEggRecord,
  isFavoriteRecord,
  isGuardedRecord,
  zeroEffortValues,
} from './catch-fields';
import { BASE_FRIENDSHIP, SHADOW_FRIENDSHIP } from '../data/constants/friendship';
import { getAdminFirestore } from './firebase';
import { recordCaughtSpecies } from './pokedex';
import { CANDY_STACKS, ITEM_STACKS } from '../auth/stacks';
import { readStackIn, spendStackIn, writeStackIn } from './stacks';
import { asOffset, toLocalISO, toLocalTime } from '../auth/local-time';
import { freeFields, isCatchLocked } from './locks';
import { asNumber, asNumberArray, docData } from './read';
import { retireSpawn } from './overworld';

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
 * Whether the player has a pokemon to spare — that is, more than the
 * one.
 *
 * Nothing may take somebody's last one. Releasing it or selling it
 * leaves a player who cannot join a raid, cannot answer a grunt and
 * cannot throw a ball at anything, which is not a decision so much as
 * a way of ending the game by accident. The game gives a pokemon to
 * anyone who has none, so an emptied collection would also be handed
 * a new starter — releasing the last one to reroll it is not a loop
 * worth having.
 *
 * Two documents at most, since the question is "more than one" rather
 * than "how many"
 */
export async function hasSpareCatch(uid: string): Promise<boolean> {
  const owned = await getAdminFirestore()
    .collection(CAUGHT_COLLECTION)
    .where('owner', '==', uid)
    .limit(2)
    .get();

  return owned.size > 1;
}

/**
 * Write one pokemon into a player's collection.
 *
 * Every way a pokemon arrives ends here — thrown at and caught, or
 * handed over as a gift — because everything below the first three
 * lines is the same either way: what it rolled, what room it has,
 * what it is worth to somebody else, and the fact that it arrives
 * whole. What differs is the ball it is in and what the history says
 * it was, so those are asked for.
 *
 * `from` is the trainer it belonged to before this one, for a
 * distribution written as somebody else's pokemon — "owned by Red".
 * It is a name rather than an account: there is no such player, and
 * the entry is there so the sheet can say where the pokemon came from
 */
export async function writeCaughtRecord(
  uid: string,
  encounter: EncounterRecord,
  ball: Balls,
  kind: Acquisition,
  now: number,
  offset: number,
  locale: string,
  from = '',
): Promise<string> {
  const ref = getAdminFirestore().collection(CAUGHT_COLLECTION).doc();
  const room =
    encounter.slots ?? packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS);
  // The instant is the server's, the calendar the owner's: the stamp
  // is written in their zone, and the species day is the day it was
  // where they were standing
  const zone = asOffset(offset);
  const caughtAt = toLocalISO(now, zone);
  const shadow = encounter.shadow;

  await ref.set({
    owner: uid,
    type: encounter.type,
    species: encounter.species,
    // Nobody has named it yet, which is what an empty name means: it
    // is called whatever its species is called until somebody says
    // otherwise
    nickname: '',
    level: encounter.level,
    individualValue: encounter.individualValue,
    traitValue: encounter.traitValue,
    ivs: encounter.ivs,
    gender: encounter.gender,
    nature: encounter.nature,
    // Cut to the room below: a record that knew more moves than it
    // has slots for would be one the sheet could not draw
    moves: encounter.moves.slice(0, getSlots(room, Slots.Move)),
    // Nothing has been spent on any of them: what a pokemon arrives
    // knowing is what its species and its rolls gave it
    movePoints: {},
    // Whatever it walks in with — the one it rolled, or the list a
    // gift was written with — plus Shadow for good where it came out
    // of one. Shadow is added once however it arrived
    abilities: [
      ...new Set([
        ...(encounter.abilities ?? [encounter.ability]),
        ...(shadow ? [Abilities.Shadow] : []),
      ]),
    ],
    // What it has room for: the game's own, unless the meeting was
    // written with more. A shadow needs no extra room for the shadow
    // itself — the special tier takes no slot
    slots: room,
    // Whatever it was carrying when it was met comes with it, cut to
    // the room the line above just gave it
    items: encounter.items.slice(0, getSlots(room, Slots.Item)),
    // The ball is on the entry as well as on the pokemon: this is the
    // one it arrived in, and a later owner may put it in another
    history: [
      // Whoever had it first, where the gift says somebody did. It
      // holds no uid: nobody signs in as Red
      ...(from === '' ? [] : [{ owner: '', name: from, acquiredAt: caughtAt, kind, ball }]),
      { owner: uid, acquiredAt: caughtAt, kind, ball },
    ],
    // Whatever was true of the meeting is true of the record: it
    // sparkled for this player, or it came out of a shadow raid
    shiny: encounter.shiny,
    shadow,
    egg: false,
    favorite: false,
    guarded: false,
    // Caught by the hands holding it, so it has been nobody else's
    traded: false,
    // Derived from three fields on this same document, and stored so
    // the store can be asked "which of mine are worth a listing"
    // without reading a whole box to find out
    auctionable: isAuctionableCatch(encounter),
    // A fresh catch has fought nothing
    ...freeFields(),
    // ...so it arrives whole, whatever the throw took out of it: an
    // encounter is not a battle, and nothing in one carries over
    health: getMaxHealth({
      species: encounter.species,
      level: encounter.level,
      ivs: encounter.ivs,
      effortValues: zeroEffortValues(),
    }),
    statuses: 0,
    // Where it was fought, for a raid prize: the record says which
    // lair rather than only which kind of raid
    lair: encounter.lair,
    // Something met in the world arrives already out of its shell,
    // so it has nowhere to be walked to
    steps: 0,
    hatchSteps: 0,
    steppedAt: 0,
    ball,
    caughtAt,
    locale: asLocale(locale),
    effortValues: zeroEffortValues(),
    effortBonus: 0,
    // A shadow arrives thinking nothing of anybody, and stays that way
    // until it is put right
    friendship: shadow ? SHADOW_FRIENDSHIP : BASE_FRIENDSHIP,
    origin: {
      timestamp: encounter.timestamp,
      x: encounter.x,
      y: encounter.y,
      biome: encounter.biome,
      // A meeting that happened somewhere with a name says the name;
      // one met in the world is named by its chunk
      ...(encounter.place == null ? {} : { place: encounter.place }),
    },
  });
  // Every arrival ends here — thrown at and caught, or handed over —
  // so this is the one place the dex has to be told a pokemon became
  // this player's. An egg is the exception and writes its own record;
  // it is logged when it hatches, since what is in the shell is not
  // something the player has met yet
  await recordCaughtSpecies(uid, encounter.species, encounter.shiny);
  return ref.id;
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
  const zone = asOffset(offset);
  const id = await writeCaughtRecord(uid, encounter, ball, Acquisition.Caught, now, offset, locale);

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
  await mendWithHealBall(uid, ball);
  // And it is not standing there any more — for this player. The
  // spawn belongs to the window and the window is everybody's, so it
  // is retired the same way one that ran off is: left in the world,
  // left out of what this player is shown. Without it the map went on
  // drawing a pokemon that is already in the bag, and pressing it
  // opened an encounter that could never be caught twice
  await retireSpawn(uid, spawnId);

  return id;
}

/**
 * What a Heal Ball does here.
 *
 * The mainline ball mends what is caught in it, and here that is
 * already true of everything: an encounter is not a battle, so a catch
 * arrives whole however long it was fed and thrown at. What the ball's
 * field does have something to mend is the pokemon standing beside the
 * player — often the one that walked out of the last raid on two hit
 * points — so that is where the healing goes.
 *
 * It is free and it is quiet: a buddy already whole is left alone
 * rather than written to, an egg has nothing to mend, and a buddy
 * locked into a live battle is left to fight it
 */
async function mendWithHealBall(uid: string, ball: Balls): Promise<void> {
  if (ball !== Balls.HealBall) {
    return;
  }

  const resolved = await resolveBuddyCatch(uid);

  if (resolved == null) {
    return;
  }

  const [catchId, stored] = resolved;

  if (isCatchLocked(stored) || isEggRecord(stored)) {
    return;
  }

  const buddy = asCaughtPokemon(stored);

  if (!needsCare(buddy)) {
    return;
  }
  await getAdminFirestore()
    .collection(CAUGHT_COLLECTION)
    .doc(catchId)
    .update({ health: getMaxHealth(buddy), statuses: 0 });
}

/**
 * Set or clear one of the two marks a player sets themselves.
 *
 * A **favorite** cannot be released, auctioned or traded; a **guarded**
 * pokemon cannot be bred, groomed, fielded, healed, purified or have an
 * item spent on it. Neither is a rule about the pokemon — both are the
 * player saying what they want left alone — so both come off exactly
 * the way they went on, and the record is otherwise untouched.
 *
 * Each is a field of its own, so setting one cannot disturb another:
 * a shiny shadow stays a shiny shadow, and the store can be asked for
 * every favorite a player owns.
 *
 * Refused while the pokemon is fighting, the way every other edit to a
 * live record is: a battle runs on a frozen snapshot, and a flag that
 * moved under it would describe a pokemon the fight does not have.
 * Resolves what the mark now is, or null when it was refused
 */
async function setCatchMark(
  uid: string,
  catchId: string,
  field: 'favorite' | 'guarded',
  on: boolean,
): Promise<boolean | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(ref));

    if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
      return null;
    }
    transaction.update(ref, { [field]: on });
    return on;
  });
}

/**
 * Name one of the player's pokemon, or take its name back off.
 *
 * The name is cleaned by the server rather than trusted from the
 * caller — `asNickname` — so nothing arrives on a record that the
 * sheet cannot draw: no control characters, no run of spaces standing
 * in for a name, nothing longer than `NICKNAME_LIMIT`. A name that
 * cleans to nothing clears the field, and the pokemon goes back to
 * being called whatever its species is called.
 *
 * A **guarded** pokemon may still be named. What guarding protects is
 * everything that changes what a pokemon *is* — its level, its
 * values, its species — and what somebody calls it is not among them.
 * A **fighting** one may not, for the ordinary reason: its record is
 * held while the battle runs on a snapshot of it.
 *
 * Resolves the name as it now stands, or null when the catch is not
 * the user's or is fighting
 */
export async function setNickname(
  uid: string,
  catchId: string,
  nickname: string,
): Promise<string | null> {
  const db = getAdminFirestore();
  const named = asNickname(nickname);

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(ref));

    if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
      return null;
    }
    transaction.update(ref, { nickname: named });
    return named;
  });
}

/**
 * Mark one of the player's catches as one they are keeping, or take
 * the mark off
 */
export async function setFavorite(
  uid: string,
  catchId: string,
  favorite: boolean,
): Promise<boolean | null> {
  return setCatchMark(uid, catchId, 'favorite', favorite);
}

/**
 * Put one of the player's catches away, or take it back out
 */
export async function setGuarded(
  uid: string,
  catchId: string,
  guarded: boolean,
): Promise<boolean | null> {
  return setCatchMark(uid, catchId, 'guarded', guarded);
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

    // An egg has no hands: nothing is handed to one until it hatches.
    // A locked one has hands and may already be holding something —
    // it is simply not to be reached into either way
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return false;
    }

    const held = asHeldItems(caught.items);

    // How much room it has is the record's own answer: a pokemon that
    // has been given a second hand is not the one the constant knows
    // about
    if (held.length >= getSlots(asNumber(caught.slots), Slots.Item)) {
      return false;
    }

    const carried = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (!spendStackIn(transaction, ITEM_STACKS, uid, item, carried)) {
      return false;
    }
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

    // Taking one back is refused for a locked pokemon as much as
    // handing one over: what it is holding is part of how it was put
    // away
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isGuardedRecord(caught)
    ) {
      return false;
    }

    const held = asHeldItems(caught.items);
    const index = held.indexOf(item);

    if (index < 0) {
      return false;
    }

    const carried = await readStackIn(transaction, ITEM_STACKS, uid, item);

    // Only the one copy comes off, so a future stack of duplicates
    // still gives back exactly what it took
    transaction.update(caughtRef, { items: held.filter((_, at) => at !== index) });
    writeStackIn(transaction, ITEM_STACKS, uid, item, carried + 1);
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
 * A **favorite** is refused as well. Releasing cannot be undone, and
 * the flag is there for exactly this: the player has already said this
 * one is not to be parted with.
 *
 * So is the **last** one, whatever it is: see `hasSpareCatch`.
 *
 * Resolves false when the catch is not the player's, is fighting, is
 * a favorite, or is the only pokemon they have
 */
export async function releaseCatch(uid: string, catchId: string): Promise<boolean> {
  const db = getAdminFirestore();

  if (!(await hasSpareCatch(uid))) {
    return false;
  }

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const profileRef = db.collection(PROFILE_COLLECTION).doc(uid);
    const [caughtDoc, profileDoc] = await transaction.getAll(caughtRef, profileRef);
    const caught = docData(caughtDoc);

    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isFavoriteRecord(caught)
    ) {
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
      [...returning.keys()].map(
        async (item) => [item, await readStackIn(transaction, ITEM_STACKS, uid, item)] as const,
      ),
    );

    // What the pokemon was worth meeting, paid once more as it goes.
    // The species' own rarity decides it, the same way catching one
    // does: a legendary let go is five candies towards raising the
    // rest of its family, and a Rattata is one. It is read before
    // anything is written, with the item stacks, because a
    // transaction that writes before it reads is refused
    const record = asCaughtPokemon(caught);
    const { family } = getSpeciesData(record.species);
    const candies = await readStackIn(transaction, CANDY_STACKS, uid, family);

    for (const [item, carried] of stacks) {
      writeStackIn(transaction, ITEM_STACKS, uid, item, carried + (returning.get(item) ?? 0));
    }
    writeStackIn(transaction, CANDY_STACKS, uid, family, candies + getCatchCandy(record.species));

    // The buddy is a field of the profile, so it is cleared rather
    // than deleted: the player walks alone, they do not stop having a
    // profile
    if (docData(profileDoc)?.buddy === catchId) {
      transaction.update(profileRef, { buddy: '' });
    }
    transaction.delete(caughtRef);
    return true;
  });
}
