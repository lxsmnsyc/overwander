import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * Wish is left behind rather than cast at anybody: the healing
 * arrives later, and it arrives for whoever is standing in the
 * wisher's place. A pokemon that faints in the meantime is past
 * helping, so the wish goes with it
 * https://bulbapedia.bulbagarden.net/wiki/Wish_(move)
 */
const DELAY = turns(2);

/** What it puts back when it lands */
const SHARE = 0.5;

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

    wishes.push({ unit: event.source, remaining: DELAY });
    timer.start();
  });
}
