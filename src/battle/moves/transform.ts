import { EventPriority } from '../../core/event-emitter';
import { Stats, StatsKind } from '../../data/constants/stats';
import type { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type { Species } from '../../data/ids/species';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Stats copied by Transform — everything but HP
 */
const COPIED_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

interface TransformSnapshot {
  moves: Moves[];
  types: Types[];
  stats: [Stats, number][];
  appearance: Species;
}

/**
 * Pre-transform state of currently transformed units, restored in
 * full on revert
 */
const snapshots = new WeakMap<Unit, TransformSnapshot>();

function heldMoves(unit: Unit): Moves[] {
  const moves: Moves[] = [];

  for (const state of Object.values(unit.moves)) {
    // tsgolint narrows the optional record's values to defined; at
    // runtime cleared slots hold undefined
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (state) {
      moves.push(state.move);
    }
  }

  return moves;
}

/**
 * Copy the target's appearance, types, stats (except HP), stages and
 * move set onto the source (Transform, Imposter). The copy lasts
 * until the source leaves the field or faints.
 */
export function transformUnit(source: Unit, target: Unit): void {
  // The first transform snapshots the original state
  if (!snapshots.has(source)) {
    snapshots.set(source, {
      moves: heldMoves(source),
      types: [...source.types],
      stats: COPIED_STATS.map((stat) => [stat, source.stats[StatsKind.Base][stat]]),
      appearance: source.appearance,
    });
  }

  source.setAppearance(target.appearance);

  for (const type of [...source.types]) {
    source.removeType(type);
  }
  for (const type of target.types) {
    source.addType(type);
  }

  for (const stat of COPIED_STATS) {
    source.setStat(StatsKind.Base, stat, target.stats[StatsKind.Base][stat]);
  }

  Object.assign(source.stages, target.stages);

  for (const move of heldMoves(source)) {
    source.removeMove(move);
  }
  for (const move of heldMoves(target)) {
    source.addMove(move);
  }
}

function revert(unit: Unit): void {
  const snapshot = snapshots.get(unit);

  if (snapshot) {
    snapshots.delete(unit);

    unit.setAppearance(snapshot.appearance);

    for (const type of [...unit.types]) {
      unit.removeType(type);
    }
    for (const type of snapshot.types) {
      unit.addType(type);
    }

    for (const [stat, value] of snapshot.stats) {
      unit.setStat(StatsKind.Base, stat, value);
    }

    for (const move of heldMoves(unit)) {
      unit.removeMove(move);
    }
    for (const move of snapshot.moves) {
      unit.addMove(move);
    }

    unit.resetStages({ type: EffectType.None });
  }
}

export default function setupTransform(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (
      event.move === Moves.Transform &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit !== event.source
    ) {
      transformUnit(event.source, event.target.unit);
    }
  });

  // The copy wears off when the unit leaves the field
  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    revert(event.source);
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    revert(event.source);
  });
}
