import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';

/**
 * Wonder Room and Magic Room: Trick Room's siblings, each bending the
 * whole field for a while, and each taken down by a second casting
 * https://bulbapedia.bulbagarden.net/wiki/Wonder_Room_(move)
 */
const DURATION = turns(5);

const SWAPPED = new Map<Stats, Stats>([
  [Stats.Defense, Stats.SpecialDefense],
  [Stats.SpecialDefense, Stats.Defense],
]);

export default function setupRooms(battle: Battle): void {
  const remaining = new Map<Moves, number>([
    [Moves.WonderRoom, 0],
    [Moves.MagicRoom, 0],
  ]);

  const standing = (room: Moves): boolean => (remaining.get(room) ?? 0) > 0;

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (remaining.has(event.move)) {
      remaining.set(event.move, standing(event.move) ? 0 : DURATION);
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [room, left] of remaining) {
      if (left > 0) {
        remaining.set(room, Math.max(0, left - event.duration));
      }
    }
  });

  // Asking for the partner comes back through here, so the swap stands
  // aside while it answers, the way Power Trick's does
  let swapping = false;

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
    const partner = SWAPPED.get(event.stat);

    if (swapping || partner == null || !standing(Moves.WonderRoom)) {
      return;
    }
    swapping = true;
    try {
      event.value = event.source.checkStat(partner, 0);
    } finally {
      swapping = false;
    }
  });

  battle.on(BattleEvents.CheckUnitItem, EventPriority.Post, (event) => {
    if (standing(Moves.MagicRoom)) {
      event.enabled = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (remaining.has(event.move) && standing(event.move)) {
      event.score -= USELESS_PENALTY;
    }
  });
}
