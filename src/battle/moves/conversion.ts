import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { TYPE_EFFECTIVENESS, TypeEffectiveness, Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';
import { USELESS_PENALTY } from '../ai/score';

/**
 * Conversion: the user becomes the type of one of its own moves.
 *
 * The modern reading of it, which is not the one this dex was written
 * for. In Red and Blue, Conversion copied the **target's** types — a
 * Porygon looking at a Gengar became Ghost/Poison — and from Gen II it
 * reads the user's own move list instead, narrowing in Gen VI to the
 * move in the first slot and nothing else. This game takes the modern
 * rules wherever the two disagree, so it is the first slot.
 *
 * That makes it a move about the *order* a pokemon's moves are in,
 * which is worth saying out loud: a Porygon carrying Psybeam first
 * turns Psychic, and one carrying Tackle first turns Normal and has
 * spent its turn on almost nothing.
 *
 * https://bulbapedia.bulbagarden.net/wiki/Conversion_(move)
 */

/**
 * The type the user would take: the first move it is carrying, in the
 * order it carries them.
 *
 * Null where there is nothing to read — a unit with no moves at all,
 * or one whose first move is typeless. Conversion into `Unknown` is
 * not a type change, it is a pokemon that nothing is super effective
 * against, and Struggle is not a costume
 */
export function conversionType(unit: Unit): Types | null {
  for (const state of Object.values(unit.moves)) {
    // tsgolint narrows the optional record's values to defined; at
    // runtime a cleared slot holds undefined
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (state == null || state.move === Moves.Conversion) {
      continue;
    }
    const type = getMoveData(state.move).type;

    return type === Types.Unknown ? null : type;
  }
  return null;
}

export default function setupConversion(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Conversion) {
      return;
    }

    const wanted = conversionType(event.source);

    if (wanted == null) {
      return;
    }

    // Set rather than added: the point of it is to *be* that type, so
    // a Porygon that turns Psychic stops being Normal and stops
    // resisting what Normal resists
    for (const type of [...event.source.types]) {
      event.source.removeType(type);
    }
    event.source.addType(wanted);
  });

  // Nothing to convert into, or already wearing it: the move would
  // spend a cast and change nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Conversion) {
      return;
    }

    const wanted = conversionType(event.source);

    if (wanted == null || (event.source.types.size === 1 && event.source.types.has(wanted))) {
      event.score -= USELESS_PENALTY;
    }
  });
}

/**
 * Conversion 2: the user takes a type that stands up to whatever hit
 * it last. The mainline reads the target's last move; so does this,
 * and the first type in the chart that resists it or sits the type
 * out entirely is the one taken
 * https://bulbapedia.bulbagarden.net/wiki/Conversion_2_(move)
 */
function resistingType(against: Types): Types | null {
  const row = TYPE_EFFECTIVENESS[against];

  for (const key of Object.keys(TYPE_EFFECTIVENESS)) {
    // The chart is keyed by the type enum, which comes back as a
    // string from Object.keys
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const type = Number(key) as Types;
    const effect = row[type];

    if (
      type !== Types.Unknown &&
      (effect === TypeEffectiveness.Resistant || effect === TypeEffectiveness.Immune)
    ) {
      return type;
    }
  }
  return null;
}

export function setupConversion2(battle: Battle): void {
  const lastType = new Map<Unit, Types>();

  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Post, (event) => {
    const type = getMoveData(event.move).type;

    if (type !== Types.Unknown) {
      lastType.set(event.source, type);
    }
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    lastType.delete(event.source);
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Conversion2) {
      const against =
        event.target.type === MoveTargetType.Unit ? lastType.get(event.target.unit) : undefined;

      event.usable = against != null && resistingType(against) != null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Conversion2 || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const against = lastType.get(event.target.unit);
    const wanted = against == null ? null : resistingType(against);

    if (wanted == null) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    for (const type of [...event.source.types]) {
      event.source.removeType(type);
    }
    event.source.addType(wanted);
  });
}
