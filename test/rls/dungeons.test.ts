import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import registerData from '../../src/data';
import type { DungeonRun } from '../../src/auth/dungeon-record';
import Landmark from '../../src/data/overworld/landmark';
import getWorld from '../../src/overworld/current';
import { DIRECTIONS } from '../../src/overworld/dungeon/floor';
import {
  beginDungeonRun,
  enterDungeon,
  leaveDungeonRun,
  moveInDungeon,
} from '../../src/server/dungeons';
import { useRareCandy } from '../../src/server/candy';
import { visitNurse } from '../../src/server/npcs/nurse';

// Nurse Joy stands wherever the test says she does
vi.mock('../../src/server/npcs/visits', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  resolveNpc: () => ({}),
}));

const OFFSET = 480;

let player: Actor;

/** The first hideout out in the country, somewhere near the origin */
function findHideout(): { x: number; y: number; cell: number } {
  const world = getWorld();

  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 16; y++) {
      for (const [cell, landmark] of world.getChunk(x, y).getLandmarkCells()) {
        if (landmark === Landmark.Hideout) {
          return { x, y, cell };
        }
      }
    }
  }
  throw new Error('No hideout near the origin');
}

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('dungeon-player');
});

afterAll(async () => {
  await sql.end();
});

describe('a dungeon run', () => {
  it('locks a party in, walks the floor, and keeps every heal but medicine off it', async () => {
    const { x, y, cell } = findHideout();
    const entry = await enterDungeon(player.uid, x, y, cell, Date.now(), OFFSET);

    if (entry == null || typeof entry === 'string') {
      throw new Error(`No run to walk: ${String(entry)}`);
    }

    const run: DungeonRun = entry;

    // Hurt before it goes in, so there is something for a heal to do
    await sql`insert into caught ${sql({ ...caughtRow('run-member', player.uid), health: 5 })}`;
    await sql`insert into caught ${sql({ ...caughtRow('run-other', player.uid), health: 5 })}`;

    const started = await beginDungeonRun(player.uid, run.id, ['run-member'], Date.now());

    expect(started?.state).not.toBeNull();
    expect(started?.party).toEqual(['run-member']);

    // Somewhere to step from the entry: the floor is finishable, so a way out exists
    let stepped = null;

    for (const direction of DIRECTIONS) {
      stepped ??= await moveInDungeon(player.uid, run.id, direction, Date.now());
    }
    expect(stepped).not.toBeNull();
    expect(stepped?.run.state?.at).not.toBe(started?.state?.at);

    // The nurse tends the one outside the run and leaves the one in it
    const tended = await visitNurse(
      player.uid,
      0,
      0,
      0,
      ['run-member', 'run-other'],
      Date.now(),
      OFFSET,
    );

    expect(tended).toEqual(['run-other']);
    // And a candy's level, which mends, is refused
    expect(await useRareCandy(player.uid, 'run-member')).toBeNull();

    // Walking out frees the party
    const left = await leaveDungeonRun(player.uid, run.id);

    expect(left?.state).toBeNull();
    expect(await visitNurse(player.uid, 0, 0, 0, ['run-member'], Date.now(), OFFSET)).toEqual([
      'run-member',
    ]);
  });
});
