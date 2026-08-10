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
  documentId,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import { Stats } from '../data/constants/stats';
import Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import { type Balls, ItemFlags, type Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import { getItemData } from '../data/items';
import type { Encounter, EncounterType } from '../overworld/encounter';
import { asNumber, asNumberArray, asRecord, asStatRecord, asString } from './__normalize';
import { syncServerClock } from './clock';
import { getFirebaseFirestore } from './firebase';
import { getEntryRef } from './inventory';

/**
 * A caught encounter, permanently recorded. The IVs, gender and
 * nature are stored explicitly (even though they re-derive from the
 * individual and trait values) so records are readable and queryable
 * on their own.
 *
 * Everything about one catch lives in this one document: its
 * abilities, what it holds and whose hands it has passed through were
 * once three side stores keyed by the same id, which meant four reads
 * to show a pokemon and four documents to keep in step. They are
 * fields now, and a catch is read, written and secured as a whole
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
  /**
   * Whether it came out of a shadow raid. A shadow keeps its Shadow
   * ability and costs twice the candy to raise
   */
  shadow: boolean;
  moves: Moves[];
  /**
   * The abilities the catch has: the rolled one, plus Shadow for a
   * shadow catch, which it keeps for good
   */
  abilities: Abilities[];
  /**
   * What it is holding, up to HELD_ITEM_LIMIT; a fresh catch holds
   * nothing
   */
  items: Items[];
  /**
   * Whose hands it has passed through, oldest first: the catcher, and
   * an entry per trade
   */
  history: OwnershipRecord[];
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

/**
 * Restore an ownership history from an untyped Firestore value
 */
function asOwnershipHistory(value: unknown): OwnershipRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    const record = asRecord(entry);

    return { owner: asString(record.owner), acquiredAt: asNumber(record.acquiredAt) };
  });
}

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
      shadow: data.shadow === true,
      moves: asNumberArray(data.moves) as Moves[],
      abilities: asNumberArray(data.abilities) as Abilities[],
      items: asNumberArray(data.items) as Items[],
      history: asOwnershipHistory(data.history),
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
 * Record a catch for the signed-in user. The whole pokemon is one
 * document, so it lands in a single write. Returns the new catch id
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

  await setDoc(ref, {
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
    shadow: encounter.shadow,
    moves: encounter.moves,
    // A shadow raid's reward keeps its Shadow ability for good, on
    // top of the one it rolled
    abilities: encounter.shadow ? [encounter.ability, Abilities.Shadow] : [encounter.ability],
    items: [],
    history: [{ owner: user.uid, acquiredAt: caughtAt }],
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
 * The most ids `listOwned` will look up at once — Firestore caps a
 * `documentId() in [...]` query, and a party is smaller than this
 * anyway
 */
export const OWNERSHIP_QUERY_LIMIT = 30;

/**
 * Which of the given catch ids the user actually owns. Client code
 * hands catch ids around freely — a team is a list of them — and the
 * ids of other players' pokemon are readable, so anything that acts
 * on a submitted id has to check it against the owner rather than
 * trust the caller. Resolves the subset that is really theirs
 */
export async function listOwned(owner: string, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0 || ids.length > OWNERSHIP_QUERY_LIMIT) {
    return new Set();
  }

  const caught = collection(getFirebaseFirestore(), CAUGHT_COLLECTION).withConverter(
    caughtConverter,
  );
  const snapshot = await getDocs(query(caught, where(documentId(), 'in', ids)));

  return new Set(
    snapshot.docs.filter((entry) => entry.data().owner === owner).map((entry) => entry.id),
  );
}

/**
 * Whether the user owns any pokemon at all. Reads a single document
 * rather than the whole collection — a raid asks this of everyone who
 * walks in, and the answer is a yes or no
 */
export async function hasAnyCaught(owner: string): Promise<boolean> {
  const caught = collection(getFirebaseFirestore(), CAUGHT_COLLECTION).withConverter(
    caughtConverter,
  );
  const snapshot = await getDocs(query(caught, where('owner', '==', owner), limit(1)));

  return !snapshot.empty;
}

/**
 * Whether the user already owns a pokemon of the species. Reads a
 * single document, since the answer is a yes or no — the Repeat
 * Ball's condition
 */
export async function hasCaughtSpecies(owner: string, species: Species): Promise<boolean> {
  const caught = collection(getFirebaseFirestore(), CAUGHT_COLLECTION).withConverter(
    caughtConverter,
  );
  const snapshot = await getDocs(
    query(caught, where('owner', '==', owner), where('species', '==', species), limit(1)),
  );

  return !snapshot.empty;
}

/**
 * How many items one pokemon can hold at a time, matching the
 * battle's per-unit item limit
 */
export const HELD_ITEM_LIMIT = 1;

/**
 * Hand an item from the player's bag to one of their catches. The
 * stack and the held list move in one transaction, so an item is
 * never in both places or neither. Resolves false when the catch is
 * not the user's, the item is not carried, the catch already holds
 * its limit, or the item is not holdable
 */
export async function giveItem(uid: string, catchId: string, item: Items): Promise<boolean> {
  if ((getItemData(item).flags & ItemFlags.Holdable) === 0) {
    return false;
  }

  const db = getFirebaseFirestore();

  return runTransaction(db, async (transaction) => {
    const caughtRef = getCaughtRef(catchId);
    const caught = (await transaction.get(caughtRef)).data();

    if (caught == null || caught.owner !== uid) {
      return false;
    }
    if (caught.items.length >= HELD_ITEM_LIMIT) {
      return false;
    }

    const stackRef = getEntryRef(uid, item);
    const amount = (await transaction.get(stackRef)).data()?.amount ?? 0;

    if (amount < 1) {
      return false;
    }

    transaction.set(stackRef, { user: uid, item, amount: amount - 1 });
    transaction.update(caughtRef, { items: [...caught.items, item] });
    return true;
  });
}

/**
 * Take a held item back into the bag. Resolves false when the catch
 * is not the user's or is not holding that item
 */
export async function takeItem(uid: string, catchId: string, item: Items): Promise<boolean> {
  const db = getFirebaseFirestore();

  return runTransaction(db, async (transaction) => {
    const caughtRef = getCaughtRef(catchId);
    const caught = (await transaction.get(caughtRef)).data();

    if (caught == null || caught.owner !== uid) {
      return false;
    }

    const index = caught.items.indexOf(item);

    if (index < 0) {
      return false;
    }

    const stackRef = getEntryRef(uid, item);
    const amount = (await transaction.get(stackRef)).data()?.amount ?? 0;

    // Only the one copy comes off, so a future stack of duplicates
    // still gives back exactly what it took
    transaction.update(caughtRef, { items: caught.items.filter((_, at) => at !== index) });
    transaction.set(stackRef, { user: uid, item, amount: amount + 1 });
    return true;
  });
}
