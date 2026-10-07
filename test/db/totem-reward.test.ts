import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import BattleOutcome from '../../src/auth/battle-outcome';
import { asOffset, toLocalTime } from '../../src/auth/local-time';
import { RaidKind, raidId } from '../../src/auth/raid-record';
import { claimRaidReward } from '../../src/server/raids';
import { holdsItem } from '../../src/server/inventory';
import { writeRaid } from '../../src/server/raid-io';
import { tx } from '../../src/server/db';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';
import { getTotemCrystal } from '../../src/data/overworld/totems';

/**
 * A beaten Totem, claimed against the real database: the first clear
 * hands over the trial's crystal, and claiming again pays nothing twice
 */

let fighter: Actor;

const BATTLE = 'totem-battle';
const NOW = Date.now();

/** A Totem standing this window, and the chunk it stands in */
function findTotem(): { x: number; y: number; cell: number; snapshot: ChunkSnapshot } {
  const world = getWorld(Depth.Surface);

  for (let x = 0; x < 48; x++) {
    for (let y = 0; y < 48; y++) {
      const snapshot = new ChunkSnapshot(world.getChunk(x, y), toLocalTime(NOW, asOffset(0)));
      const first = snapshot.getTotemLairs().keys().next();

      if (first.done !== true) {
        return { x, y, cell: first.value, snapshot };
      }
    }
  }
  throw new Error('No Totem in reach');
}

beforeAll(async () => {
  await clearAll();
  fighter = await actor('totem-fighter');
});

afterAll(async () => {
  await sql.end();
});

describe('a beaten Totem', () => {
  it('hands over its crystal on the first clear, and pays a claim once', async () => {
    const { x, y, cell, snapshot } = findTotem();
    const roll = snapshot.getTotemLairs().get(cell)!;
    const lobby = raidId(snapshot.chunk, snapshot.raidTimestamp, cell, RaidKind.Totem, 0);

    await tx(async (transaction) => {
      await writeRaid(transaction, lobby, {
        kind: RaidKind.Totem,
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
      values (${BATTLE}, ${lobby}, ${roll.species}, ${BattleOutcome.Won}, ${NOW}, 0)
    `;
    await sql`
      insert into team_snapshots (id, player, alliance, catches)
      values ('totem-team', ${fighter.uid}, 1, '[]'::jsonb)
    `;
    await sql`
      insert into battle_teams (battle_id, position, snapshot_id, player)
      values (${BATTLE}, 1, 'totem-team', ${fighter.uid})
    `;
    await sql`update raids set battle_id = ${BATTLE} where id = ${lobby}`;

    const crystal = getTotemCrystal(roll.species);
    const first = await claimRaidReward(fighter.uid, lobby);

    expect(first?.items).toEqual([{ item: crystal, amount: 1 }]);
    expect(await holdsItem(fighter.uid, crystal)).toBe(true);

    // The claim is spent: asking again reopens the meeting and pays nothing
    const again = await claimRaidReward(fighter.uid, lobby);

    expect(again?.gold ?? 0).toBe(0);
    expect(again?.items ?? []).toEqual([]);
  });
});
