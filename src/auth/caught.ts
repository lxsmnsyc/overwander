// Firestore returns untyped documents; the converters below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { User } from 'firebase/auth';
import {
  type DocumentReference,
  type FirestoreDataConverter,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Balls, Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type { Encounter, EncounterType } from '../overworld/encounter';
import { asNumber, asNumberArray, asRecord, asStatRecord, asString } from './__normalize';
import { syncServerClock } from './clock';
import { getFirebaseFirestore } from './firebase';

/**
 * A caught encounter, permanently recorded. The IVs, gender and
 * nature are stored explicitly (even though they re-derive from the
 * individual and trait values) so records are readable and
 * queryable on their own. Abilities, held items and ownership
 * history live in their own stores keyed by the same id
 */
export interface CaughtPokemon {
  /**
   * The current owner's uid
   */
  owner: string;
  /**
   * How the pokemon was originally encountered
   */
  type: EncounterType;
  species: Species;
  level: number;
  individualValue: number;
  traitValue: number;
  /**
   * Individual values per stat (0-31)
   */
  ivs: Record<Stats, number>;
  gender: Genders;
  nature: Natures;
  /**
   * The shiny verdict as seen by the original catcher, frozen at
   * catch time so trades cannot change it
   */
  shiny: boolean;
  moves: Moves[];
  /**
   * The ball the catch was made with
   */
  ball: Balls;
  /**
   * Catch date, milliseconds since the epoch
   */
  caughtAt: number;
  /**
   * Effort values per stat; a fresh catch starts at zero
   */
  effortValues: Record<Stats, number>;
  /**
   * Where and when the spawn appeared
   */
  origin: {
    timestamp: number;
    x: number;
    y: number;
    biome: Biome;
  };
}

export interface OwnershipRecord {
  owner: string;
  /**
   * When this owner obtained the pokemon (catch date for the first
   * entry, trade date for later ones)
   */
  acquiredAt: number;
}

const CAUGHT_COLLECTION = 'caught';
const ABILITIES_COLLECTION = 'caughtAbilities';
const ITEMS_COLLECTION = 'caughtItems';
const OWNERS_COLLECTION = 'caughtOwners';

const caughtConverter: FirestoreDataConverter<CaughtPokemon> = {
  toFirestore: (caught) => caught,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    const origin = asRecord(data.origin);

    return {
      owner: asString(data.owner),
      type: asNumber(data.type) as EncounterType,
      species: asNumber(data.species) as Species,
      level: asNumber(data.level),
      individualValue: asNumber(data.individualValue),
      traitValue: asNumber(data.traitValue),
      ivs: asStatRecord(data.ivs),
      gender: asNumber(data.gender) as Genders,
      nature: asNumber(data.nature) as Natures,
      shiny: data.shiny === true,
      moves: asNumberArray(data.moves) as Moves[],
      ball: asNumber(data.ball) as Balls,
      caughtAt: asNumber(data.caughtAt),
      effortValues: asStatRecord(data.effortValues),
      origin: {
        timestamp: asNumber(origin.timestamp),
        x: asNumber(origin.x),
        y: asNumber(origin.y),
        biome: asNumber(origin.biome) as Biome,
      },
    };
  },
};

/**
 * The catch's document reference, converter attached. Exported so
 * stores that mutate a catch alongside their own documents (candies,
 * say) can join it in one transaction
 */
export function getCaughtRef(id: string): DocumentReference<CaughtPokemon> {
  return doc(getFirebaseFirestore(), CAUGHT_COLLECTION, id).withConverter(caughtConverter);
}

function zeroEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
}

/**
 * Record a catch for the signed-in user: the main record plus its
 * ability, held-item and ownership stores, written atomically.
 * Returns the new catch id
 */
export async function recordCatch(
  user: User,
  encounter: Encounter,
  ball: Balls,
  stamp?: number,
): Promise<string> {
  // The catch is stamped by the server's clock unless the caller
  // supplies one, so ownership history stays comparable across
  // players regardless of their devices
  const caughtAt = stamp ?? (await syncServerClock());
  const db = getFirebaseFirestore();
  const ref = doc(collection(db, CAUGHT_COLLECTION)).withConverter(caughtConverter);
  const batch = writeBatch(db);

  batch.set(ref, {
    owner: user.uid,
    type: encounter.type,
    species: encounter.species,
    level: encounter.level,
    individualValue: encounter.individualValue,
    traitValue: encounter.traitValue,
    ivs: encounter.ivs,
    gender: encounter.gender,
    nature: encounter.nature,
    shiny: encounter.shiny,
    moves: encounter.moves,
    ball,
    caughtAt,
    effortValues: zeroEffortValues(),
    origin: {
      timestamp: encounter.timestamp,
      x: encounter.x,
      y: encounter.y,
      biome: encounter.biome,
    },
  });
  batch.set(doc(db, ABILITIES_COLLECTION, ref.id), { abilities: [encounter.ability] });
  batch.set(doc(db, ITEMS_COLLECTION, ref.id), { items: [] });
  batch.set(doc(db, OWNERS_COLLECTION, ref.id), {
    history: [{ owner: user.uid, acquiredAt: caughtAt }],
  });
  await batch.commit();

  return ref.id;
}

export async function getCaught(id: string): Promise<CaughtPokemon | null> {
  const snapshot = await getDoc(getCaughtRef(id));

  return snapshot.data() ?? null;
}

/**
 * Every pokemon currently owned by the user, as id-record pairs
 */
export async function listCaught(owner: string): Promise<[string, CaughtPokemon][]> {
  const caught = collection(getFirebaseFirestore(), CAUGHT_COLLECTION).withConverter(
    caughtConverter,
  );
  const snapshot = await getDocs(query(caught, where('owner', '==', owner)));

  return snapshot.docs.map((entry) => [entry.id, entry.data()]);
}

/**
 * The catch's enabled abilities; starts as the spawn's rolled
 * ability
 */
export async function getCaughtAbilities(id: string): Promise<Abilities[]> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), ABILITIES_COLLECTION, id));

  return asNumberArray(snapshot.data()?.abilities) as Abilities[];
}

/**
 * The held-item document's reference. Exported so a store that needs
 * the held items mid-transaction (evolution, say) can read them
 * without a second round trip
 */
export function getCaughtItemsRef(id: string): DocumentReference {
  return doc(getFirebaseFirestore(), ITEMS_COLLECTION, id);
}

/**
 * The catch's held items; starts empty
 */
export async function getCaughtItems(id: string): Promise<Items[]> {
  const snapshot = await getDoc(getCaughtItemsRef(id));

  return asNumberArray(snapshot.data()?.items) as Items[];
}

/**
 * The catch's ownership history, oldest first; trades append here
 */
export async function getOwnershipHistory(id: string): Promise<OwnershipRecord[]> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), OWNERS_COLLECTION, id));
  const history: unknown = snapshot.data()?.history;

  if (!Array.isArray(history)) {
    return [];
  }
  return history.map((entry) => {
    const record = asRecord(entry);

    return { owner: asString(record.owner), acquiredAt: asNumber(record.acquiredAt) };
  });
}
