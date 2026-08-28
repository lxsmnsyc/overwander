import { AuctionLot, type AuctionRecord, hasEnded, isLive } from './auction-record';
import type { CaughtPokemon } from './caught-record';
import { TYPE_NAMES } from '../data/constants/types';
import { getItemData } from '../data/items';
import { ITEM_TYPE_NAMES } from '../data/items/names';
import { getSpeciesData } from '../data/species';
import type { QueryVocabulary } from '../core/query';
import { alternatives, askedTerms, holds, holdsAny, parseControls, within } from '../core/query';

/**
 * What a search box over the auction board can be asked.
 *
 * The grammar is the bag's and the box's — a plain word, `field:value`
 * pairs that narrow, `is:` for the yes-or-no facts, `!` to refuse one
 * and `|` to accept any of several — asked of a lot rather than of a
 * thing owned. A board is somebody else's shelf, so what a player
 * wants of it is usually a price, a kind and a seller.
 *
 * Everything is answered over what the board already read: the record,
 * the pokemon on the block where the lot is one, and the two words the
 * board writes for itself, the lot's name and the seller's.
 */

/** What the board already knows about a lot, handed to the search */
export interface AuctionContext {
  /** What the lot is called on the board, which a plain word matches */
  name?: string;
  /** Who listed it, as the board says it: a nickname, or "you" */
  seller?: string;
  /** The pokemon on the block, once the board has read it */
  caught?: CaughtPokemon | null;
  /** Whether the reader listed it */
  mine?: boolean;
  /** Whether the reader holds the standing bid */
  bidding?: boolean;
  /** What time it is, for how long a lot has left */
  now?: number;
}

/** What a lot stands at: the bid on it, or what it opened at */
function standing(auction: AuctionRecord): number {
  return auction.bid > 0 ? auction.bid : auction.startingBid;
}

/** How many hours of bidding are left, negative once it has closed */
function hoursLeft(auction: AuctionRecord, now: number): number {
  return (auction.endsAt - now) / (60 * 60 * 1000);
}

/** One yes-or-no fact about a lot, by the word a search calls it */
const MARKS = new Map<string, (auction: AuctionRecord, context: AuctionContext) => boolean>(
  Object.entries<(auction: AuctionRecord, context: AuctionContext) => boolean>({
    item: (auction) => auction.lot === AuctionLot.Item,
    pokemon: (auction) => auction.lot === AuctionLot.Catch,
    mine: (_auction, context) => context.mine === true,
    // Whose bid is in front, which is what a player comes back to check
    bidding: (_auction, context) => context.bidding === true,
    bid: (auction) => auction.bid > 0,
    unbid: (auction) => auction.bid === 0,
    live: (auction, context) => isLive(auction, context.now ?? Date.now()),
    ended: (auction, context) => hasEnded(auction, context.now ?? Date.now()),
    settled: (auction) => auction.settled,
    shiny: (_auction, context) => context.caught?.shiny === true,
    shadow: (_auction, context) => context.caught?.shadow === true,
  }),
);

function marked(
  auction: AuctionRecord,
  value: string,
  wanted: boolean,
  context: AuctionContext,
): boolean {
  return alternatives(value).some((word) => {
    const mark = MARKS.get(word.trim().toLowerCase());

    return mark?.(auction, context) === wanted;
  });
}

/** What one field asks of one lot */
type AuctionField = (auction: AuctionRecord, value: string, context: AuctionContext) => boolean;

const FIELDS = new Map<string, AuctionField>(
  Object.entries<AuctionField>({
    seller: (_auction, value, context) => context.seller != null && holds(context.seller, value),
    // The two halves of what may be on the block, each asked in its
    // own words: a shelf for an item lot, a species for a catch one
    shelf: (auction, value) =>
      auction.item != null && holds(ITEM_TYPE_NAMES[getItemData(auction.item).type], value),
    species: (_auction, value, context) =>
      context.caught != null && holds(getSpeciesData(context.caught.species).name, value),
    type: (_auction, value, context) =>
      context.caught != null &&
      holdsAny(
        getSpeciesData(context.caught.species).types.map((kind) => TYPE_NAMES[kind]),
        value,
      ),
    level: (_auction, value, context) =>
      context.caught != null && within(value, context.caught.level),
    // What it would cost to be in front of it, which is the bid where
    // there is one and the asking price where there is not
    price: (auction, value) => within(value, standing(auction)),
    start: (auction, value) => within(value, auction.startingBid),
    // Hours of bidding left, so "ends:<6" is the end of the board
    ends: (auction, value, context) =>
      within(value, Math.max(0, hoursLeft(auction, context.now ?? Date.now()))),
    is: (auction, value, context) => marked(auction, value, true, context),
    not: (auction, value, context) => marked(auction, value, false, context),
  }),
);

/**
 * Whether one lot answers the whole search. A field nobody has heard
 * of matches nothing, as everywhere else: a search that quietly
 * dropped the half typed most carefully is worse than an empty board
 */
export default function matchesAuction(
  auction: AuctionRecord,
  query: string,
  context: AuctionContext = {},
): boolean {
  return askedTerms(query).every((term) => {
    const answered =
      term.field === ''
        ? context.name != null && holds(context.name, term.value)
        : FIELDS.get(term.field)?.(auction, term.value, context) === true;

    return term.negated ? !answered : answered;
  });
}

/** What each `sort:` word reads off a lot */
const SORTS = new Map<string, (auction: AuctionRecord, context: AuctionContext) => number | string>(
  Object.entries<(auction: AuctionRecord, context: AuctionContext) => number | string>({
    name: (_auction, context) => (context.name ?? '').toLowerCase(),
    seller: (_auction, context) => (context.seller ?? '').toLowerCase(),
    price: (auction) => standing(auction),
    start: (auction) => auction.startingBid,
    ends: (auction) => auction.endsAt,
    listed: (auction) => auction.createdAt,
    level: (_auction, context) => context.caught?.level ?? 0,
  }),
);

/**
 * One short line per field, and the values it is known to take.
 *
 * Which fields exist is read off the table that answers them, so a
 * field added there turns up in the guide on its own. Only the lines
 * are written out, and a test holds every field to having one
 */
const HINTS: Record<string, string> = {
  seller: 'Who listed it',
  shelf: 'Which shelf an item lot sits on',
  species: 'What a pokemon lot is',
  type: 'What a pokemon lot fights as',
  level: 'What level it is',
  price: 'What it stands at',
  start: 'What it opened at',
  ends: 'Hours of bidding left',
  is: 'A fact it has',
  not: 'A fact it lacks',
  sort: 'Arrange by',
  order: 'Which way round',
};

const VALUES: Record<string, () => string[]> = {
  shelf: () => Object.values(ITEM_TYPE_NAMES),
  type: () => Object.values(TYPE_NAMES),
  is: () => [...MARKS.keys()],
  not: () => [...MARKS.keys()],
  sort: () => [...SORTS.keys()],
  order: () => ['asc', 'desc'],
};

/** What the board's box can be asked, with the arranging terms on the end */
export const AUCTION_VOCABULARY: QueryVocabulary = {
  fields: [...FIELDS.keys(), 'sort', 'order'].map((name) => ({
    name,
    hint: HINTS[name] ?? '',
    values: VALUES[name],
  })),
};

/**
 * The lots a search asked for, in the order it asked for them. The two
 * arranging terms hide nothing, so this runs over whatever the
 * predicate already kept
 */
export function orderAuctions<T>(
  rows: T[],
  query: string,
  of: (row: T) => { auction: AuctionRecord; context?: AuctionContext },
): T[] {
  const controls = parseControls(query);
  const read = SORTS.get(controls.sort);

  if (read == null) {
    return rows;
  }
  return [...rows].sort((left, right) => {
    const one = of(left);
    const other = of(right);
    const first = read(one.auction, one.context ?? {});
    const second = read(other.auction, other.context ?? {});
    const order =
      typeof first === 'string' && typeof second === 'string'
        ? first.localeCompare(second)
        : Number(first) - Number(second);

    return controls.descending ? -order : order;
  });
}
