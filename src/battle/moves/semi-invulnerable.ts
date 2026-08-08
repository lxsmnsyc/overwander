import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type { Unit } from '../unit';

interface SemiInvulnerableConfig {
  /**
   * Moves that can still hit the semi-invulnerable unit
   */
  bypass: Set<Moves>;
  /**
   * Subset of bypass moves that deal double damage
   */
  doubled: Set<Moves>;
}

/**
 * Two-step moves that hide the user on the charging step (Dig, Fly).
 * The damage on the final step is handled by the hit move group.
 */
const SEMI_INVULNERABLE_MOVES: { [key in Moves]?: SemiInvulnerableConfig } = {
  // https://bulbapedia.bulbagarden.net/wiki/Dig_(move)
  [Moves.Dig]: {
    bypass: new Set([Moves.Earthquake, Moves.Fissure]),
    doubled: new Set([Moves.Earthquake]),
  },
  // https://bulbapedia.bulbagarden.net/wiki/Fly_(move)
  // TODO Twister (doubled), Hurricane once implemented
  [Moves.Fly]: {
    bypass: new Set([Moves.Gust, Moves.Thunder]),
    doubled: new Set([Moves.Gust]),
  },
  // Self switch-out: the user vanishes during the wind-up step.
  // The switch itself is handled by the switch-out move group.
  [Moves.Teleport]: {
    bypass: new Set(),
    doubled: new Set(),
  },
};

function getSemiInvulnerableConfig(target: Unit) {
  const cause = target.status[Statuses.Invulnerable];

  if (cause && cause.type === EffectType.Move) {
    return SEMI_INVULNERABLE_MOVES[cause.move];
  }

  return undefined;
}

export function setupSemiInvulnerableMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    if (event.move in SEMI_INVULNERABLE_MOVES) {
      const cause = {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      } as const;

      if (event.steps === 1) {
        event.source.addStatus(Statuses.Invulnerable, cause);
      } else {
        event.source.removeStatus(Statuses.Invulnerable, cause);
      }
    }
  });

  /**
   * Moves against a semi-invulnerable target always miss, except the
   * ones that reach the target's hiding spot.
   *
   * Forced through the hit roll instead of the accuracy check: a falsy
   * base accuracy means "no accuracy check" to the resolver, so zeroing
   * the accuracy would guarantee a hit instead of a miss.
   */
  battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, event => {
    const target = event.parent.target;

    if (event.hit && target.type === MoveTargetType.Unit) {
      const config = getSemiInvulnerableConfig(target.unit);

      if (config && !config.bypass.has(event.parent.move)) {
        event.hit = false;
      }
    }
  });

  // Reaching moves that punish the hiding spot deal double damage
  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, event => {
    const config = getSemiInvulnerableConfig(event.parent.target);

    if (config?.doubled.has(event.parent.move)) {
      event.value *= 2;
    }
  });
}
