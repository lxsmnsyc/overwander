import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Team from '../team';
import turns from '../turn';

/**
 * Lucky Chant: a chant over one side, and nothing lands a critical on
 * it while it holds. It covers the side rather than the unit that
 * sang it, so it survives whoever sang it leaving the field
 * https://bulbapedia.bulbagarden.net/wiki/Lucky_Chant_(move)
 */
const DURATION = turns(5);

export default function setupLuckyChant(battle: Battle): void {
  /** How long each side still has the chant over it */
  const remaining = new Map<Team, number>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.LuckyChant) {
      return;
    }

    const team = event.source.team;

    remaining.set(team, DURATION);
    team.addStatus(TeamStatuses.LuckyChant, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, left] of remaining) {
      if (left <= event.duration) {
        remaining.delete(team);

        const cause = team.status[TeamStatuses.LuckyChant];

        if (cause != null) {
          team.removeStatus(TeamStatuses.LuckyChant, cause);
        }
      } else {
        remaining.set(team, left - event.duration);
      }
    }
  });

  battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
    if (event.critical && remaining.has(event.parent.target.team)) {
      event.critical = false;
    }
  });

  // A second chant while the first is still going adds nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.LuckyChant && remaining.has(event.source.team)) {
      event.score -= USELESS_PENALTY;
    }
  });
}
