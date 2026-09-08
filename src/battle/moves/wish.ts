import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { scoreHeal } from '../ai/score';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import turns from '../turn';
import type { MoveTarget } from '../events';
import type Unit from '../unit';

/**
 * Wish heals late rather than now, and it can be left with a teammate
 * rather than kept. A pokemon that faints in the meantime is past
 * helping, so the wish goes with it
 * https://bulbapedia.bulbagarden.net/wiki/Wish_(move)
 */
const DELAY = turns(2);

/** What it puts back when it lands */
const SHARE = 0.5;

/** Who the wish is left with: the one it was aimed at, else the wisher */
function wishedOn(source: Unit, target: MoveTarget): Unit {
  return target.type === MoveTargetType.Unit ? target.unit : source;
}

interface Pending {
  unit: Unit;
  remaining: number;
}

export default function setupWish(battle: Battle): void {
  const wishes: Pending[] = [];

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const wish of [...wishes]) {
      wish.remaining -= event.duration;

      if (wish.remaining > 0) {
        continue;
      }

      wishes.splice(wishes.indexOf(wish), 1);

      if (wish.unit.alive) {
        wish.unit.heal(
          { type: EffectType.Move, move: Moves.Wish, unit: wish.unit },
          wish.unit,
          wish.unit.checkStat(Stats.HP, 0) * SHARE,
          0,
        );
      }
    }

    if (wishes.length === 0) {
      timer.stop();
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Wish) {
      return;
    }

    wishes.push({ unit: wishedOn(event.source, event.target), remaining: DELAY });
    timer.start();
  });

  // Worth what it would put back for whoever it is left with, the way
  // an outright heal is. It arrives late, so a wish on somebody who is
  // barely hurt is a cast spent on nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Wish) {
      scoreHeal(event, wishedOn(event.source, event.target), SHARE);
    }
  });
}
