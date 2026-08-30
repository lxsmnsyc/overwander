import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { Species } from '../../src/data/ids/species';
import registerData from '../../src/data';
import { getCatchCandy } from '../../src/auth/candy-rules';
import { getSpeciesData } from '../../src/data/species';
import { releaseCatch, releaseCatches, setCatchMarks } from '../../src/server/caught';
import { Items } from '../../src/data/ids/items';

/**
 * Letting several go at once, and marking several at once, run against
 * the real database.
 *
 * The rules a batch has to keep are the ones a single release keeps,
 * held across the whole run: a refusal steps over one pokemon rather
 * than failing the rest, the candy and the held items still move, and
 * the player is still never left with nothing.
 */

let player: Actor;

/** Two families, so the candy can be checked per pile */
const KIND: Record<string, Species> = {
  a: Species.Pidgey,
  b: Species.Pidgey,
  c: Species.Rattata,
  d: Species.Rattata,
};

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('bulk-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from bag_items`;
  await sql`delete from bag_candies`;
  await sql`delete from caught_items`;
  await sql`delete from caught`;
});

/** One of the player's, named by its key, with whatever marks it carries */
async function put(
  key: string,
  marks: { favorite?: boolean; guarded?: boolean; lockedAt?: number; items?: Items[] } = {},
): Promise<string> {
  const id = `bulk-${key}`;

  await sql`insert into caught ${sql({
    ...caughtRow(id, player.uid),
    species: KIND[key] ?? Species.Pidgey,
    favorite: marks.favorite ?? false,
    guarded: marks.guarded ?? false,
    locked_at: marks.lockedAt ?? 0,
  })}`;

  // What it holds is a table of its own, a row per slot
  for (const [slot, item] of (marks.items ?? []).entries()) {
    await sql`
      insert into caught_items (caught_id, slot, item) values (${id}, ${slot}, ${item})
    `;
  }
  return id;
}

async function remaining(): Promise<string[]> {
  const rows = await sql`select id from caught where owner = ${player.uid} order by id`;

  return rows.map((row) => String(row.id));
}

async function candyFor(species: Species): Promise<number> {
  const { family } = getSpeciesData(species);
  const rows = await sql`
    select count from bag_candies where player = ${player.uid} and family = ${family}
  `;

  return Number(rows.at(0)?.count ?? 0);
}

async function bagCount(item: Items): Promise<number> {
  const rows = await sql`
    select count from bag_items where player = ${player.uid} and item = ${item}
  `;

  return Number(rows.at(0)?.count ?? 0);
}

describe('letting several go at once', () => {
  it('pays each family its own candy and hands the items back', async () => {
    await put('a', { items: [Items.Potion, Items.Potion] });
    await put('b');
    await put('c');
    await put('d');

    const outcome = await releaseCatches(player.uid, ['bulk-a', 'bulk-b', 'bulk-c']);

    expect(outcome.done).toEqual(['bulk-a', 'bulk-b', 'bulk-c']);
    expect(outcome.refused).toEqual([]);
    expect(await remaining()).toEqual(['bulk-d']);
    // Two Pidgey and one Rattata, each paying what meeting it pays
    expect(await candyFor(Species.Pidgey)).toBe(getCatchCandy(Species.Pidgey) * 2);
    expect(await candyFor(Species.Rattata)).toBe(getCatchCandy(Species.Rattata));
    // The belt was the player's all along, so it comes back whole
    expect(await bagCount(Items.Potion)).toBe(2);
  });

  it('stops one short rather than emptying the box', async () => {
    await put('a');
    await put('b');
    await put('c');

    const outcome = await releaseCatches(player.uid, ['bulk-a', 'bulk-b', 'bulk-c']);

    expect(outcome.done).toEqual(['bulk-a', 'bulk-b']);
    expect(outcome.refused).toEqual(['bulk-c']);
    expect(await remaining()).toEqual(['bulk-c']);
  });

  it('steps over a favorite, a locked one and a fighting one', async () => {
    await put('a', { favorite: true });
    await put('b', { guarded: true });
    await put('c', { lockedAt: Date.now() });
    await put('d');

    const outcome = await releaseCatches(player.uid, ['bulk-a', 'bulk-b', 'bulk-c', 'bulk-d']);

    expect(outcome.done).toEqual(['bulk-d']);
    expect(outcome.refused).toEqual(['bulk-a', 'bulk-b', 'bulk-c']);
    expect(await remaining()).toEqual(['bulk-a', 'bulk-b', 'bulk-c']);
  });

  it('refuses a pokemon that is not theirs', async () => {
    await put('a');
    await put('b');
    await sql`insert into caught ${sql(caughtRow('bulk-theirs', null))}`;

    const outcome = await releaseCatches(player.uid, ['bulk-theirs']);

    expect(outcome.done).toEqual([]);
    expect(outcome.refused).toEqual(['bulk-theirs']);
  });
});

describe('a locked pokemon and release', () => {
  // Locking says "leave it alone", and release is the one act that
  // cannot be undone. The sheet's button has always refused it; the
  // server used to allow it
  it('is refused one at a time as well as in a batch', async () => {
    await put('a', { guarded: true });
    await put('b');

    expect(await releaseCatch(player.uid, 'bulk-a')).toBe(false);
    expect(await releaseCatch(player.uid, 'bulk-b')).toBe(true);
    expect(await remaining()).toEqual(['bulk-a']);
  });
});

describe('marking several at once', () => {
  it('marks a run and takes the mark off again', async () => {
    await put('a');
    await put('b');
    await put('c');

    const on = await setCatchMarks(player.uid, ['bulk-a', 'bulk-b'], 'favorite', true);

    expect(on.done).toEqual(['bulk-a', 'bulk-b']);

    const rows = await sql`select id, favorite from caught where owner = ${player.uid} order by id`;

    expect(rows.map((row) => Boolean(row.favorite))).toEqual([true, true, false]);

    const off = await setCatchMarks(player.uid, ['bulk-a', 'bulk-b'], 'favorite', false);

    expect(off.done).toEqual(['bulk-a', 'bulk-b']);

    const after = await sql`select favorite from caught where owner = ${player.uid} order by id`;

    expect(after.map((row) => Boolean(row.favorite))).toEqual([false, false, false]);
  });

  it('locks a run, and a locked one may still be unlocked', async () => {
    await put('a', { guarded: true });
    await put('b');

    const outcome = await setCatchMarks(player.uid, ['bulk-a', 'bulk-b'], 'guarded', false);

    expect(outcome.done).toEqual(['bulk-a', 'bulk-b']);

    const rows = await sql`select guarded from caught where owner = ${player.uid} order by id`;

    expect(rows.map((row) => Boolean(row.guarded))).toEqual([false, false]);
  });

  it('refuses one that is fighting', async () => {
    await put('a', { lockedAt: Date.now() });
    await put('b');

    const outcome = await setCatchMarks(player.uid, ['bulk-a', 'bulk-b'], 'favorite', true);

    expect(outcome.done).toEqual(['bulk-b']);
    expect(outcome.refused).toEqual(['bulk-a']);
  });
});
