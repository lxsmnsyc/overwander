import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Species } from '../../data/ids/species';
import { MoveCategories, MoveTargets, type Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import {
  GENERIC_Z_MOVES,
  TYPE_Z_MOVES,
  type ZStatusEffect,
  Z_STATUS_EFFECTS,
  canBecomeZMove,
  zPowerOf,
} from '../../data/moves/z-moves';
import { getMegaStone } from '../../data/items/mega-stones';
import { SIGNATURE_CRYSTALS, TYPE_CRYSTALS } from '../../data/items/z-crystals';
import type Battle from '../core';
import { BattleEvents, EffectType, type MoveTarget, MoveTargetType } from '../events';
import { megaOf } from '../items/megas';
import type Team from '../team';
import type Unit from '../unit';

/**
 * Z-Moves. A unit holding a Z-Crystal has a matching move turned into
 * its Z-Move as the move goes off, with no button to press, so the AI
 * and a player get it the same way. The first one a side throws spends
 * it for the whole side for the rest of the fight. A status move keeps
 * going off as itself, with its Z-effect paid first. A Mega, or a unit
 * that would become one, never throws one: its stone is what it holds
 * https://bulbapedia.bulbagarden.net/wiki/Z-Move
 */

const ALL_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
] as const;

/** Whether the unit is a Mega, or holds what would make it one */
function isMegaHolder(unit: Unit): boolean {
  return (
    megaOf(unit) != null ||
    getMegaStone(unit.species) != null ||
    unit.species === Species.RayquazaMega
  );
}

/** The Z-Move this unit's crystal makes of the move, if any */
function zMoveFor(unit: Unit, move: Moves, target: MoveTarget): Moves | null {
  if (!canBecomeZMove(move) || isMegaHolder(unit)) {
    return null;
  }
  for (const [item, crystal] of SIGNATURE_CRYSTALS) {
    if (unit.hasItem(item) && crystal.move === move && crystal.holders.includes(unit.species)) {
      return crystal.zMove;
    }
  }

  const type = unit.checkMoveType(move, target);

  return holdsTypeCrystal(unit, type) ? (TYPE_Z_MOVES.get(type) ?? null) : null;
}

function holdsTypeCrystal(unit: Unit, type: Types): boolean {
  for (const [item, crystal] of TYPE_CRYSTALS) {
    if (unit.hasItem(item) && crystal.type === type) {
      return true;
    }
  }
  return false;
}

/** The Z-effect this unit's crystal adds to a status move, if any */
function zEffectFor(unit: Unit, move: Moves, target: MoveTarget): ZStatusEffect | null {
  const effect = Z_STATUS_EFFECTS.get(move);

  if (
    effect == null ||
    isMegaHolder(unit) ||
    !holdsTypeCrystal(unit, unit.checkMoveType(move, target))
  ) {
    return null;
  }
  return effect;
}

function applyZEffect(unit: Unit, move: Moves, effect: ZStatusEffect): void {
  const cause = { type: EffectType.Move, move, unit } as const;
  const heal = (): void => {
    unit.heal(cause, unit, unit.checkStat(Stats.HP, 0), 0);
  };

  switch (effect.kind) {
    case 'stages':
      for (const stage of effect.stages) {
        unit.addStage(stage, effect.value, cause);
      }
      break;
    case 'heal':
      heal();
      break;
    case 'clear':
      for (const stage of ALL_STAGES) {
        if (unit.stages[stage] < 0) {
          unit.addStage(stage, -unit.stages[stage], cause);
        }
      }
      break;
    case 'critical':
      unit.addStatus(Statuses.FocusEnergy, cause);
      break;
    case 'centre':
      unit.addStatus(Statuses.Centered, cause);
      break;
    case 'curse':
      if (unit.types.has(Types.Ghost)) {
        heal();
      } else {
        unit.addStage(Stages.Attack, 1, cause);
      }
      break;
  }
}

/**
 * Who a Z-Move goes at. It is always aimed at one enemy, so one thrown
 * off a move that went out to everybody picks the first enemy standing,
 * and one thrown off a move aimed at the user's own side is not thrown
 */
function zTargetOf(battle: Battle, unit: Unit, target: MoveTarget): MoveTarget | null {
  if (target.type === MoveTargetType.Unit) {
    return target.unit.team.alliance === unit.team.alliance ? null : target;
  }
  for (const other of battle.units()) {
    if (other.alive && other.team.alliance !== unit.team.alliance) {
      return { type: MoveTargetType.Unit, unit: other };
    }
  }
  return null;
}

export default function setupZMoves(battle: Battle): void {
  /** The sides that have thrown their Z-Move this fight */
  const spent = new WeakSet<Team>();
  /** The move each unit's type Z-Move replaced, for its power and category */
  const replaced = new Map<Unit, Moves>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    const unit = event.source;

    // The wind-up steps of a charged move go by as they are; the blow is the one turned
    if (event.steps !== 0 || spent.has(unit.team)) {
      return;
    }

    if (getMoveData(event.move).category === MoveCategories.Status) {
      const effect = zEffectFor(unit, event.move, event.target);

      if (effect != null) {
        spent.add(unit.team);
        applyZEffect(unit, event.move, effect);
      }
      return;
    }

    const zMove = zMoveFor(unit, event.move, event.target);

    if (zMove == null) {
      return;
    }

    // A Z-Move that goes out to a whole side, or to nobody, needs no aim
    const aimed =
      getMoveData(zMove).target === MoveTargets.None
        ? ({ type: MoveTargetType.None } as const)
        : zTargetOf(battle, unit, event.target);

    if (aimed == null) {
      return;
    }

    spent.add(unit.team);
    event.disabled = true;
    replaced.set(unit, event.move);
    unit.triggerMove(zMove, aimed, 0);
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    const base = replaced.get(event.source);

    if (GENERIC_Z_MOVES.has(event.move) && base != null) {
      event.power = zPowerOf(base);
    }
  });

  battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
    const base = replaced.get(event.source);

    if (GENERIC_Z_MOVES.has(event.move) && base != null) {
      event.category = getMoveData(base).category;
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      replaced.delete(event.source);
    });
  }
}
