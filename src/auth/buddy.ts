import {
  type DocumentReference,
  type FirestoreDataConverter,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import type { Buddy } from '../overworld/core';
import { asString } from './__normalize';
import { type CaughtPokemon, getCaught } from './caught';
import { getFirebaseFirestore } from './firebase';

/**
 * The pokemon a player keeps at their side, stored one per player at
 * buddies/{uid}. Overworld item effects and abilities read the buddy
 * to decide what the player's presence changes, and the planned
 * walking feature follows the same record. Firestore security rules
 * must restrict writes to the owning uid
 */
export interface BuddyRecord {
  /**
   * The owning uid, matching the document id
   */
  player: string;
  /**
   * The caught/{catchId} the buddy points at
   */
  caught: string;
}

const BUDDY_COLLECTION = 'buddies';

const converter: FirestoreDataConverter<BuddyRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return { player: asString(data.player), caught: asString(data.caught) };
  },
};

function getBuddyRef(uid: string): DocumentReference<BuddyRecord> {
  return doc(getFirebaseFirestore(), BUDDY_COLLECTION, uid).withConverter(converter);
}

/**
 * The player's buddy record, or null when they have none. The record
 * may still point at a pokemon they no longer own — resolveBuddy
 * checks that
 */
export async function getBuddy(uid: string): Promise<BuddyRecord | null> {
  const snapshot = await getDoc(getBuddyRef(uid));

  return snapshot.data() ?? null;
}

/**
 * Set the player's buddy. Resolves false (and writes nothing) when
 * the catch does not exist or the player does not own it, so a
 * traded-away pokemon cannot be kept at someone else's side
 */
export async function setBuddy(uid: string, catchId: string): Promise<boolean> {
  const caught = await getCaught(catchId);

  if (caught == null || caught.owner !== uid) {
    return false;
  }
  await setDoc(getBuddyRef(uid), { player: uid, caught: catchId });
  return true;
}

/**
 * Send the buddy back; the player walks alone afterwards
 */
export async function clearBuddy(uid: string): Promise<void> {
  await deleteDoc(getBuddyRef(uid));
}

/**
 * The buddy as the overworld's field effects read it, or null when
 * the player walks alone. The client needs this to show what its
 * abilities change — which pokemon the chunk is holding, and how many
 * of them — before the player walks up to any of them
 */
export async function getBuddyEffects(uid: string): Promise<Buddy | null> {
  const buddy = await resolveBuddy(uid);

  if (buddy == null) {
    return null;
  }

  const [, caught] = buddy;

  // An egg is carried rather than accompanied: what is written inside
  // it changes nothing about the world until it hatches
  if (caught.egg) {
    return null;
  }

  return {
    species: caught.species,
    abilities: caught.abilities,
    items: caught.items,
    nature: caught.nature,
    gender: caught.gender,
  };
}

/**
 * The buddy as a catch id and its record, for the effects that need
 * the species, ability or held items. Resolves null when the player
 * has no buddy, or when the record points at a pokemon that has
 * since changed hands — a trade leaves the buddy record behind, and
 * this is where that is caught
 */
export async function resolveBuddy(uid: string): Promise<[string, CaughtPokemon] | null> {
  const record = await getBuddy(uid);

  if (record == null) {
    return null;
  }

  const caught = await getCaught(record.caught);

  if (caught == null || caught.owner !== uid) {
    return null;
  }
  return [record.caught, caught];
}
