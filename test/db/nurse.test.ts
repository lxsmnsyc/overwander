import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { visitNurse } from '../../src/server/npcs/nurse';
import registerData from '../../src/data';

// Nurse Joy stands wherever the test says she does: where she walks is
// the world's business, and what is checked here is the heal itself
vi.mock('../../src/server/npcs/visits', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  resolveNpc: () => ({}),
}));

let player: Actor;

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('nurse-player');
});

afterAll(async () => {
  await sql.end();
});

describe('Nurse Joy', () => {
  it('heals several parties at once on a pool that has just opened', async () => {
    // Several at once is what opens several connections together, and
    // a connection that had not learned array types yet refused the read
    const visits: Promise<string[] | null>[] = [];

    for (let party = 0; party < 4; party += 1) {
      const fainted = `nurse-${party}-fainted`;
      const hurt = `nurse-${party}-hurt`;

      await sql`insert into caught ${sql({ ...caughtRow(fainted, player.uid), health: 0 })}`;
      await sql`insert into caught ${sql({ ...caughtRow(hurt, player.uid), health: 5 })}`;
      visits.push(visitNurse(player.uid, 0, 0, 0, [fainted, hurt], Date.now(), 480));
    }

    for (const tended of await Promise.all(visits)) {
      expect(tended).toHaveLength(2);
    }

    const rows = await sql`select health from caught where id like 'nurse-%'`;

    for (const row of rows) {
      expect(Number(row.health)).toBeGreaterThan(5);
    }
  });
});
