import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { readPosition, readPositions } from '../../src/server/positions';

/**
 * Reading where people are standing, against the real database. The
 * page reader answers in one question however many are asked for, so
 * what has to hold is that it says the same as asking one at a time
 * and leaves out anybody who has never walked.
 */

let walker: Actor;
let stayer: Actor;

beforeAll(async () => {
  await clearAll();
  walker = await actor('walker');
  stayer = await actor('stayer');

  await sql`
    insert into positions (player, chunk_x, chunk_y, cell_x, cell_y, moved_at)
    values (${walker.uid}, 3, -4, 5, 6, 1000)
  `;
});

afterAll(async () => {
  await sql.end();
});

describe('where several people are standing', () => {
  it('says what asking one at a time says', async () => {
    const found = await readPositions([walker.uid, stayer.uid]);

    expect(found.get(walker.uid)).toEqual(await readPosition(walker.uid));
    expect(found.get(walker.uid)?.chunkX).toBe(3);
    expect(found.get(walker.uid)?.chunkY).toBe(-4);
    // Somebody who has never walked is left out rather than answered
    // as standing at the origin
    expect(found.has(stayer.uid)).toBe(false);
    expect(await readPosition(stayer.uid)).toBeNull();
  });

  it('asks nothing at all for an empty list', async () => {
    expect((await readPositions([])).size).toBe(0);
  });
});
