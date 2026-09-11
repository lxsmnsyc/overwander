import { AttackPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Moves that deal a fixed amount of damage: no stat calculation, no
 * critical hit, no STAB or type effectiveness (Pure attack flag).
 * Type immunities still gate the hit through the shared
 * UnitTriggerMoveTarget immunity check.
 */
/**
 * One-hit KO moves (used by Sturdy's immunity)
 */
export const OHKO_MOVES = new Set<Moves>([
  Moves.Fissure,
  Moves.HornDrill,
  Moves.Guillotine,
  Moves.SheerCold,
]);

const FIXED_DAMAGE_MOVES: {
  [key in Moves]?: (source: Unit, target: Unit) => number;
} = {
  // https://bulbapedia.bulbagarden.net/wiki/Seismic_Toss_(move)
  [Moves.SeismicToss]: (source) => source.level,
  // https://bulbapedia.bulbagarden.net/wiki/Night_Shade_(move)
  [Moves.NightShade]: (source) => source.level,
  // https://bulbapedia.bulbagarden.net/wiki/Dragon_Rage_(move)
  [Moves.DragonRage]: () => 40,
  // https://bulbapedia.bulbagarden.net/wiki/Sonic_Boom_(move)
  [Moves.SonicBoom]: () => 20,
  // https://bulbapedia.bulbagarden.net/wiki/Fissure_(move)
  [Moves.Fissure]: (_, target) => target.health,
  // https://bulbapedia.bulbagarden.net/wiki/Horn_Drill_(move)
  [Moves.HornDrill]: (_, target) => target.health,
  // https://bulbapedia.bulbagarden.net/wiki/Guillotine_(move)
  [Moves.Guillotine]: (_, target) => target.health,
  // https://bulbapedia.bulbagarden.net/wiki/Super_Fang_(move)
  [Moves.SuperFang]: (_, target) => Math.max(1, Math.floor(target.health / 2)),
  // https://bulbapedia.bulbagarden.net/wiki/Psywave_(move)
  [Moves.Psywave]: (source) => Math.max(1, source.level * source.battle.randomRange(0.5, 1.5)),
  // https://bulbapedia.bulbagarden.net/wiki/Sheer_Cold_(move)
  [Moves.SheerCold]: (_, target) => target.health,
  // Levels the two down to the same figure: what the target has above
  // the user is exactly what it loses
  // https://bulbapedia.bulbagarden.net/wiki/Endeavor_(move)
  [Moves.Endeavor]: (source, target) => Math.max(0, target.health - source.health),
};

/**
 * Fixed-damage moves whose amount derives from the target's health
 */
export const HEALTH_SCALED_MOVES = new Set<Moves>([
  Moves.Fissure,
  Moves.HornDrill,
  Moves.Guillotine,
  Moves.SuperFang,
  Moves.SheerCold,
  Moves.Endeavor,
]);

/**
 * What the AI weighs a fixed-damage move at, where the amount itself
 * is a roll and asking for it twice would give two answers
 */
const FIXED_DAMAGE_ESTIMATES: {
  [key in Moves]?: (source: Unit, target: Unit) => number;
} = {
  // Psywave averages out at the user's level
  [Moves.Psywave]: (source) => source.level,
};

/**
 * What a fixed-damage move would take off, without rolling for it.
 * `undefined` for anything whose damage comes from the stats instead.
 *
 * These moves carry no `power`, so an estimate that went by the move
 * data alone would read every one of them as doing nothing
 */
export function estimateFixedDamage(source: Unit, move: Moves, target: Unit): number | undefined {
  return (FIXED_DAMAGE_ESTIMATES[move] ?? FIXED_DAMAGE_MOVES[move])?.(source, target);
}

export default function setupFixedDamageMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const getAmount = FIXED_DAMAGE_MOVES[event.move];

    if (getAmount && event.target.type === MoveTargetType.Unit && event.steps === 0) {
      let flags = MoveAttackFlags.Pure;

      if (HEALTH_SCALED_MOVES.has(event.move)) {
        flags |= MoveAttackFlags.HealthScaled;
      }

      event.source.attack(
        event.target.unit,
        event.move,
        getAmount(event.source, event.target.unit),
        event.source.checkMoveType(event.move, event.target),
        getMoveData(event.move).category,
        flags,
      );
    }
  });
}
