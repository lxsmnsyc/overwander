import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, MoveAttackFlags, MoveCategories, Moves } from '../../data/ids/moves';
import { ItemTypes, type Items } from '../../data/ids/items';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import { getItemData } from '../../data/items';
import { getMoveData } from '../../data/moves';
import { FIXED_G_MAX_MOVES, G_MAX_MOVES, gMaxPowerOf } from '../../data/moves/gmax-moves';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import { registerSideCondition } from '../mechanics/side-conditions';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Team from '../team';
import turns from '../turn';
import type Unit from '../unit';
import { hasFreeItemSlot } from '../utils';
import { blowAway } from './defog';
import { pullDown } from './gravity';
import { spiteUnit } from './spite';
import { setStealthRock } from './stealth-rock';
import { setSteelsurge } from './steelsurge';

/**
 * The G-Max Moves: what each leaves behind once it lands, on top of
 * the hit. Which move a Gigantamax throws, and when, is Dynamax's
 * business; this answers only for the moves themselves. Each effect
 * reaches every foe, or the user's whole side, whoever the blow was
 * aimed at, and lands even when the blow knocks its target out
 * https://bulbapedia.bulbagarden.net/wiki/G-Max_Move
 */

/** The four that leave every foe not of a type taking a share each turn */
const RESIDUALS: { [key in Moves]?: Types } = {
  [Moves.GMaxVineLash]: Types.Grass,
  [Moves.GMaxWildfire]: Types.Fire,
  [Moves.GMaxCannonade]: Types.Water,
  [Moves.GMaxVolcalith]: Types.Rock,
};

export const G_MAX_RESIDUAL_SHARE = 1 / 6;
export const G_MAX_RESIDUAL_DURATION = turns(4);
const RESIDUAL_TICK = turns(1);

/** How far Chi Strike lifts a side's critical hit ratio, at most */
export const CHI_STRIKE_LIMIT = 3;

/** What G-Max Finale gives back to everybody on the side */
export const FINALE_SHARE = 1 / 6;

/** The odds of G-Max Snooze's drowsiness and of each G-Max Replenish berry */
export const SNOOZE_CHANCE = 0.5;
export const REPLENISH_CHANCE = 0.5;

const BEFUDDLE = [Statuses.Poisoned, Statuses.Paralyzed, Statuses.Sleeping] as const;
const STUN_SHOCK = [Statuses.Poisoned, Statuses.Paralyzed] as const;

/** One status for each foe, each drawn on its own */
const FOE_STATUSES: { [key in Moves]?: readonly Statuses[] } = {
  [Moves.GMaxBefuddle]: BEFUDDLE,
  [Moves.GMaxVoltCrash]: [Statuses.Paralyzed],
  [Moves.GMaxGoldRush]: [Statuses.Confused],
  [Moves.GMaxTerror]: [Statuses.Cornered],
  [Moves.GMaxCuddle]: [Statuses.Infatuated],
  [Moves.GMaxMalodor]: [Statuses.Poisoned],
  [Moves.GMaxMeltdown]: [Statuses.Tormented],
  [Moves.GMaxSandblast]: [Statuses.Trapped],
  [Moves.GMaxStunShock]: STUN_SHOCK,
  [Moves.GMaxCentiferno]: [Statuses.Trapped],
  [Moves.GMaxSmite]: [Statuses.Confused],
};

/** The stage each foe loses */
const FOE_STAGES: { [key in Moves]?: [Stages, number] } = {
  [Moves.GMaxFoamBurst]: [Stages.Speed, -2],
  [Moves.GMaxTartness]: [Stages.Evasion, -1],
};

/** The two that walk through a guard */
const GUARD_BREAKERS = new Set<Moves>([Moves.GMaxOneBlow, Moves.GMaxRapidFlow]);

interface Residual {
  type: Types;
  left: number;
  progress: number;
  cause: EffectCause;
}

function foesOf(battle: Battle, unit: Unit): Unit[] {
  const foes: Unit[] = [];

  for (const other of battle.units(unit.team.alliance)) {
    if (other.alive) {
      foes.push(other);
    }
  }
  return foes;
}

function sideOf(unit: Unit): Unit[] {
  const side: Unit[] = [];

  for (const team of unit.team.alliance.teams) {
    for (const other of team.units) {
      if (other.alive) {
        side.push(other);
      }
    }
  }
  return side;
}

export default function setupGMaxMoves(battle: Battle): void {
  /** The move each unit last threw, which a G-Max Move thrown in its place reads */
  const bases = new Map<Unit, Moves>();
  /** What each side is taking each turn, by the move that left it */
  const residuals = new Map<Team, Map<Moves, Residual>>();
  /** How far Chi Strike has lifted each unit's critical hit ratio */
  const focus = new Map<Unit, number>();
  /** The berry each unit last ate, which Replenish grows back */
  const eaten = new Map<Unit, Items>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Prepare, (event) => {
    if (event.steps === 0 && !G_MAX_MOVES.has(event.move)) {
      bases.set(event.source, event.move);
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    if (G_MAX_MOVES.has(event.move) && !FIXED_G_MAX_MOVES.has(event.move)) {
      event.power = gMaxPowerOf(bases.get(event.source), getMoveData(event.move).type);
    }
  });

  battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
    const base = bases.get(event.source);

    if (G_MAX_MOVES.has(event.move) && base != null) {
      const category = getMoveData(base).category;

      if (category !== MoveCategories.Status) {
        event.category = category;
      }
    }
  });

  battle.on(BattleEvents.CheckUnitMoveGuard, EventPriority.Exact, (event) => {
    if (GUARD_BREAKERS.has(event.move)) {
      event.walks = true;
    }
  });

  // What a Replenish has to grow back: a berry the unit ate itself
  battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
    if (event.cause.type === EffectType.Item && getItemData(event.item).type === ItemTypes.Berry) {
      eaten.set(event.source, event.item);
    }
  });

  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    event.value += focus.get(event.parent.source) ?? 0;
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      bases.delete(event.source);
      focus.delete(event.source);
      eaten.delete(event.source);
    });
  }

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, held] of residuals) {
      for (const [move, residual] of [...held]) {
        residual.left -= event.duration;
        residual.progress += event.duration;

        if (residual.progress >= RESIDUAL_TICK) {
          residual.progress -= RESIDUAL_TICK;
          bite(team, residual);
        }
        if (residual.left <= 0) {
          held.delete(move);
        }
      }
      if (held.size === 0) {
        residuals.delete(team);
      }
    }
    if (residuals.size === 0) {
      timer.stop();
    }
  });

  timer.stop();

  function bite(team: Team, residual: Residual): void {
    if (residual.cause.type === EffectType.None) {
      return;
    }
    for (const unit of [...team.units]) {
      if (unit.alive && !unit.types.has(residual.type)) {
        residual.cause.unit.damage(
          residual.cause,
          unit,
          unit.checkStat(Stats.HP, 0) * G_MAX_RESIDUAL_SHARE,
          DamageFlags.Indirect | DamageFlags.HealthScaled,
        );
      }
    }
  }

  function leaveResidual(team: Team, move: Moves, type: Types, cause: EffectCause): void {
    const held = residuals.get(team) ?? new Map<Moves, Residual>();

    held.set(move, { type, left: G_MAX_RESIDUAL_DURATION, progress: 0, cause });
    residuals.set(team, held);
    timer.start();
  }

  // Court Change carries what is left of each across
  for (const [key, type] of Object.entries(RESIDUALS)) {
    // The table is keyed by the move enum, which comes back as a string
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const move = Number(key) as Moves;

    registerSideCondition(battle, {
      read: (team) => residuals.get(team)?.get(move)?.left,
      write: (team, value, cause) => {
        if (value == null) {
          residuals.get(team)?.delete(move);
          return;
        }
        leaveResidual(team, move, type, cause);

        const residual = residuals.get(team)?.get(move);

        if (residual != null) {
          residual.left = value;
        }
      },
    });
  }

  function landed(source: Unit, target: Unit, move: Moves): void {
    const cause = { type: EffectType.Move, move, unit: source } as const;
    const residual = RESIDUALS[move];

    if (residual != null) {
      for (const team of battle.teams(source.team.alliance)) {
        leaveResidual(team, move, residual, cause);
      }
      return;
    }

    const statuses = FOE_STATUSES[move];

    if (statuses != null) {
      for (const foe of foesOf(battle, source)) {
        foe.addStatus(statuses[Math.floor(battle.random() * statuses.length)], cause);
      }
      return;
    }

    const stage = FOE_STAGES[move];

    if (stage != null) {
      for (const foe of foesOf(battle, source)) {
        foe.addStage(stage[0], stage[1], cause);
      }
      return;
    }

    switch (move) {
      case Moves.GMaxChiStrike:
        for (const ally of sideOf(source)) {
          focus.set(ally, Math.min(CHI_STRIKE_LIMIT, (focus.get(ally) ?? 0) + 1));
        }
        break;
      case Moves.GMaxResonance:
        if (source.team.status[TeamStatuses.AuroraVeil] == null) {
          source.team.addStatus(TeamStatuses.AuroraVeil, cause);
        }
        break;
      case Moves.GMaxReplenish:
        for (const ally of sideOf(source)) {
          const berry = eaten.get(ally);

          if (berry != null && hasFreeItemSlot(ally) && battle.random() < REPLENISH_CHANCE) {
            eaten.delete(ally);
            ally.addItem(berry);
          }
        }
        break;
      case Moves.GMaxWindRage:
        blowAway(battle, target.team, cause);
        break;
      case Moves.GMaxGravitas:
        pullDown(battle);
        break;
      case Moves.GMaxStonesurge:
        setStealthRock(target.team, true, cause);
        break;
      case Moves.GMaxSteelsurge:
        setSteelsurge(target.team, cause);
        break;
      case Moves.GMaxSweetness:
        for (const ally of sideOf(source)) {
          for (const status of MAJOR_STATUS_CONDITIONS) {
            if (ally.status[status] != null) {
              ally.removeStatus(status, cause);
            }
          }
        }
        break;
      case Moves.GMaxSnooze:
        if (target.alive && battle.random() < SNOOZE_CHANCE) {
          target.addStatus(Statuses.Drowsy, cause);
        }
        break;
      case Moves.GMaxFinale:
        for (const ally of sideOf(source)) {
          ally.heal(cause, ally, ally.checkStat(Stats.HP, 0) * FINALE_SHARE, 0);
        }
        break;
      case Moves.GMaxDepletion:
        for (const foe of foesOf(battle, source)) {
          spiteUnit(battle, foe);
        }
        break;
      default:
        break;
    }
  }

  battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
    if (
      event.success &&
      G_MAX_MOVES.has(event.move) &&
      !(event.flags & MoveAttackFlags.Simulated) &&
      event.source.alive
    ) {
      landed(event.source, event.target, event.move);
    }
  });
}
