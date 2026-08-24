import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import { PVP_BATTLE_LIMITS } from '../data/constants/battle-limits';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import { asOffset, toLocalTime } from '../auth/local-time';
import {
  type RocketRecord,
  asRocketRecord,
  deriveRocketReward,
  rocketStopId,
  toSpawns,
} from '../auth/rocket-record';
import { TEAM_SIZE } from '../auth/teams';
import ChunkSnapshot, { NPC_INTERVAL } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { EncounterType } from '../overworld/encounter';
import { PLAYER_ALLIANCE } from '../overworld/raid';
import {
  ROCKET_ALLIANCE,
  ROCKET_REWARD_LEVEL,
  ROCKET_STOP_GOLD,
  createRocketParty,
} from '../overworld/rocket';
import { encounterKey } from '../overworld/safari';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { getSql, jsonOf, newDocId, tx } from './db';
import { readEncounter } from './encounter-io';
import { startEncounter } from './overworld';
import { grantGold } from './profile';
import { foughtBattle, readBattle } from './raid-io';
import { isAnyCatchQueued, publishTeamSnapshot } from './raids';
import { asNumber, asString } from './read';

/**
 * Team Rocket stops, written with admin credentials. A grunt hands
 * over gold and a pokemon, so what it fields, whether it was beaten,
 * and what beating it paid are all decided here — a client reports
 * the outcome of the fight and nothing else about it
 */

/**
 * A stored outcome, restored as the enum this compares against
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

/**
 * Walk up to a Team Rocket stop. The grunt's party comes from the
 * chunk's own roll for the window, so it is the one the world staged
 * wherever the caller says they are standing, and the record is
 * created on first approach.
 *
 * Resolves the stop id and the player's state of it, or null when the
 * cell stages no grunt this window or the player has already beaten
 * the
 * one it stages
 */

/** One stop for one player, in the record shape, or null */
async function readRocketStop(
  stop: string,
  player: string,
): Promise<Record<string, unknown> | null> {
  const sql = getSql();
  const rows = await sql`
    select * from rocket_stops where stop_id = ${stop} and player = ${player}
  `;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }

  const party = await sql`
    select species, individual_value as "individualValue", trait_value as "traitValue"
    from rocket_party
    where stop_id = ${stop} and player = ${player}
    order by slot
  `;

  return {
    player: row.player,
    party: [...party],
    battle: row.battle_id,
    timestamp: row.window_at,
    offset: row.utc_offset,
    chunk: { seed: asString(row.chunk_seed), x: asNumber(row.chunk_x), y: asNumber(row.chunk_y) },
    cell: row.cell,
    defeated: row.defeated,
  };
}

/**
 * Two ways for a walk-up to find nobody, told apart because they say
 * different things: `'beaten'` is this player's own win still standing
 * on the cell, and null is a cell the window stages no grunt on at
 * all, which is what a stale client's board looks like from here
 */
export type RocketStopEntry = [string, RocketRecord] | 'beaten' | null;

export async function enterRocketStop(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<RocketStopEntry> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const party = snapshot.getRocketStops().get(cell);

  if (party == null) {
    return null;
  }

  const stop = rocketStopId(chunk, snapshot.npcTimestamp, cell, zone);
  const stored = await readRocketStop(stop, uid);

  if (stored != null) {
    const existing = asRocketRecord(stored);

    // A grunt already beaten is gone for the window; a grunt that won
    // is still standing there, and can be fought again
    return existing.defeated ? 'beaten' : [stop, existing];
  }

  const fresh: RocketRecord = {
    player: uid,
    party: party.map(([species, individualValue, traitValue]) => ({
      species,
      individualValue,
      traitValue,
    })),
    battle: null,
    timestamp: snapshot.npcTimestamp,
    offset: zone,
    chunk: { seed: chunk.seed, x: chunk.x, y: chunk.y },
    cell,
    defeated: false,
  };

  await tx(async (transaction) => {
    await transaction`
      insert into rocket_stops
        (stop_id, player, battle_id, window_at, utc_offset,
         chunk_seed, chunk_x, chunk_y, cell, defeated)
      values
        (${stop}, ${uid}, null, ${fresh.timestamp}, ${fresh.offset},
         ${chunk.seed}, ${chunk.x}, ${chunk.y}, ${cell}, false)
      on conflict do nothing
    `;

    const rows = fresh.party.map((entry, slot) => ({
      stop_id: stop,
      player: uid,
      slot,
      species: entry.species,
      individual_value: entry.individualValue,
      trait_value: entry.traitValue,
    }));

    await transaction`
      insert into rocket_party
        ${transaction(rows, 'stop_id', 'player', 'slot', 'species', 'individual_value', 'trait_value')}
      on conflict do nothing
    `;
  });
  return [stop, fresh];
}

/**
 * Whether a fight is still going. A battle that has an outcome, or one
 * whose row never landed, is over, and a stop whose last fight is over
 * may be fought again
 */
async function isBattleUnfinished(battleId: string): Promise<boolean> {
  const battle = await readBattle(battleId);

  return battle != null && asOutcome(battle.outcome) === BattleOutcome.Unfinished;
}

/**
 * Accept the grunt's challenge. The player's party is frozen and
 * locked exactly as a raid freezes one, the grunt's three are frozen
 * beside it, and the pair becomes a battle.
 *
 * A fight already under way is returned rather than restaged, so a
 * second acceptance walks back into the same one. A stop the player
 * has beaten, or one whose window has rolled over, stages nothing.
 *
 * Resolves the battle id, or null when the challenge cannot be taken
 */
export async function startRocketBattle(
  uid: string,
  stop: string,
  catches: string[],
  now: number,
): Promise<string | null> {
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const stored = await readRocketStop(stop, uid);

  if (stored == null) {
    return null;
  }

  const record = asRocketRecord(stored);

  if (record.player !== uid || record.defeated) {
    return null;
  }
  // A grunt stands for the window that staged them; past that, the
  // cell has rolled somebody else onto it
  if (toLocalTime(now, record.offset) >= record.timestamp + NPC_INTERVAL) {
    return null;
  }
  if (record.battle != null && (await isBattleUnfinished(record.battle))) {
    return record.battle;
  }
  // A pokemon waiting in a raid lobby is spoken for; one already
  // fighting is refused by the freeze below
  if (await isAnyCatchQueued(uid, catches)) {
    return null;
  }

  const battleId = newDocId();
  const party = await publishTeamSnapshot(uid, catches, PLAYER_ALLIANCE, now);

  if (party == null) {
    return null;
  }

  const chunk = getWorld().getChunk(record.chunk.x, record.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, record.timestamp, record.offset);
  const gruntId = newDocId();

  await tx(async (transaction) => {
    // The grunt's party belongs to nobody, the way a raid boss' does
    await transaction`
      insert into team_snapshots (id, player, alliance, catches)
      values (${gruntId}, null, ${ROCKET_ALLIANCE},
              ${jsonOf(transaction, createRocketParty(snapshot, toSpawns(record.party)))})
    `;
    await transaction`
      insert into battles (id, raid_id, species, outcome, started_at, limits)
      values (${battleId}, null, ${record.party[0]?.species ?? 0},
              ${BattleOutcome.Unfinished}, ${now},
              ${PVP_BATTLE_LIMITS})
    `;

    const rows = [
      { battle_id: battleId, position: 0, snapshot_id: gruntId, player: null as string | null },
      { battle_id: battleId, position: 1, snapshot_id: party, player: uid as string | null },
    ];

    await transaction`
      insert into battle_teams ${transaction(rows, 'battle_id', 'position', 'snapshot_id', 'player')}
    `;
    await transaction`
      update rocket_stops set battle_id = ${battleId}
      where stop_id = ${stop} and player = ${uid}
    `;
  });

  return battleId;
}

/**
 * What a beaten grunt owed: the purse, and the pokemon they left
 */
export interface RocketReward {
  encounter: EncounterRecord;
  gold: number;
}

/**
 * Collect what a beaten grunt owes. The `defeated` flag guards the
 * **gold**: it is set inside a transaction, and only the call that
 * sets it pays, so a stop pays once however many times it is claimed.
 *
 * The pokemon is not spent by walking away from it: the encounter is
 * staged per player and handed back as-is until it is caught, so a
 * reward run from can be walked back to. Only a catch retires it.
 *
 * Resolves null when the fight was not won, was somebody else's, or
 * the pokemon is already caught and the gold already paid
 */
export async function claimRocketReward(uid: string, stop: string): Promise<RocketReward | null> {
  const stored = await readRocketStop(stop, uid);

  if (stored == null) {
    return null;
  }

  const record = asRocketRecord(stored);

  if (record.player !== uid || record.battle == null) {
    return null;
  }

  const battle = await readBattle(record.battle);

  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !(await foughtBattle(record.battle, uid))
  ) {
    return null;
  }

  // First claim pays; the guard rides in the statement
  const claimed = await getSql()`
    update rocket_stops set defeated = true
    where stop_id = ${stop} and player = ${uid} and not defeated
  `;

  const [spawnId, spawn] = deriveRocketReward(record, stop, uid);

  if (claimed.count === 0) {
    // Paid already: the only thing possibly still owed is the
    // pokemon. Caught, it is retired and there is nothing left here
    const existing = await readEncounter(spawnId, uid);

    if (existing == null) {
      return null;
    }

    const encounter = asEncounterRecord(existing);
    const gone = await getSql()`
      select 1 from fled_encounters
      where player = ${uid} and key = ${encounterKey(encounter)}
    `;

    return gone.length > 0 ? null : { encounter, gold: 0 };
  }

  // What the grunt is worth, and then what the winner brought along:
  // a buddy burning a Luck Incense doubles the purse
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const gold = overworld.checkGoldReward(stop, ROCKET_STOP_GOLD);

  await grantGold(uid, gold);

  const chunk = getWorld().getChunk(record.chunk.x, record.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, record.timestamp, record.offset);
  // Fixed rather than rolled, so the same grunt is worth the same to
  // everyone who put them down — and far below the level-50 party it
  // was taken from
  const encounter = await startEncounter(uid, snapshot, spawnId, spawn, {
    type: EncounterType.Rocket,
    level: ROCKET_REWARD_LEVEL,
    shadow: true,
  });

  return { encounter, gold };
}
