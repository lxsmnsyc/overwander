import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import {
  type BulkOutcome,
  type ReleasedCatch,
  type TakeBack,
  arrangeCatch as arrangeOnServer,
  setFavorite as favoriteOnServerSide,
  giveItem as giveOnServer,
  setGuarded as guardedOnServerSide,
  listReleased as listReleasedOnServerSide,
  setCatchMarks as markOnServerSide,
  setNickname as nicknameOnServerSide,
  releaseCatches as releaseManyOnServerSide,
  releaseCatch as releaseOnServerSide,
  takeBack as takeBackOnServerSide,
  takeItem as takeOnServer,
} from '../server/caught';
import { requireReader, requireUid } from '../server/auth';
import {
  type MarkColumn,
  type RevisedCatch,
  countBox,
  holdsSpecies,
  readBox,
  readBoxRevisions as readBoxRevisionsOnServerSide,
  readCatchContext as readCatchContextOnServerSide,
  readCatchesById,
  readMarked,
  readOwned,
  searchBox,
} from '../server/caught-reads';
import { readOnly } from '../utils/server-calls';
import { ServerFlag, isFlagOn } from '../server/flags';
import check, {
  CATCH_CONSTRAINTS,
  CATCH_IDS,
  CATCH_LIST,
  CATCH_MARK,
  CATCH_ORDER,
  FLAG,
  GAME_ID,
  ID,
  ID_BATCH,
  MARK_FIELD,
  NICKNAME,
  TOKEN,
  UID,
} from '../server/validate';
import type { CatchConstraint, CatchContext } from './catch-search';
import { announceBuddyChange } from './buddy-changes';
import { type CatchOrder, type CaughtPokemon, asCaughtPokemon } from './caught-record';
import getIdToken from './session';
import batchedQuery from '../utils/batched-query';

export {
  HELD_ITEM_LIMIT,
  asCaughtPokemon,
  getCatchName,
  isFavorite,
  isGuarded,
} from './caught-record';
export { NICKNAME_LIMIT, asNickname } from './nickname';
export type { CatchOrder, CaughtPokemon, OwnershipRecord } from './caught-record';

/** How many ids one read by id sends, as `CATCH_IDS` allows */
const READ_PAGE = 1000;

/** Server records to pairs, which is where they become catches */
function toPairs(found: readonly RevisedCatch[]): [string, CaughtPokemon][] {
  const pairs: [string, CaughtPokemon][] = [];

  for (const [id, , record] of found) {
    pairs.push([id, asCaughtPokemon(record)]);
  }
  return pairs;
}

/**
 * Catches are written by the server alone — see
 * [`src/server/caught.ts`](../server/caught.ts). The record is built
 * from the encounter the overworld staged, so a client cannot write
 * itself the pokemon it would rather have caught
 */

export async function getCaught(id: string): Promise<CaughtPokemon | null> {
  const found = (await readByIdOnServer(await getIdToken(), [id])).at(0);

  return found == null ? null : asCaughtPokemon(found[2]);
}

/**
 * `getCaught` for a screen reading many at once, such as a lobby of
 * parties: every call made in the same moment goes out as one read.
 * Browser only, since the queue is shared by everyone in the module
 */
export const getCaughtBatched = batchedQuery(
  async (ids: string[]): Promise<Map<string, CaughtPokemon>> =>
    new Map(toPairs(await readByIdOnServer(await getIdToken(), ids))),
  (found, id): CaughtPokemon | null => found.get(id) ?? null,
  { limit: 50 },
);

async function readByIdOnServer(token: string, ids: string[]): Promise<RevisedCatch[]> {
  'use server';
  check(TOKEN, token);
  check(CATCH_IDS, ids);
  await requireReader(token);
  return readCatchesById(ids);
}
readOnly(readByIdOnServer);

/**
 * Every catch an owner holds, as its id and revision and nothing else.
 * It is what a kept box is checked against: a couple of dozen bytes a
 * catch, where the catch itself is over a kilobyte
 */
export async function readBoxRevisions(owner: string): Promise<[string, number][]> {
  return readRevisionsOnServer(await getIdToken(), owner);
}

async function readRevisionsOnServer(token: string, owner: string): Promise<[string, number][]> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  await requireReader(token);
  return readBoxRevisionsOnServerSide(owner);
}
readOnly(readRevisionsOnServer);

/** Catches in full, with the revision each was read at */
export async function readCaughtRevised(ids: string[]): Promise<[string, number, CaughtPokemon][]> {
  const token = await getIdToken();
  const pages: Promise<RevisedCatch[]>[] = [];

  for (let start = 0; start < ids.length; start += READ_PAGE) {
    pages.push(readByIdOnServer(token, ids.slice(start, start + READ_PAGE)));
  }

  const found: [string, number, CaughtPokemon][] = [];

  for (const page of await Promise.all(pages)) {
    for (const [id, revision, record] of page) {
      found.push([id, revision, asCaughtPokemon(record)]);
    }
  }
  return found;
}

export async function listCaught(owner: string): Promise<[string, CaughtPokemon][]> {
  return toPairs(await readBoxOnServer(await getIdToken(), owner));
}

async function readBoxOnServer(token: string, owner: string): Promise<RevisedCatch[]> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  await requireReader(token);
  return readBox(owner);
}
readOnly(readBoxOnServer);

/**
 * The player's pokemon that answer one narrowed search.
 *
 * A search is asked in two passes — see
 * [`catch-search.ts`](./catch-search.ts) — and this is the first: the
 * terms the store can answer, beside the owner. The caller still runs
 * the whole predicate over what comes back, because a good part of the
 * grammar (a plain name, a count of hands, one of several marks) is
 * not a query anybody can write
 */
export async function searchCaught(
  owner: string,
  narrowing: CatchConstraint[],
): Promise<[string, CaughtPokemon][]> {
  return toPairs(await searchOnServer(await getIdToken(), owner, narrowing));
}

async function searchOnServer(
  token: string,
  owner: string,
  narrowing: CatchConstraint[],
): Promise<RevisedCatch[]> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  check(CATCH_CONSTRAINTS, narrowing);
  await requireReader(token);
  return searchBox(owner, narrowing);
}
readOnly(searchOnServer);

/**
 * The three facts about a player's box that live in another table:
 * which pokemon is their buddy, which are standing on the block, and
 * which are drafted into a raid party.
 *
 * A search asks about all three (`is:buddy`, `is:listed`,
 * `is:raiding`) and the record answers none of them, so the box reads
 * them once beside its rows rather than a row at a time
 */
export async function readCatchContext(owner: string): Promise<CatchContext> {
  const { buddy, listed, raiding } = await readContextOnServer(await getIdToken(), owner);

  return { buddy, listed: new Set(listed), raiding: new Set(raiding) };
}

async function readContextOnServer(
  token: string,
  owner: string,
): Promise<{ buddy: string; listed: string[]; raiding: string[] }> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  await requireReader(token);
  return readCatchContextOnServerSide(owner);
}
readOnly(readContextOnServer);

/**
 * Every species the owner has more than one of, read off a box that
 * has already been loaded. It is what `is:duplicate` asks, and it is
 * a count over the whole box rather than a fact about any one row
 */
export function findDuplicates(box: readonly CaughtPokemon[]): Set<Species> {
  const seen = new Set<Species>();
  const twice = new Set<Species>();

  for (const caught of box) {
    if (seen.has(caught.species)) {
      twice.add(caught.species);
    }
    seen.add(caught.species);
  }
  return twice;
}

/**
 * How many pokemon the player has, without reading any of them.
 *
 * It is asked where the answer decides whether something may be given
 * up — a release, a listing — because the last one may not be
 */
export async function countCaught(owner: string): Promise<number> {
  return countOnServer(await getIdToken(), owner);
}

async function countOnServer(token: string, owner: string): Promise<number> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  await requireReader(token);
  return countBox(owner);
}
readOnly(countOnServer);

/**
 * The yes-or-no facts a catch carries. Each is its own column rather
 * than a bit of a packed one, which is what lets a search filter on
 * them.
 *
 * `auctionable` is the odd one: the other five are *stated* about a
 * record, and it is **derived** from three of its own fields — see
 * `isAuctionableCatch`. It is stored regardless, because "perfect
 * **or** blank **or** shiny **or** legendary" is a disjunction, and a
 * disjunction cannot be asked of a box in one query.
 *
 * `hurt` is derived too, and is the store's own: the column is
 * generated from the health against the maximum stored beside it
 */
export type CatchMark = MarkColumn;

/**
 * The player's pokemon that answer yes to one of them — their shinies,
 * their shadows, the eggs they are carrying
 */
export async function listCaughtMarked(
  owner: string,
  mark: CatchMark,
): Promise<[string, CaughtPokemon][]> {
  return toPairs(await readMarkedOnServer(await getIdToken(), owner, mark));
}

async function readMarkedOnServer(
  token: string,
  owner: string,
  mark: CatchMark,
): Promise<RevisedCatch[]> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  check(CATCH_MARK, mark);
  await requireReader(token);
  return readMarked(owner, mark);
}
readOnly(readMarkedOnServer);

/**
 * The most ids `listOwned` will look up at once. A party is smaller
 * than this anyway, and the cap is what stops a caller handing over a
 * list long enough to be a query of its own
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
  return new Set(await readOwnedOnServer(await getIdToken(), owner, ids));
}

async function readOwnedOnServer(token: string, owner: string, ids: string[]): Promise<string[]> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  check(ID_BATCH, ids);
  await requireReader(token);
  return readOwned(owner, ids);
}
readOnly(readOwnedOnServer);

/**
 * Whether the user owns any pokemon at all: a raid asks this of
 * everyone who walks in, and the answer is a yes or no
 */
export async function hasAnyCaught(owner: string): Promise<boolean> {
  return (await countCaught(owner)) > 0;
}

/**
 * Whether the user already owns a pokemon of the species: the Repeat
 * Ball's condition
 */
export async function hasCaughtSpecies(owner: string, species: Species): Promise<boolean> {
  return holdsSpeciesOnServer(await getIdToken(), owner, species);
}

async function holdsSpeciesOnServer(
  token: string,
  owner: string,
  species: Species,
): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(UID, owner);
  check(GAME_ID, species);
  await requireReader(token);
  return holdsSpecies(owner, species);
}
readOnly(holdsSpeciesOnServer);

/**
 * Hand an item from the player's bag to one of their catches. The
 * stack and the held list move in one transaction, so an item is
 * never in both places or neither. Resolves false when the catch is
 * not the user's, the item is not carried, the catch already holds
 * its limit, or the item is not holdable
 */
export async function giveItem(catchId: string, item: Items): Promise<boolean> {
  const given = await giveItemOnServer(await getIdToken(), catchId, item);

  // Announced whichever catch it was: telling whether it is the buddy costs the same read
  if (given) {
    announceBuddyChange();
  }
  return given;
}

async function giveItemOnServer(token: string, catchId: string, item: Items): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(GAME_ID, item);
  return giveOnServer(await requireUid(token), catchId, item);
}

/**
 * Take a held item back into the bag. Resolves false when the catch
 * is not the user's or is not holding that item
 */
export async function takeItem(catchId: string, item: Items): Promise<boolean> {
  const taken = await takeItemOnServer(await getIdToken(), catchId, item);

  if (taken) {
    announceBuddyChange();
  }
  return taken;
}

async function takeItemOnServer(token: string, catchId: string, item: Items): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(GAME_ID, item);
  return takeOnServer(await requireUid(token), catchId, item);
}

/**
 * Lay a pokemon's moves, abilities and held items out in the order
 * the player wants them.
 *
 * One call for all three, because the sheet lays them out together
 * and saves them together: a player who has shuffled four moves and
 * two items pays one round trip rather than six.
 *
 * The order decides what it brings to a fight that allows fewer than
 * it knows. Resolves false when the catch is not the player's, is
 * fighting, is an egg, is put away, or when a list is anything but a
 * rearrangement of what it already has
 */
export async function arrangeCatch(catchId: string, order: CatchOrder): Promise<boolean> {
  return arrangeCatchOnServer(await getIdToken(), catchId, order);
}

async function arrangeCatchOnServer(
  token: string,
  catchId: string,
  order: CatchOrder,
): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(CATCH_ORDER, order);
  return arrangeOnServer(await requireUid(token), catchId, order);
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
  check(TOKEN, token);
  check(ID, catchId);
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
  check(TOKEN, token);
  check(ID, catchId);
  check(FLAG, favorite);
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
  check(TOKEN, token);
  check(ID, catchId);
  check(NICKNAME, nickname);
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
  check(TOKEN, token);
  check(ID, catchId);
  check(FLAG, guarded);
  return guardedOnServerSide(await requireUid(token), catchId, guarded);
}

export type { BulkOutcome } from '../server/caught';

/**
 * Let several of the player's pokemon go at once.
 *
 * One round trip and one transaction rather than one of each per
 * pokemon, which is the whole point: a box being cleared out is thirty
 * of them. Each is refused on its own terms — a favorite, a locked one,
 * one in a battle, and the last one whatever it is — so the answer says
 * which actually went rather than assuming they all did
 */
export async function releaseCatches(catchIds: string[]): Promise<BulkOutcome> {
  return releaseManyOnServer(await getIdToken(), catchIds);
}

async function releaseManyOnServer(token: string, catchIds: string[]): Promise<BulkOutcome> {
  'use server';
  check(TOKEN, token);
  check(CATCH_LIST, catchIds);
  return releaseManyOnServerSide(await requireUid(token), catchIds);
}

/**
 * Mark several as ones the player is keeping, or take the mark off
 * several. One in a battle is refused; nothing else is
 */
export async function favoriteCatches(catchIds: string[], on: boolean): Promise<BulkOutcome> {
  return markManyOnServer(await getIdToken(), catchIds, 'favorite', on);
}

/**
 * Put several away, or take several back out. One in a battle is
 * refused; nothing else is
 */
export async function guardCatches(catchIds: string[], on: boolean): Promise<BulkOutcome> {
  return markManyOnServer(await getIdToken(), catchIds, 'guarded', on);
}

async function markManyOnServer(
  token: string,
  catchIds: string[],
  field: 'favorite' | 'guarded',
  on: boolean,
): Promise<BulkOutcome> {
  'use server';
  check(TOKEN, token);
  check(CATCH_LIST, catchIds);
  check(MARK_FIELD, field);
  check(FLAG, on);
  return markOnServerSide(await requireUid(token), catchIds, field, on);
}

export type { ReleasedCatch, TakeBack } from '../server/caught';

/** Whether a release can be taken back, and what has been let go inside the day */
export interface ReleaseGrace {
  /** Whether this server holds releases for a day at all */
  grace: boolean;
  released: ReleasedCatch[];
}

/**
 * Whether releasing is final on this server, and what the player let
 * go that can still be taken back. The server's `RELEASE_GRACE`
 * variable decides, so the screen asks rather than guessing
 */
export async function getReleaseGrace(): Promise<ReleaseGrace> {
  return releaseGraceOnServer(await getIdToken());
}

async function releaseGraceOnServer(token: string): Promise<ReleaseGrace> {
  'use server';
  check(TOKEN, token);
  const uid = await requireUid(token);

  return {
    grace: isFlagOn(ServerFlag.ReleaseGrace),
    released: await listReleasedOnServerSide(uid, Date.now()),
  };
}

/**
 * Take back a pokemon let go inside the day. The candy its release
 * paid is spent again; it comes back without what it was holding,
 * since that went back to the bag
 */
export async function takeBackCatch(catchId: string): Promise<TakeBack> {
  return takeBackOnServer(await getIdToken(), catchId);
}

async function takeBackOnServer(token: string, catchId: string): Promise<TakeBack> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  return takeBackOnServerSide(await requireUid(token), catchId, Date.now());
}

/** Whether this server holds releases for a day, asked once a visit */
let graced: Promise<boolean> | null = null;

/**
 * Whether a release can be taken back on this server, for a screen
 * that only needs to say so. Asked once and kept: the answer is the
 * deployment's and does not change while the page is open
 */
export async function isReleaseGraced(): Promise<boolean> {
  graced ??= getIdToken()
    .then(async (token) => releaseGracedOnServer(token))
    .catch(() => {
      graced = null;
      return false;
    });
  return graced;
}

async function releaseGracedOnServer(token: string): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  await requireUid(token);
  return isFlagOn(ServerFlag.ReleaseGrace);
}
