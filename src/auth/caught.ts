// Firestore returns untyped documents; the converters below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import {
  type DocumentReference,
  type FirestoreDataConverter,
  type QueryFieldFilterConstraint,
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import {
  setFavorite as favoriteOnServerSide,
  giveItem as giveOnServer,
  setGuarded as guardedOnServerSide,
  setNickname as nicknameOnServerSide,
  releaseCatch as releaseOnServerSide,
  takeItem as takeOnServer,
} from '../server/caught';
import { requireUid } from '../server/firebase';
import type { CatchConstraint } from './catch-search';
import { type CaughtPokemon, asCaughtPokemon } from './caught-record';
import { CAUGHT_COLLECTION } from './collections';
import { getFirebaseFirestore } from './firebase';
import getIdToken from './session';

export {
  HELD_ITEM_LIMIT,
  NICKNAME_LIMIT,
  asCaughtPokemon,
  asNickname,
  getCatchName,
  isFavorite,
  isGuarded,
} from './caught-record';
export type { CaughtPokemon, OwnershipRecord } from './caught-record';

const caughtConverter: FirestoreDataConverter<CaughtPokemon> = {
  toFirestore: (caught) => caught,
  fromFirestore: (snapshot) => asCaughtPokemon(snapshot.data()),
};

/**
 * The catch's document reference, converter attached. Exported so
 * stores that mutate a catch alongside their own documents (candies,
 * say) can join it in one transaction
 */
export function getCaughtRef(id: string): DocumentReference<CaughtPokemon> {
  return doc(getFirebaseFirestore(), CAUGHT_COLLECTION, id).withConverter(caughtConverter);
}

/**
 * Catches are written by the server alone — see
 * [`src/server/caught.ts`](../server/caught.ts). The record is built
 * from the encounter the overworld staged, so a client cannot write
 * itself the pokemon it would rather have caught
 */

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
 * The player's pokemon that answer one narrowed search.
 *
 * A search is asked in two passes — see
 * [`catch-search.ts`](./catch-search.ts) — and this is the first: the
 * one term the store can answer, beside the owner. The caller still
 * runs the whole predicate over what comes back, because most of the
 * grammar (a name, a second type, an ability) is not a query anybody
 * can write.
 *
 * Every field pushed here needs a composite index with `owner` — see
 * [`firestore.indexes.json`](../../firestore.indexes.json) — which is
 * why the planner pushes one and not a combination
 */
export async function searchCaught(
  owner: string,
  narrowing: CatchConstraint[],
): Promise<[string, CaughtPokemon][]> {
  const caught = collection(getFirebaseFirestore(), CAUGHT_COLLECTION).withConverter(
    caughtConverter,
  );
  const snapshot = await getDocs(
    query(caught, where('owner', '==', owner), ...narrowing.flatMap(asConstraint)),
  );

  return snapshot.docs.map((entry) => [entry.id, entry.data()]);
}

/** One planned constraint, in the words the web SDK takes */
function asConstraint(narrowed: CatchConstraint): QueryFieldFilterConstraint[] {
  if ('oneOf' in narrowed) {
    return [where(narrowed.field, 'in', narrowed.oneOf)];
  }
  if ('has' in narrowed) {
    return [where(narrowed.field, 'array-contains', narrowed.has)];
  }
  if ('is' in narrowed) {
    return [where(narrowed.field, '==', narrowed.is)];
  }
  if ('equals' in narrowed) {
    return [where(narrowed.field, '==', narrowed.equals)];
  }
  // Everything from here to the next thing that sorts after it. The
  // stamps are ISO strings, so "the month of August" is a range
  if ('prefix' in narrowed) {
    return [
      where(narrowed.field, '>=', narrowed.prefix),
      where(narrowed.field, '<', `${narrowed.prefix}\uffff`),
    ];
  }
  // An open end is left off rather than compared against infinity,
  // which Firestore has no number for
  return [
    ...(Number.isFinite(narrowed.low) ? [where(narrowed.field, '>=', narrowed.low)] : []),
    ...(Number.isFinite(narrowed.high) ? [where(narrowed.field, '<=', narrowed.high)] : []),
  ];
}

/**
 * How many pokemon the player has, without reading any of them.
 *
 * It is asked where the answer decides whether something may be given
 * up — a release, a listing — because the last one may not be. A
 * count query is billed as a fraction of a read whatever the number
 * comes to, so this stays cheap for a player with three hundred
 */
export async function countCaught(owner: string): Promise<number> {
  const caught = collection(getFirebaseFirestore(), CAUGHT_COLLECTION);
  const counted = await getCountFromServer(query(caught, where('owner', '==', owner)));

  return counted.data().count;
}

/**
 * The yes-or-no fields a catch carries. Each is its own field on the
 * document rather than a bit of one, which is the whole reason they
 * can be asked of the store.
 *
 * `auctionable` is the odd one: the other five are *stated* about a
 * record, and it is **derived** from three of its own fields — see
 * `isAuctionableCatch`. It is stored regardless, because "perfect
 * **or** blank **or** shiny **or** legendary" is a disjunction, and a
 * disjunction cannot be asked of a box in one query
 */
export type CatchMark = 'shiny' | 'shadow' | 'egg' | 'favorite' | 'guarded' | 'auctionable';

/**
 * The player's pokemon that answer yes to one of them — their shinies,
 * their shadows, the eggs they are carrying.
 *
 * This is why each of them is a field of its own: a bit cannot be
 * queried — Firestore compares a number whole — so a packed field
 * would mean reading every catch a player owns and filtering in the
 * browser. A field each reads only the matching documents.
 *
 * Each mark needs a **composite index** on `(owner, <mark>)` — see
 * [Catches](../../docs/firestore/catches.md) — since the query filters
 * on two fields at once
 */
export async function listCaughtMarked(
  owner: string,
  mark: CatchMark,
): Promise<[string, CaughtPokemon][]> {
  const caught = collection(getFirebaseFirestore(), CAUGHT_COLLECTION).withConverter(
    caughtConverter,
  );
  const snapshot = await getDocs(
    query(caught, where('owner', '==', owner), where(mark, '==', true)),
  );

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
 * Hand an item from the player's bag to one of their catches. The
 * stack and the held list move in one transaction, so an item is
 * never in both places or neither. Resolves false when the catch is
 * not the user's, the item is not carried, the catch already holds
 * its limit, or the item is not holdable
 */
export async function giveItem(catchId: string, item: Items): Promise<boolean> {
  return giveItemOnServer(await getIdToken(), catchId, item);
}

async function giveItemOnServer(token: string, catchId: string, item: Items): Promise<boolean> {
  'use server';
  return giveOnServer(await requireUid(token), catchId, item);
}

/**
 * Take a held item back into the bag. Resolves false when the catch
 * is not the user's or is not holding that item
 */
export async function takeItem(catchId: string, item: Items): Promise<boolean> {
  return takeItemOnServer(await getIdToken(), catchId, item);
}

async function takeItemOnServer(token: string, catchId: string, item: Items): Promise<boolean> {
  'use server';
  return takeOnServer(await requireUid(token), catchId, item);
}

/**
 * Let one of the player's pokemon go. The record is deleted, whatever
 * it was holding goes back to the bag, and a buddy record naming it
 * is cleared with it. There is no undoing it.
 *
 * Resolves false when the catch is not the user's or is fighting
 */
export async function releaseCatch(catchId: string): Promise<boolean> {
  return releaseOnServer(await getIdToken(), catchId);
}

async function releaseOnServer(token: string, catchId: string): Promise<boolean> {
  'use server';
  return releaseOnServerSide(await requireUid(token), catchId);
}

/**
 * Mark one of the player's pokemon as one they are keeping, or take
 * the mark off. A favorite cannot be released, put up for auction or
 * traded away — it is a guard against a mis-click on something that
 * cannot be undone, and it changes nothing else.
 *
 * Resolves the mark as it now stands, or null when the catch is not
 * the user's or is fighting
 */
export async function setFavorite(catchId: string, favorite: boolean): Promise<boolean | null> {
  return setFavoriteOnServer(await getIdToken(), catchId, favorite);
}

async function setFavoriteOnServer(
  token: string,
  catchId: string,
  favorite: boolean,
): Promise<boolean | null> {
  'use server';
  return favoriteOnServerSide(await requireUid(token), catchId, favorite);
}

/**
 * Name one of the player's pokemon, or take the name back off by
 * handing over nothing.
 *
 * The server cleans what it is given — see `asNickname` — so what
 * lands on the record is what the sheet showed while it was being
 * typed. Resolves the name as it now stands, which is an empty string
 * for a pokemon back to being called by its species, or null when the
 * catch is not the user's or is fighting
 */
export async function setNickname(catchId: string, nickname: string): Promise<string | null> {
  return setNicknameOnServer(await getIdToken(), catchId, nickname);
}

async function setNicknameOnServer(
  token: string,
  catchId: string,
  nickname: string,
): Promise<string | null> {
  'use server';
  return nicknameOnServerSide(await requireUid(token), catchId, nickname);
}

/**
 * Put one of the player's pokemon away, or take it back out. A guarded
 * pokemon stays as it is: no levels, no training, no values moved, no
 * evolution, no fighting, no healing, no purifying, and no item given
 * to it or taken back off it. What it can still do is what only ever
 * adds to it — walking beside the player, coming to think more of
 * them, and standing as a parent at the breeder.
 *
 * Resolves the mark as it now stands, or null when the catch is not
 * the user's or is fighting
 */
export async function setGuarded(catchId: string, guarded: boolean): Promise<boolean | null> {
  return setGuardedOnServer(await getIdToken(), catchId, guarded);
}

async function setGuardedOnServer(
  token: string,
  catchId: string,
  guarded: boolean,
): Promise<boolean | null> {
  'use server';
  return guardedOnServerSide(await requireUid(token), catchId, guarded);
}
