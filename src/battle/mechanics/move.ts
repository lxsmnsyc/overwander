import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  TypeEffectiveness,
  Types,
} from '../../data/constants/types';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  MoveFlags,
  MoveTargetFlags,
  Moves,
  StatFlags,
} from '../../data/ids/moves';
import { PP_UP_LIMIT, getMoveData, getMovePP } from '../../data/moves';
import type Alliance from '../alliance';
import type Battle from '../core';
import type {
  CheckUnitAttackEffectChanceEvent,
  CheckUnitAttackEffectEvent,
  MoveState,
  TriggerMoveData,
  UnitAttackEvent,
  UnitAttackResolveAmountEvent,
  UnitAttackResolveCriticalEvent,
  UnitAttackResolveEffectivenessEvent,
  UnitAttackResolveStatEvent,
  UnitTriggerMoveEvent,
  UnitTriggerMoveResolveAccuracyEvent,
  UnitTriggerMoveRollHitEvent,
} from '../events';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import type Unit from '../unit';

const FPS = 60;
const FPS_DURATION = 1000 / FPS;
const FRAMES_PER_PRIORITY = 16;
const BASE_FRAMES = 104;

/**
 * The gap between a move going off and its effect landing, for moves
 * that do not name their own. It is what the swing takes: without it
 * the damage lands on the frame the animation starts, and every hit
 * in the game is over before it is seen.
 *
 * A move whose data carries a `delay` keeps it — a projectile's is its
 * flight time, which is longer than a swing
 */
export const MOVE_DELAY = 250;

function getCastTime(priority: number): number {
  return (BASE_FRAMES - priority * FRAMES_PER_PRIORITY) * FPS_DURATION;
}

function isTypeImmune(offendingType: Types, defendingType: Types): boolean {
  return TYPE_EFFECTIVENESS[offendingType][defendingType] === TypeEffectiveness.Immune;
}

function isUnitImmune(unit: Unit, offending: Types): boolean {
  for (const defending of unit.types) {
    if (isTypeImmune(offending, defending)) {
      return true;
    }
  }
  return false;
}

function createMoveState(source: Unit, move: Moves): MoveState {
  return {
    source,
    move,
    disabled: false,
    cooldown: undefined,
    // Nothing has been spent on it until whoever fields the unit says
    // so, which is what keeps a wild pokemon's moves plain
    points: 0,
  };
}

export function setupMoveMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitAddMove, EventPriority.Exact, (event) => {
    event.source.moves[event.move] = createMoveState(event.source, event.move);
  });
  battle.on(BattleEvents.UnitSetMovePoints, EventPriority.Exact, (event) => {
    const data = event.source.moves[event.move];

    // Only a move the unit actually has: points for one it does not
    // know belong to nothing, and inventing a state for them would
    // give it a move it was never fielded with
    if (data) {
      data.points = Math.min(Math.max(0, Math.floor(event.points)), PP_UP_LIMIT);
    }
  });
  battle.on(BattleEvents.UnitRemoveMove, EventPriority.Exact, (event) => {
    // Deleted rather than blanked: the record is walked with
    // Object.values by both the AI and the field readout, and a slot
    // that is present but empty reads as a move with no state at all.
    // A forgotten move is not a move the unit knows nothing about, it
    // is a move the unit does not have.
    //
    // Through `Reflect` rather than the `delete` keyword only because
    // the key is computed, which the lint refuses on the grounds that
    // a record with dynamic keys wants to be a `Map`. This one is a
    // record keyed by a move id everywhere else in the engine
    Reflect.deleteProperty(event.source.moves, event.move);
  });
  battle.on(BattleEvents.UnitEnableMove, EventPriority.Exact, (event) => {
    const current = event.source.moves[event.move];
    if (current) {
      current.disabled = false;
    }
  });
  battle.on(BattleEvents.UnitDisableMove, EventPriority.Exact, (event) => {
    const current = event.source.moves[event.move];
    if (current) {
      current.disabled = true;
    }
  });

  // Checks
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Exact, (event) => {
    event.type = getMoveData(event.move).type;
  });
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, (event) => {
    if (event.target.type === MoveTargetType.Unit) {
      event.immune = isUnitImmune(event.target.unit, event.type);
    }
  });
  // Powder- and spore-based moves cannot affect Grass types
  // (modern mechanics)
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, (event) => {
    if (
      !event.immune &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.types.has(Types.Grass) &&
      getMoveData(event.move).flags & MoveFlags.Powder
    ) {
      event.immune = true;
    }
  });
  // Ground moves cannot reach airborne units (Floating status, Flying
  // type); the Grounded status drags them back into range
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, (event) => {
    if (
      !event.immune &&
      event.type === Types.Ground &&
      event.target.type === MoveTargetType.Unit &&
      !event.target.unit.checkGrounded()
    ) {
      event.immune = true;
    }
  });
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Exact, (event) => {
    event.accuracy = getMoveData(event.move).accuracy;
  });
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    event.power = getMoveData(event.move).power;
  });
  battle.on(BattleEvents.CheckUnitMovePP, EventPriority.Exact, (event) => {
    // What the move is registered with, plus whatever its owner spent
    // on it. Everything that changes PP afterwards — Pressure halving
    // it — is a multiplier at a later priority, so the order the two
    // land in does not matter
    event.pp = getMovePP(event.move, event.source.moves[event.move]?.points ?? 0);
  });
  battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Exact, (event) => {
    event.priority = getMoveData(event.move).priority ?? 0;
  });
  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Exact, (event) => {
    event.steps = getMoveData(event.move).steps ?? 0;
  });
  battle.on(BattleEvents.CheckUnitMoveDelay, EventPriority.Exact, (event) => {
    event.duration = getMoveData(event.move).delay ?? MOVE_DELAY;
  });
}

function isCastingTargetUnit(caster: Unit, target: Unit): boolean {
  return (
    !!caster.casting &&
    caster.casting.target.type === MoveTargetType.Unit &&
    caster.casting.target.unit === target
  );
}

function canUnitCastMove(caster: Unit, move: Moves): boolean {
  // Struggle is nobody's move. It is what is thrown when everything
  // that *is* somebody's move has been shut off, so it cannot be asked
  // for from the move set the way the rest are — it would be refused
  // for not being in there, which is the only condition it is ever
  // used under.
  //
  // Attack is **not** exempt, though it is nobody's move either: every
  // unit is fielded carrying it, so it is in the set like any other
  // and it cools like any other. Waving it through here would be a
  // pokemon swinging with no cooldown at all
  if (move === Moves.Struggle) {
    return true;
  }

  const data = caster.moves[move];
  if (data) {
    return !(data.disabled || data.cooldown);
  }
  return false;
}

export function setupCastingMechanics(battle: Battle): void {
  const queue = new Set<Unit>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const unit of queue) {
      // advance timer
      if (unit.casting) {
        unit.updateCast({
          time: {
            duration: unit.casting.time.duration,
            progress: unit.casting.time.progress + event.duration,
          },
        });
      } else {
        unit.stopCast();
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Exact, (event) => {
    if (event.success) {
      event.success =
        // Caster must be alive
        event.source.alive &&
        // Caster must not be casting/channeling
        !(event.source.casting ?? event.source.channeling) &&
        // Move must not be disabled or in cooldown
        canUnitCastMove(event.source, event.move);

      // If the move target is a unit, make sure it is still alive
      if (event.target.type === MoveTargetType.Unit) {
        event.success = event.success && event.target.unit.alive;
      }
    }
  });

  battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Exact, (event) => {
    event.duration = getCastTime(event.source.checkMovePriority(event.move, event.target));
  });

  battle.on(BattleEvents.UnitCast, EventPriority.Exact, (event) => {
    const castTime = event.source.checkMoveCastTime(event.move, event.target);

    event.source.casting = {
      target: event.target,
      time: {
        progress: 0,
        duration: castTime,
      },
      move: event.move,
    };

    // Add new entry for the tick updates
    queue.add(event.source);

    if (queue.size === 1) {
      timer.start();
    }
  });

  battle.on(BattleEvents.UnitUpdateCast, EventPriority.Exact, (event) => {
    if (event.source.casting) {
      event.source.casting = {
        ...event.source.casting,
        ...event.data,
      };

      if (event.source.casting.time.progress >= event.source.casting.time.duration) {
        event.source.finishCast();
      }
    }
  });

  battle.on(BattleEvents.UnitStopCast, EventPriority.Exact, (event) => {
    event.source.casting = undefined;
    queue.delete(event.source);

    if (queue.size === 0) {
      timer.stop();
    }
  });

  battle.on(BattleEvents.UnitFinishCast, EventPriority.Exact, (event) => {
    const casting = event.source.casting;
    if (casting) {
      event.source.stopCast();

      event.source.startCooldown(casting.move, casting.target);

      const steps = event.source.checkMoveSteps(casting.move, casting.target);

      // Trigger first step
      event.source.triggerMove(casting.move, casting.target, steps);

      if (steps > 0) {
        // Channel next effect
        event.source.channel(casting.move, casting.target, steps - 1);
      }
    }
  });

  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, (event) => {
    if (event.source === event.target) {
      // Look up all casting units and stop those whose current target
      // is the switching unit
      for (const unit of queue) {
        if (isCastingTargetUnit(unit, event.source) || isCastingTargetUnit(unit, event.target)) {
          unit.stopCast();
        }
      }
    } else {
      // Otherwise, update the casting target
      for (const unit of queue) {
        if (isCastingTargetUnit(unit, event.source)) {
          unit.updateCast({
            target: {
              type: MoveTargetType.Unit,
              unit: event.target,
            },
          });
          // TODO should this swap targets?
        } else if (isCastingTargetUnit(unit, event.target)) {
          unit.updateCast({
            target: {
              type: MoveTargetType.Unit,
              unit: event.source,
            },
          });
        }
      }
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, (event) => {
    // look up all casting units whose current target is this unit.
    for (const unit of queue) {
      if (isCastingTargetUnit(unit, event.source)) {
        unit.stopCast();
      }
    }
  });

  battle.on(BattleEvents.UnitInterrupt, EventPriority.Exact, (event) => {
    if (event.source.casting) {
      event.source.stopCast();
    }
  });
}

function isChannelingTargetUnit(caster: Unit, target: Unit): boolean {
  return (
    !!caster.channeling &&
    caster.channeling.target.type === MoveTargetType.Unit &&
    caster.channeling.target.unit === target
  );
}

export function setupChannelingMechanics(battle: Battle): void {
  const queue = new Set<Unit>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const unit of queue) {
      // advance timer
      if (unit.channeling) {
        unit.updateChannel({
          time: {
            duration: unit.channeling.time.duration,
            progress: unit.channeling.time.progress + event.duration,
          },
        });
      } else {
        unit.stopChannel();
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Exact, (event) => {
    if (event.success) {
      event.success =
        // Caster must be alive
        event.source.alive &&
        // The wind-up it continues is already over: a channel is
        // started from finishCast or finishChannel, both of which
        // clear the phase they end before opening the next one
        !(event.source.casting ?? event.source.channeling) &&
        // Move must not be disabled. Cooldown is deliberately not
        // consulted: the cooldown of this very move started when the
        // cast finished, and the channel is the rest of that same use
        !event.source.moves[event.move]?.disabled;

      // If the move target is a unit, make sure it is still alive
      if (event.target.type === MoveTargetType.Unit) {
        event.success = event.success && event.target.unit.alive;
      }
    }
  });

  /**
   * A channelled step runs as long as the wind-up that opened it. It
   * is the engine's stand-in for a turn, so a two-step move spends one
   * hidden underground or gathering light, and a rampage swings again
   * at the pace it swung the first time. Moves that want longer say so
   * on top of it — Bide doubles it
   */
  battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Exact, (event) => {
    event.duration = getCastTime(event.source.checkMovePriority(event.move, event.target));
  });

  battle.on(BattleEvents.UnitChannel, EventPriority.Exact, (event) => {
    const castTime = event.source.checkMoveChannelTime(event.move, event.target);

    event.source.channeling = {
      target: event.target,
      time: {
        progress: 0,
        duration: castTime,
      },
      move: event.move,
      steps: event.steps,
    };

    // Add new entry for the tick updates
    queue.add(event.source);

    if (queue.size === 1) {
      timer.start();
    }
  });

  battle.on(BattleEvents.UnitUpdateChannel, EventPriority.Exact, (event) => {
    if (event.source.channeling) {
      event.source.channeling = {
        ...event.source.channeling,
        ...event.data,
      };

      if (event.source.channeling.time.progress >= event.source.channeling.time.duration) {
        event.source.finishChannel();
      }
    }
  });

  battle.on(BattleEvents.UnitStopChannel, EventPriority.Exact, (event) => {
    event.source.channeling = undefined;
    queue.delete(event.source);

    if (queue.size === 0) {
      timer.stop();
    }
  });

  battle.on(BattleEvents.UnitFinishChannel, EventPriority.Exact, (event) => {
    const channeling = event.source.channeling;
    if (channeling) {
      // Stop channeling
      event.source.stopChannel();

      // Trigger move
      event.source.triggerMove(channeling.move, channeling.target, channeling.steps);

      // Recast move if step is more than 1
      if (channeling.steps > 0) {
        event.source.channel(channeling.move, channeling.target, channeling.steps - 1);
      }
    }
  });

  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, (event) => {
    if (event.source === event.target) {
      // Look up all casting units and stop those whose current target
      // is the switching unit
      for (const unit of queue) {
        if (
          isChannelingTargetUnit(unit, event.source) ||
          isChannelingTargetUnit(unit, event.target)
        ) {
          unit.stopChannel();
        }
      }
    } else {
      // Otherwise, update the channeling target
      for (const unit of queue) {
        if (isChannelingTargetUnit(unit, event.source)) {
          unit.updateChannel({
            target: {
              type: MoveTargetType.Unit,
              unit: event.target,
            },
          });
          // TODO should this swap targets?
        } else if (isChannelingTargetUnit(unit, event.target)) {
          unit.updateChannel({
            target: {
              type: MoveTargetType.Unit,
              unit: event.source,
            },
          });
        }
      }
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, (event) => {
    // look up all channeling units whose current target is this unit.
    for (const unit of queue) {
      if (isChannelingTargetUnit(unit, event.source)) {
        unit.stopChannel();
      }
    }
  });

  battle.on(BattleEvents.UnitInterrupt, EventPriority.Exact, (event) => {
    if (event.source.channeling) {
      event.source.stopChannel();
    }
  });
}

export function setupCooldownMechanics(battle: Battle): void {
  const queue = new Set<MoveState>();

  const PP_COOLDOWN_BASIS = 180; // How many usages is possible within 3 minutes

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const state of queue) {
      // advance timer
      if (state.cooldown) {
        state.source.updateCooldown(state.move, {
          progress: state.cooldown.progress + event.duration,
        });
      } else {
        state.source.finishCooldown(state.move);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitStartCooldown, EventPriority.Exact, (event) => {
    const data = event.source.moves[event.move];
    if (data) {
      data.cooldown = {
        progress: 0,
        duration: (PP_COOLDOWN_BASIS / event.source.checkMovePP(event.move, event.target)) * 1000,
      };

      queue.add(data);

      if (queue.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitFinishCooldown, EventPriority.Exact, (event) => {
    const data = event.source.moves[event.move];
    if (data) {
      data.cooldown = undefined;
      queue.delete(data);
      if (queue.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitUpdateCooldown, EventPriority.Exact, (event) => {
    const state = event.source.moves[event.move];
    if (state?.cooldown) {
      state.cooldown = {
        ...state.cooldown,
        ...event.data,
      };
      if (state.cooldown.progress >= state.cooldown.duration) {
        event.source.finishCooldown(event.move);
      }
    }
  });
}

function targetTeamUnits(source: Unit, move: Moves, team: Team, steps: number): void {
  for (const unit of team.units) {
    if (source !== unit) {
      source.triggerMoveTarget(
        move,
        {
          type: MoveTargetType.Unit,
          unit,
        },
        steps,
      );
    }
  }
}

function targetAllianceUnits(source: Unit, move: Moves, alliance: Alliance, steps: number): void {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      targetTeamUnits(source, move, team, steps);
    }
  }
}

function targetTeam(source: Unit, move: Moves, team: Team, steps: number): void {
  source.triggerMoveTarget(
    move,
    {
      type: MoveTargetType.Team,
      team,
    },
    steps,
  );
}

function targetAllianceTeams(source: Unit, move: Moves, alliance: Alliance, steps: number): void {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      targetTeam(source, move, team, steps);
    }
  }
}

export function setupTriggerMoveMechanics(battle: Battle): void {
  const triggerMoveData = new Set<TriggerMoveData>();

  function triggerMoveUpdate(data: Partial<TriggerMoveData>): void {
    battle.emit(BattleEvents.UnitTriggerMoveUpdate, {
      id: 'UnitTriggerMoveUpdate',
      disabled: false,
      data,
    });
  }

  function triggerMoveEnd(data: UnitTriggerMoveEvent): void {
    battle.emit(BattleEvents.UnitTriggerMoveEnd, {
      ...data,
      id: 'UnitTriggerMoveEnd',
      disabled: false,
    });
  }

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const data of triggerMoveData) {
      data.time.progress += event.duration;

      if (data.time.progress >= data.time.duration) {
        triggerMoveData.delete(data);

        if (triggerMoveData.size === 0) {
          timer.stop();
        }

        triggerMoveEnd(data.parent);
      } else {
        triggerMoveUpdate(data);
      }
    }
  });

  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Exact, (event) => {
    const duration = event.source.checkMoveDelay(event.move, event.target);

    // No delay: resolve in the same frame
    if (duration <= 0) {
      triggerMoveEnd(event);
      return;
    }

    const data: TriggerMoveData = {
      parent: event,
      time: {
        progress: 0,
        duration,
      },
    };

    triggerMoveData.add(data);

    if (triggerMoveData.size === 1) {
      timer.start();
    }
  });

  // The effective target mask resolves through the event engine so
  // abilities (e.g. Boss) can widen it
  battle.on(BattleEvents.CheckUnitMoveTargetFlags, EventPriority.Exact, (event) => {
    event.flags = getMoveData(event.move).target;
  });

  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Exact, (event) => {
    const targetFlags = event.source.checkMoveTargetFlags(event.move);

    /**
     * For multiple target type, the casting doesn't require a pre-defined
     * target unit/team.
     *
     * Singular target types require a casting target.
     */
    if (targetFlags & MoveTargetFlags.Multiple) {
      // Check if target mode is per-unit
      if (targetFlags & MoveTargetFlags.Unit) {
        // Target the source first
        if (targetFlags & MoveTargetFlags.Self) {
          event.source.triggerMoveTarget(
            event.move,
            {
              type: MoveTargetType.Unit,
              unit: event.source,
            },
            event.steps,
          );
        }
        // Target the units from own team
        if (targetFlags & MoveTargetFlags.Own) {
          targetTeamUnits(event.source, event.move, event.source.team, event.steps);
        }
        if (targetFlags & MoveTargetFlags.Ally) {
          targetAllianceUnits(event.source, event.move, event.source.team.alliance, event.steps);
        }
        if (targetFlags & MoveTargetFlags.Enemy) {
          for (const team of battle.teams(event.source.team.alliance)) {
            targetTeamUnits(event.source, event.move, team, event.steps);
          }
        }
        // Otherwise, target by team
      } else if (targetFlags & MoveTargetFlags.Team) {
        if (targetFlags & MoveTargetFlags.Own) {
          targetTeam(event.source, event.move, event.source.team, event.steps);
        }
        if (targetFlags & MoveTargetFlags.Ally) {
          targetAllianceTeams(event.source, event.move, event.source.team.alliance, event.steps);
        }
        if (targetFlags & MoveTargetFlags.Enemy) {
          for (const team of battle.teams(event.source.team.alliance)) {
            targetTeam(event.source, event.move, team, event.steps);
          }
        }
      }
    } else {
      // Just forward the target by default
      event.source.triggerMoveTarget(event.move, event.target, event.steps);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveResolveAccuracy, EventPriority.Exact, (event) => {
    const parent = event.parent;
    const baseAccuracy = parent.source.checkMoveAccuracy(parent.move, parent.target);

    if (baseAccuracy) {
      /**
       *  Base modifier for accuracy
       */
      let accuracyStage = parent.source.checkStage(Stages.Accuracy, StatFlags.Attack);
      if (parent.target.type === MoveTargetType.Unit) {
        accuracyStage -= parent.target.unit.checkStage(Stages.Evasion, StatFlags.Attack);

        accuracyStage = Math.max(-6, Math.min(accuracyStage, 6));
      }
      event.accuracy =
        baseAccuracy * (accuracyStage < 0 ? 3 / (3 - accuracyStage) : (3 + accuracyStage) / 3);
    }
  });

  function resolveMoveAccuracy(parent: UnitTriggerMoveEvent): number | undefined {
    const event: UnitTriggerMoveResolveAccuracyEvent = {
      id: 'UnitTriggerMoveResolveAccuracy',
      disabled: false,
      parent,
    };
    battle.emit(BattleEvents.UnitTriggerMoveResolveAccuracy, event);
    return event.accuracy;
  }

  battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Exact, (event) => {
    if (!event.hit) {
      const actualAccuracy = resolveMoveAccuracy(event.parent);
      event.hit = actualAccuracy == null || battle.random() * 100 <= actualAccuracy;
    }
  });

  function rollHit(parent: UnitTriggerMoveEvent): boolean {
    const event: UnitTriggerMoveRollHitEvent = {
      id: 'TriggerMovUnitTriggerMoveRollHiteRollHit',
      disabled: false,
      parent,
      hit: false,
    };
    battle.emit(BattleEvents.UnitTriggerMoveRollHit, event);
    return event.hit;
  }

  function triggerFailed(parent: UnitTriggerMoveEvent): void {
    battle.emit(BattleEvents.UnitTriggerMoveFailed, {
      id: 'UnitTriggerMoveFailed',
      disabled: false,
      parent,
    });
  }

  function triggerMiss(parent: UnitTriggerMoveEvent): void {
    battle.emit(BattleEvents.UnitTriggerMoveMissed, {
      id: 'UnitTriggerMoveMissed',
      disabled: false,
      parent,
    });
  }

  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Exact, (event) => {
    const currentSource = event.source;
    const currentMove = event.move;
    // Get the move's type
    const currentType = currentSource.checkMoveType(currentMove, event.target);

    // Check for the target's immunity
    const isImmune = currentSource.checkMoveImmunity(currentMove, event.target, currentType);

    // if the target is immune, skip
    if (isImmune) {
      triggerFailed(event);
      return;
    }

    if (event.target.type === MoveTargetType.Unit && !rollHit(event)) {
      triggerMiss(event);
      return;
    }

    // Trigger move effect
    currentSource.triggerMoveEffect(event.move, event.target, event.steps);
  });
}

export function setupAttackMechanics(battle: Battle): void {
  function resolveCriticalHitRatio(parent: UnitAttackEvent): number {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackCheckCriticalRatio',
      disabled: false,
      parent,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackCheckCriticalRatio, event);
    return event.value;
  }
  function resolveCriticalHit(parent: UnitAttackEvent): boolean {
    const event: UnitAttackResolveCriticalEvent = {
      id: 'UnitAttackResolveCriticalHit',
      disabled: false,
      parent,
      critical: false,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);
    return event.critical;
  }

  function resolveDamage(parent: UnitAttackEvent): number {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent,
      value: parent.value,
    };
    battle.emit(BattleEvents.UnitAttackResolveDamage, event);
    return event.value;
  }

  function resolveAttackStat(
    parent: UnitAttackEvent,
    unit: Unit,
    stat: Stats,
    value: number,
  ): number {
    const event: UnitAttackResolveStatEvent = {
      id: 'UnitAttackResolveStat',
      disabled: false,
      parent,
      unit,
      stat,
      value,
    };
    battle.emit(BattleEvents.UnitAttackResolveStat, event);
    return event.value;
  }

  function resolveSTAB(parent: UnitAttackEvent): number {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveStage',
      disabled: false,
      parent,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveSTAB, event);
    return event.value;
  }

  function resolveCriticalMult(parent: UnitAttackEvent): number {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveStage',
      disabled: false,
      parent,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalMult, event);
    return event.value;
  }

  function resolveEffectiveness(parent: UnitAttackEvent, defendingType: Types): number {
    const event: UnitAttackResolveEffectivenessEvent = {
      id: 'UnitAttackResolveEffectiveness',
      disabled: false,
      parent,
      defendingType,
      multiplier: 1.0,
    };
    battle.emit(BattleEvents.UnitAttackResolveEffectiveness, event);
    return event.multiplier;
  }

  battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Exact, (event) => {
    const result = TYPE_EFFECTIVENESS[event.parent.type][event.defendingType];

    // Explicit null check: TypeEffectiveness.Effective is 0
    if (result != null) {
      event.multiplier *= TYPE_EFFECTIVENESS_FACTOR[result];
    }
  });

  battle.on(BattleEvents.UnitAttackResolveCriticalMult, EventPriority.Exact, (event) => {
    event.value = 2;
  });

  battle.on(BattleEvents.UnitAttackResolveSTAB, EventPriority.Exact, (event) => {
    if (event.parent.source.types.has(event.parent.type)) {
      event.value = 1.5;
    } else {
      event.value = 1;
    }
  });

  battle.on(BattleEvents.UnitAttackResolveCriticalChance, EventPriority.Exact, (event) => {
    event.value = (1 / 16) * 2 ** Math.min(Math.max(0, resolveCriticalHitRatio(event.parent)), 4);
  });

  function resolveCriticalHitChance(parent: UnitAttackEvent): number {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveCriticalChance',
      disabled: false,
      value: 0,
      parent,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalChance, event);
    return event.value;
  }

  battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Exact, (event) => {
    if (!event.critical) {
      const chance = resolveCriticalHitChance(event.parent);
      event.critical = battle.random() <= chance;
    }
  });

  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Exact, (event) => {
    /**
     * Refer to Gen V+ calculation
     *
     * https://bulbapedia.bulbagarden.net/wiki/Damage#Damage_calculation
     */

    const parent = event.parent;
    const source = parent.source;
    const target = parent.target;

    const category = parent.category;

    // multiply to effective attack stat
    if (event.parent.flags & MoveAttackFlags.Pure) {
      // do nothing
    } else {
      if (category !== MoveCategories.Status) {
        // Base amount
        let base = (2 * source.level) / 5 + 2;

        // multiply to power
        base *= event.value;

        let isCritical = false;

        // If critical is enabled, roll for a hit
        if (event.parent.flags & MoveAttackFlags.Critical) {
          isCritical = resolveCriticalHit(event.parent);
        }

        // Get stat stage
        const preferredAttackStat =
          category === MoveCategories.Physical ? Stats.Attack : Stats.SpecialAttack;
        const preferredDefenseStat =
          category === MoveCategories.Physical ? Stats.Defense : Stats.SpecialDefense;

        let statFlag = StatFlags.Attack;

        // For critical hit, set a flag that ignores the negative attack/positive defense stages
        if (isCritical) {
          statFlag |= StatFlags.Critical;
        }

        const attackStat = resolveAttackStat(
          parent,
          source,
          preferredAttackStat,
          source.resolveStat(preferredAttackStat, statFlag),
        );
        const defenseStat = resolveAttackStat(
          parent,
          target,
          preferredDefenseStat,
          target.resolveStat(preferredDefenseStat, statFlag),
        );

        base *= attackStat / Math.max(1, defenseStat);
        base = base / 50 + 2;

        event.value = base;

        if (isCritical) {
          event.value *= resolveCriticalMult(parent);
        }

        // Random factor: 85% to 100%
        event.value *= battle.randomRange(0.85, 1);
      }

      if (event.parent.flags & MoveAttackFlags.Confused) {
        return;
      }
      // Calculate type effectiveness
      for (const type of target.types) {
        event.value *= resolveEffectiveness(parent, type);
      }

      // STAB
      event.value *= resolveSTAB(parent);
    }
  });

  function runAttackEffect(parent: UnitAttackEvent): void {
    battle.emit(BattleEvents.UnitAttackEffect, {
      id: 'UnitAttackEffect',
      disabled: false,
      parent,
    });
  }

  function checkUnitAttackEffect(parent: UnitAttackEvent): boolean {
    const event: CheckUnitAttackEffectEvent = {
      id: 'CheckUnitAttackEffect',
      disabled: false,
      parent,
      success: true,
    };
    battle.emit(BattleEvents.CheckUnitAttackEffect, event);
    return event.success;
  }

  function checkUnitAttackEffectChance(parent: UnitAttackEvent): number | undefined {
    const event: CheckUnitAttackEffectChanceEvent = {
      id: 'CheckUnitAttackEffect',
      disabled: false,
      parent,
      value: 0,
    };
    battle.emit(BattleEvents.CheckUnitAttackEffectChance, event);
    return event.value;
  }

  battle.on(BattleEvents.CheckUnitAttackEffect, EventPriority.Exact, (event) => {
    event.success = event.parent.source.alive && event.parent.target.alive;
  });

  battle.on(BattleEvents.UnitAttack, AttackPriority.Exact, (event) => {
    if (event.target.alive) {
      const amount = resolveDamage(event);

      let flags = 0;

      if (event.flags & MoveAttackFlags.NonLethal) {
        flags |= DamageFlags.NonLethal;
      }

      if (event.flags & MoveAttackFlags.Piercing) {
        flags |= DamageFlags.Piercing;
      }

      if (event.flags & MoveAttackFlags.HealthScaled) {
        flags |= DamageFlags.HealthScaled;
      }

      event.success = event.source.damage(
        { type: EffectType.Move, unit: event.source, move: event.move },
        event.target,
        amount,
        flags,
      );

      if (checkUnitAttackEffect(event)) {
        const chance = checkUnitAttackEffectChance(event);
        if (chance == null || chance >= battle.random() * 100) {
          runAttackEffect(event);
        }
      }
    }
  });
}
