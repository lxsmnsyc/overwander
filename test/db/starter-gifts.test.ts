import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import registerData from '../../src/data';
import { GiftKind } from '../../src/auth/gift-record';
import { STARTER_SPECIES, listMysteryGifts } from '../../src/server/gifts';
import { type Actor, actor, clearAll, sql } from './clients';

/**
 * The starter shelf, run against the real database.
 *
 * The list grows: a region added later brings three more, and every
 * database that has ever been signed into already holds the ones
 * before them. An all-or-none write is refused outright by those rows,
 * so the new starters would silently never appear — which is the sort
 * of thing nobody notices until a player asks where theirs is.
 */

let player: Actor;

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('starter-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from gifts`;
});

/** Every gift row on the shelf, by id */
async function shelved(): Promise<string[]> {
  const rows = await sql`select id from gifts order by id`;

  return rows.map((row) => String(row.id));
}

describe('the starter shelf', () => {
  it('stands one gift per starter, and the balls beside them', async () => {
    const listed = await listMysteryGifts(player.uid, 1000);

    expect(await shelved()).toHaveLength(STARTER_SPECIES.length + 1);
    expect(listed).toHaveLength(STARTER_SPECIES.length + 1);

    const species = listed
      .filter((gift) => gift.kind === GiftKind.Catch)
      .map((gift) => gift.species);

    expect(new Set(species)).toEqual(new Set(STARTER_SPECIES));
  });

  it('puts a newly added starter on a shelf already holding the rest', async () => {
    await listMysteryGifts(player.uid, 1000);
    await sql`delete from gifts where id = ${`starter-${STARTER_SPECIES[0]}`}`;
    expect(await shelved()).toHaveLength(STARTER_SPECIES.length);

    const listed = await listMysteryGifts(player.uid, 2000);

    expect(await shelved()).toHaveLength(STARTER_SPECIES.length + 1);
    expect(listed).toHaveLength(STARTER_SPECIES.length + 1);
  });

  it('leaves the ones already standing exactly as they were', async () => {
    await listMysteryGifts(player.uid, 1000);
    const first = await sql`select id, offered_at, gift, encounter from gifts order by id`;

    // A second ask a world away in time: an offer rewritten here would
    // reroll the pokemon every taker after it receives
    await listMysteryGifts(player.uid, 9999);

    expect(await sql`select id, offered_at, gift, encounter from gifts order by id`).toEqual(first);
  });
});
