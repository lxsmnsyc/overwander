import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Team from '../team';
import turns from '../turn';

/**
 * Tailwind: a wind at one side's back, and everything on that side
 * moves at twice the speed while it holds.
 *
 * Speed is what governs cooldowns here, so this is the strongest
 * thing a team can do for itself: for six seconds every move on that
 * side comes round twice as often. It is deliberately outside the
 * stage system, which is why nothing can Haze it away and why it runs
 * out rather than being taken off
 * https://bulbapedia.bulbagarden.net/wiki/Tailwind_(move)
 */
const DURATION = turns(3);

const DOUBLED = 2;

export default function setupTailwind(battle: Battle): void {
  /** How long each side still has the wind behind it */
  const remaining = new Map<Team, number>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Tailwind) {
      remaining.set(event.source.team, DURATION);
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, left] of remaining) {
      if (left <= event.duration) {
        remaining.delete(team);
      } else {
        remaining.set(team, left - event.duration);
      }
    }
  });

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
    if (event.stat === Stats.Speed && remaining.has(event.source.team)) {
      event.value *= DOUBLED;
    }
  });

  // A second wind while the first is still blowing adds nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Tailwind && remaining.has(event.source.team)) {
      event.score -= USELESS_PENALTY;
    }
  });
}
