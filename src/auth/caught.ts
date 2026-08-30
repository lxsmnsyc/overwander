import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import {
  type BulkOutcome,
  setFavorite as favoriteOnServerSide,
  giveItem as giveOnServer,
  setGuarded as guardedOnServerSide,
  setCatchMarks as markOnServerSide,
  setNickname as nicknameOnServerSide,
  releaseCatches as releaseManyOnServerSide,
  releaseCatch as releaseOnServerSide,
  takeItem as takeOnServer,
} from '../server/caught';
import { requireUid } from '../server/auth';
import type { CatchConstraint, CatchContext, RowConstraint } from './catch-search';
import { asRecord, asRecordArray } from './__normalize';
import type { CaughtPokemon } from './caught-record';
import { CAUGHT_EMBED, fromCaughtRow } from './caught-rows';
import getSupabase from './supabase';
import getIdToken from './session';

export {
  HELD_ITEM_LIMIT,
  asCaughtPokemon,
  getCatchName,
  isFavorite,
  isGuarded,
} from './caught-record';
export { NICKNAME_LIMIT, asNickname } from './nickname';
export type { CaughtPokemon, OwnershipRecord } from './caught-record';

const CAUGHT_TABLE = 'caught';

/** Rows out of a dynamic select, paired as [id, record] */
function rowsToPairs(data: unknown): [string, CaughtPokemon][] {
  return asRecordArray(data).map((row) => [String(row.id), fromCaughtRow(row)]);
}

/**
 * Catches are written by the server alone — see
 * [`src/server/caught.ts`](../server/caught.ts). The record is built
 * from the encounter the overworld staged, so a client cannot write
 * itself the pokemon it would rather have caught
 */

export async function getCaught(id: string): Promise<CaughtPokemon | null> {
  const { data } = await getSupabase()
    .from(CAUGHT_TABLE)
    .select(CAUGHT_EMBED)
    .eq('id', id)
    .maybeSingle();

  return data == null ? null : fromCaughtRow(asRecord(data));
}

/**
 * Every pokemon currently owned by the user, as id-record pairs
 */
/**
 * The box selection, widened to `string` on purpose: left literal,
 * supabase-js parses it at the type level, fails on the embed syntax,
 * and the `ParserError` type poisons every constraint chained onto
 * the query
 */
// oxlint-disable-next-line typescript/no-inferrable-types
const ROW_SELECTION: string = `id, ${CAUGHT_EMBED}`;

/**
 * The rows of one owner's box, with the embeds along. An arrow with
 * its type left to inference: the builder's type is the anchor the
 * constraint chain below is checked against, and nobody can write it
 * out by hand
 */
// oxlint-disable-next-line typescript/explicit-function-return-type
const caughtRows = (owner: string) =>
  getSupabase().from(CAUGHT_TABLE).select(ROW_SELECTION).eq('owner', owner);

export async function listCaught(owner: string): Promise<[string, CaughtPokemon][]> {
  const { data } = await caughtRows(owner);

  return rowsToPairs(data);
}

/**
 * The one column each joinable table is asked for. It is never read —
 * the join is there to prove the row exists — so the cheapest column
 * that is always there is the right one
 */
const JOIN_KEYS: Record<string, string> = {
  caught_moves: 'caught_id',
  caught_abilities: 'caught_id',
  caught_items: 'caught_id',
  caught_history: 'caught_id',
  team_catches: 'caught_id',
  auctions: 'id',
  profiles: 'id',
};

/**
 * The player's pokemon that answer one narrowed search.
 *
 * A search is asked in two passes — see
 * [`catch-search.ts`](./catch-search.ts) — and this is the first: the
 * terms the store can answer, beside the owner. The caller still runs
 * the whole predicate over what comes back, because a good part of the
 * grammar (a plain name, a count of hands, one of several marks) is
 * not a query anybody can write.
 *
 * Anything joined rides on an **alias** of its own beside the embed
 * the reader unpacks. Filtering the embed itself would narrow what
 * comes back with it, and a pokemon that came back holding only the
 * move that was searched for would be a wrong record rather than a
 * narrowed list
 */
export async function searchCaught(
  owner: string,
  narrowing: CatchConstraint[],
): Promise<[string, CaughtPokemon][]> {
  const joins = narrowing
    .filter(
      (narrowed): narrowed is Exclude<CatchConstraint, RowConstraint> => narrowed.on !== 'row',
    )
    .map((narrowed) => `${narrowed.alias}:${narrowed.table}!inner(${JOIN_KEYS[narrowed.table]})`);
  let request = getSupabase()
    .from(CAUGHT_TABLE)
    .select([ROW_SELECTION, ...joins].join(', '))
    .eq('owner', owner);

  for (const narrowed of narrowing) {
    request = applyConstraint(request, narrowed);
  }

  const { data } = await request;

  return rowsToPairs(data);
}

type Chain = ReturnType<typeof caughtRows>;

/**
 * One planned constraint, applied to the running query. A joined one
 * names its alias before its column, which is how PostgREST is told
 * which of the two embeds of a table to filter
 */
function applyConstraint(request: Chain, narrowed: CatchConstraint): Chain {
  if (narrowed.on === 'exists') {
    let joined = request;

    for (const [column, value] of Object.entries(narrowed.equals)) {
      joined = joined.eq(`${narrowed.alias}.${column}`, value);
    }
    return joined;
  }

  const column = narrowed.on === 'child' ? `${narrowed.alias}.${narrowed.column}` : narrowed.column;
  const listed = Array.isArray(narrowed.value) ? narrowed.value : [narrowed.value];

  switch (narrowed.op) {
    case 'in':
      return request.in(column, listed);
    case 'nin':
      return request.not(column, 'in', `(${listed.join(',')})`);
    case 'neq':
      return request.neq(column, narrowed.value);
    case 'gt':
      return request.gt(column, narrowed.value);
    case 'gte':
      return request.gte(column, narrowed.value);
    case 'lt':
      return request.lt(column, narrowed.value);
    case 'lte':
      return request.lte(column, narrowed.value);
    case 'ilike':
      return request.ilike(column, String(narrowed.value));
    case 'eq':
    default:
      return request.eq(column, narrowed.value);
  }
}

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
  const supabase = getSupabase();
  const [profile, lots, drafted] = await Promise.all([
    supabase.from('profiles').select('buddy_id').eq('id', owner).maybeSingle(),
    supabase.from('auctions').select('caught_id').eq('seller', owner).eq('settled', false),
    supabase.from('teams').select('team_catches(caught_id)').eq('player', owner),
  ]);

  const listed = new Set<string>();
  const raiding = new Set<string>();

  for (const row of asRecordArray(lots.data)) {
    if (typeof row.caught_id === 'string') {
      listed.add(row.caught_id);
    }
  }
  for (const team of asRecordArray(drafted.data)) {
    for (const entry of asRecordArray(team.team_catches)) {
      if (typeof entry.caught_id === 'string') {
        raiding.add(entry.caught_id);
      }
    }
  }

  const buddy = asRecord(profile.data).buddy_id;

  return { buddy: typeof buddy === 'string' ? buddy : '', listed, raiding };
}

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
 * up — a release, a listing — because the last one may not be. It
 * counts in the store rather than reading the rows, so it stays cheap
 * for a player with three hundred
 */
export async function countCaught(owner: string): Promise<number> {
  const { count } = await getSupabase()
    .from(CAUGHT_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('owner', owner);

  return count ?? 0;
}

/**
 * The yes-or-no facts a catch carries. Each is its own column rather
 * than a bit of a packed one, which is what lets a search filter on
 * them.
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
 * This is why each of them is a column of its own rather than a bit
 * of one: a packed field would mean reading every catch a player owns
 * and filtering in the browser
 */
export async function listCaughtMarked(
  owner: string,
  mark: CatchMark,
): Promise<[string, CaughtPokemon][]> {
  const { data } = await getSupabase()
    .from(CAUGHT_TABLE)
    .select(`id, ${CAUGHT_EMBED}`)
    .eq('owner', owner)
    .eq(mark, true);

  return rowsToPairs(data);
}

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

  const { data } = await getSupabase()
    .from(CAUGHT_TABLE)
    .select('id')
    .eq('owner', owner)
    .in('id', ids);

  return new Set(((data ?? []) as { id: unknown }[]).map((row) => String(row.id)));
}

/**
 * Whether the user owns any pokemon at all. Reads one row rather than
 * the box: a raid asks this of everyone who walks in, and the answer
 * is a yes or no
 */
export async function hasAnyCaught(owner: string): Promise<boolean> {
  const { count } = await getSupabase()
    .from(CAUGHT_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('owner', owner);

  return (count ?? 0) > 0;
}

/**
 * Whether the user already owns a pokemon of the species. Reads one
 * row, since the answer is a yes or no: the Repeat Ball's condition
 */
export async function hasCaughtSpecies(owner: string, species: Species): Promise<boolean> {
  const { count } = await getSupabase()
    .from(CAUGHT_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('owner', owner)
    .eq('species', species);

  return (count ?? 0) > 0;
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
  return markOnServerSide(await requireUid(token), catchIds, field, on);
}
