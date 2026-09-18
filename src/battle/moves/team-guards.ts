import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveAffects, MoveTargets, Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import turns from '../turn';

/**
 * Wide Guard and Quick Guard: Protect over a whole team, for one kind
 * of move each. They hold as long as a Protect does, and the modern
 * rule lets them be raised back to back
 * https://bulbapedia.bulbagarden.net/wiki/Wide_Guard_(move)
 */
const DURATION = turns(1);

const GUARDS: { [key in Moves]?: TeamStatuses } = {
  [Moves.WideGuard]: TeamStatuses.WideGuard,
  [Moves.QuickGuard]: TeamStatuses.QuickGuard,
};

/** A move that goes out to several pokemon at once */
function isSpread(move: Moves): boolean {
  const data = getMoveData(move);

  return data.target === MoveTargets.None && (data.affects & MoveAffects.Unit) !== 0;
}

export default function setupTeamGuards(battle: Battle): void {
  const raised = new Map<Team, Map<TeamStatuses, number>>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const status = GUARDS[event.move];

    // Explicit null check: TeamStatuses starts at 0
    if (status == null) {
      return;
    }

    const team = event.source.team;
    const guards = raised.get(team) ?? new Map<TeamStatuses, number>();

    team.addStatus(status, { type: EffectType.Move, move: event.move, unit: event.source });
    guards.set(status, DURATION);
    raised.set(team, guards);
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, guards] of raised) {
      for (const [status, left] of guards) {
        if (left > event.duration) {
          guards.set(status, left - event.duration);
          continue;
        }
        guards.delete(status);

        const cause = team.status[status];

        if (cause != null) {
          team.removeStatus(status, cause);
        }
      }
      if (guards.size === 0) {
        raised.delete(team);
      }
    }
  });

  battle.on(BattleEvents.TeamRemoveStatus, EventPriority.Post, (event) => {
    raised.get(event.team)?.delete(event.status);
  });

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (event.immune || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (target === event.source) {
      return;
    }

    const team = target.team;
    let guard: TeamStatuses;

    if (team.status[TeamStatuses.WideGuard] != null && isSpread(event.move)) {
      guard = TeamStatuses.WideGuard;
    } else if (
      team.status[TeamStatuses.QuickGuard] != null &&
      event.source.checkMovePriority(event.move, event.target) > 0
    ) {
      guard = TeamStatuses.QuickGuard;
    } else {
      return;
    }

    const cause = team.status[guard];

    // What walks through a Protect breaks a team guard the same way
    if (event.source.checkMoveGuard(event.move, event.target)) {
      if (cause != null) {
        team.removeStatus(guard, cause);
      }
      return;
    }

    event.immune = true;
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const status = GUARDS[event.move];

    if (status != null && event.source.team.status[status] != null) {
      event.score -= USELESS_PENALTY;
    }
  });
}
