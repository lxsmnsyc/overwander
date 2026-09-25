import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The guards, and what each one puts on the user. Protect and Detect
 * turn a hit away; Endure takes it and refuses to fall
 */
const GUARD_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.Protect]: Statuses.Protected,
  [Moves.Detect]: Statuses.Protected,
  [Moves.Endure]: Statuses.Enduring,
  [Moves.SpikyShield]: Statuses.Protected,
  [Moves.KingsShield]: Statuses.Protected,
  [Moves.BanefulBunker]: Statuses.Protected,
};

/** What a Spiky Shield costs whatever touches it, as a share of its HP */
export const SPIKY_SHIELD_SHARE = 1 / 8;

/** What a King's Shield takes off whatever touches it */
export const KINGS_SHIELD_STAGES = 1;

/**
 * Which move raised the guard a unit is standing behind. The guard is
 * one status whoever raised it, so this is what tells a Spiky Shield
 * from a Protect
 */
const RAISED_BY = new WeakMap<Unit, Moves>();

/** The move that raised the unit's current guard, if it raised one */
export function guardOf(unit: Unit): Moves | undefined {
  return unit.status[Statuses.Protected] == null ? undefined : RAISED_BY.get(unit);
}

/**
 * A guard held twice over is a unit nothing can reach, so the second
 * one in a row fails. The mainline halves the odds each time; a flat
 * refusal is the same promise without a die roll
 */
export default function setupProtectMoves(battle: Battle): void {
  const guarded = new WeakSet<Unit>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (GUARD_MOVES[event.move] == null) {
      guarded.delete(event.source);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && GUARD_MOVES[event.move] != null && guarded.has(event.source)) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const status = GUARD_MOVES[event.move];

    // Explicit null check: the first Statuses enum member is 0
    if (status == null) {
      return;
    }

    if (guarded.has(event.source)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    guarded.add(event.source);
    RAISED_BY.set(event.source, event.move);

    event.source.addStatus(status, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });

  // What touches the three shields pays for it. Read off a move the
  // guard actually turned away rather than off the question of
  // whether it would, so a move the AI only weighed costs nothing
  battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
    const { source, move, target } = event.parent;

    if (target.type !== MoveTargetType.Unit || target.unit === source) {
      return;
    }

    const guard = guardOf(target.unit);

    if (
      (guard !== Moves.SpikyShield &&
        guard !== Moves.KingsShield &&
        guard !== Moves.BanefulBunker) ||
      !source.checkMoveContact(move, target)
    ) {
      return;
    }

    const cause = { type: EffectType.Move, move: guard, unit: target.unit } as const;

    if (guard === Moves.BanefulBunker) {
      source.addStatus(Statuses.Poisoned, cause);
      return;
    }
    if (guard === Moves.SpikyShield) {
      source.damage(
        cause,
        source,
        source.checkStat(Stats.HP, 0) * SPIKY_SHIELD_SHARE,
        DamageFlags.Indirect | DamageFlags.HealthScaled,
      );
      return;
    }
    source.addStage(Stages.Attack, -KINGS_SHIELD_STAGES, cause);
  });
}
