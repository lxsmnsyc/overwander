import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import BattleOutcome from '../../src/auth/battle-outcome';
import { asOffset, toLocalTime } from '../../src/auth/local-time';
import { RaidAction, RaidKind, raidId } from '../../src/auth/raid-record';
import { ITEM_STACKS } from '../../src/auth/stacks';
import AleaRNG from '../../src/core/alea';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { NOBLE_BALM_PACK, getNobleTreasure } from '../../src/data/overworld/nobles';
import { claimRaidReward, enterRaid, joinRaid, peekRaid, startRaid } from '../../src/server/raids';
import { NOBLE_RAID_BALMS, NOBLE_RAID_EXTRA_BALM_CHANCE } from '../../src/server/raids/reward';
import { writeRaid } from '../../src/server/raid-io';
import { grantItem } from '../../src/server/inventory';
import { readStack } from '../../src/server/stacks';
import { tx } from '../../src/server/db';
import ChunkSnapshot, { type RaidRoll } from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';
import { NOBLE_RAID_GOLD } from '../../src/overworld/raid';

/**
 * A calmed Noble against the real database: the purse, the Balms, a
 * canon Noble's treasure and nothing caught, the lobby, and the Balms
 * a party packs as the raid starts
 */

let fighter: Actor;
let helper: Actor;

const NOW = Date.now();

interface Found {
  x: number;
  y: number;
  cell: number;
  snapshot: ChunkSnapshot;
  roll: RaidRoll;
}

/** A Noble standing in this window, nearest the origin */
function findNobleRaid(): Found {
  const world = getWorld(Depth.Surface);
  const at = toLocalTime(NOW, asOffset(0));

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      const snapshot = new ChunkSnapshot(world.getChunk(x, y), at);
      const first = snapshot.getNobleRaids().entries().next();

      if (first.done !== true) {
        return { x, y, cell: first.value[0], snapshot, roll: first.value[1] };
      }
    }
  }
  throw new Error('No Noble in reach');
}

/** Stage a won raid on that landmark, its Noble the species given, with the fighter in it */
async function wonRaid(found: Found, species: Species, battle: string): Promise<string> {
  const { x, y, cell, snapshot, roll } = found;
  const lobby = `${raidId(snapshot.chunk, snapshot.raidTimestamp, cell, RaidKind.Noble, 0)}:${battle}`;

  await tx(async (transaction) => {
    await writeRaid(transaction, lobby, {
      kind: RaidKind.Noble,
      lair: null,
      species,
      traitValue: roll.traitValue,
      host: fighter.uid,
      teams: [],
      battle: null,
      timestamp: snapshot.raidTimestamp,
      offset: asOffset(0),
      chunk: { seed: snapshot.chunk.seed, x, y },
      biome: snapshot.biomeAt(cell),
      cell,
      cleared: false,
    });
  });
  await sql`
    insert into battles (id, raid_id, species, outcome, started_at, limits)
    values (${battle}, ${lobby}, ${species}, ${BattleOutcome.Won}, ${NOW}, 0)
  `;
  await sql`
    insert into team_snapshots (id, player, alliance, catches)
    values (${`${battle}-team`}, ${fighter.uid}, 1, '[]'::jsonb)
  `;
  await sql`
    insert into battle_teams (battle_id, position, snapshot_id, player)
    values (${battle}, 1, ${`${battle}-team`}, ${fighter.uid})
  `;
  await sql`update raids set battle_id = ${battle} where id = ${lobby}`;
  return lobby;
}

/** The Balms a claim on this lobby pays this player, rolled the way the claim rolls them */
function balmsFor(lobby: string, uid: string): number {
  const rng = new AleaRNG(`${lobby}:${uid}:noble`);

  return NOBLE_RAID_BALMS + (rng.random() < NOBLE_RAID_EXTRA_BALM_CHANCE ? 1 : 0);
}

beforeAll(async () => {
  await clearAll();
  fighter = await actor('noble-fighter');
  helper = await actor('noble-helper');
  await sql`insert into caught ${sql(caughtRow('noble-mine', fighter.uid))}`;
  await sql`insert into caught ${sql(caughtRow('noble-theirs', helper.uid))}`;
});

afterAll(async () => {
  await sql.end();
});

describe('a calmed Noble', () => {
  it("pays its purse, Balms and a canon Noble's treasure, and leaves nobody to catch", async () => {
    const lobby = await wonRaid(findNobleRaid(), Species.Kleavor, 'kleavor-battle');
    const reward = await claimRaidReward(fighter.uid, lobby);
    const balms = balmsFor(lobby, fighter.uid);

    expect(reward?.gold).toBe(NOBLE_RAID_GOLD);
    expect(reward?.encounter).toBeNull();
    expect(reward?.items).toEqual([
      { item: Items.Balm, amount: balms },
      { item: getNobleTreasure(Species.Kleavor), amount: 1 },
    ]);
    expect(await readStack(ITEM_STACKS, fighter.uid, Items.Balm)).toBe(balms);
    expect(await readStack(ITEM_STACKS, fighter.uid, Items.BlackAugurite)).toBe(1);

    const waiting = await sql`select 1 from encounters where player = ${fighter.uid}`;

    expect(waiting).toHaveLength(0);

    // The claim is spent: asking again pays nothing twice
    expect(await claimRaidReward(fighter.uid, lobby)).toBeNull();
    expect(await readStack(ITEM_STACKS, fighter.uid, Items.Balm)).toBe(balms);
  });

  it('pays only Balms beside the purse for a Noble by rule', async () => {
    await sql`delete from bag_items where player = ${fighter.uid}`;

    const lobby = await wonRaid(findNobleRaid(), Species.Charizard, 'charizard-battle');
    const reward = await claimRaidReward(fighter.uid, lobby);

    expect(reward?.encounter).toBeNull();
    expect(reward?.items).toEqual([{ item: Items.Balm, amount: balmsFor(lobby, fighter.uid) }]);
  });

  it("opens a lobby of its own kind, and packs each fighter's Balms as it starts", async () => {
    await sql`delete from battles`;
    await sql`delete from raids`;
    await sql`delete from bag_items`;

    const { x, y, cell, roll } = findNobleRaid();
    const peeked = await peekRaid(fighter.uid, x, y, cell, RaidKind.Noble, NOW, 0);

    expect(peeked?.action).toBe(RaidAction.Host);
    expect(peeked?.kind).toBe(RaidKind.Noble);
    expect(peeked?.species).toBe(roll.species);

    const entered = await enterRaid(fighter.uid, x, y, cell, RaidKind.Noble, NOW, 0);

    expect(entered?.[1].kind).toBe(RaidKind.Noble);
    expect(entered?.[1].lair).toBeNull();

    const lobby = entered![0];

    await grantItem(fighter.uid, Items.Balm, NOBLE_BALM_PACK + 2);
    await grantItem(helper.uid, Items.Balm, 1);
    expect(await joinRaid(fighter.uid, lobby, ['noble-mine'])).not.toBeNull();
    expect(await joinRaid(helper.uid, lobby, ['noble-theirs'])).not.toBeNull();

    const battle = await startRaid(fighter.uid, lobby, NOW);

    expect(battle).not.toBeNull();

    const packed = new Map<string, unknown>();

    for (const row of await sql`
      select ts.player, ts.catches -> 0 -> 'balms' as balms
      from battle_teams bt join team_snapshots ts on ts.id = bt.snapshot_id
      where bt.battle_id = ${battle} and ts.player is not null
    `) {
      packed.set(String(row.player), row.balms);
    }
    // Up to the pack from a full bag, and what there is from a thin one
    expect(packed.get(fighter.uid)).toBe(NOBLE_BALM_PACK);
    expect(packed.get(helper.uid)).toBe(1);
    expect(await readStack(ITEM_STACKS, fighter.uid, Items.Balm)).toBe(2);
    expect(await readStack(ITEM_STACKS, helper.uid, Items.Balm)).toBe(0);
  });
});
