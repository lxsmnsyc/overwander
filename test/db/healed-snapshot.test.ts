import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { getMaxHealth } from '../../src/auth/health';
import { asCatchSnapshot } from '../../src/auth/catch-snapshot';
import { publishTeamSnapshot } from '../../src/server/raids';

/**
 * A party frozen healthy, the way a duel fields one, run against the
 * real database: whatever the overworld left of it does not come in.
 */

let player: Actor;

beforeAll(async () => {
  await clearAll();
  player = await actor('healed-player');
  // One worn down and poisoned, and one fainted outright
  await sql`insert into caught ${sql({ ...caughtRow('healed-hurt', player.uid), health: 3, statuses: 1 })}`;
  await sql`insert into caught ${sql({ ...caughtRow('healed-down', player.uid), health: 0 })}`;
});

afterAll(async () => {
  await sql.end();
});

async function frozen(id: string | null): Promise<ReturnType<typeof asCatchSnapshot>[]> {
  const rows = await sql<{ catches: unknown[] }[]>`
    select catches from team_snapshots where id = ${id ?? ''}
  `;
  const found: ReturnType<typeof asCatchSnapshot>[] = [];

  for (const row of rows) {
    for (const one of row.catches) {
      found.push(asCatchSnapshot(one));
    }
  }
  return found;
}

describe('a party frozen healthy', () => {
  it('fields everyone at full health with nothing on them, the fainted too', async () => {
    const id = await publishTeamSnapshot(
      player.uid,
      ['healed-hurt', 'healed-down'],
      0,
      Date.now(),
      {
        healed: true,
      },
    );
    const catches = await frozen(id);

    expect(catches.map((one) => one.caught)).toEqual(['healed-hurt', 'healed-down']);
    for (const one of catches) {
      expect(one.health).toBe(getMaxHealth(one));
      expect(one.statuses).toBe(0);
    }
  });

  it('leaves the stored health alone', async () => {
    const rows = await sql<{ id: string; health: number }[]>`
      select id, health from caught where id in ('healed-hurt', 'healed-down') order by id
    `;

    expect(rows).toEqual([
      { id: 'healed-down', health: 0 },
      { id: 'healed-hurt', health: 3 },
    ]);
  });
});
