import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { ITEM_STACKS } from '../../src/auth/stacks';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import useMaxMushrooms from '../../src/server/max-mushrooms';
import { acceptTrade, offerTrade } from '../../src/server/trades';
import { grantStacksIn, readStack } from '../../src/server/stacks';
import { tx } from '../../src/server/db';

/**
 * Max Mushrooms against the stored record: the factor is given once,
 * only to a species with a Gigantamax form, and it stays with the
 * pokemon when it changes hands.
 */

const NOW = 1_700_000_000_000;
const OFFSET = 480;

let owner: Actor;
let friend: Actor;

async function factorOf(catchId: string): Promise<boolean> {
  const rows = await sql`select gigantamax from caught where id = ${catchId}`;

  return rows[0].gigantamax === true;
}

beforeEach(async () => {
  await clearAll();
  await sql`delete from trades`;
  await sql`delete from caught where id in ('mush-eevee', 'mush-charmander', 'mush-friend')`;
  [owner, friend] = await Promise.all([actor('mushroomer'), actor('mushfriend')]);

  const rows: Record<string, unknown>[] = [
    { ...caughtRow('mush-eevee', owner.uid), species: Species.Eevee },
    { ...caughtRow('mush-charmander', owner.uid), species: Species.Charmander },
    caughtRow('mush-friend', friend.uid),
  ];

  await sql`insert into caught ${sql(rows, ...Object.keys(caughtRow('x', null)))}`;
  await tx(async (transaction) => {
    await grantStacksIn(transaction, ITEM_STACKS, owner.uid, [[Items.MaxMushrooms, 2]]);
  });
});

afterAll(async () => {
  await clearAll();
  await sql.end();
});

describe('Max Mushrooms', () => {
  it('gives the factor to a Gigantamax species once, spending one', async () => {
    expect(await factorOf('mush-eevee')).toBe(false);
    expect(await useMaxMushrooms(owner.uid, 'mush-eevee')).toBe(true);
    expect(await factorOf('mush-eevee')).toBe(true);
    expect(await readStack(ITEM_STACKS, owner.uid, Items.MaxMushrooms)).toBe(1);

    // Already there: nothing to give, so nothing is spent
    expect(await useMaxMushrooms(owner.uid, 'mush-eevee')).toBe(false);
    expect(await readStack(ITEM_STACKS, owner.uid, Items.MaxMushrooms)).toBe(1);
  });

  it('refuses a species with no Gigantamax form, and somebody else’s catch', async () => {
    expect(await useMaxMushrooms(owner.uid, 'mush-charmander')).toBe(false);
    expect(await factorOf('mush-charmander')).toBe(false);
    expect(await useMaxMushrooms(owner.uid, 'mush-friend')).toBe(false);
    expect(await readStack(ITEM_STACKS, owner.uid, Items.MaxMushrooms)).toBe(2);
  });

  it('refuses with none carried', async () => {
    expect(await useMaxMushrooms(friend.uid, 'mush-friend')).toBe(false);
  });

  it('keeps the factor through a trade', async () => {
    await sql`
      insert into friends ${sql(
        [
          { owner: owner.uid, friend: friend.uid, since: NOW },
          { owner: friend.uid, friend: owner.uid, since: NOW },
        ],
        'owner',
        'friend',
        'since',
      )}
    `;
    expect(await useMaxMushrooms(owner.uid, 'mush-eevee')).toBe(true);

    const id = await offerTrade(
      owner.uid,
      { friend: friend.uid, caught: 'mush-eevee', asked: 'mush-friend', gold: 0 },
      NOW,
      OFFSET,
    );

    expect(await acceptTrade(friend.uid, String(id), '', NOW + 1000, -OFFSET)).toBe(true);

    const rows = await sql`select owner, traded, gigantamax from caught where id = 'mush-eevee'`;

    expect(rows[0].owner).toBe(friend.uid);
    expect(rows[0].traded).toBe(true);
    expect(rows[0].gigantamax).toBe(true);
  });
});
