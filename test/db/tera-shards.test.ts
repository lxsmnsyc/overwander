import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { ITEM_STACKS } from '../../src/model/stacks';
import { Types } from '../../src/data/constants/types';
import { Balls, Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { TERA_SHARD_COST } from '../../src/data/items/tera-shards';
import useTeraShards from '../../src/server/tera-shards';
import { acceptTrade, offerTrade } from '../../src/server/trades';
import { grantStacksIn, readStack } from '../../src/server/stacks';
import { tx } from '../../src/server/db';
import { writeCaughtRecord } from '../../src/server/caught';
import { asEncounterRecord } from '../../src/model/encounter-record';
import { Acquisition } from '../../src/model/caught-record';
import { TERA_TYPES } from '../../src/data/species/tera-type';

/**
 * Tera Shards against the stored record: fifty of a type change the
 * Tera type, and the type stays with the pokemon when it changes hands.
 */

const NOW = 1_700_000_000_000;
const OFFSET = 480;

let owner: Actor;
let friend: Actor;

async function teraTypeOf(catchId: string): Promise<number | null> {
  const rows = await sql`select tera_type from caught where id = ${catchId}`;

  const type: unknown = rows[0].tera_type;

  return typeof type === 'number' ? type : null;
}

beforeEach(async () => {
  await clearAll();
  await sql`delete from trades`;
  await sql`delete from caught where id in ('tera-bulbasaur', 'tera-spare', 'tera-friend')`;
  [owner, friend] = await Promise.all([actor('terashards'), actor('terafriend')]);

  const rows: Record<string, unknown>[] = [
    { ...caughtRow('tera-bulbasaur', owner.uid), species: Species.Bulbasaur },
    // A trade never takes a player's last pokemon
    caughtRow('tera-spare', owner.uid),
    caughtRow('tera-friend', friend.uid),
  ];

  await sql`insert into caught ${sql(rows, ...Object.keys(caughtRow('x', null)))}`;
  await tx(async (transaction) => {
    await grantStacksIn(transaction, ITEM_STACKS, owner.uid, [
      [Items.FireTeraShard, TERA_SHARD_COST + 10],
      [Items.GrassTeraShard, TERA_SHARD_COST],
      [Items.WaterTeraShard, TERA_SHARD_COST - 1],
      [Items.StellarTeraShard, TERA_SHARD_COST],
    ]);
  });
});

afterAll(async () => {
  await clearAll();
  await sql.end();
});

describe('Tera Shards', () => {
  it('changes the Tera type for fifty shards of the type', async () => {
    expect(await teraTypeOf('tera-bulbasaur')).toBeNull();
    expect(await useTeraShards(owner.uid, 'tera-bulbasaur', Items.FireTeraShard)).toBe(Types.Fire);
    expect(await teraTypeOf('tera-bulbasaur')).toBe(Types.Fire);
    expect(await readStack(ITEM_STACKS, owner.uid, Items.FireTeraShard)).toBe(10);

    // Already Fire: nothing to change, so nothing is spent
    expect(await useTeraShards(owner.uid, 'tera-bulbasaur', Items.FireTeraShard)).toBeNull();
    expect(await readStack(ITEM_STACKS, owner.uid, Items.FireTeraShard)).toBe(10);
  });

  it('refuses the type it reads as, too few shards, Stellar, and another item', async () => {
    // None stored reads as Grass, its first type
    expect(await useTeraShards(owner.uid, 'tera-bulbasaur', Items.GrassTeraShard)).toBeNull();
    expect(await useTeraShards(owner.uid, 'tera-bulbasaur', Items.WaterTeraShard)).toBeNull();
    expect(await useTeraShards(owner.uid, 'tera-bulbasaur', Items.StellarTeraShard)).toBeNull();
    expect(await useTeraShards(owner.uid, 'tera-bulbasaur', Items.MaxMushrooms)).toBeNull();
    expect(await teraTypeOf('tera-bulbasaur')).toBeNull();
    expect(await readStack(ITEM_STACKS, owner.uid, Items.WaterTeraShard)).toBe(TERA_SHARD_COST - 1);
    expect(await readStack(ITEM_STACKS, owner.uid, Items.StellarTeraShard)).toBe(TERA_SHARD_COST);
  });

  it('refuses somebody else’s catch', async () => {
    expect(await useTeraShards(owner.uid, 'tera-friend', Items.FireTeraShard)).toBeNull();
    expect(await teraTypeOf('tera-friend')).toBeNull();
    expect(await readStack(ITEM_STACKS, owner.uid, Items.FireTeraShard)).toBe(TERA_SHARD_COST + 10);
  });

  it('rolls one for a new catch', async () => {
    const catchId = await writeCaughtRecord(
      owner.uid,
      asEncounterRecord({
        spawn: 'tera-spawn',
        player: owner.uid,
        species: Species.Charmander,
        level: 5,
      }),
      Balls.PokeBall,
      Acquisition.Caught,
      NOW,
      OFFSET,
      'en',
    );

    expect(TERA_TYPES).toContain(await teraTypeOf(catchId));
    await sql`delete from caught where id = ${catchId}`;
  });

  it('keeps the Tera type through a trade', async () => {
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
    expect(await useTeraShards(owner.uid, 'tera-bulbasaur', Items.FireTeraShard)).toBe(Types.Fire);

    const id = await offerTrade(
      owner.uid,
      { friend: friend.uid, caught: 'tera-bulbasaur', asked: 'tera-friend', gold: 0 },
      NOW,
      OFFSET,
    );

    expect(await acceptTrade(friend.uid, String(id), '', NOW + 1000, -OFFSET)).toBe(true);

    const rows = await sql`select owner, tera_type from caught where id = 'tera-bulbasaur'`;

    expect(rows[0].owner).toBe(friend.uid);
    expect(rows[0].tera_type).toBe(Types.Fire);
  });
});
