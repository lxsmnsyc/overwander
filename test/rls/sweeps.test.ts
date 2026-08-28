import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { dailyWindow, weeklyWindow } from '../../src/data/quests/rotations';
import registerData from '../../src/data';
import { listRotations } from '../../src/server/rotations';

/**
 * The two things that clear away what a rolled window left behind.
 *
 * Both are about rows nothing can reach any more: a rotation window
 * key is derived from the date, and a claim marker's key embeds the
 * window it belongs to, so once either has rolled no query will ever
 * name that row again. Neither sweep can be read off the code, since
 * what matters is which rows survive a real one.
 */

let player: Actor;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 28, 12);

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('sweep-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from rotation_baselines`;
  await sql`delete from rotation_claims`;
  await sql`delete from berry_claims`;
  await sql`delete from cache_claims`;
  await sql`delete from quest_progress`;
  await sql`delete from encounters`;
  await sql`delete from rocket_stops`;
});

async function windows(table: 'rotation_baselines' | 'rotation_claims'): Promise<string[]> {
  const rows =
    table === 'rotation_baselines'
      ? await sql`select window_key from rotation_baselines order by window_key`
      : await sql`select window_key from rotation_claims order by window_key`;

  return rows.map((row) => String(row.window_key));
}

describe('the rotation board', () => {
  it('forgets the windows that have rolled past', async () => {
    const stale = dailyWindow(NOW - 30 * DAY);
    const staleWeek = weeklyWindow(NOW - 30 * DAY);

    await sql`
      insert into rotation_baselines (player, window_key, slot, baseline)
      values (${player.uid}, ${stale}, 0, 5), (${player.uid}, ${staleWeek}, 0, 5)
    `;
    await sql`
      insert into rotation_claims (player, window_key, slot, claimed_at)
      values (${player.uid}, ${stale}, 0, 1000)
    `;

    await listRotations(player.uid, NOW);

    // Today's board wrote its own baselines and took the old ones with
    // it: a month of dailies is a month of rows no query can name
    expect(await windows('rotation_baselines')).not.toContain(stale);
    expect(await windows('rotation_baselines')).not.toContain(staleWeek);
    expect(await windows('rotation_claims')).toEqual([]);
    // ...and today's are all that is left
    for (const key of await windows('rotation_baselines')) {
      expect([dailyWindow(NOW), weeklyWindow(NOW)]).toContain(key);
    }
  });

  it(`leaves this week's rows alone when only the day turned`, async () => {
    // Yesterday's daily is gone; the weekly it sits inside is not
    const week = weeklyWindow(NOW);

    await sql`
      insert into rotation_baselines (player, window_key, slot, baseline)
      values (${player.uid}, ${dailyWindow(NOW - DAY)}, 0, 3), (${player.uid}, ${week}, 0, 3)
    `;

    await listRotations(player.uid, NOW);

    const left = await windows('rotation_baselines');

    expect(left).toContain(week);
    expect(left).not.toContain(dailyWindow(NOW - DAY));
  });

  it('does not sweep on every look, only on the first of the day', async () => {
    await listRotations(player.uid, NOW);

    // A second read finds today's baselines already written, so it
    // has nothing to turn over and does not go looking
    await sql`
      insert into rotation_baselines (player, window_key, slot, baseline)
      values (${player.uid}, 'd-planted', 9, 0)
    `;
    await listRotations(player.uid, NOW);

    expect(await windows('rotation_baselines')).toContain('d-planted');
  });
});

describe('the claim markers', () => {
  it('stamps every kind with when it was written', async () => {
    // The column the sweep reads. Cache claims always carried one;
    // the rest were carrying their window inside the marker text
    for (const table of [
      'cache_claims',
      'berry_claims',
      'nest_claims',
      'phenomenon_claims',
      'npc_claims',
    ]) {
      const rows = await sql`
        select 1 from information_schema.columns
        where table_name = ${table} and column_name = 'claimed_at'
      `;

      expect(rows, table).toHaveLength(1);
    }
  });

  it('takes the markers a day past their window and leaves the rest', async () => {
    const cutoff = `(extract(epoch from now()) * 1000)::bigint - 86400000`;

    await sql`
      insert into berry_claims (marker, player, item, amount, claimed_at)
      values ('old', ${player.uid}, 1, 1, 0),
             ('fresh', ${player.uid}, 1, 1, (extract(epoch from now()) * 1000)::bigint)
    `;
    // The sweep's own statement, run the way the schedule runs it
    await sql.unsafe(`delete from berry_claims where claimed_at < ${cutoff}`);

    const left = await sql`select marker from berry_claims`;

    expect(left.map((row) => String(row.marker))).toEqual(['fresh']);
  });

  it(`takes a cache's items down with it`, async () => {
    await sql`
      insert into cache_claims (marker, player, claimed_at) values ('old', ${player.uid}, 0)
    `;
    await sql`
      insert into cache_claim_items (marker, player, item, amount)
      values ('old', ${player.uid}, 1, 2)
    `;
    await sql.unsafe(
      `delete from cache_claims where claimed_at < (extract(epoch from now()) * 1000)::bigint - 86400000`,
    );

    // The child cascades, so the sweep needs no statement for it
    expect(await sql`select 1 from cache_claim_items`).toHaveLength(0);
  });

  it('is on the schedule', async () => {
    const jobs = await sql`select jobname from cron.job where jobname = 'sweep-claim-markers'`;

    expect(jobs).toHaveLength(1);
  });
});

describe('the encounters a window staged', () => {
  const cutoff = '(extract(epoch from now()) * 1000)::bigint - 86400000';

  async function stage(spawn: string, type: number, windowAt: string): Promise<void> {
    await sql`
      insert into encounters
        (spawn_id, player, type, species, level, individual_value, trait_value, ivs,
         nature, ability, gender, shiny, shadow, window_at, x, y, biome)
      values (${spawn}, ${player.uid}, ${type}, 1, 5, 0, 0, 0, 0, 0, 0, false, false,
              ${sql.unsafe(windowAt)}, 0, 0, 0)
    `;
  }

  it('takes the wild ones a day past their window', async () => {
    await stage('wild-old', 0, '0');
    await stage('wild-now', 0, '(extract(epoch from now()) * 1000)::bigint');
    await sql.unsafe(`delete from encounters where type = 0 and window_at < ${cutoff}`);

    const left = await sql`select spawn_id from encounters`;

    expect(left.map((row) => String(row.spawn_id))).toEqual(['wild-now']);
  });

  it(`never takes a gift, a raid prize or a grunt's shadow`, async () => {
    // Keyed by the gift or the raid rather than by a spawn, and owed
    // to the player however long they leave it
    await stage('gift', 3, '0');
    await stage('raid', 2, '0');
    await stage('rocket', 4, '0');
    await stage('hatched', 1, '0');
    await sql.unsafe(`delete from encounters where type = 0 and window_at < ${cutoff}`);

    expect(await sql`select 1 from encounters`).toHaveLength(4);
  });

  it(`takes an encounter's moves down with it`, async () => {
    await stage('wild-old', 0, '0');
    await sql`
      insert into encounter_moves (spawn_id, player, slot, move)
      values ('wild-old', ${player.uid}, 0, 1)
    `;
    await sql.unsafe(`delete from encounters where type = 0 and window_at < ${cutoff}`);

    expect(await sql`select 1 from encounter_moves`).toHaveLength(0);
  });

  it('is on the schedule with the stops', async () => {
    const jobs = await sql`select jobname from cron.job where jobname = 'sweep-stale-encounters'`;

    expect(jobs).toHaveLength(1);
  });
});
