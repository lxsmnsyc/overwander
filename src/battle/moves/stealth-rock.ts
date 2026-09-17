import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { TYPE_EFFECTIVENESS, TYPE_EFFECTIVENESS_FACTOR, Types } from '../../data/constants/types';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import type Unit from '../unit';

/**
 * Stealth Rock: stones hung over a side, which cost whatever walks in
 * an eighth of its health, doubled or halved by how it takes a Rock
 * move. They hang in the air rather than lying on it, so a Flying type
 * pays the most and nothing is spared by being off the ground.
 *
 * One layer only, unlike the two kinds of spikes
 * https://bulbapedia.bulbagarden.net/wiki/Stealth_Rock_(move)
 */
const BASE_DAMAGE = 1 / 8;

const HUNG = new WeakSet<Team>();

export function stonesOver(team: Team): boolean {
  return HUNG.has(team);
}

/** Bring a side's stones down, answering whether there were any */
export function clearStealthRock(team: Team): boolean {
  if (!HUNG.has(team)) {
    return false;
  }

  HUNG.delete(team);

  const cause = team.status[TeamStatuses.StealthRock];

  if (cause != null) {
    team.removeStatus(TeamStatuses.StealthRock, cause);
  }
  return true;
}

/** What a Rock move is worth against this unit, as a multiplier */
function rockAgainst(unit: Unit): number {
  let factor = 1;

  for (const type of unit.types) {
    const matchup = TYPE_EFFECTIVENESS[Types.Rock][type];

    if (matchup != null) {
      factor *= TYPE_EFFECTIVENESS_FACTOR[matchup];
    }
  }
  return factor;
}

export default function setupStealthRock(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      event.usable &&
      event.move === Moves.StealthRock &&
      event.target.type === MoveTargetType.Team
    ) {
      event.usable = !stonesOver(event.target.team);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.StealthRock || event.target.type !== MoveTargetType.Team) {
      return;
    }

    const team = event.target.team;

    if (stonesOver(team)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    HUNG.add(team);
    team.addStatus(TeamStatuses.StealthRock, {
      type: EffectType.Move,
      move: Moves.StealthRock,
      unit: event.source,
    });
  });

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;

    if (!unit.alive || !stonesOver(unit.team)) {
      return;
    }

    const factor = rockAgainst(unit);

    if (factor === 0) {
      return;
    }

    unit.damage(
      unit.team.status[TeamStatuses.StealthRock] ?? { type: EffectType.None },
      unit,
      unit.checkStat(Stats.HP, 0) * BASE_DAMAGE * factor,
      DamageFlags.Indirect | DamageFlags.HealthScaled,
    );
  });

  // Hanging them a second time does nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.move === Moves.StealthRock &&
      event.target.type === MoveTargetType.Team &&
      stonesOver(event.target.team)
    ) {
      event.score -= USELESS_PENALTY;
    }
  });
}
