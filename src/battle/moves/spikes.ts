import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import type Unit from '../unit';

/**
 * How deep the spikes may be laid, and what each depth costs whatever
 * walks in: an eighth, a sixth, a quarter
 */
const LAYER_DAMAGE = [1 / 8, 1 / 6, 1 / 4];

/**
 * How deep the spikes are laid under each side. It is a weak map so a
 * finished battle's teams take their spikes with them, and it lives
 * here rather than inside the setup so Rapid Spin can sweep them
 */
const LAYERS = new WeakMap<Team, number>();

export function layersUnder(team: Team): number {
  return LAYERS.get(team) ?? 0;
}

/**
 * Sweep a side clear. Answers whether there was anything to sweep, so
 * a move that clears them can tell whether it did
 */
export function clearSpikes(team: Team): boolean {
  if (layersUnder(team) === 0) {
    return false;
  }

  LAYERS.delete(team);

  const cause = team.status[TeamStatuses.Spikes];

  if (cause != null) {
    team.removeStatus(TeamStatuses.Spikes, cause);
  }
  return true;
}

/**
 * Spikes sit on the ground, so what never touches it never feels
 * them. The airborne check is the engine's own, so a Flying type
 * pulled down by Gravity walks into them like anything else
 */
function walksOn(unit: Unit): boolean {
  return unit.checkGrounded() && !unit.types.has(Types.Flying);
}

export default function setupSpikes(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Spikes && event.target.type === MoveTargetType.Team) {
      event.usable = layersUnder(event.target.team) < LAYER_DAMAGE.length;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (event.move !== Moves.Spikes || event.target.type !== MoveTargetType.Team) {
      return;
    }

    const team = event.target.team;
    const laid = layersUnder(team);

    if (laid >= LAYER_DAMAGE.length) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    LAYERS.set(team, laid + 1);
    team.addStatus(TeamStatuses.Spikes, {
      type: EffectType.Move,
      move: Moves.Spikes,
      unit: event.source,
    });
  });

  // What walks in pays. A unit already on the field when they are laid
  // is not walking in, so nothing happens to it until it comes back
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;
    const laid = layersUnder(unit.team);

    if (laid === 0 || !unit.alive || !walksOn(unit)) {
      return;
    }

    unit.damage(
      unit.team.status[TeamStatuses.Spikes] ?? { type: EffectType.None },
      unit,
      unit.checkStat(Stats.HP, 0) * LAYER_DAMAGE[laid - 1],
      DamageFlags.Indirect | DamageFlags.HealthScaled,
    );
  });

  // Nothing to lay them under is a cast spent on an empty bench
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Spikes || event.target.type !== MoveTargetType.Team) {
      return;
    }

    let waiting = 0;

    for (const unit of event.target.team.units) {
      if (unit.alive && unit.status[Statuses.Switching] == null) {
        waiting += 1;
      }
    }

    // One unit standing there is the one already on the field
    if (waiting <= 1) {
      event.score -= USELESS_PENALTY;
    }
  });
}
