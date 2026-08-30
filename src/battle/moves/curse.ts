import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * What a Ghost pays to lay one
 */
const GHOST_COST = 0.5;

/**
 * Two moves in one, told apart by who is casting. A Ghost spends half
 * its own health to curse what it is looking at; anything else digs
 * in, trading Speed for Attack and Defense
 * https://bulbapedia.bulbagarden.net/wiki/Curse_(move)
 */
function isGhost(unit: Unit): boolean {
  return unit.types.has(Types.Ghost);
}

export default function setupCurse(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable || event.move !== Moves.Curse || !isGhost(event.source)) {
      return;
    }

    // A Ghost that cannot pay, or has nothing new to curse, is
    // spending half its health on nothing
    event.usable =
      event.source.health > event.source.checkStat(Stats.HP, 0) * GHOST_COST &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.Cursed] == null;
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Curse) {
      return;
    }

    const cause = {
      type: EffectType.Move,
      move: Moves.Curse,
      unit: event.source,
    } as const;

    if (!isGhost(event.source)) {
      event.source.addStage(Stages.Attack, 1, cause);
      event.source.addStage(Stages.Defense, 1, cause);
      event.source.addStage(Stages.Speed, -1, cause);
      return;
    }

    if (event.target.type !== MoveTargetType.Unit) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    const cost = event.source.checkStat(Stats.HP, 0) * GHOST_COST;

    if (event.source.health <= cost) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // The price is paid first, so the curse is laid by a unit that has
    // already survived paying for it
    event.source.damage(cause, event.source, cost, DamageFlags.Indirect | DamageFlags.Cost);
    event.target.unit.addStatus(Statuses.Cursed, cause);
  });
}
