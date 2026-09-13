import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Guard Split and Power Split: the user and the target each take the
 * average of a pair of stats, until they leave the field. Read at the
 * stat rather than written into it, like Power Trick
 * https://bulbapedia.bulbagarden.net/wiki/Guard_Split_(move)
 */
const SPLITS: { [key in Moves]?: Stats[] } = {
  [Moves.GuardSplit]: [Stats.Defense, Stats.SpecialDefense],
  [Moves.PowerSplit]: [Stats.Attack, Stats.SpecialAttack],
};

export default function setupSplitMoves(battle: Battle): void {
  const shared = new Map<Unit, Map<Stats, number>>();

  /** Set while a stat is read before any split or modifier touches it */
  let reading: { value: number } | undefined;

  function unsplit(unit: Unit, stat: Stats): number {
    const read = { value: 0 };

    reading = read;
    try {
      unit.checkStat(stat, 0);
    } finally {
      reading = undefined;
    }
    return read.value;
  }

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Exact, (event) => {
    if (reading != null) {
      reading.value = event.value;
      return;
    }

    const value = shared.get(event.source)?.get(event.stat);

    if (value != null) {
      event.value = value;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const stats = SPLITS[event.move];

    if (stats == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    for (const stat of stats) {
      const average = Math.floor((unsplit(event.source, stat) + unsplit(target, stat)) / 2);

      for (const unit of [event.source, target]) {
        const split = shared.get(unit) ?? new Map<Stats, number>();

        split.set(stat, average);
        shared.set(unit, split);
      }
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      shared.delete(event.source);
    });
  }

  // Only worth it against somebody ahead on the pair
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const stats = SPLITS[event.move];

    if (stats == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const ahead = stats.reduce(
      (total, stat) => total + target.checkStat(stat, 0) - event.source.checkStat(stat, 0),
      0,
    );

    if (ahead <= 0) {
      event.score -= USELESS_PENALTY;
    }
  });
}
