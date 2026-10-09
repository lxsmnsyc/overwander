import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import BattleOutcome from '../../src/auth/battle-outcome';
import { Acquisition } from '../../src/auth/caught-record';
import { asOffset, toLocalTime } from '../../src/auth/local-time';
import { RaidAction, RaidKind, raidId } from '../../src/auth/raid-record';
import AleaRNG from '../../src/core/alea';
import { Balls, Items } from '../../src/data/ids/items';
import { claimRaidReward, enterRaid, peekRaid } from '../../src/server/raids';
import {
  MAX_RAID_BAND_CHANCE,
  MAX_RAID_EXTRA_MUSHROOM_CHANCE,
  MAX_RAID_MUSHROOMS,
} from '../../src/server/raids/reward';
import { writeCaughtRecord } from '../../src/server/caught';
import { ITEM_STACKS } from '../../src/auth/stacks';
import { readStack } from '../../src/server/stacks';
import { writeRaid } from '../../src/server/raid-io';
import { tx } from '../../src/server/db';
import ChunkSnapshot, { RAID_INTERVAL, type RaidRoll } from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';
import { EncounterType } from '../../src/overworld/encounter';
import { MAX_RAID_GOLD, isGigantamaxBoss } from '../../src/overworld/raid';

/**
 * A beaten Max Raid, claimed against the real database: the purse, the
 * mushrooms and the band chance, and a Gigantamax boss's prize caught
 * with its factor
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

/**
 * A Max Raid standing in some recent window, Gigantamaxed or not as
 * asked, or any Max Raid in this window when `gigantamax` is null
 */
function findMaxRaid(gigantamax: boolean | null): Found {
  const world = getWorld(Depth.Surface);

  for (let window = 0; window < (gigantamax == null ? 1 : 24); window++) {
    const at = toLocalTime(NOW, asOffset(0)) - window * RAID_INTERVAL;

    for (let x = 0; x < 32; x++) {
      for (let y = 0; y < 32; y++) {
        const snapshot = new ChunkSnapshot(world.getChunk(x, y), at);

        for (const [cell, roll] of snapshot.getMaxRaids()) {
          if (gigantamax == null || isGigantamaxBoss(roll.species) === gigantamax) {
            return { x, y, cell, snapshot, roll };
          }
        }
      }
    }
  }
  throw new Error('No Max Raid in reach');
}

/** Stage a won raid on that landmark with the fighter's party in it */
async function wonRaid(found: Found, battle: string): Promise<string> {
  const { x, y, cell, snapshot, roll } = found;
  const lobby = raidId(snapshot.chunk, snapshot.raidTimestamp, cell, RaidKind.Max, 0);

  await tx(async (transaction) => {
    await writeRaid(transaction, lobby, {
      kind: RaidKind.Max,
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
  fighter = await actor('max-fighter');
});

afterAll(async () => {
  await sql.end();
});

describe('a beaten Max Raid', () => {
  it('pays its purse, Max Mushrooms and the band at its odds, once', async () => {
    const lobby = await wonRaid(findMaxRaid(false), 'max-battle');
    const first = await claimRaidReward(fighter.uid, lobby);

    // The same rolls the claim makes, in the same order
    const rng = new AleaRNG(`${lobby}:${fighter.uid}:max`);
    const mushrooms = MAX_RAID_MUSHROOMS + (rng.random() < MAX_RAID_EXTRA_MUSHROOM_CHANCE ? 1 : 0);
    const band = rng.random() < MAX_RAID_BAND_CHANCE;

    expect(first?.gold).toBe(MAX_RAID_GOLD);
    expect(first?.encounter?.type).toBe(EncounterType.MaxRaid);
    expect(first?.items).toEqual([
      { item: Items.MaxMushrooms, amount: mushrooms },
      ...(band ? [{ item: Items.DynamaxBand, amount: 1 }] : []),
    ]);
    expect(await readStack(ITEM_STACKS, fighter.uid, Items.MaxMushrooms)).toBe(mushrooms);
    expect(await readStack(ITEM_STACKS, fighter.uid, Items.DynamaxBand)).toBe(band ? 1 : 0);

    // The claim is spent: asking again pays nothing twice
    const again = await claimRaidReward(fighter.uid, lobby);

    expect(again?.gold ?? 0).toBe(0);
    expect(again?.items ?? []).toEqual([]);
    expect(await readStack(ITEM_STACKS, fighter.uid, Items.MaxMushrooms)).toBe(mushrooms);
  });

  it('hands over a Gigantamax boss with its factor, and a plain one without', async () => {
    const giant = await claimRaidReward(
      fighter.uid,
      await wonRaid(findMaxRaid(true), 'gmax-battle'),
    );
    const plain = await claimRaidReward(
      fighter.uid,
      await wonRaid(findMaxRaid(false), 'plain-battle'),
    );

    expect(giant).not.toBeNull();
    expect(plain).not.toBeNull();

    const caught = await writeCaughtRecord(
      fighter.uid,
      giant!.encounter!,
      Balls.PokeBall,
      Acquisition.Caught,
      NOW,
      0,
      'en',
    );
    const other = await writeCaughtRecord(
      fighter.uid,
      plain!.encounter!,
      Balls.PokeBall,
      Acquisition.Caught,
      NOW,
      0,
      'en',
    );
    const rows = await sql`select id, gigantamax from caught where id = any(${[caught, other]})`;
    const factor = new Map<string, boolean>();

    for (const row of rows) {
      factor.set(String(row.id), row.gigantamax === true);
    }
    expect(factor.get(caught)).toBe(true);
    expect(factor.get(other)).toBe(false);
  });

  it('opens a lobby of its own kind, the way a lair does', async () => {
    // After the catches above, so the fighter has a party to stage it
    // with, and on a clean slate, since the raids above may stand there
    await sql`delete from battles`;
    await sql`delete from raids`;

    const { x, y, cell, roll } = findMaxRaid(null);
    const peeked = await peekRaid(fighter.uid, x, y, cell, RaidKind.Max, NOW, 0);

    expect(peeked?.action).toBe(RaidAction.Host);
    expect(peeked?.kind).toBe(RaidKind.Max);
    expect(peeked?.species).toBe(roll.species);

    const entered = await enterRaid(fighter.uid, x, y, cell, RaidKind.Max, NOW, 0);

    expect(entered?.[1].kind).toBe(RaidKind.Max);
    expect(entered?.[1].species).toBe(roll.species);
    expect(entered?.[1].lair).toBeNull();
    // The cell is a Max Raid's and nothing else's
    expect(await enterRaid(fighter.uid, x, y, cell, RaidKind.Legendary, NOW, 0)).toBeNull();
    expect(await enterRaid(fighter.uid, x, y, cell, RaidKind.Totem, NOW, 0)).toBeNull();
  });
});
