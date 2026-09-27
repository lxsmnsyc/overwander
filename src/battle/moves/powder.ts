import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * Powder, the move: a coat that holds for a turn and goes up the
 * moment its wearer casts fire, costing it 1/4 of its HP and the move
 * https://bulbapedia.bulbagarden.net/wiki/Powder_(move)
 */
export const POWDER_DURATION = turns(1);
export const POWDER_BLAST_SHARE = 1 / 4;

export const POWDER_MOVES = new Set<Moves>([
  Moves.PoisonPowder,
  Moves.SleepPowder,
  Moves.StunSpore,
  Moves.Spore,
]);

export default function setupPowderMoves(battle: Battle): void {
  const coated = new Map<Unit, number>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Powder && event.target.type === MoveTargetType.Unit) {
      coated.set(event.target.unit, POWDER_DURATION);
    }
  });

  // Asked as the move goes off rather than when it is weighed, so a
  // fire move the AI only considered costs nothing
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    const unit = event.source;

    if (!coated.has(unit) || unit.checkMoveType(event.move, event.target) !== Types.Fire) {
      return;
    }

    coated.delete(unit);
    event.disabled = true;
    unit.damage(
      { type: EffectType.Move, move: Moves.Powder, unit },
      unit,
      unit.checkStat(Stats.HP, 0) * POWDER_BLAST_SHARE,
      DamageFlags.Indirect | DamageFlags.HealthScaled,
    );
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, left] of coated) {
      if (left > event.duration) {
        coated.set(unit, left - event.duration);
      } else {
        coated.delete(unit);
      }
    }
  });

  // Setup grass-type immunity
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      POWDER_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.types.has(Types.Grass)
    ) {
      event.immune = true;
    }
  });
}
