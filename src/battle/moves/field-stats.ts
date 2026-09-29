import { AttackPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The stat moves that pick who they reach by what each pokemon is,
 * rather than by where it stands: Rototiller and Flower Shield reach
 * every Grass type on the field, Magnetic Flux reaches the user's side
 * carrying Plus or Minus, and Venom Drench reaches only what is
 * already poisoned
 * https://bulbapedia.bulbagarden.net/wiki/Rototiller_(move)
 */
interface FieldStatMove {
  stages: Stages[];
  value: number;
  /** Whether this unit is one the move reaches */
  reaches: (unit: Unit, source: Unit) => boolean;
}

const POISONED = [Statuses.Poisoned, Statuses.BadlyPoisoned];

function isPoisoned(unit: Unit): boolean {
  for (const status of POISONED) {
    if (unit.status[status] != null) {
      return true;
    }
  }
  return false;
}

const FIELD_STAT_MOVES: { [key in Moves]?: FieldStatMove } = {
  // The soil is turned, so what is not standing in it is not reached
  [Moves.Rototiller]: {
    stages: [Stages.Attack, Stages.SpecialAttack],
    value: 1,
    reaches: (unit) => unit.types.has(Types.Grass) && unit.checkGrounded(),
  },
  [Moves.FlowerShield]: {
    stages: [Stages.Defense],
    value: 1,
    reaches: (unit) => unit.types.has(Types.Grass),
  },
  [Moves.MagneticFlux]: {
    stages: [Stages.Defense, Stages.SpecialDefense],
    value: 1,
    reaches: (unit, source) =>
      unit.team === source.team &&
      (unit.hasAbility(Abilities.Plus) || unit.hasAbility(Abilities.Minus)),
  },
  [Moves.VenomDrench]: {
    stages: [Stages.Attack, Stages.SpecialAttack, Stages.Speed],
    value: -1,
    reaches: (unit) => isPoisoned(unit),
  },
};

/** Who on the field this move would reach, for the move and the AI alike */
function reached(battle: Battle, move: Moves, source: Unit): Unit[] {
  const config = FIELD_STAT_MOVES[move];
  const units: Unit[] = [];

  if (config == null) {
    return units;
  }
  for (const unit of battle.units()) {
    if (unit.alive && config.reaches(unit, source)) {
      units.push(unit);
    }
  }
  return units;
}

export default function setupFieldStatMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const config = FIELD_STAT_MOVES[event.move];

    if (config == null) {
      return;
    }

    // Venom Drench lands on each target it was thrown at; the others
    // go out over the whole field at once
    let units: Unit[];

    if (event.target.type === MoveTargetType.Unit) {
      units = config.reaches(event.target.unit, event.source) ? [event.target.unit] : [];
    } else {
      units = reached(battle, event.move, event.source);
    }

    if (units.length === 0) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const unit of units) {
      for (const stage of config.stages) {
        unit.addStage(stage, config.value, cause);
      }
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable || FIELD_STAT_MOVES[event.move] == null) {
      return;
    }

    const config = FIELD_STAT_MOVES[event.move];

    event.usable =
      event.target.type === MoveTargetType.Unit
        ? config?.reaches(event.target.unit, event.source) === true
        : reached(battle, event.move, event.source).length > 0;
  });
}
