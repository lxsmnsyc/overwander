import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Terrains } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Alliance from '../alliance';
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

  /**
   * Which side laid the terrain each holder has down. Written as a unit
   * lays one, since the holder it lands on is only settled once the
   * battle mode has routed it
   */
  const laidBy = new Map<Team | Battle, Alliance>();
  let laying: Alliance | null = null;

  battle.on(BattleEvents.UnitSetTerrain, EventPriority.Pre, (event) => {
    laying = event.source.team.alliance;
  });

  function record(holder: Team | Battle, terrain: Terrains): void {
    if (terrain === Terrains.None || laying == null) {
      laidBy.delete(holder);
    } else {
      laidBy.set(holder, laying);
    }
    laying = null;
  }

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
    record(battle, event.terrain);
  });

  battle.on(BattleEvents.TeamSetTerrain, EventPriority.Post, (event) => {
    hold(event.team, event.terrain, event.duration);
    record(event.team, event.terrain);
  });

  // Laying the terrain that is already down changes nothing, and
  // laying another over one its own side put down throws away the
  // turns that one had left. An enemy's terrain is still fair game
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const terrain = TERRAIN_MOVES.get(event.move);

    if (!event.usable || terrain == null) {
      return;
    }
    if (event.source.checkTerrain() === terrain) {
      event.usable = false;
      return;
    }
    // Read off the holder rather than the unit, which feels nothing
    // while it is in the air and would lay a second one over the first
    const holder = battle.terrain.current === Terrains.None ? event.source.team : battle;

    if (
      holder.terrain.current !== Terrains.None &&
      laidBy.get(holder) === event.source.team.alliance
    ) {
      event.usable = false;
    }
  });
}
