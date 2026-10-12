import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import BattleOutcome from '../../src/auth/battle-outcome';
import { Acquisition } from '../../src/auth/caught-record';
import { asOffset, toLocalTime } from '../../src/auth/local-time';
import { RaidAction, RaidKind, raidId } from '../../src/auth/raid-record';
import AleaRNG from '../../src/core/alea';
import { MAX_IV, STAT_ORDER, getIV } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { Balls } from '../../src/data/ids/items';
import { ALPHA_PERFECT_STATS, pickAlphaPerfectStats } from '../../src/data/overworld/alphas';
import { claimRaidReward, enterRaid, peekRaid } from '../../src/server/raids';
import { writeCaughtRecord } from '../../src/server/caught';
import { writeRaid } from '../../src/server/raid-io';
import { tx } from '../../src/server/db';
import ChunkSnapshot, { type RaidRoll } from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';
import { EncounterType } from '../../src/overworld/encounter';
import { RAID_MIN_IV } from '../../src/overworld/encounter/traits';
import { ALPHA_RAID_GOLD } from '../../src/overworld/raid';

/**
 * A beaten Alpha raid, claimed and caught against the real database:
 * the purse, and a prize with three perfect stats and no Alpha mark
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

/** An Alpha standing in this window, nearest the origin */
function findAlphaRaid(): Found {
  const world = getWorld(Depth.Surface);
  const at = toLocalTime(NOW, asOffset(0));

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      const snapshot = new ChunkSnapshot(world.getChunk(x, y), at);

      const first = snapshot.getAlphaRaids().entries().next();

      if (first.done !== true) {
        return { x, y, cell: first.value[0], snapshot, roll: first.value[1] };
      }
    }
  }
  throw new Error('No Alpha in reach');
}

/** Stage a won raid on that landmark with the fighter's party in it */
async function wonRaid(found: Found, battle: string): Promise<string> {
  const { x, y, cell, snapshot, roll } = found;
  const lobby = raidId(snapshot.chunk, snapshot.raidTimestamp, cell, RaidKind.Alpha, 0);

  await tx(async (transaction) => {
    await writeRaid(transaction, lobby, {
      kind: RaidKind.Alpha,
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
  fighter = await actor('alpha-fighter');
});

afterAll(async () => {
  await sql.end();
});

describe('a beaten Alpha raid', () => {
  it('pays its purse and hands over the Alpha with three perfect stats', async () => {
    const found = findAlphaRaid();
    const lobby = await wonRaid(found, 'alpha-battle');
    const reward = await claimRaidReward(fighter.uid, lobby);

    expect(reward?.gold).toBe(ALPHA_RAID_GOLD);
    expect(reward?.items).toEqual([]);
    expect(reward?.encounter?.type).toBe(EncounterType.AlphaRaid);
    expect(reward?.encounter?.species).toBe(found.roll.species);

    const encounter = reward!.encounter!;
    // The three the prize's own values pick, the same way the claim did
    const rng = new AleaRNG(`${encounter.individualValue}:${encounter.traitValue}:alpha`);
    const perfect = pickAlphaPerfectStats(() => rng.random());

    expect(perfect.size).toBe(ALPHA_PERFECT_STATS);

    const caught = await writeCaughtRecord(
      fighter.uid,
      encounter,
      Balls.PokeBall,
      Acquisition.Caught,
      NOW,
      0,
      'en',
    );
    const [row] = await sql`select ivs, type from caught where id = ${caught}`;
    const ivs = Number(row.ivs);
    let perfects = 0;

    expect(Number(row.type)).toBe(EncounterType.AlphaRaid);
    for (const stat of STAT_ORDER) {
      if (perfect.has(stat)) {
        expect(getIV(ivs, stat)).toBe(MAX_IV);
      } else {
        // A raid prize's ordinary roll, lifted onto its floor
        expect(getIV(ivs, stat)).toBeGreaterThanOrEqual(RAID_MIN_IV);
      }
      if (getIV(ivs, stat) === MAX_IV) {
        perfects++;
      }
    }
    // The other three may land on 31 by their own roll, never by the Alpha's
    expect(perfects).toBeGreaterThanOrEqual(ALPHA_PERFECT_STATS);

    // The species as it is, with no mark of having been an Alpha
    const abilities = await sql`select ability from caught_abilities where caught_id = ${caught}`;

    expect(abilities.length).toBeGreaterThan(0);
    for (const ability of abilities) {
      expect(Number(ability.ability)).not.toBe(Abilities.Alpha);
      expect(Number(ability.ability)).not.toBe(Abilities.Boss);
    }
  });

  it('opens a lobby of its own kind, the way a lair does', async () => {
    // After the catch above, so the fighter has a party to stage it
    // with, and on a clean slate, since the raid above stands there
    await sql`delete from battles`;
    await sql`delete from raids`;

    const { x, y, cell, roll } = findAlphaRaid();
    const peeked = await peekRaid(fighter.uid, x, y, cell, RaidKind.Alpha, NOW, 0);

    expect(peeked?.action).toBe(RaidAction.Host);
    expect(peeked?.kind).toBe(RaidKind.Alpha);
    expect(peeked?.species).toBe(roll.species);

    const entered = await enterRaid(fighter.uid, x, y, cell, RaidKind.Alpha, NOW, 0);

    expect(entered?.[1].kind).toBe(RaidKind.Alpha);
    expect(entered?.[1].lair).toBeNull();
    expect(await enterRaid(fighter.uid, x, y, cell, RaidKind.Max, NOW, 0)).toBeNull();
  });
});
