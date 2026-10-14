import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import BattleOutcome from '../../src/model/battle-outcome';
import { Acquisition } from '../../src/model/caught-record';
import { asOffset, toLocalTime } from '../../src/model/local-time';
import { RaidAction, RaidKind, raidId } from '../../src/model/raid-record';
import { ITEM_STACKS } from '../../src/model/stacks';
import AleaRNG from '../../src/core/alea';
import { Balls } from '../../src/data/ids/items';
import { getTeraShard } from '../../src/data/items/tera-shards';
import {
  TERA_RAID_EXTRA_SHARDS,
  TERA_RAID_SHARDS,
  getTeraRaidType,
} from '../../src/data/overworld/tera-raids';
import { claimRaidReward, enterRaid, peekRaid } from '../../src/server/raids';
import { writeCaughtRecord } from '../../src/server/caught';
import { writeRaid } from '../../src/server/raids/io';
import { readStack } from '../../src/server/stacks';
import { tx } from '../../src/server/db';
import ChunkSnapshot, { type RaidRoll } from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';
import { EncounterType } from '../../src/overworld/encounter';
import { TERA_RAID_GOLD } from '../../src/overworld/raid/index';

/**
 * A beaten Tera raid, claimed and caught against the real database:
 * the purse, Tera Shards of the boss's Tera type, and a prize that
 * keeps that Tera type
 */

let fighter: Actor;

const NOW = Date.now();

interface Found {
  x: number;
  y: number;
  cell: number;
  snapshot: ChunkSnapshot;
  roll: RaidRoll;
}

/** A Tera boss standing in this window, nearest the origin */
function findTeraRaid(): Found {
  const world = getWorld(Depth.Surface);
  const at = toLocalTime(NOW, asOffset(0));

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      const snapshot = new ChunkSnapshot(world.getChunk(x, y), at);
      const first = snapshot.getTeraRaids().entries().next();

      if (first.done !== true) {
        return { x, y, cell: first.value[0], snapshot, roll: first.value[1] };
      }
    }
  }
  throw new Error('No Tera crystal in reach');
}

/** Stage a won raid on that landmark with the fighter's party in it */
async function wonRaid(found: Found, battle: string): Promise<string> {
  const { x, y, cell, snapshot, roll } = found;
  const lobby = raidId(snapshot.chunk, snapshot.raidTimestamp, cell, RaidKind.Tera, 0);

  await tx(async (transaction) => {
    await writeRaid(transaction, lobby, {
      kind: RaidKind.Tera,
      lair: null,
      species: roll.species,
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
    values (${battle}, ${lobby}, ${roll.species}, ${BattleOutcome.Won}, ${NOW}, 0)
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

beforeAll(async () => {
  await clearAll();
  fighter = await actor('tera-fighter');
});

afterAll(async () => {
  await sql.end();
});

describe('a beaten Tera raid', () => {
  it('pays its purse and shards of its Tera type, and the prize keeps that type', async () => {
    const found = findTeraRaid();
    const lobby = await wonRaid(found, 'tera-battle');
    const tera = getTeraRaidType(found.roll.species, lobby);
    const shard = getTeraShard(tera);
    // Rolled the way the claim rolls it
    const amount =
      TERA_RAID_SHARDS +
      Math.floor(
        new AleaRNG(`${lobby}:${fighter.uid}:tera`).random() * (TERA_RAID_EXTRA_SHARDS + 1),
      );
    const reward = await claimRaidReward(fighter.uid, lobby);

    expect(shard).not.toBeNull();
    expect(reward?.gold).toBe(TERA_RAID_GOLD);
    expect(reward?.items).toEqual([{ item: shard, amount }]);
    expect(await readStack(ITEM_STACKS, fighter.uid, shard!)).toBe(amount);
    expect(reward?.encounter?.type).toBe(EncounterType.TeraRaid);
    expect(reward?.encounter?.species).toBe(found.roll.species);

    const caught = await writeCaughtRecord(
      fighter.uid,
      reward!.encounter!,
      Balls.PokeBall,
      Acquisition.Caught,
      NOW,
      0,
      'en',
    );
    const [row] = await sql`select type, tera_type from caught where id = ${caught}`;

    expect(Number(row.type)).toBe(EncounterType.TeraRaid);
    expect(Number(row.tera_type)).toBe(tera);

    // Claimed twice, it pays nothing more
    await claimRaidReward(fighter.uid, lobby);
    expect(await readStack(ITEM_STACKS, fighter.uid, shard!)).toBe(amount);
  });

  it('opens a lobby of its own kind, the way a lair does', async () => {
    // After the catch above, so the fighter has a party to stage it
    // with, and on a clean slate, since the raid above stands there
    await sql`delete from battles`;
    await sql`delete from raids`;

    const { x, y, cell, roll } = findTeraRaid();
    const peeked = await peekRaid(fighter.uid, x, y, cell, RaidKind.Tera, NOW, 0);

    expect(peeked?.action).toBe(RaidAction.Host);
    expect(peeked?.kind).toBe(RaidKind.Tera);
    expect(peeked?.species).toBe(roll.species);

    const entered = await enterRaid(fighter.uid, x, y, cell, RaidKind.Tera, NOW, 0);

    expect(entered?.[1].kind).toBe(RaidKind.Tera);
    expect(entered?.[1].lair).toBeNull();
    expect(await enterRaid(fighter.uid, x, y, cell, RaidKind.Alpha, NOW, 0)).toBeNull();
  });
});
