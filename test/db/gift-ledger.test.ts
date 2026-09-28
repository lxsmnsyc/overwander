import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { GiftKind } from '../../src/auth/gift-record';
import { Items } from '../../src/data/ids/items';
import registerData from '../../src/data';
import { QUEST_GIFT, ROTATION_GIFT, giftId, listAllGifts } from '../../src/server/gifts';
import { jsonOf } from '../../src/server/db';

/**
 * What the dashboard's gift ledger shows, run against the real
 * database.
 *
 * Quest rewards and the daily and weekly rotations are paid through
 * the gift rows, one per quest or slot per player, so a live game
 * writes far more of them than staff ever will. The ledger leaves them
 * out, and the rule is a prefix on the id, which is exactly the sort
 * of thing that stops being true quietly.
 */

let player: Actor;

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('ledger-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from gifts`;
});

/** One gift row under whatever id the caller names */
async function put(id: string, reason: string): Promise<void> {
  await sql`
    insert into gifts (id, player, offered_at, gift)
    values (${id}, ${player.uid}, 1000, ${jsonOf(sql, {
      kind: GiftKind.Item,
      id,
      reason,
      expiresAt: null,
      item: Items.Potion,
      amount: 1,
    })})
  `;
}

async function reasons(): Promise<string[]> {
  return (await listAllGifts(2000)).map((row) => row.gift.reason).sort();
}

describe('the dashboard gift ledger', () => {
  it('leaves what the game paid out, and keeps everything else', async () => {
    await put(giftId('staff-abc123', player.uid), 'By hand.');
    await put(giftId(`${QUEST_GIFT}7-1000`, player.uid), 'Quest: First Steps.');
    await put(giftId(`${ROTATION_GIFT}3-0-1000`, player.uid), 'Daily: Take a Walk.');
    await put(giftId(`${ROTATION_GIFT}2026-W01-0-0`, player.uid), 'Hunt: Fill the Dex.');
    await put('open-for-everybody', 'Open to all.');

    expect(await reasons()).toEqual(['By hand.', 'Open to all.']);
  });

  it('leaves an open quest gift out too, id and all', async () => {
    // The prefix is on the row id rather than on the player half, so a
    // quest reward with nobody's name on it is caught the same way
    await put(`${QUEST_GIFT}9-1000`, 'Quest: with no owner.');
    await put('staff-plain', 'By hand.');

    expect(await reasons()).toEqual(['By hand.']);
  });

  it('does not catch a gift that merely mentions a quest', async () => {
    // The rule is the id, not the sentence: staff writing "quest" or
    // "daily" in a reason must not vanish from their own ledger
    await put(giftId('staff-xyz', player.uid), 'Quest: written by hand as a make-good.');
    await put(giftId('staff-zyx', player.uid), 'Daily: written by hand as a make-good.');

    expect(await reasons()).toEqual([
      'Daily: written by hand as a make-good.',
      'Quest: written by hand as a make-good.',
    ]);
  });
});
