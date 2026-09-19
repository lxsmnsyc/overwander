import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import type Unit from '../unit';
import walksOverHazards from './hazards';

/**
 * Sticky Web: a net over a side that costs whatever walks in a stage
 * of Speed. It lies on the ground like the spikes, so what never
 * touches the ground walks over it. One layer only
 * https://bulbapedia.bulbagarden.net/wiki/Sticky_Web_(move)
 */
export const STICKY_WEB_STAGES = 1;

const WOVEN = new WeakSet<Team>();

export function webOver(team: Team): boolean {
  return WOVEN.has(team);
}

/** Tear a side's web down, answering whether there was one */
export function clearStickyWeb(team: Team): boolean {
  if (!WOVEN.has(team)) {
    return false;
  }

  WOVEN.delete(team);

  const cause = team.status[TeamStatuses.StickyWeb];

  if (cause != null) {
    team.removeStatus(TeamStatuses.StickyWeb, cause);
  }
  return true;
}

function walksOn(unit: Unit): boolean {
  return unit.checkGrounded() && !unit.types.has(Types.Flying);
}

export default function setupStickyWeb(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      event.usable &&
      event.move === Moves.StickyWeb &&
      event.target.type === MoveTargetType.Team
    ) {
      event.usable = !webOver(event.target.team);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.StickyWeb || event.target.type !== MoveTargetType.Team) {
      return;
    }

    const team = event.target.team;

    if (webOver(team)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    WOVEN.add(team);
    team.addStatus(TeamStatuses.StickyWeb, {
      type: EffectType.Move,
      move: Moves.StickyWeb,
      unit: event.source,
    });
  });

  // What walks in is slowed. A unit already standing on it when it is
  // woven is not walking in, so nothing happens until it comes back
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;

    if (!unit.alive || !webOver(unit.team) || !walksOn(unit) || walksOverHazards(unit)) {
      return;
    }

    unit.addStage(
      Stages.Speed,
      -STICKY_WEB_STAGES,
      unit.team.status[TeamStatuses.StickyWeb] ?? { type: EffectType.None },
    );
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.move === Moves.StickyWeb &&
      event.target.type === MoveTargetType.Team &&
      webOver(event.target.team)
    ) {
      event.score -= USELESS_PENALTY;
    }
  });
}
