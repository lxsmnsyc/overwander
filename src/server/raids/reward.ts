import 'server-only';
import BattleOutcome from '../../auth/battle-outcome';
import { type EncounterRecord, asEncounterRecord } from '../../auth/encounter-record';
import { RaidKind, type RaidRecord, asRaidRecord, deriveRaidReward } from '../../auth/raid-record';
import ChunkSnapshot from '../../overworld/chunk-snapshot';
import { WORLD_GENERATION, getChunkOfSeed } from '../../overworld/current';
import createOverworld from '../../overworld/setup';
import resolveBuddy from '../buddy';
import { Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import Biome from '../../data/ids/biome';
import { getSql } from '../db';
import { foughtBattle, readBattle, readRaid } from '../raid-io';
import { startEncounter } from '../overworld';
import { readEncounter } from '../encounter-io';
import { encounterKey } from '../../overworld/safari';
import { grantGold } from '../profile';
import { asOutcome } from './outcome';
import { RAID_ENCOUNTER_TYPES, RAID_GOLD, RAID_REWARD_LEVELS, RAID_SHINY_BOOST } from './spoils';
import { Boost, boostOf, boosted } from '../boosts';

/** What a beaten boss leaves, and claiming it */
/**
 * What a cleared raid owes one fighter: the legendary waiting for
 * them, and the purse that came with it
 */
export interface RaidReward {
  encounter: EncounterRecord;
  gold: number;
}

/**
 * Collect what a cleared raid owes. The claim marker at
 * raidRewards/{raidId}:{uid} guards it, so the raid pays each fighter
 * once however late they come back for it — the gold and the pokemon
 * ride the same marker, so neither can be collected twice. The
 * encounter is derived against the raid's own chunk and window, not
 * wherever the player is standing now
 */
export async function claimRaidReward(uid: string, lobby: string): Promise<RaidReward | null> {
  const stored = await readRaid(lobby);

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.battle == null) {
    return null;
  }

  const battle = await readBattle(raid.battle);

  // Only the players who actually fielded a team are owed anything,
  // and only from a raid that was won
  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !(await foughtBattle(raid.battle, uid))
  ) {
    return null;
  }

  const shadow = raid.kind === RaidKind.Shadow;
  // What the boss is worth, and then what the claimant brought along:
  // a buddy burning a Luck Incense doubles the purse
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const gold = boosted(
    overworld.checkGoldReward(lobby, RAID_GOLD[raid.kind]),
    await boostOf(Boost.Gold, Date.now()),
  );
  const claimed = await getSql()`
    insert into raid_rewards (raid_id, player, gold)
    values (${lobby}, ${uid}, ${gold})
    on conflict do nothing
  `;

  if (claimed.count === 0) {
    return reopenReward(uid, deriveRaidReward(raid, lobby, uid)[0]);
  }
  await grantGold(uid, gold, 'raid-reward');
  await bumpProgress(uid, [[Metric.GoldEarned, 0, gold]]);

  // The raid's own world, so a cave lair's prize remembers the cave
  const chunk = getChunkOfSeed(raid.chunk.x, raid.chunk.y, raid.chunk.seed);
  // The raid's own window and zone, not wherever the claimant is now
  const snapshot = new ChunkSnapshot(chunk, raid.timestamp, raid.offset);
  const [spawnId, spawn] = deriveRaidReward(raid, lobby, uid);
  const encounter = await startEncounter(uid, snapshot, spawnId, spawn, {
    // The three raids hand over different prizes, so a catch says
    // which lobby it came out of
    type: RAID_ENCOUNTER_TYPES[raid.kind],
    shadow,
    // The prize remembers the place it was won in — and a mythical
    // remembers that the place was nowhere on the map
    lair: raid.lair,
    biome: raid.kind === RaidKind.Mythical ? Biome.Beyond : undefined,
    level: RAID_REWARD_LEVELS[raid.kind],
    shinyBoost: RAID_SHINY_BOOST,
  });

  return { encounter, gold };
}

/**
 * A reward already paid, whose pokemon was left uncaught: the same
 * encounter again, with no gold, so closing the meeting loses nothing
 */
async function reopenReward(uid: string, spawnId: string): Promise<RaidReward | null> {
  const existing = await readEncounter(spawnId, uid);

  if (existing == null) {
    return null;
  }

  const encounter = asEncounterRecord(existing);
  const gone = await getSql()`
    select 1 from fled_encounters
    where player = ${uid} and generation = ${WORLD_GENERATION} and key = ${encounterKey(encounter)}
  `;

  return gone.length > 0 ? null : { encounter, gold: 0 };
}
