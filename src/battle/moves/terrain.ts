import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Terrains } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Team from '../team';
import turns from '../turn';

/**
 * The terrain moves: a move whose whole effect is what the field is
 * laid with afterwards. The clock lives here rather than with the
 * terrain mechanics, the way a weather move's does, since only a
 * terrain somebody laid runs out again
 */
export const TERRAIN_DURATION = turns(5);

export const TERRAIN_MOVES = new Map<Moves, Terrains>([
  [Moves.ElectricTerrain, Terrains.Electric],
  [Moves.GrassyTerrain, Terrains.Grassy],
  [Moves.MistyTerrain, Terrains.Misty],
  [Moves.PsychicTerrain, Terrains.Psychic],
]);

export default function setupTerrainMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const terrain = TERRAIN_MOVES.get(event.move);

    if (terrain != null) {
      event.source.setTerrain(
        terrain,
        event.source.checkTerrainDuration(terrain, TERRAIN_DURATION),
      );
    }
  });

  const expiring = new Map<Team | Battle, number>();

  const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [holder, remaining] of [...expiring]) {
      const left = remaining - event.duration;

      if (left > 0) {
        expiring.set(holder, left);
        continue;
      }

      expiring.delete(holder);
      holder.setTerrain(Terrains.None);
    }

    if (expiring.size === 0) {
      clock.stop();
    }
  });

  clock.stop();

  function hold(holder: Team | Battle, terrain: Terrains, duration: number): void {
    if (terrain === Terrains.None || duration <= 0) {
      expiring.delete(holder);
      return;
    }

    expiring.set(holder, duration);
    clock.start();
  }

  battle.on(BattleEvents.SetTerrain, EventPriority.Post, (event) => {
    hold(battle, event.terrain, event.duration);
  });

  battle.on(BattleEvents.TeamSetTerrain, EventPriority.Post, (event) => {
    hold(event.team, event.terrain, event.duration);
  });

  // Laying the terrain that is already down changes nothing
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const terrain = TERRAIN_MOVES.get(event.move);

    if (event.usable && terrain != null && event.source.checkTerrain() === terrain) {
      event.usable = false;
    }
  });
}
