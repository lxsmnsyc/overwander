import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { MoveTargetPriorities } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import {
  BattleEvents,
  type CheckTeamAIUnitEvent,
  type CheckUnitAIRatingEvent,
  MoveTargetType,
} from '../events';
import type { Team } from '../team';
import type { Unit } from '../unit';

const RATED_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/**
 * Major conditions that hamper a unit beyond its raw stats
 */
const HAMPERING_STATUS = [
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Burned,
  Statuses.Paralyzed,
  Statuses.Sleeping,
  Statuses.Frozen,
  Statuses.Confused,
];

const HAMPERING_FACTOR = 0.75;

/**
 * How strong a unit currently is. Internal to the AI module.
 */
export function checkUnitRating(battle: Battle, source: Unit) {
  const event: CheckUnitAIRatingEvent = {
    id: 'CheckUnitAIRating',
    disabled: false,
    source,
    rating: 0,
  };
  battle.emit(BattleEvents.CheckUnitAIRating, event);
  return event.rating;
}

/**
 * Pick a unit from a team by rating priority. Internal to the AI
 * module.
 */
export function checkTeamUnit(
  battle: Battle,
  team: Team,
  priority: MoveTargetPriorities,
  exclude?: Unit,
) {
  const event: CheckTeamAIUnitEvent = {
    id: 'CheckTeamAIUnit',
    disabled: false,
    team,
    priority,
    exclude,
    unit: undefined,
  };
  battle.emit(BattleEvents.CheckTeamAIUnit, event);
  return event.unit;
}

export function setupRatingAI(battle: Battle) {
  // Base rating: current health plus resolved stats (stages included)
  battle.on(BattleEvents.CheckUnitAIRating, EventPriority.Exact, event => {
    let rating = event.source.health;

    for (const stat of RATED_STATS) {
      rating += event.source.resolveStat(stat, 0);
    }

    event.rating = rating;
  });

  // Hampering statuses drag the rating down
  battle.on(BattleEvents.CheckUnitAIRating, EventPriority.Post, event => {
    if (HAMPERING_STATUS.some(status => event.source.status[status])) {
      event.rating *= HAMPERING_FACTOR;
    }
  });

  /**
   * Rating-aware focus for move selection: a move aimed at a
   * threatening enemy scores higher, so the AI concentrates fire on
   * the biggest current threat instead of spreading it arbitrarily.
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, EventPriority.Post, event => {
    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const source = event.source;
    const target = event.target.unit;

    if (target === source || target.team.alliance === source.team.alliance) {
      return;
    }

    const ratio =
      checkUnitRating(battle, target) /
      Math.max(1, checkUnitRating(battle, source));

    if (ratio >= 1.5) {
      event.score += 3;
    } else if (ratio >= 1) {
      event.score += 2;
    } else if (ratio >= 0.5) {
      event.score += 1;
    }
  });

  // Resolver: pick the team's unit by priority
  battle.on(BattleEvents.CheckTeamAIUnit, EventPriority.Exact, event => {
    const candidates: Unit[] = [];

    for (const unit of event.team.units) {
      if (unit.alive && unit !== event.exclude) {
        candidates.push(unit);
      }
    }

    if (candidates.length === 0) {
      return;
    }

    if (event.priority === MoveTargetPriorities.Random) {
      event.unit = candidates[Math.floor(battle.random() * candidates.length)];
      return;
    }

    let best: Unit | undefined;
    let bestRating = 0;

    for (const unit of candidates) {
      const rating = checkUnitRating(battle, unit);

      if (
        best == null ||
        (event.priority === MoveTargetPriorities.Strongest
          ? rating > bestRating
          : rating < bestRating)
      ) {
        best = unit;
        bestRating = rating;
      }
    }

    event.unit = best;
  });
}
