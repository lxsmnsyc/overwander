import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import { PVP_BATTLE_LIMITS } from '../data/constants/battle-limits';
import {
  BATTLE_COLLECTION,
  ROCKET_COLLECTION,
  TEAM_SNAPSHOT_COLLECTION,
} from '../auth/collections';
import type { EncounterRecord } from '../auth/encounter-record';
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
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { getAdminFirestore } from './firebase';
import { startEncounter } from './overworld';
import { grantGold } from './profile';
import { isAnyCatchQueued, publishTeamSnapshot } from './raids';
import { asNumber, asStringArray, docData } from './read';

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
 * The document one player's dealings with one stop live at
 */
function stopEntryId(stop: string, uid: string): string {
  return `${stop}:${uid}`;
}

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
export async function enterRocketStop(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<[string, RocketRecord] | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const party = snapshot.getRocketStops().get(cell);

  if (party == null) {
    return null;
  }

  const db = getAdminFirestore();
  const stop = rocketStopId(chunk, snapshot.npcTimestamp, cell, zone);
  const ref = db.collection(ROCKET_COLLECTION).doc(stopEntryId(stop, uid));
  const stored = docData(await ref.get());

  if (stored != null) {
    const existing = asRocketRecord(stored);

    // A grunt already beaten is gone for the window; a grunt that won
    // is still standing there, and can be fought again
    return existing.defeated ? null : [stop, existing];
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

  await ref.set(fresh);
  return [stop, fresh];
}

/**
 * Whether a fight is still going. A battle that has an outcome, or
 * one whose document never landed, is over — and a stop whose last
 * fight is over may be fought again
 */
async function isBattleUnfinished(battleId: string): Promise<boolean> {
  const battle = docData(
    await getAdminFirestore().collection(BATTLE_COLLECTION).doc(battleId).get(),
  );

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

  const db = getAdminFirestore();
  const ref = db.collection(ROCKET_COLLECTION).doc(stopEntryId(stop, uid));
  const stored = docData(await ref.get());

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

  const battle = db.collection(BATTLE_COLLECTION).doc();
  const party = await publishTeamSnapshot(uid, catches, PLAYER_ALLIANCE, now);

  if (party == null) {
    return null;
  }

  const chunk = getWorld().getChunk(record.chunk.x, record.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, record.timestamp, record.offset);
  const grunt = db.collection(TEAM_SNAPSHOT_COLLECTION).doc();

  // The grunt's party belongs to nobody, the way a raid boss' does
  await grunt.set({
    player: '',
    alliance: ROCKET_ALLIANCE,
    catches: createRocketParty(snapshot, toSpawns(record.party)),
  });

  await battle.set({
    teams: [grunt.id, party],
    players: [uid],
    // A stop is not a raid, so no lobby owns this fight
    raid: '',
    species: record.party[0]?.species ?? 0,
    outcome: BattleOutcome.Unfinished,
    startedAt: now,
    // A trainer battle is held to the mainline's shape: one ability,
    // one held item, four moves apiece
    limits: PVP_BATTLE_LIMITS,
  });
  await ref.update({ battle: battle.id });

  return battle.id;
}

/**
 * What a beaten grunt owed: the purse, and the pokemon they left
 */
export interface RocketReward {
  encounter: EncounterRecord;
  gold: number;
}

/**
 * Collect what a beaten grunt owes. The `defeated` flag is both the
 * record of the win and the marker that guards it: it is set inside a
 * transaction, and only the call that sets it pays, so a stop pays
 * once however many times it is claimed.
 *
 * Resolves null when the fight was not won, was somebody else's, or
 * has already been collected
 */
export async function claimRocketReward(uid: string, stop: string): Promise<RocketReward | null> {
  const db = getAdminFirestore();
  const ref = db.collection(ROCKET_COLLECTION).doc(stopEntryId(stop, uid));
  const stored = docData(await ref.get());

  if (stored == null) {
    return null;
  }

  const record = asRocketRecord(stored);

  if (record.player !== uid || record.defeated || record.battle == null) {
    return null;
  }

  const battle = docData(await db.collection(BATTLE_COLLECTION).doc(record.battle).get());

  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !new Set(asStringArray(battle.players)).has(uid)
  ) {
    return null;
  }

  const claimed = await db.runTransaction(async (transaction) => {
    const current = docData(await transaction.get(ref));

    if (current == null || current.defeated === true) {
      return false;
    }
    transaction.update(ref, { defeated: true });
    return true;
  });

  if (!claimed) {
    return null;
  }

  // What the grunt is worth, and then what the winner brought along:
  // a buddy burning a Luck Incense doubles the purse
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const gold = overworld.checkGoldReward(stop, ROCKET_STOP_GOLD);

  await grantGold(uid, gold);

  const chunk = getWorld().getChunk(record.chunk.x, record.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, record.timestamp, record.offset);
  const [spawnId, spawn] = deriveRocketReward(record, stop, uid);
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
