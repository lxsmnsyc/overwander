import type { TeamSnapshotRecord } from '../auth/teams';
import { BattleModes } from '../battle/core';
import type Biome from '../data/ids/biome';
import createBattle from '../battle/setup';
import { NPC_BATTLE_LIMITS } from '../data/constants/battle-limits';
import Weather, { toBattleWeather } from '../data/overworld/weather';
import { FRONTIER_TIME_LIMIT, FrontierRule } from '../data/overworld/experts';
import { BattleEvents } from '../battle/events';
import { EventPriority } from '../core/event-emitter';
import { PLAYER_ALLIANCE } from './raid';
import type Battle from '../battle/core';
import { type RaidBattle, fieldTeams } from './raid-battle';

/**
 * The trainer fights, assembled. It is client-only for the same
 * reason the raid builder beside it is: what is here stages an
 * engine, and the engine only runs in a browser
 */

/**
 * Assemble a trainer fight from its stored team snapshots: no raid
 * rules, under whichever non-raid mode the fight was, a stop's by
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
  limits = NPC_BATTLE_LIMITS,
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
    // And the Palace, where nobody is fighting on orders: the units
    // pick by temperament instead
    byNature: rules === FrontierRule.Natured,
  });

  if (mode === BattleModes.Npc) {
    battle.setWeather(toBattleWeather(weather));
  }

  const staged = fieldTeams(battle, teams, null);
  // The Castle, where the service is the house's: nothing puts health
  // back on the challenger's side, whatever asked. It is a veto rather
  // than a heal of zero, so a potion is refused rather than spent
  const guests = staged.alliances.get(PLAYER_ALLIANCE);

  if (rules === FrontierRule.Unhealed && guests != null) {
    battle.on(BattleEvents.CheckUnitCanHeal, EventPriority.Post, (event) => {
      if (event.target.team.alliance === guests) {
        event.success = false;
      }
    });
  }
  return { battle, ...staged };
}

/**
 * A grunt's fight: an ordinary trainer battle whose per-unit ability
 * limit only has to fit the rolled ability alongside Shadow
 */
export function createStopBattle(
  battleId: string,
  teams: TeamSnapshotRecord[],
  limits = NPC_BATTLE_LIMITS,
  weather = Weather.Clear,
  biome?: Biome,
): RaidBattle {
  return createTrainerBattle(battleId, teams, limits, BattleModes.Npc, weather, biome);
}
