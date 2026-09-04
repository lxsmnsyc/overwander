import type { TeamSnapshotRecord } from '../auth/teams';
import { BattleModes } from '../battle/core';
import type Biome from '../data/ids/biome';
import createBattle from '../battle/setup';
import { PVP_BATTLE_LIMITS } from '../data/constants/battle-limits';
import Weather, { toBattleWeather } from '../data/overworld/weather';
import { FRONTIER_TIME_LIMIT, FrontierRule } from '../data/overworld/experts';
import type Battle from '../battle/core';
import { type RaidBattle, fieldTeams } from './raid-battle';

/**
 * The trainer fights, assembled. It is client-only for the same
 * reason the raid builder beside it is: what is here stages an
 * engine, and the engine only runs in a browser
 */

/**
 * Assemble a trainer fight from its stored team snapshots: no raid
 * rules, under whichever non-raid mode the fight was, a grunt's by
 * default, a player's when both sides are somebody's.
 *
 * The sky is laid before the teams are fielded, so a pokemon that
 * reads the weather as it arrives reads the one it is standing in.
 * It holds for the whole fight rather than running out, since it is
 * the world's sky and not a move's, and it only reaches a fight
 * against the world: two players meet under nothing
 */
export function createTrainerBattle(
  battleId: string,
  teams: TeamSnapshotRecord[],
  limits = PVP_BATTLE_LIMITS,
  mode: BattleModes = BattleModes.Npc,
  weather = Weather.Clear,
  biome?: Biome,
  rules = FrontierRule.None,
): RaidBattle {
  const battle: Battle = createBattle(battleId, {
    mode,
    realtime: true,
    limits,
    biome,
    // The Arena is the one house that stops a fight rather than
    // waiting for it to end
    timeLimit: rules === FrontierRule.Timed ? FRONTIER_TIME_LIMIT : 0,
  });

  if (mode === BattleModes.Npc) {
    battle.setWeather(toBattleWeather(weather));
  }
  return { battle, ...fieldTeams(battle, teams, null) };
}

/**
 * A grunt's fight: an ordinary trainer battle whose per-unit ability
 * limit only has to fit the rolled ability alongside Shadow
 */
export function createRocketBattle(
  battleId: string,
  teams: TeamSnapshotRecord[],
  limits = PVP_BATTLE_LIMITS,
  weather = Weather.Clear,
  biome?: Biome,
): RaidBattle {
  return createTrainerBattle(battleId, teams, limits, BattleModes.Npc, weather, biome);
}
