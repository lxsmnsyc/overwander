import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { FOSSIL_REVIVE_LEVEL } from '../../src/data/overworld/fossil';
import { reviveFossil } from '../../src/server/npcs/fossils';
import { grantItem } from '../../src/server/inventory';

// The scientist stands wherever the test says he does: where he walks is
// the world's business, and what is checked here is the bench itself
vi.mock('../../src/server/npcs/visits', async (original) => {
  const { liveSnapshot } = await import('../../src/server/overworld');

  return {
    ...(await original<Record<string, unknown>>()),
    resolveNpc: (x: number, y: number, _cell: number, now: number, offset: number) =>
      liveSnapshot(x, y, now, offset),
  };
});

let player: Actor;

async function carried(item: Items): Promise<number> {
  const rows = await sql`
    select count from bag_items where player = ${player.uid} and item = ${item}
  `;
  let count = 0;

  for (const row of rows) {
    count += Number(row.count);
  }
  return count;
}

beforeAll(async () => {
  await clearAll();
  player = await actor('fossil-player');
});

afterAll(async () => {
  await sql.end();
});

describe('the Fossil Scientist', () => {
  it('revives a top and a bottom as one pokemon, spending both', async () => {
    await grantItem(player.uid, Items.FossilizedFish, 2);
    await grantItem(player.uid, Items.FossilizedDrake, 2);

    const revived = await reviveFossil(
      player.uid,
      0,
      0,
      0,
      Items.FossilizedFish,
      Items.FossilizedDrake,
      2,
      Date.now(),
      0,
      'en',
    );

    expect(revived).toHaveLength(2);
    for (const one of revived ?? []) {
      expect(one.species).toBe(Species.Dracovish);
      expect(one.level).toBe(FOSSIL_REVIVE_LEVEL);
    }
    expect(await carried(Items.FossilizedFish)).toBe(0);
    expect(await carried(Items.FossilizedDrake)).toBe(0);
  });

  it('refuses a half alone, two tops, and a half without its partner in the bag', async () => {
    await grantItem(player.uid, Items.FossilizedBird, 2);
    await grantItem(player.uid, Items.FossilizedFish, 1);

    const now = Date.now();

    expect(
      await reviveFossil(player.uid, 0, 0, 0, Items.FossilizedBird, null, 1, now, 0, 'en'),
    ).toBeNull();
    expect(
      await reviveFossil(
        player.uid,
        0,
        0,
        0,
        Items.FossilizedBird,
        Items.FossilizedFish,
        1,
        now,
        0,
        'en',
      ),
    ).toBeNull();
    // No Dino carried: the Bird goes back rather than being spent on nothing
    expect(
      await reviveFossil(
        player.uid,
        0,
        0,
        0,
        Items.FossilizedBird,
        Items.FossilizedDino,
        1,
        now,
        0,
        'en',
      ),
    ).toBeNull();
    expect(await carried(Items.FossilizedBird)).toBe(2);
    expect(await carried(Items.FossilizedFish)).toBe(1);
  });

  it('still opens a whole fossil on its own', async () => {
    await grantItem(player.uid, Items.HelixFossil);

    const revived = await reviveFossil(
      player.uid,
      0,
      0,
      0,
      Items.HelixFossil,
      null,
      1,
      Date.now(),
      0,
      'en',
    );

    expect(revived?.[0]?.species).toBe(Species.Omanyte);
    expect(await carried(Items.HelixFossil)).toBe(0);
  });
});
