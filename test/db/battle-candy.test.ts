import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import BattleOutcome from '../../src/auth/battle-outcome';
import { Species } from '../../src/data/ids/species';
import registerData from '../../src/data';
import recordAftermath from '../../src/server/battles';
import { jsonOf } from '../../src/server/db';
import { Moves } from '../../src/data/ids/moves';
import { getCastTime } from '../../src/battle/mechanics/move/timing';
import { PAY_DAY_COINS_PER_LEVEL } from '../../src/battle/moves/pay-day';

/**
 * What a fought team is paid, run against the real database.
 *
 * A win pays the whole party and a loss pays only for what it put
 * down, which is a rule about two rows in two tables and the
 * once-per-battle marker over both. None of it can be read off the
 * code, and the clamp on the reported count least of all.
 */

let player: Actor;

const BATTLE = 'candy-battle';
const MINE = 'candy-mine';
const THEIRS = 'candy-theirs';

/** Two of the player's own, and three standing against them */
const PARTY = [Species.Pidgey, Species.Rattata];
const AGAINST = [Species.Zubat, Species.Geodude, Species.Machop];

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('candy-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from battle_aftermaths`;
  await sql`delete from battle_teams`;
  await sql`delete from battles`;
  await sql`delete from team_snapshots`;
  await sql`delete from bag_candies`;
  await sql`delete from caught`;
});

interface Snapshot {
  caught: string;
  species: number;
  level: number;
  ivs: number;
  nature: number;
  gender: number;
  health: number;
  moves?: number[];
}

function snapshot(id: string, species: Species, moves: Moves[] = []): Snapshot {
  return { caught: id, species, level: 5, ivs: 0, nature: 0, gender: 0, health: 20, moves };
}

/** A battle the player fought, staged the way the server stages one */
async function stage(outcome: BattleOutcome, moves: Moves[] = [], startedAt = 1000): Promise<void> {
  for (const [at] of PARTY.entries()) {
    await sql`insert into caught ${sql(caughtRow(`${MINE}-${at}`, player.uid))}`;
  }
  await sql`
    insert into team_snapshots (id, player, alliance, catches)
    values (${MINE}, ${player.uid}, 0,
            ${jsonOf(
              sql,
              PARTY.map((one, at) => snapshot(`${MINE}-${at}`, one, at === 0 ? moves : [])),
            )})
  `;
  // The other side belongs to nobody, the way a grunt's party does
  await sql`
    insert into team_snapshots (id, player, alliance, catches)
    values (${THEIRS}, null, 1,
            ${jsonOf(
              sql,
              AGAINST.map((one, at) => snapshot(`${THEIRS}-${at}`, one)),
            )})
  `;
  await sql`
    insert into battles (id, raid_id, species, outcome, started_at, limits)
    values (${BATTLE}, null, 0, ${outcome}, ${startedAt}, 0)
  `;
  await sql`
    insert into battle_teams (battle_id, position, snapshot_id, player)
    values (${BATTLE}, 0, ${THEIRS}, null), (${BATTLE}, 1, ${MINE}, ${player.uid})
  `;
}

/** The report a client sends: every one of the party walked out */
function report(coins = 0): {
  caught: string;
  items: never[];
  health: number;
  statuses: number;
  coins: number;
}[] {
  return PARTY.map((_, at) => ({
    caught: `${MINE}-${at}`,
    items: [],
    health: 10,
    statuses: 0,
    coins,
  }));
}

async function candies(): Promise<number> {
  const rows = await sql`select coalesce(sum(count), 0)::int as held from bag_candies`;

  return Number(rows[0]?.held ?? 0);
}

describe('what a fought team is paid', () => {
  it('pays a win for the whole party', async () => {
    await stage(BattleOutcome.Won);

    const earned = await recordAftermath(player.uid, BATTLE, report(), 0);

    // Every pokemon fielded, however the fight went for the other side
    expect(earned.reduce((sum, one) => sum + one.count, 0)).toBe(PARTY.length);
    expect(await candies()).toBe(PARTY.length);
  });

  it('pays a loss only for what it put down', async () => {
    await stage(BattleOutcome.Lost);

    const earned = await recordAftermath(player.uid, BATTLE, report(), 1);

    expect(earned.reduce((sum, one) => sum + one.count, 0)).toBe(1);
    expect(await candies()).toBe(1);
  });

  it('pays a fight given up on nothing at all', async () => {
    await stage(BattleOutcome.Lost);

    const earned = await recordAftermath(player.uid, BATTLE, report(), 0);

    expect(earned).toEqual([]);
    expect(await candies()).toBe(0);
  });

  it('never pays a loss more than the party could have won', async () => {
    await stage(BattleOutcome.Lost);

    // Three stood against two: beating all three is still worth two,
    // since a candy is paid per pokemon fielded rather than per kill
    const earned = await recordAftermath(player.uid, BATTLE, report(), AGAINST.length);

    expect(earned.reduce((sum, one) => sum + one.count, 0)).toBe(PARTY.length);
  });

  it('clamps a report that claims more than stood there', async () => {
    await stage(BattleOutcome.Lost);

    // The count is the client's word, so it is held to the party the
    // server itself staged
    await recordAftermath(player.uid, BATTLE, report(), 9999);

    expect(await candies()).toBe(PARTY.length);
  });

  it('pays one battle once, however often the report arrives', async () => {
    await stage(BattleOutcome.Lost);

    await recordAftermath(player.uid, BATTLE, report(), 1);
    const again = await recordAftermath(player.uid, BATTLE, report(), 1);

    expect(again).toEqual([]);
    expect(await candies()).toBe(1);
  });
});

describe('what a Pay Day report is paid', () => {
  async function gold(): Promise<number> {
    const rows = await sql`select gold from profiles where id = ${player.uid}`;

    return Number(rows[0]?.gold ?? 0);
  }

  it('pays nothing to a party that never knew the move', async () => {
    await stage(BattleOutcome.Won);
    const before = await gold();

    await recordAftermath(player.uid, BATTLE, report(1000), 0);

    expect(await gold()).toBe(before);
  });

  it('pays no more than the casts the fight has had time for', async () => {
    // Started three casts ago on the server's clock, so the one who
    // knows it may claim four uses at level 5, and the other nothing
    const lasted = getCastTime(0) * 3 + 100;

    await stage(BattleOutcome.Won, [Moves.PayDay], Date.now() - lasted);
    const before = await gold();

    await recordAftermath(player.uid, BATTLE, report(1_000_000), 0);

    expect((await gold()) - before).toBe(PAY_DAY_COINS_PER_LEVEL * 5 * 4);
  });
});
