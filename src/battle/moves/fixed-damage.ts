import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type { Unit } from '../unit';

/**
 * Moves that deal a fixed amount of damage: no stat calculation, no
 * critical hit, no STAB or type effectiveness (Pure attack flag).
 *
 * TODO type immunities should still apply
 * (e.g. Seismic Toss vs Ghost, Fissure vs Flying)
 */
const FIXED_DAMAGE_MOVES: {
  [key in Moves]?: (source: Unit, target: Unit) => number;
} = {
  // https://bulbapedia.bulbagarden.net/wiki/Seismic_Toss_(move)
  [Moves.SeismicToss]: source => source.level,
  // https://bulbapedia.bulbagarden.net/wiki/Dragon_Rage_(move)
  [Moves.DragonRage]: () => 40,
  // https://bulbapedia.bulbagarden.net/wiki/Fissure_(move)
  [Moves.Fissure]: (_, target) => target.health,
  // https://bulbapedia.bulbagarden.net/wiki/Super_Fang_(move)
  [Moves.SuperFang]: (_, target) => Math.max(1, target.health / 2),
  // https://bulbapedia.bulbagarden.net/wiki/Psywave_(move)
  [Moves.Psywave]: source =>
    Math.max(1, source.level * source.battle.randomRange(0.5, 1.5)),
};

export function setupFixedDamageMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    const getAmount = FIXED_DAMAGE_MOVES[event.move];

    if (
      getAmount &&
      event.target.type === MoveTargetType.Unit &&
      event.steps === 0
    ) {
      event.source.attack(
        event.target.unit,
        event.move,
        getAmount(event.source, event.target.unit),
        event.source.checkMoveType(event.move, event.target),
        getMoveData(event.move).category,
        MoveAttackFlags.Pure,
      );
    }
  });
}
