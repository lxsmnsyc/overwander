import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { Items } from '../../src/data/ids/items';
import { ITEM_STACKS } from '../../src/auth/stacks';
import { WORLD_GENERATION } from '../../src/overworld/current';
import { type ClaimPayment, claim } from '../../src/server/overworld/claims';
import { grantStacksIn } from '../../src/server/stacks';

/**
 * A claim and what it pays are one transaction: a marker never stands
 * without its payout, and a payout never lands without its marker
 */

let player: Actor;
let marker = 0;

beforeAll(async () => {
  await clearAll();
  player = await actor('claimer');
});

afterAll(async () => {
  await sql.end();
});

async function markers(id: string): Promise<number> {
  const rows = await sql`
    select 1 from berry_claims
    where generation = ${WORLD_GENERATION} and marker = ${id} and player = ${player.uid}
  `;

  return rows.length;
}

async function carried(item: Items): Promise<number> {
  const rows =
    await sql`select count from bag_items where player = ${player.uid} and item = ${item}`;

  return rows.length === 0 ? 0 : Number(rows[0].count);
}

function nextMarker(): string {
  marker += 1;
  return `claims-test-${marker}`;
}

describe('a claim and its payment', () => {
  it('lands together', async () => {
    const id = nextMarker();
    const before = await carried(Items.OranBerry);
    const record = { player: player.uid, item: Items.OranBerry, amount: 3 };

    expect(
      await claim('berry_claims', id, record, async (transaction) => {
        await grantStacksIn(transaction, ITEM_STACKS, player.uid, [[Items.OranBerry, 3]]);
        return true;
      }),
    ).toBe(true);
    expect(await markers(id)).toBe(1);
    expect(await carried(Items.OranBerry)).toBe(before + 3);
  });

  it('pays once, however often it is asked', async () => {
    const id = nextMarker();
    const before = await carried(Items.OranBerry);
    const record = { player: player.uid, item: Items.OranBerry, amount: 1 };
    const pay: ClaimPayment = async (transaction) => {
      await grantStacksIn(transaction, ITEM_STACKS, player.uid, [[Items.OranBerry, 1]]);
      return true;
    };
    const answers = await Promise.all([
      claim('berry_claims', id, record, pay),
      claim('berry_claims', id, record, pay),
      claim('berry_claims', id, record, pay),
    ]);

    expect(answers.filter(Boolean)).toHaveLength(1);
    expect(await carried(Items.OranBerry)).toBe(before + 1);
  });

  it('goes back whole when the payment is refused', async () => {
    const id = nextMarker();
    const before = await carried(Items.OranBerry);
    const record = { player: player.uid, item: Items.OranBerry, amount: 2 };

    expect(
      await claim('berry_claims', id, record, async (transaction) => {
        // Written, and then refused: the grant must not survive the refusal
        await grantStacksIn(transaction, ITEM_STACKS, player.uid, [[Items.OranBerry, 2]]);
        return false;
      }),
    ).toBe(false);
    expect(await markers(id)).toBe(0);
    expect(await carried(Items.OranBerry)).toBe(before);
  });
});
