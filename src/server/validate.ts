import 'server-only';
import * as v from 'valibot';
import { CELL_COUNT, CHUNK_CELLS } from '../overworld/grid';
import { AuctionLot, MAX_INCREMENT, MAX_STARTING_BID } from '../auth/auction-record';
import { MAX_OFFSET, MIN_OFFSET } from '../auth/local-time';
import { NICKNAME_LIMIT, PLAYER_NAME_LIMIT } from '../auth/nickname';
import { Slots, mostSlots } from '../data/constants/slots';
import { WORLD_MAX, WORLD_MIN } from '../overworld/world';
import BattleOutcome from '../auth/battle-outcome';
import { CLAIM_CHUNK_LIMIT } from '../auth/snapshot-record';
import { Depth } from '../overworld/depth';
import { GiftKind } from '../auth/gift-record';
import { LobbyRole } from '../auth/lobby-role';
import { MAX_EFFORT_PER_STAT } from '../data/constants/stats';
import { MAX_LEVEL } from '../data/constants/levels';
import Npc from '../data/overworld/npc';
import { RaidKind } from '../auth/raid-record';
import { TEAM_SIZE } from '../auth/teams';
import { TRADE_GOLD_LIMIT } from '../auth/trade-record';

/**
 * What a server function accepts before it acts.
 *
 * Every argument on the other side of a `'use server'` boundary is
 * whatever the caller sent, not what the parameter list says: the
 * types are erased and the call is an ordinary HTTP request anybody
 * can shape. The modules under `src/server/` then read those
 * arguments over the table-owner connection, which row-level security
 * does not bind, so the shape has to be checked here rather than
 * assumed.
 *
 * This is a check, not a rule. A schema says an argument is a number
 * in the world or a text id of a sane length; whether the player may
 * do the thing stays where it already is
 */

/** How long any text id may be */
const ID_LIMIT = 256;

/** How long any line a player writes may be */
const TEXT_LIMIT = 500;

/**
 * Past the last id any registry in `src/data/ids` reaches, forms and
 * the signature band included. An id beyond a registry simply finds
 * nothing; the bound is here so a number is a number
 */
const MAX_GAME_ID = 1e9;

/** The most any count, amount or price may be */
const MAX_AMOUNT = 1e9;

/** The most rows an admin listing may page to */
const MAX_PAGE = 10_000;

/** The most pokemon one call may act on at once */
const BULK_LIMIT = 200;

/** The most lines one basket may carry */
const BASKET_LIMIT = 64;

/** Ids are built out of seeds, uids and numbers, so printable ASCII */
const ID_CHARACTERS = /^[\x20-\x7e]+$/;

/** A BCP 47 tag as `Intl` reports one, e.g. `en-PH` */
const LOCALE_TAG = /^[A-Za-z0-9-]{2,35}$/;

/**
 * Check one argument against its schema and hand it back.
 *
 * The argument comes back as it arrived: nothing is coerced here, so
 * the normalizers further in still see what the caller actually sent
 */
export default function check<T>(
  schema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
  value: T,
): T {
  const result = v.safeParse(schema, value);

  if (!result.success) {
    throw new Error(`Refused: ${result.issues[0].message}`);
  }
  return value;
}

/** A bounded list, since an unbounded one is a request to do work */
function listOf(
  item: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
  most: number,
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
  return v.pipe(v.array(item), v.maxLength(most));
}

/** A whole number between two bounds */
function whole(least: number, most: number): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
  return v.pipe(v.number(), v.integer(), v.minValue(least), v.maxValue(most));
}

/** The caller's id token, which `requireUid` then verifies */
export const TOKEN = v.string();

/**
 * An account, which is a Supabase uid. Empty stands for nobody, the
 * way it does everywhere else, and the calls that take it refuse it
 * themselves
 */
export const UID = v.union([v.literal(''), v.pipe(v.string(), v.uuid())]);

/** A row key or a key derived from a chunk: a catch, a raid, a seat */
export const ID = v.pipe(v.string(), v.nonEmpty(), v.maxLength(ID_LIMIT), v.regex(ID_CHARACTERS));

/** An id where empty stands for nobody or nothing */
export const MAYBE_ID = v.union([v.literal(''), ID]);

/** An entry in one of the registries under `src/data/ids` */
export const GAME_ID = whole(0, MAX_GAME_ID);

/** A registry entry, or null where the caller named none */
export const MAYBE_GAME_ID = v.nullable(GAME_ID);

/** A count of something, never below nothing */
export const COUNT = whole(0, MAX_AMOUNT);

/** A change to a count, which a sale makes negative */
export const AMOUNT = whole(-MAX_AMOUNT, MAX_AMOUNT);

/** Gold, on either side of a trade */
export const GOLD = whole(0, TRADE_GOLD_LIMIT);

/** A chunk inside the world */
export const CHUNK_COORDINATE = whole(WORLD_MIN, WORLD_MAX);

/** A region, which is coarser than a chunk and so sits well inside it */
export const REGION_COORDINATE = whole(WORLD_MIN, WORLD_MAX);

/** A cell inside a chunk, packed as one index */
export const CELL = whole(0, CELL_COUNT - 1);

/** A cell as a column or a row of its chunk */
export const CELL_COORDINATE = whole(0, CHUNK_CELLS - 1);

/** Minutes east of UTC, inside the zones that exist */
export const OFFSET = whole(MIN_OFFSET, MAX_OFFSET);

/** A layer of the world */
export const DEPTH = v.picklist([Depth.Surface, Depth.Cave]);

export const FLAG = v.boolean();

/** The caller's locale tag, which the server formats dates in */
export const LOCALE = v.pipe(v.string(), v.regex(LOCALE_TAG));

/** A name a player wrote, cleaned again further in */
export const NICKNAME = v.pipe(v.string(), v.maxLength(NICKNAME_LIMIT));

/** A trainer named at a bar or searched for */
export const PLAYER_NAME = v.pipe(v.string(), v.maxLength(PLAYER_NAME_LIMIT));

/** A trainer named, or nobody */
export const MAYBE_PLAYER_NAME = v.nullable(PLAYER_NAME);

/** A line a player or a staff member wrote: a reason, a search */
export const TEXT = v.pipe(v.string(), v.maxLength(TEXT_LIMIT));

/** A page of an admin listing */
export const PAGE = whole(0, MAX_PAGE);

/** A level a pokemon can stand at */
export const LEVEL = whole(1, MAX_LEVEL);

/**
 * Which known move a new one goes over. Below nothing where the
 * pokemon still has room, which is what the counters send then
 */
export const REPLACED_SLOT = whole(-1, mostSlots(Slots.Move) - 1);

/** The catches a player brings to a fight */
export const PARTY = listOf(ID, TEAM_SIZE);

/** The catches one call acts on at once */
export const CATCH_LIST = listOf(ID, BULK_LIMIT);

/** Which mark a bulk call is setting */
export const MARK_FIELD = v.picklist(['favorite', 'guarded']);

/** How often a rotation comes round */
export const ROTATION_SCOPE = v.picklist(['daily', 'weekly']);

/** Who stands at a counter */
/** Who a basket is bought from or sold to: the market stall or the Chef */
export const NPC = v.picklist([Npc.Vendor, Npc.Chef]);

/** What somebody is in a lobby for */
export const LOBBY_ROLE = v.picklist([LobbyRole.Fighter, LobbyRole.Spectator]);

/** What a raid lobby is staging */
export const RAID_KIND = v.picklist([RaidKind.Legendary, RaidKind.Shadow, RaidKind.Mythical]);

/** How a battle ended */
export const BATTLE_OUTCOME = v.picklist([
  BattleOutcome.Unfinished,
  BattleOutcome.Won,
  BattleOutcome.Lost,
]);

/**
 * The two parents a breeder is handed. Either may be empty, which the
 * counter refuses itself rather than being a malformed call
 */
export const PARENTS = v.tuple([MAYBE_ID, MAYBE_ID]);

/** What a shopper is buying or selling, as pairs of item and amount */
export const BASKET = listOf(v.tuple([GAME_ID, AMOUNT]), BASKET_LIMIT);

/** Effort points to move, keyed by the stat they go on */
export const EFFORT_SPREAD = v.record(
  v.picklist(['0', '1', '2', '3', '4', '5']),
  whole(0, MAX_EFFORT_PER_STAT),
);

/** The lists a rearranging player wants, as ids in the order they want them */
export const CATCH_ORDER = v.object({
  moves: v.optional(listOf(GAME_ID, mostSlots(Slots.Move))),
  abilities: v.optional(listOf(GAME_ID, mostSlots(Slots.Ability))),
  items: v.optional(listOf(GAME_ID, mostSlots(Slots.Item))),
});

/** What a proposer put on the table */
export const TRADE_OFFER = v.object({
  friend: UID,
  caught: ID,
  asked: MAYBE_ID,
  gold: GOLD,
});

/** What a seller is asking */
export const AUCTION_TERMS = v.object({
  startingBid: whole(0, MAX_STARTING_BID),
  increment: whole(0, MAX_INCREMENT),
});

/** What is on the block */
export const AUCTION_OFFER = v.variant('lot', [
  v.object({ lot: v.literal(AuctionLot.Item), item: GAME_ID }),
  v.object({ lot: v.literal(AuctionLot.Catch), caught: ID }),
]);

/** What a duel lobby is arranged under */
export const DUEL_RULES = v.object({
  limits: COUNT,
  teamSize: whole(1, TEAM_SIZE),
});

/** The chunks a board is asking about, each in its own zone and layer */
export const CLAIM_QUERIES = listOf(
  v.object({
    x: CHUNK_COORDINATE,
    y: CHUNK_COORDINATE,
    offset: OFFSET,
    depth: DEPTH,
  }),
  CLAIM_CHUNK_LIMIT,
);

/** What a battle did to one player's party */
export const AFTERMATHS = listOf(
  v.object({
    caught: ID,
    items: listOf(GAME_ID, mostSlots(Slots.Item)),
    health: COUNT,
    statuses: COUNT,
    coins: COUNT,
    sketched: v.optional(GAME_ID),
  }),
  TEAM_SIZE,
);

/** Where a teleport was asked for: an axis, a person, or neither */
export const TELEPORT_WANTED = v.object({
  x: v.optional(CHUNK_COORDINATE),
  y: v.optional(CHUNK_COORDINATE),
  to: v.optional(PLAYER_NAME),
});

/** What every gift says, wherever it was made */
const GIFT_BASE = {
  reason: TEXT,
  expiresAt: v.nullable(v.date()),
};

/** What a gifted pokemon is, before it is rolled into a record */
const GIFT_POKEMON = {
  species: GAME_ID,
  level: LEVEL,
  shiny: FLAG,
  shadow: FLAG,
  gender: MAYBE_GAME_ID,
  nature: MAYBE_GAME_ID,
  ivs: v.nullable(COUNT),
  abilities: listOf(GAME_ID, mostSlots(Slots.Ability)),
  moves: listOf(GAME_ID, mostSlots(Slots.Move)),
  items: listOf(GAME_ID, mostSlots(Slots.Item)),
  place: TEXT,
  slots: COUNT,
};

/** The three shapes a gift comes in, whether or not it names a player */
function giftVariants(
  common: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>,
): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
  return v.variant('kind', [
    v.object({ ...common, kind: v.literal(GiftKind.Item), item: GAME_ID, amount: COUNT }),
    v.object({
      ...common,
      ...GIFT_POKEMON,
      kind: v.literal(GiftKind.Catch),
      ball: GAME_ID,
      owner: TEXT,
    }),
    v.object({ ...common, ...GIFT_POKEMON, kind: v.literal(GiftKind.Encounter) }),
  ]);
}

/** A gift put on a shelf by hand, for one player or for everybody */
export const STAFF_GIFT = giftVariants({ ...GIFT_BASE, player: v.nullable(UID) });

/**
 * The same gift as the command bar describes it: it names the player
 * in its own argument, so the gift itself does not
 */
export const COMMAND_GIFT = giftVariants(GIFT_BASE);
