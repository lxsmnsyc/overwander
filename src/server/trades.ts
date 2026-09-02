import 'server-only';
import { Acquisition, asCaughtPokemon } from '../auth/caught-record';
import { asOffset, toLocalISO } from '../auth/local-time';
import {
  TRADE_ESCROW,
  type TradeRecord,
  TradeStatus,
  asTradeGold,
  asTradeRecord,
  canAnswerTrade,
  canCancelTrade,
} from '../auth/trade-record';
import { FriendTie } from '../auth/friend-record';
import { BASE_FRIENDSHIP } from '../data/constants/friendship';
import { settleHandover } from '../data/species';
import { isEggRecord, isFavoriteRecord, withoutHeld } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { hasSpareCatch } from './caught';
import { type Tx, getSql, newDocId, tx } from './db';
import { readFriendTie } from './friends';
import { isCatchLocked } from './locks';
import { isAnyCatchQueued } from './raids';
import { Metric } from '../auth/quest-record';
import { type ProgressBump, bumpProgress } from './quest-progress';
import { asNumber, asString } from './read';

/**
 * Trades, written over the owner connection.
 *
 * Two rules make an offer safe to leave sitting. The offered catch is
 * **taken when the offer is made** — into the same escrow an auction
 * lot goes to — so the receiver can trust what they are looking at.
 * The asked catch is **taken only at accept**, and everything about it
 * is checked again there, since it stayed in play while the offer sat.
 *
 * Gold rides the same way a bid does: what comes with the offer is
 * paid as the offer is made and returned if it dies; what is asked of
 * the receiver is paid as they accept.
 */

/** What the proposer put on the table */
export interface TradeOffer {
  friend: string;
  caught: string;
  /** The catch asked in return, or empty for the receiver's own pick */
  asked: string;
  gold: number;
}

/** One trade row in the record shape, locked for the transaction */
async function readTradeIn(transaction: Tx, id: string): Promise<TradeRecord | null> {
  const rows = await transaction`select * from trades where id = ${id} for update`;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }
  const stored: Record<string, unknown> = {
    proposer: row.proposer,
    receiver: row.receiver,
    offered: row.offered_caught ?? '',
    asked: row.asked_caught ?? '',
    given: row.given_caught ?? '',
    gold: row.gold,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? 0,
    offset: row.utc_offset,
  };

  return asTradeRecord(stored);
}

/**
 * One player's catch, locked and checked for changing hands: theirs,
 * not fighting, not an egg, not a favorite. The buddy is refused where
 * the profile row is read, since that is a different table
 */
async function tradableCatchIn(
  transaction: Tx,
  uid: string,
  catchId: string,
): Promise<Record<string, unknown> | null> {
  // The lock is what stops the same catch riding out through two
  // trades at once: whoever locks second finds it already in escrow
  await transaction`select 1 from caught where id = ${catchId} for update`;
  const caught = await readCaughtIn(transaction, catchId);

  if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
    return null;
  }
  if (isEggRecord(caught) || isFavoriteRecord(caught)) {
    return null;
  }
  return caught;
}

/**
 * Offer a friend a trade: one of the proposer's pokemon, for a named
 * one of the friend's or for whatever the friend picks, with gold
 * riding either way. The offered catch moves into escrow here and
 * comes back only through a decline or a cancel.
 *
 * Resolves the trade id, or null when they are not friends, an offer
 * to this friend is already open, the catch is not one to give away
 * (an egg, a favorite, the buddy, one fighting or queued for a raid,
 * or their last one), or the gold offered is more than they hold
 */
export async function offerTrade(
  uid: string,
  offer: TradeOffer,
  now: number,
  offset: number,
): Promise<string | null> {
  if (offer.friend === '' || offer.friend === uid) {
    return null;
  }
  if ((await readFriendTie(uid, offer.friend)) !== FriendTie.Friends) {
    return null;
  }
  // Queued means promised to a raid party that holds the id rather
  // than the record; asked before the transaction the way an auction
  // asks it
  if (await isAnyCatchQueued(uid, [offer.caught])) {
    return null;
  }
  // Nor their last one: the catch leaves their hands the moment the
  // offer is written, for as long as the friend takes to answer
  if (!(await hasSpareCatch(uid))) {
    return null;
  }

  const gold = asTradeGold(offer.gold);

  return tx(async (transaction) => {
    // The profile lock is also what serializes a proposer's offers,
    // so the one-open-offer-per-pair check below cannot be raced
    const profiles = await transaction`
      select gold, buddy_id from profiles where id = ${uid} for update
    `;

    if (profiles.at(0) == null || profiles[0].buddy_id === offer.caught) {
      return null;
    }
    if (gold > 0 && asNumber(profiles[0].gold) < gold) {
      return null;
    }

    const open = await transaction`
      select 1 from trades
      where proposer = ${uid} and receiver = ${offer.friend} and status = ${TradeStatus.Open}
    `;

    if (open.length > 0) {
      return null;
    }
    if ((await tradableCatchIn(transaction, uid, offer.caught)) == null) {
      return null;
    }

    // A named ask has to be the friend's to give when the offer is
    // made; everything else about it waits for the accept
    if (offer.asked !== '') {
      const asked = await transaction`select owner from caught where id = ${offer.asked}`;

      if (asString(asked.at(0)?.owner) !== offer.friend) {
        return null;
      }
    }

    if (gold > 0) {
      await transaction`update profiles set gold = gold - ${gold} where id = ${uid}`;
    }
    await updateCaughtIn(transaction, offer.caught, { owner: TRADE_ESCROW });

    const tradeId = newDocId();

    await transaction`
      insert into trades
        (id, proposer, receiver, offered_caught, asked_caught, given_caught,
         gold, status, created_at, resolved_at, utc_offset)
      values
        (${tradeId}, ${uid}, ${offer.friend}, ${offer.caught},
         ${offer.asked === '' ? null : offer.asked}, null,
         ${gold}, ${TradeStatus.Open}, ${now}, null, ${asOffset(offset)})
    `;
    return tradeId;
  });
}

/**
 * Accept a trade: the two catches change hands in one transaction,
 * and the gold riding on it lands wherever it was headed. `pick` is
 * the receiver's answer to an open ask and is ignored where the
 * proposer named one.
 *
 * Both pokemon arrive traded — which is what opens a trade evolution —
 * with a fresh entry in their history and their friendship reset, the
 * way a lot won at auction arrives.
 *
 * Resolves false when the caller is not the receiver, the trade is no
 * longer open, the two are no longer friends, the catch going back is
 * not the receiver's to give, or the gold asked is more than they hold
 */
export async function acceptTrade(
  uid: string,
  tradeId: string,
  pick: string,
  now: number,
  offset: number,
): Promise<boolean> {
  // What would cross is needed before the transaction for the raid
  // queue check, which reads other tables; the trade is read again
  // under lock below
  const rows = await getSql()`select asked_caught, proposer from trades where id = ${tradeId}`;
  const given = asString(rows.at(0)?.asked_caught) || pick;
  const proposer = asString(rows.at(0)?.proposer);

  if (given === '' || (await isAnyCatchQueued(uid, [given]))) {
    return false;
  }

  let goldMoved = 0;
  const accepted = await tx(async (transaction) => {
    const trade = await readTradeIn(transaction, tradeId);

    if (trade == null || !canAnswerTrade(trade, uid)) {
      return false;
    }

    // An unfriending while the offer sat takes the trade with it; the
    // proposer gets their catch back through cancel
    const friends = await transaction`
      select 1 from friends where owner = ${uid} and friend = ${trade.proposer}
    `;

    if (friends.length === 0) {
      return false;
    }

    const counterpart = trade.asked === '' ? given : trade.asked;

    await transaction`select 1 from caught where id = ${trade.offered} for update`;
    const offered = await readCaughtIn(transaction, trade.offered);

    // Escrow is where the offer put it, and nothing else can move it
    // from there
    if (offered == null || asCaughtPokemon(offered).owner !== TRADE_ESCROW) {
      return false;
    }

    const giving = await tradableCatchIn(transaction, uid, counterpart);

    if (giving == null) {
      return false;
    }

    const profiles = await transaction`
      select gold, buddy_id from profiles where id = ${uid} for update
    `;

    if (profiles.at(0) == null || profiles[0].buddy_id === counterpart) {
      return false;
    }
    if (trade.gold < 0 && asNumber(profiles[0].gold) < -trade.gold) {
      return false;
    }

    if (trade.gold > 0) {
      await transaction`update profiles set gold = gold + ${trade.gold} where id = ${uid}`;
    } else if (trade.gold < 0) {
      await transaction`update profiles set gold = gold - ${-trade.gold} where id = ${uid}`;
      await transaction`
        update profiles set gold = gold + ${-trade.gold} where id = ${trade.proposer}
      `;
    }
    goldMoved = trade.gold;

    // Each arrives thinking of its new owner what a fresh catch would:
    // the friendship it built belonged to the hands it left
    const incoming = asCaughtPokemon(offered);
    const outgoing = asCaughtPokemon(giving);
    // Asked once, here: what each was at the moment of the swap, what
    // came the other way, and what it was holding are all in hand, and
    // none of them is afterwards. A held item the evolution asks for
    // is spent by the swap, the way the mainline spends it
    const incomingHandover = settleHandover(
      incoming.species,
      outgoing.species,
      new Set(incoming.items),
    );
    const outgoingHandover = settleHandover(
      outgoing.species,
      incoming.species,
      new Set(outgoing.items),
    );

    await updateCaughtIn(transaction, trade.offered, {
      owner: uid,
      history: [
        ...incoming.history,
        {
          owner: uid,
          acquiredAt: toLocalISO(now, offset),
          kind: Acquisition.Trade,
          paid: trade.gold < 0 ? -trade.gold : null,
          ball: incoming.ball,
        },
      ],
      friendship: BASE_FRIENDSHIP,
      traded: true,
      canEvolve: incomingHandover.opens,
      ...(incomingHandover.spends == null
        ? {}
        : { items: withoutHeld(incoming.items, incomingHandover.spends) }),
    });

    await updateCaughtIn(transaction, counterpart, {
      owner: trade.proposer,
      history: [
        ...outgoing.history,
        {
          owner: trade.proposer,
          // In the proposer's own zone, stored with the offer for this
          acquiredAt: toLocalISO(now, trade.offset),
          kind: Acquisition.Trade,
          paid: trade.gold > 0 ? trade.gold : null,
          ball: outgoing.ball,
        },
      ],
      friendship: BASE_FRIENDSHIP,
      traded: true,
      canEvolve: outgoingHandover.opens,
      ...(outgoingHandover.spends == null
        ? {}
        : { items: withoutHeld(outgoing.items, outgoingHandover.spends) }),
    });

    await transaction`
      update trades
      set status = ${TradeStatus.Accepted}, given_caught = ${counterpart}, resolved_at = ${now}
      where id = ${tradeId}
    `;
    return true;
  });

  // A settled trade counts once for each side of it, and the gold
  // that rode with it counts for whoever paid and whoever was paid.
  // Positive gold came from the proposer, negative was asked of the
  // acceptor
  if (accepted && proposer !== '') {
    await bumpProgress(uid, [
      [Metric.Trades, 0, 1],
      ...(goldMoved > 0 ? [[Metric.GoldEarned, 0, goldMoved] satisfies ProgressBump] : []),
      ...(goldMoved < 0 ? [[Metric.GoldSpent, 0, -goldMoved] satisfies ProgressBump] : []),
    ]);
    await bumpProgress(proposer, [
      [Metric.Trades, 0, 1],
      ...(goldMoved > 0 ? [[Metric.GoldSpent, 0, goldMoved] satisfies ProgressBump] : []),
      ...(goldMoved < 0 ? [[Metric.GoldEarned, 0, -goldMoved] satisfies ProgressBump] : []),
    ]);
  }
  return accepted;
}

/**
 * Undo an open trade: the catch comes out of escrow to the proposer
 * exactly as it went in, and the gold that rode with the offer comes
 * home. Ownership history and friendship are left alone, since it
 * never changed hands
 */
async function returnTradeIn(
  transaction: Tx,
  tradeId: string,
  trade: TradeRecord,
  status: TradeStatus,
  now: number,
): Promise<boolean> {
  await transaction`select 1 from caught where id = ${trade.offered} for update`;
  const offered = await readCaughtIn(transaction, trade.offered);

  if (offered == null || asCaughtPokemon(offered).owner !== TRADE_ESCROW) {
    return false;
  }
  if (trade.gold > 0) {
    await transaction`update profiles set gold = gold + ${trade.gold} where id = ${trade.proposer}`;
  }
  await updateCaughtIn(transaction, trade.offered, { owner: trade.proposer });
  await transaction`
    update trades set status = ${status}, resolved_at = ${now} where id = ${tradeId}
  `;
  return true;
}

/**
 * Turn a trade down. Resolves false when the caller is not the
 * receiver or it is no longer open
 */
export async function declineTrade(uid: string, tradeId: string, now: number): Promise<boolean> {
  return tx(async (transaction) => {
    const trade = await readTradeIn(transaction, tradeId);

    if (trade == null || !canAnswerTrade(trade, uid)) {
      return false;
    }
    return returnTradeIn(transaction, tradeId, trade, TradeStatus.Declined, now);
  });
}

/**
 * Take an offer back. Resolves false when the caller is not the
 * proposer or it is no longer open
 */
export async function cancelTrade(uid: string, tradeId: string, now: number): Promise<boolean> {
  return tx(async (transaction) => {
    const trade = await readTradeIn(transaction, tradeId);

    if (trade == null || !canCancelTrade(trade, uid)) {
      return false;
    }
    return returnTradeIn(transaction, tradeId, trade, TradeStatus.Cancelled, now);
  });
}
