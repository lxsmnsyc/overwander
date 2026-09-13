import { EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Moves, StatFlags } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { ACCURACY_STAGE_LIMIT, accuracyScale } from '../mechanics/move/trigger';

/**
 * The moves that change which numbers a blow is worked out from
 */

/** Swung with the target's own Attack and stages */
const BORROWED_ATTACK = new Set<Moves>([Moves.FoulPlay]);

/** Special moves that land against Defense */
const AGAINST_DEFENSE = new Set<Moves>([Moves.Psyshock, Moves.Psystrike, Moves.SecretSword]);

/** Blind to the target's stages, its evasion included */
const IGNORES_STAGES = new Set<Moves>([Moves.ChipAway, Moves.SacredSword]);

const ALWAYS_CRITICAL = new Set<Moves>([Moves.StormThrow, Moves.FrostBreath]);

export default function setupStatReadingMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Exact, (event) => {
    const parent = event.parent;

    if (
      BORROWED_ATTACK.has(parent.move) &&
      event.unit === parent.source &&
      event.stat === Stats.Attack
    ) {
      event.value = parent.target.resolveStat(Stats.Attack, StatFlags.Attack);
    }
    if (
      AGAINST_DEFENSE.has(parent.move) &&
      event.unit === parent.target &&
      event.stat === Stats.SpecialDefense
    ) {
      // Renamed as well, so anything after this reads the stat in use
      event.stat = Stats.Defense;
      event.value = parent.target.resolveStat(Stats.Defense, StatFlags.Attack);
    }
  });

  // At Post, beside Unaware, which strips stages the same way
  battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
    if (IGNORES_STAGES.has(event.parent.move) && event.unit === event.parent.target) {
      event.value = event.unit.checkStat(event.stat, 0);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveResolveAccuracy, EventPriority.Post, (event) => {
    const parent = event.parent;

    if (!IGNORES_STAGES.has(parent.move) || event.accuracy == null) {
      return;
    }

    const base = parent.source.checkMoveAccuracy(parent.move, parent.target);

    if (base) {
      const stage = parent.source.checkStage(Stages.Accuracy, StatFlags.Attack);

      event.accuracy =
        base *
        accuracyScale(Math.max(-ACCURACY_STAGE_LIMIT, Math.min(stage, ACCURACY_STAGE_LIMIT)));
    }
  });

  // Decided before the roll, so a Lucky Chant or a Battle Armor can
  // still turn it down afterwards
  battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Pre, (event) => {
    if (ALWAYS_CRITICAL.has(event.parent.move)) {
      event.critical = true;
    }
  });
}
