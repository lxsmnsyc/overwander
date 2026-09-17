import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import type Unit from '../unit';

/**
 * Toxic Spikes: poisoned caltrops scattered under a side. One layer
 * poisons whatever walks in, two poison it badly, and a Poison type
 * walking in takes them up on the way past rather than being poisoned
 * by its own element
 * https://bulbapedia.bulbagarden.net/wiki/Toxic_Spikes_(move)
 */
const MAX_LAYERS = 2;

/** How deep the caltrops lie under each side */
const LAYERS = new WeakMap<Team, number>();

export function toxicLayersUnder(team: Team): number {
  return LAYERS.get(team) ?? 0;
}

/** Sweep a side clear, answering whether there was anything to sweep */
export function clearToxicSpikes(team: Team): boolean {
  if (toxicLayersUnder(team) === 0) {
    return false;
  }

  LAYERS.delete(team);

  const cause = team.status[TeamStatuses.ToxicSpikes];

  if (cause != null) {
    team.removeStatus(TeamStatuses.ToxicSpikes, cause);
  }
  return true;
}

/** Whether the caltrops reach this unit at all: they lie on the floor */
function walksOn(unit: Unit): boolean {
  return unit.checkGrounded() && !unit.types.has(Types.Flying);
}

export default function setupToxicSpikes(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      event.usable &&
      event.move === Moves.ToxicSpikes &&
      event.target.type === MoveTargetType.Team
    ) {
      event.usable = toxicLayersUnder(event.target.team) < MAX_LAYERS;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.ToxicSpikes || event.target.type !== MoveTargetType.Team) {
      return;
    }

    const team = event.target.team;
    const laid = toxicLayersUnder(team);

    if (laid >= MAX_LAYERS) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    LAYERS.set(team, laid + 1);
    team.addStatus(TeamStatuses.ToxicSpikes, {
      type: EffectType.Move,
      move: Moves.ToxicSpikes,
      unit: event.source,
    });
  });

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;
    const laid = toxicLayersUnder(unit.team);

    if (laid === 0 || !unit.alive || !walksOn(unit)) {
      return;
    }

    // A Poison type takes them up rather than standing in them: it is
    // the one thing on the field that knows how to handle them
    if (unit.types.has(Types.Poison)) {
      clearToxicSpikes(unit.team);
      return;
    }

    unit.addStatus(laid >= MAX_LAYERS ? Statuses.BadlyPoisoned : Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.ToxicSpikes,
      unit,
    });
  });
}
