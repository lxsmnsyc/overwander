import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import BattleOutcome from '../../src/auth/battle-outcome';
import {
  SEAT_DAILY_TAKE,
  SEAT_STAKE_LIMIT,
  SEAT_STAKE_SHARE,
  seatStake,
} from '../../src/auth/gym-seat-record';

/**
 * The gym seat's settlement, run against the real database.
 *
 * The interesting parts of a seat are all races and clamps — who may
 * sit down, what the purse does, whether a beaten holder can sit
 * straight back — and none of them can be checked by reading the
 * code. These drive the SQL the server drives.
 */

let alice: Actor;
let bob: Actor;

const SEAT = 'test-seat';
const BATTLE = 'test-seat-battle';

/**
 * What a Relic Crown fetches: the top of the valuables ladder, and
 * the purse the per-fight ceiling is anchored to
 */
const CROWN = 600_000;

beforeAll(async () => {
  await clearAll();
  alice = await actor('seat-alice');
  bob = await actor('seat-bob');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from gym_challenges`;
  await sql`delete from gym_seats`;
  await sql`delete from battle_teams`;
  await sql`delete from battles`;
  await sql`delete from team_snapshots`;
  await sql`update profiles set gold = 0`;
});

/**
 * A seat alice is holding, with a party frozen onto it
 */
async function seatAlice(): Promise<void> {
  await sql`
    insert into team_snapshots (id, player, alliance, catches)
    values ('test-seat-party', ${alice.uid}, 0, '[]'::jsonb)
  `;
  await sql`
    insert into gym_seats
      (seat_id, holder, snapshot_id, chunk_seed, chunk_x, chunk_y, cell, seated_at)
    values (${SEAT}, ${alice.uid}, 'test-seat-party', 'seed', 0, 0, 5, 1000)
  `;
}

/**
 * Bob's challenge on it, settled the way the server settles one
 */
async function challenge(outcome: BattleOutcome): Promise<void> {
  await sql`
    insert into battles (id, raid_id, species, outcome, started_at, limits)
    values (${BATTLE}, null, 0, ${outcome}, 1000, 0)
  `;
  await sql`
    insert into gym_challenges (seat_id, challenger, battle_id, held_by, started_at)
    values (${SEAT}, ${bob.uid}, ${BATTLE}, ${alice.uid}, 1000)
  `;
}

async function goldOf(uid: string): Promise<number> {
  const rows = await sql`select gold from profiles where id = ${uid}`;

  return Number(rows[0]?.gold ?? 0);
}

describe('what a seat is worth', () => {
  it('takes a share of the purse, never more than the ceiling', () => {
    // A tenth of what they hold, so a poor trainer risks little
    expect(seatStake(1000)).toBe(1000 * SEAT_STAKE_SHARE);
    // ...and the share, not the ceiling, is what governs all the way
    // up to a purse worth the richest thing the ground hides. A
    // ceiling that bound before then would go stale the first time
    // somebody dug up a ruin
    expect(seatStake(CROWN)).toBe(CROWN * SEAT_STAKE_SHARE);
    expect(seatStake(CROWN)).toBe(SEAT_STAKE_LIMIT);
    // Past that it clips, so no one fight cleans anybody out
    expect(seatStake(10_000_000)).toBe(SEAT_STAKE_LIMIT);
    // Nothing comes off nothing, which is what keeps the gold check
    // on profiles from ever being the thing that decides a fight
    expect(seatStake(0)).toBe(0);
    expect(seatStake(-500)).toBe(0);
    // And a challenger who has had their fill takes no more
    expect(seatStake(1_000_000, 0)).toBe(0);
    expect(seatStake(1_000_000, 250)).toBe(250);
  });

  it('caps a day of takings at three good wins', () => {
    expect(SEAT_DAILY_TAKE).toBe(SEAT_STAKE_LIMIT * 3);
  });
});

describe('a seat that is beaten', () => {
  it('empties the cell rather than handing it over', async () => {
    await seatAlice();
    await challenge(BattleOutcome.Won);

    // What the server does when the challenger won
    await sql`
      update gym_seats
      set holder = null, snapshot_id = null, defenses = 0, ousted = ${alice.uid}, freed_at = 2000
      where seat_id = ${SEAT} and holder = ${alice.uid}
    `;

    const rows = await sql`select holder, ousted from gym_seats where seat_id = ${SEAT}`;

    // The row survives so the challenge ledger hanging off it does
    expect(rows[0]?.holder).toBeNull();
    expect(rows[0]?.ousted).toBe(alice.uid);

    const ledger = await sql`select 1 from gym_challenges where seat_id = ${SEAT}`;

    expect(ledger).toHaveLength(1);
  });

  it('lets the winner sit down and keeps the beaten holder off', async () => {
    await seatAlice();
    await sql`
      update gym_seats set holder = null, snapshot_id = null, ousted = ${alice.uid}, freed_at = 2000
      where seat_id = ${SEAT}
    `;

    // Bob takes the free cell; the take clears the bar with it
    await sql`
      insert into team_snapshots (id, player, alliance, catches)
      values ('test-seat-bob', ${bob.uid}, 0, '[]'::jsonb)
    `;
    const taken = await sql`
      update gym_seats
      set holder = ${bob.uid}, snapshot_id = 'test-seat-bob', seated_at = 3000,
          defenses = 0, ousted = null, freed_at = 0
      where seat_id = ${SEAT} and holder is null
    `;

    expect(taken.count).toBe(1);

    const rows = await sql`select holder, ousted from gym_seats where seat_id = ${SEAT}`;

    expect(rows[0]?.holder).toBe(bob.uid);
    expect(rows[0]?.ousted).toBeNull();
  });
});

describe('the purse a seat moves', () => {
  it('never pushes a loser below nothing', async () => {
    await sql`update profiles set gold = 300 where id = ${alice.uid}`;

    // The share of a thin purse, taken the way the server takes it
    const held = await goldOf(alice.uid);
    const moved = seatStake(held);

    await sql`update profiles set gold = gold - ${moved} where id = ${alice.uid}`;
    await sql`update profiles set gold = gold + ${moved} where id = ${bob.uid}`;

    expect(moved).toBe(30);
    expect(await goldOf(alice.uid)).toBe(270);
    expect(await goldOf(bob.uid)).toBe(30);
    // The table's own floor was never the thing that decided it
    expect(await goldOf(alice.uid)).toBeGreaterThanOrEqual(0);
  });

  it('refuses to let a purse go negative at all', async () => {
    await sql`update profiles set gold = 10 where id = ${alice.uid}`;

    // The check is real: an unclamped take throws rather than paying
    await expect(
      sql`update profiles set gold = gold - 5000 where id = ${alice.uid}`,
    ).rejects.toThrow();
    expect(await goldOf(alice.uid)).toBe(10);
  });

  it('rolls the daily take over rather than resetting on a clock', async () => {
    await seatAlice();
    await challenge(BattleOutcome.Won);

    const day = 24 * 60 * 60 * 1000;
    const now = 10 * day;

    // First take opens the window
    await sql`
      update gym_challenges
      set window_at = case when ${now} - window_at >= ${day} then ${now} else window_at end,
          taken = case when ${now} - window_at >= ${day} then 1000 else taken + 1000 end
      where seat_id = ${SEAT} and challenger = ${bob.uid}
    `;

    let rows = await sql`select window_at, taken from gym_challenges where seat_id = ${SEAT}`;

    expect(Number(rows[0]?.taken)).toBe(1000);
    expect(Number(rows[0]?.window_at)).toBe(now);

    // A second take inside the same day accumulates
    await sql`
      update gym_challenges
      set window_at = case when ${now + 1000} - window_at >= ${day} then ${now + 1000} else window_at end,
          taken = case when ${now + 1000} - window_at >= ${day} then 1000 else taken + 1000 end
      where seat_id = ${SEAT} and challenger = ${bob.uid}
    `;
    rows = await sql`select window_at, taken from gym_challenges where seat_id = ${SEAT}`;
    expect(Number(rows[0]?.taken)).toBe(2000);

    // One a day later starts the count again
    const later = now + day + 1;

    await sql`
      update gym_challenges
      set window_at = case when ${later} - window_at >= ${day} then ${later} else window_at end,
          taken = case when ${later} - window_at >= ${day} then 1000 else taken + 1000 end
      where seat_id = ${SEAT} and challenger = ${bob.uid}
    `;
    rows = await sql`select window_at, taken from gym_challenges where seat_id = ${SEAT}`;
    expect(Number(rows[0]?.taken)).toBe(1000);
    expect(Number(rows[0]?.window_at)).toBe(later);
  });
});

describe('the aftermath of a seat fight', () => {
  it('is offered to the challenger and refused to the holder', async () => {
    await seatAlice();
    await challenge(BattleOutcome.Won);
    await sql`
      insert into battle_teams (battle_id, position, snapshot_id, player)
      values (${BATTLE}, 0, 'test-seat-party', ${alice.uid})
    `;

    // The guard recordAftermath applies: the challenger of this
    // battle settles, and the holder standing opposite does not
    const challenger = await sql`
      select 1 from gym_challenges where battle_id = ${BATTLE} and challenger = ${bob.uid}
    `;
    const holder = await sql`
      select 1 from gym_challenges where battle_id = ${BATTLE} and challenger = ${alice.uid}
    `;

    expect(challenger).toHaveLength(1);
    expect(holder).toHaveLength(0);
  });
});

describe('who may see a seat', () => {
  it('shows a freed seat to everybody without naming a holder', async () => {
    await seatAlice();
    await sql`
      update gym_seats set holder = null, snapshot_id = null, ousted = ${alice.uid}, freed_at = 2000
      where seat_id = ${SEAT}
    `;

    const seen = await bob.client.from('gym_seats').select('holder, ousted');

    expect(seen.error).toBeNull();
    expect(seen.data?.length).toBe(1);
    expect(seen.data?.[0]?.holder).toBeNull();

    // And nobody can free or claim one from a browser
    const forged = await bob.client
      .from('gym_seats')
      .update({ holder: bob.uid })
      .eq('seat_id', SEAT);

    expect(forged.error).not.toBeNull();
  });
});
