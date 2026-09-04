import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import { asCaughtPokemon } from '../auth/caught-record';
import { createCatchSnapshot } from '../auth/catch-snapshot';
import type { CatchSnapshot } from '../auth/catch-snapshot';
import { PVP_BATTLE_LIMITS } from '../data/constants/battle-limits';
import {
  CHALLENGER_ALLIANCE,
  type GymSeatRecord,
  type GymSeatStanding,
  HOLDER_ALLIANCE,
  SEAT_COOLDOWN,
  SEAT_DAILY_TAKE,
  SEAT_OUSTED_BAR,
  SEAT_TAKE_WINDOW,
  asGymSeatRecord,
  seatId,
  seatStake,
} from '../auth/gym-seat-record';
import { getMaxHealth, isFainted } from '../auth/health';
import { Foe, Metric } from '../auth/quest-record';
import { TEAM_SIZE } from '../auth/teams';
import Landmark from '../data/overworld/landmark';
import getWorld from '../overworld/current';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtMany } from './caught-io';
import { type Tx, getSql, jsonOf, newDocId, tx } from './db';
import { isCatchLocked } from './locks';
import { resolveSnapshot } from './overworld';
import { bumpProgress } from './quest-progress';
import { foughtBattle, readBattle } from './raid-io';
import { isAnyCatchQueued, publishTeamSnapshot } from './raids';
import { recordSeenOpponents } from './pokedex';
import { asNumber, asString } from './read';

/**
 * Gym seats: asynchronous fights between players.
 *
 * The seat is a cell somebody has left a team standing on. A player
 * who walks up to an empty one may take it; one who walks up to
 * somebody else's fights the frozen party standing there, and takes
 * the seat by winning. The holder is not asked and does not need to
 * be online, which is the whole point — a fight between two players
 * who both have to be present is a fight that mostly never happens.
 *
 * Two rules keep it honest, and both are the reason a seat costs its
 * holder nothing:
 *
 * - The holder's catches are **never locked**. What stands on the
 *   seat is a copy taken when they sat down, so they walk away with
 *   their pokemon still theirs to use.
 * - A seat battle **settles no aftermath**. `recordAftermath` refuses
 *   any battle a raid does not own that fielded more than one player,
 *   so neither side spends an item or carries a scratch out of it.
 *
 * The challenger's party is locked, the way any party in a live fight
 * is: they are standing there fighting it.
 */

/**
 * A stored outcome, restored as the enum this compares against
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

/**
 * A seat as stored, in the record shape, or null when the cell holds
 * none
 */
async function readSeat(seat: string): Promise<Record<string, unknown> | null> {
  const rows = await getSql()`select * from gym_seats where seat_id = ${seat}`;
  const row = rows.at(0);

  return row == null ? null : toRecord(row);
}

function toRecord(row: Record<string, unknown>): Record<string, unknown> {
  return {
    seat: row.seat_id,
    holder: row.holder ?? '',
    snapshot: row.snapshot_id ?? '',
    chunk: { seed: asString(row.chunk_seed), x: asNumber(row.chunk_x), y: asNumber(row.chunk_y) },
    cell: row.cell,
    seatedAt: row.seated_at,
    defenses: row.defenses,
  };
}

/**
 * What a player standing on a seat cell is looking at: who holds it
 * and where this player stands with it. `'absent'` is the cell
 * staging no seat at all, which is what a stale board looks like
 * from here
 */
export type GymSeatView = GymSeatStanding | 'absent';

/**
 * Where this player stands with this seat: the cooldown the last
 * settled challenge left, and what they have stripped off it inside
 * the current day. A window that has run out reads as a clean slate,
 * which is what makes the cap roll rather than reset on a clock
 */
async function readStanding(
  seat: string,
  uid: string,
  now: number,
): Promise<{ cooldownUntil: number; taken: number }> {
  const rows = await getSql()`
    select settled_at, window_at, taken from gym_challenges
    where seat_id = ${seat} and challenger = ${uid}
  `;
  const row = rows.at(0);

  if (row == null) {
    return { cooldownUntil: 0, taken: 0 };
  }

  const settledAt = asNumber(row.settled_at);
  const windowAt = asNumber(row.window_at);

  return {
    cooldownUntil: settledAt === 0 ? 0 : settledAt + SEAT_COOLDOWN,
    taken: now - windowAt >= SEAT_TAKE_WINDOW ? 0 : asNumber(row.taken),
  };
}

/**
 * When this player may sit down on the seat. Only the holder who was
 * beaten out of it is barred, and only until the bar runs out or
 * somebody else takes the cell
 */
function readBar(row: Record<string, unknown> | null, uid: string, now: number): number {
  if (row == null || asString(row.ousted) !== uid) {
    return 0;
  }

  const until = asNumber(row.freed_at) + SEAT_OUSTED_BAR;

  return now < until ? until : 0;
}

/**
 * The raw seat row, which carries what `toRecord` drops: whether the
 * cell is currently empty, and who was turned out of it
 */
async function readSeatRow(seat: string): Promise<Record<string, unknown> | null> {
  const rows = await getSql()`select * from gym_seats where seat_id = ${seat}`;

  return rows.at(0) ?? null;
}

/**
 * What is left of this player's daily allowance on this seat
 */
async function allowance(transaction: Tx, seat: string, uid: string, now: number): Promise<number> {
  const rows = await transaction`
    select window_at, taken from gym_challenges
    where seat_id = ${seat} and challenger = ${uid}
  `;
  const row = rows.at(0);

  if (row == null || now - asNumber(row.window_at) >= SEAT_TAKE_WINDOW) {
    return SEAT_DAILY_TAKE;
  }
  return Math.max(0, SEAT_DAILY_TAKE - asNumber(row.taken));
}

/**
 * Move a share of the loser's purse to the winner.
 *
 * The balance is read under a lock and the share taken of what is
 * actually there, so the `gold >= 0` check the profiles table carries
 * can never be the thing that decides a fight. Resolves what actually
 * moved, which is zero for a loser with nothing and for a taker who
 * has had their fill of this seat today
 */
async function strip(
  transaction: Tx,
  loser: string,
  winner: string,
  cap = SEAT_DAILY_TAKE,
): Promise<number> {
  const rows = await transaction`
    select gold from profiles where id = ${loser} for update
  `;
  const moved = seatStake(asNumber(rows.at(0)?.gold), cap);

  if (moved <= 0) {
    return 0;
  }

  await transaction`update profiles set gold = gold - ${moved} where id = ${loser}`;
  await transaction`update profiles set gold = gold + ${moved} where id = ${winner}`;
  return moved;
}

/**
 * Whether the cell really stages a seat. The landmark is a fixture of
 * the chunk rather than a window's roll, so this needs no live
 * snapshot — but the snapshot is still resolved, since a player whose
 * chunk window has lapsed is not standing anywhere the server will
 * act on
 */
async function resolveSeatCell(
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<string | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return null;
  }

  const chunk = getWorld().getChunk(x, y);

  return chunk.getLandmarkCells().get(cell) === Landmark.GymSeat ? seatId(chunk, cell) : null;
}

/**
 * Walk up to a seat. Resolves what is standing on it, or `'absent'`
 * when the cell stages no seat
 */
export async function enterGymSeat(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<GymSeatView> {
  const seat = await resolveSeatCell(x, y, cell, now, offset);

  if (seat == null) {
    return 'absent';
  }

  const row = await readSeatRow(seat);
  const standing = await readStanding(seat, uid, now);
  // An emptied row is a free cell, not a held one: winning frees the
  // seat rather than handing it over, and the row stays behind to
  // carry the bar and the challenge ledger
  const held = row?.holder == null ? null : asGymSeatRecord(toRecord(row));

  return { seat: held, ...standing, barredUntil: readBar(row, uid, now) };
}

/**
 * The frozen party a seat stands on, as the battle reads it. Nothing
 * here locks a catch: the copy is what fights, and the originals are
 * the holder's to go on using
 */
async function freezeSeatParty(
  transaction: Tx,
  uid: string,
  catches: string[],
): Promise<CatchSnapshot[] | null> {
  const fielded: CatchSnapshot[] = [];
  // Locked together rather than one at a time: the same `for update`
  // on every row of the party, in one question
  const found = await readCaughtMany(transaction, catches, true);

  for (const id of catches) {
    const data = found.get(id);

    // The same bar a raid sets, minus the lock: an egg has nothing to
    // fight with, one that is down has to be healed first, and one
    // fighting elsewhere is spoken for. A guarded pokemon is refused
    // too — putting one away is meant to keep it out of fights
    if (
      data?.owner === uid &&
      !isCatchLocked(data) &&
      !isEggRecord(data) &&
      !isGuardedRecord(data) &&
      !isFainted(asCaughtPokemon(data))
    ) {
      const caught = asCaughtPokemon(data);

      // Seated at full health, whatever it walked in on. The holder
      // is not there to heal it between challenges, and a seat that
      // wore down over a day of fights would be a seat nobody could
      // hold
      fielded.push(createCatchSnapshot(id, { ...caught, health: getMaxHealth(caught) }));
    }
  }
  return fielded.length === 0 ? null : fielded;
}

/**
 * Leave a team standing on a seat.
 *
 * The seat has to be empty or already this player's — taking one off
 * somebody else is a fight, not a decision. Restaging is allowed and
 * keeps the seat: a holder who wants a better party on it should not
 * have to give the cell up to somebody passing.
 *
 * Resolves the seat as it now stands, or null when the cell stages no
 * seat, the party will not do, or somebody else is holding it
 */
export async function takeGymSeat(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  now: number,
  offset: number,
): Promise<GymSeatRecord | null> {
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const seat = await resolveSeatCell(x, y, cell, now, offset);

  if (seat == null) {
    return null;
  }

  const chunk = getWorld().getChunk(x, y);
  const snapshotId = newDocId();
  const written = await tx(async (transaction) => {
    // Locked as it is read, so two players cannot both find the seat
    // free and both sit down on it
    const held = await transaction`
      select holder, ousted, freed_at from gym_seats where seat_id = ${seat} for update
    `;
    const row = held.at(0) ?? null;
    const holder = asString(row?.holder);

    if (holder !== '' && holder !== uid) {
      return false;
    }
    // The trainer just beaten out of this cell waits before sitting
    // back down, so the winner has a real chance at it
    if (readBar(row, uid, now) > 0) {
      return false;
    }

    const fielded = await freezeSeatParty(transaction, uid, catches);

    if (fielded == null) {
      return false;
    }

    await transaction`
      insert into team_snapshots (id, player, alliance, catches)
      values (${snapshotId}, ${uid}, ${HOLDER_ALLIANCE}, ${jsonOf(transaction, fielded)})
    `;

    if (holder === '') {
      // Sitting down clears the bar with the cell: it named the last
      // holder, and the cell has one again
      await transaction`
        insert into gym_seats
          (seat_id, holder, snapshot_id, chunk_seed, chunk_x, chunk_y, cell, seated_at,
           defenses, ousted, freed_at)
        values
          (${seat}, ${uid}, ${snapshotId}, ${chunk.seed}, ${chunk.x}, ${chunk.y}, ${cell},
           ${now}, 0, null, 0)
        on conflict (seat_id) do update
          set holder = ${uid}, snapshot_id = ${snapshotId}, seated_at = ${now},
              defenses = 0, ousted = null, freed_at = 0
      `;
      return true;
    }

    // Restaged rather than retaken: the stand goes on, so the count
    // of what it has turned away stands with it
    await transaction`
      update gym_seats set snapshot_id = ${snapshotId}, seated_at = ${now}
      where seat_id = ${seat} and holder = ${uid}
    `;
    return true;
  });

  if (!written) {
    return null;
  }

  const stored = await readSeat(seat);

  return stored == null ? null : asGymSeatRecord(stored);
}

/**
 * Whether the cell is standing empty. A row with no holder is a seat
 * somebody was beaten out of; no row at all is one nobody has ever
 * taken. Both are free to sit down on
 */
async function isSeatFree(seat: string): Promise<boolean> {
  const row = await readSeatRow(seat);

  return row?.holder == null;
}

/**
 * Give up a seat. It goes back to being empty for whoever walks up
 * next; the snapshot is left where it is, since a battle already
 * fought against it still has to replay
 */
export async function leaveGymSeat(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<boolean> {
  const seat = await resolveSeatCell(x, y, cell, now, offset);

  if (seat == null) {
    return false;
  }

  const gone = await getSql()`
    delete from gym_seats where seat_id = ${seat} and holder = ${uid}
  `;

  return gone.count > 0;
}

/**
 * Whether a challenge is still being fought. One whose battle has an
 * outcome, or whose battle row never landed, is over
 */
async function isChallengeLive(battleId: string): Promise<boolean> {
  const battle = await readBattle(battleId);

  return battle != null && asOutcome(battle.outcome) === BattleOutcome.Unfinished;
}

/**
 * Challenge the party standing on a seat.
 *
 * The challenger's own party is frozen and locked the way a raid
 * freezes one; the holder's copy is fielded as it was seated. A fight
 * already under way is handed back rather than restaged, so walking
 * back in returns to the same one.
 *
 * Resolves the battle id, or null when the cell stages no seat,
 * nobody holds it, the holder is the challenger, or the party will
 * not do
 */
export async function challengeGymSeat(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  now: number,
  offset: number,
): Promise<string | null> {
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const seat = await resolveSeatCell(x, y, cell, now, offset);

  if (seat == null) {
    return null;
  }

  // An empty cell is sat down on rather than fought over
  if (await isSeatFree(seat)) {
    return null;
  }

  const stored = await readSeat(seat);

  if (stored == null) {
    return null;
  }

  const record = asGymSeatRecord(stored);

  // Nobody fights their own stand. A holder who wants a different
  // party on the seat restages it instead
  if (record.holder === uid) {
    return null;
  }

  const open = await getSql()`
    select battle_id from gym_challenges
    where seat_id = ${seat} and challenger = ${uid} and not settled
  `;
  const live = asString(open.at(0)?.battle_id);

  if (live !== '' && (await isChallengeLive(live))) {
    return live;
  }

  // A settled challenge bars this player from the seat for a while.
  // The holder is not there to turn anybody away, so the pacing has
  // to live here rather than in their hands
  const standing = await readStanding(seat, uid, now);

  if (now < standing.cooldownUntil) {
    return null;
  }

  // A pokemon waiting in a raid lobby is spoken for; one already
  // fighting is refused by the freeze
  if (await isAnyCatchQueued(uid, catches)) {
    return null;
  }

  const party = await publishTeamSnapshot(uid, catches, CHALLENGER_ALLIANCE, now);

  if (party == null) {
    return null;
  }

  const battleId = newDocId();
  const staged = await tx(async (transaction) => {
    // Read under a lock: the seat may have changed hands between the
    // walk-up and the acceptance, and what is fought has to be what
    // is actually standing there
    const held = await transaction`
      select holder, snapshot_id from gym_seats where seat_id = ${seat} for update
    `;
    const holder = asString(held.at(0)?.holder);

    if (holder === '' || holder === uid) {
      return false;
    }

    await transaction`
      insert into battles (id, raid_id, species, outcome, started_at, limits)
      values (${battleId}, null, 0, ${BattleOutcome.Unfinished}, ${now}, ${PVP_BATTLE_LIMITS})
    `;

    const rows = [
      {
        battle_id: battleId,
        position: 0,
        snapshot_id: asString(held[0].snapshot_id),
        player: holder,
      },
      { battle_id: battleId, position: 1, snapshot_id: party, player: uid },
    ];

    await transaction`
      insert into battle_teams ${transaction(rows, 'battle_id', 'position', 'snapshot_id', 'player')}
    `;
    // The rolling window and what has been taken inside it survive a
    // restaged challenge: they belong to the pair rather than to any
    // one fight, and resetting them here would be the way around the
    // daily cap
    await transaction`
      insert into gym_challenges (seat_id, challenger, battle_id, held_by, started_at, settled)
      values (${seat}, ${uid}, ${battleId}, ${holder}, ${now}, false)
      on conflict (seat_id, challenger) do update
        set battle_id = ${battleId}, held_by = ${holder}, started_at = ${now}, settled = false
    `;
    return true;
  });

  if (staged) {
    // The challenger has met the seat's party. The holder is not
    // present for it, so nothing is written on their side
    await recordSeenOpponents(battleId, [uid]);
  }

  return staged ? battleId : null;
}

/**
 * What a settled challenge came to
 */
export interface GymSeatResult {
  /**
   * Whether the cell was actually emptied. A win against a seat that
   * changed hands mid-fight is still a win, and still frees nothing:
   * what was beaten is not what is standing there now
   */
  freed: boolean;
  /**
   * Who held it going in
   */
  from: string;
  /**
   * Gold that changed hands, always in the winner's favour: taken off
   * the holder by a challenger who won, or off the challenger by a
   * holder who turned them away. Zero when the loser had nothing, or
   * when the taker has already had their fill of this seat today
   */
  gold: number;
}

/**
 * Settle a fought challenge: a win empties the cell, turns the holder
 * out and strips a share of their purse; a loss adds one to the stand
 * the holder is keeping and hands them the challenger's stake
 * instead. The winner does not inherit the seat — they sit down on it
 * afterwards, like anybody else.
 *
 * The `settled` flag is the whole race — it is set inside the
 * transaction, and only the call that sets it moves anything — so a
 * challenge settles once however many times it is reported, and the
 * gold moves once with it.
 *
 * A seat that has changed hands since the challenge started pays
 * nothing: what was beaten is not what is standing there now.
 *
 * Resolves how it came out, or null when the fight was not this
 * player's, was never finished, or was already settled
 */
export async function settleGymChallenge(uid: string, seat: string): Promise<GymSeatResult | null> {
  const rows = await getSql()`
    select battle_id, held_by from gym_challenges
    where seat_id = ${seat} and challenger = ${uid} and not settled
  `;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }

  const battleId = asString(row.battle_id);
  const battle = await readBattle(battleId);

  if (battle == null || !(await foughtBattle(battleId, uid))) {
    return null;
  }

  const outcome = asOutcome(battle.outcome);

  if (outcome === BattleOutcome.Unfinished) {
    return null;
  }

  const won = outcome === BattleOutcome.Won;
  const from = asString(row.held_by);
  const now = Date.now();
  const settled = await tx(async (transaction) => {
    const claimed = await transaction`
      update gym_challenges set settled = true, settled_at = ${now}
      where seat_id = ${seat} and challenger = ${uid} and not settled
    `;

    if (claimed.count === 0) {
      return null;
    }

    // The loser pays the winner a share of what they hold. A holder
    // who won takes the challenger's stake; a challenger who won
    // strips the holder's. Only the challenger's take is capped —
    // they are the one who chose the fight, and the holder was not
    // there to refuse it
    const gold = won
      ? await strip(transaction, from, uid, await allowance(transaction, seat, uid, now))
      : await strip(transaction, uid, from);

    // Every write below is keyed on the holder the challenge was
    // accepted against. A seat that has changed hands since is not
    // the seat that was fought, so it neither moves nor counts the
    // stand — and the row count is what says so
    if (!won) {
      await transaction`
        update gym_seats set defenses = defenses + 1
        where seat_id = ${seat} and holder = ${from}
      `;
      return { moved: false, gold };
    }

    // The cell is emptied rather than handed over. The winner sits
    // down on it like anybody else, with whatever their party has
    // left after the fight — and the trainer they beat is barred from
    // it for a while, so it is genuinely open
    const freed = await transaction`
      update gym_seats
      set holder = null, snapshot_id = null, seated_at = ${now},
          defenses = 0, ousted = ${from}, freed_at = ${now}
      where seat_id = ${seat} and holder = ${from}
    `;

    return { moved: freed.count > 0, gold };
  });

  if (settled == null) {
    return null;
  }

  // What the taker has stripped off this seat today, so the cap
  // survives the next challenge. Written outside the settling
  // transaction because it is bookkeeping rather than the settlement,
  // and a rolled-over window starts counting again from here
  if (won && settled.gold > 0) {
    await getSql()`
      update gym_challenges
      set window_at = case when ${now} - window_at >= ${SEAT_TAKE_WINDOW} then ${now} else window_at end,
          taken = case when ${now} - window_at >= ${SEAT_TAKE_WINDOW} then ${settled.gold}
                       else taken + ${settled.gold} end
      where seat_id = ${seat} and challenger = ${uid}
    `;
  }

  // The win is counted for the fight rather than for the seat: the
  // challenger beat what was standing there, whoever holds it now
  if (won) {
    await bumpProgress(uid, [[Metric.BattleWins, Foe.GymSeat, 1]]);
  }
  return { freed: settled.moved, from, gold: settled.gold };
}

/**
 * Every seat this player is holding, newest stand first. It is what
 * a profile shows: a seat held is the only lasting mark a fight
 * between players leaves
 */
export async function listHeldSeats(uid: string): Promise<GymSeatRecord[]> {
  const rows = await getSql()`
    select * from gym_seats where holder = ${uid} order by seated_at desc limit 50
  `;

  return rows.map((row) => asGymSeatRecord(toRecord(row)));
}
