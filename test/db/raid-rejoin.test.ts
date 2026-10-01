import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import BattleOutcome from '../../src/auth/battle-outcome';
import { asOffset, toLocalTime } from '../../src/auth/local-time';
import { RaidAction, RaidKind, raidId } from '../../src/auth/raid-record';
import { peekRaid } from '../../src/server/raids';
import { writeRaid } from '../../src/server/raid-io';
import { tx } from '../../src/server/db';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';

/**
 * Walking back up to a raid that is being fought, run against the real
 * database: the party that is in the fight is offered it again, and
 * anybody else is offered a seat to watch.
 */

let fighter: Actor;
let stranger: Actor;

const BATTLE = 'rejoin-battle';
const NOW = Date.now();

/** A shadow lair standing this window, and the chunk it stands in */
function findLair(): { x: number; y: number; cell: number; snapshot: ChunkSnapshot } {
  const world = getWorld(Depth.Surface);

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      const snapshot = new ChunkSnapshot(world.getChunk(x, y), toLocalTime(NOW, asOffset(0)));
      const first = snapshot.getShadowLairs().keys().next();

      if (first.done !== true) {
        return { x, y, cell: first.value, snapshot };
      }
    }
  }
  throw new Error('No shadow lair in reach');
}

beforeAll(async () => {
  await clearAll();
  fighter = await actor('rejoin-fighter');
  stranger = await actor('rejoin-stranger');
  await sql`insert into caught ${sql(caughtRow('rejoin-mine', fighter.uid))}`;
  await sql`insert into caught ${sql(caughtRow('rejoin-theirs', stranger.uid))}`;
});

afterAll(async () => {
  await sql.end();
});

describe('a raid walked back into', () => {
  it('hands the fight back to the party in it, and a seat to anybody else', async () => {
    const { x, y, cell, snapshot } = findLair();
    const roll = snapshot.getShadowLairs().get(cell)!;
    const lobby = raidId(snapshot.chunk, snapshot.raidTimestamp, cell, RaidKind.Shadow, 0);

    await tx(async (transaction) => {
      await writeRaid(transaction, lobby, {
        kind: RaidKind.Shadow,
        lair: roll.lair,
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
      values (${BATTLE}, ${lobby}, ${roll.species}, ${BattleOutcome.Unfinished}, ${NOW}, 0)
    `;
    await sql`
      insert into team_snapshots (id, player, alliance, catches)
      values ('rejoin-team', ${fighter.uid}, 1, '[]'::jsonb)
    `;
    await sql`
      insert into battle_teams (battle_id, position, snapshot_id, player)
      values (${BATTLE}, 1, 'rejoin-team', ${fighter.uid})
    `;
    await sql`update raids set battle_id = ${BATTLE} where id = ${lobby}`;

    const mine = await peekRaid(fighter.uid, x, y, cell, RaidKind.Shadow, NOW, 0);
    const theirs = await peekRaid(stranger.uid, x, y, cell, RaidKind.Shadow, NOW, 0);

    expect(mine?.action).toBe(RaidAction.Rejoin);
    expect(mine?.battle).toBe(BATTLE);
    expect(theirs?.action).toBe(RaidAction.Spectate);

    // Once the party has lost, the lair is open to stage again
    await sql`update battles set outcome = ${BattleOutcome.Lost} where id = ${BATTLE}`;

    expect((await peekRaid(fighter.uid, x, y, cell, RaidKind.Shadow, NOW, 0))?.action).toBe(
      RaidAction.Host,
    );
  });
});
