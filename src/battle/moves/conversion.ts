import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';
import { USELESS_PENALTY } from '../ai/choose-move';

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
