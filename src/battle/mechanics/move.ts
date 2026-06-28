import { EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  TypeEffectiveness,
  type Types,
} from '../../data/constants/types';
import type { Moves } from '../../data/ids/moves';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  MoveTargetFlags,
  StatFlags,
} from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type { Alliance } from '../alliance';
import type { Battle } from '../core';
import type {
  MoveState,
  UnitAttackEvent,
  UnitAttackResolveAmountEvent,
  UnitAttackResolveCriticalEvent,
  UnitAttackResolveEffectivenessEvent,
  UnitTriggerMoveEvent,
  UnitTriggerMoveResolveAccuracyEvent,
  UnitTriggerMoveRollHitEvent,
} from '../events';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type { Team } from '../team';
import type { Unit } from '../unit';

const FPS = 60;
const FPS_DURATION = 1000 / FPS;
const FRAMES_PER_PRIORITY = 16;
const BASE_FRAMES = 104;

function getCastTime(priority: number): number {
  return (BASE_FRAMES - priority * FRAMES_PER_PRIORITY) * FPS_DURATION;
}

function isTypeImmune(offendingType: Types, defendingType: Types) {
  const table = TYPE_EFFECTIVENESS[offendingType];

  if (table) {
    const kind = table[defendingType];
    return kind && kind === TypeEffectiveness.Immune;
  }

  return false;
}

function isUnitImmune(unit: Unit, offending: Types) {
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
    cooldown: {
      duration: 0,
      progress: 0,
    },
  };
}

export function setupMoveMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitAddMove, EventPriority.Exact, event => {
    event.source.moves[event.move] = createMoveState(event.source, event.move);
  });
  battle.on(BattleEvents.UnitRemoveMove, EventPriority.Exact, event => {
    event.source.moves[event.move] = undefined;
  });
  battle.on(BattleEvents.UnitEnableMove, EventPriority.Exact, event => {
    const current = event.source.moves[event.move];
    if (current) {
      current.disabled = false;
    }
  });
  battle.on(BattleEvents.UnitDisableMove, EventPriority.Exact, event => {
    const current = event.source.moves[event.move];
    if (current) {
      current.disabled = true;
    }
  });

  // Checks
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Exact, event => {
    event.type = getMoveData(event.move).type;
  });
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, event => {
    if (event.target.type === MoveTargetType.Unit) {
      event.immune = isUnitImmune(event.target.unit, event.type);
    }
  });
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Exact, event => {
    event.accuracy = getMoveData(event.move).accuracy;
  });
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, event => {
    event.power = getMoveData(event.move).power;
  });
  battle.on(BattleEvents.CheckUnitMovePP, EventPriority.Exact, event => {
    event.pp = getMoveData(event.move).pp;
  });
  battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Exact, event => {
    event.priority = getMoveData(event.move).priority ?? 0;
  });
}

function isCastingTargetUnit(caster: Unit, target: Unit) {
  return (
    caster.casting &&
    caster.casting.target.type === MoveTargetType.Unit &&
    caster.casting.target.unit === target
  );
}

function canUnitCastMove(caster: Unit, move: Moves) {
  const data = caster.moves[move];
  if (data) {
    return !(data.disabled || data.cooldown);
  }
  return false;
}

export function setupCastingMechanics(battle: Battle) {
  const queue = new Set<Unit>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, event => {
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

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Exact, event => {
    if (event.success) {
      event.success =
        // Caster must be alive
        event.source.alive &&
        // Caster must not be casting/channeling
        !!(event.source.casting || event.source.channeling) &&
        // Move must not be disabled or in cooldown
        canUnitCastMove(event.source, event.move);

      // If the move target is a unit, make sure it is still alive
      if (event.target.type === MoveTargetType.Unit) {
        event.success = event.success && event.target.unit.alive;
      }
    }
  });

  battle.on(BattleEvents.UnitCast, EventPriority.Exact, event => {
    const priority = event.source.checkMovePriority(event.move, event.target);
    const castTime = getCastTime(priority);

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

  battle.on(BattleEvents.UnitUpdateCast, EventPriority.Exact, event => {
    if (event.source.casting) {
      event.source.casting = {
        ...event.source.casting,
        ...event.data,
      };

      if (
        event.source.casting.time.progress >= event.source.casting.time.duration
      ) {
        event.source.finishCast();
      }
    }
  });

  battle.on(BattleEvents.UnitStopCast, EventPriority.Exact, event => {
    event.source.casting = undefined;
    queue.delete(event.source);

    if (queue.size === 0) {
      timer.stop();
    }
  });

  battle.on(BattleEvents.UnitFinishCast, EventPriority.Exact, event => {
    const casting = event.source.casting;
    if (casting) {
      event.source.stopCast();

      event.source.startCooldown(casting.move, casting.target);

      const steps = event.source.checkMoveSteps(casting.move, casting.target);

      if (steps > 0) {
        event.source.channel(casting.move, casting.target, steps - 1);
      } else {
        event.source.triggerMove(casting.move, casting.target, 0);
      }
    }
  });

  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, event => {
    if (event.source === event.target) {
      // Look up all casting units and stop those whose current target
      // is the switching unit
      for (const unit of queue) {
        if (
          isCastingTargetUnit(unit, event.source) ||
          isCastingTargetUnit(unit, event.target)
        ) {
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

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, event => {
    // look up all casting units whose current target is this unit.
    for (const unit of queue) {
      if (isCastingTargetUnit(unit, event.source)) {
        unit.stopCast();
      }
    }
  });

  battle.on(BattleEvents.UnitInterrupt, EventPriority.Exact, event => {
    if (event.source.casting) {
      event.source.stopCast();
    }
  });
}

function isChannelingTargetUnit(caster: Unit, target: Unit) {
  return (
    caster.channeling &&
    caster.channeling.target.type === MoveTargetType.Unit &&
    caster.channeling.target.unit === target
  );
}

export function setupChannelingMechanics(battle: Battle) {
  const queue = new Set<Unit>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, event => {
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

  battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Exact, event => {
    if (event.success) {
      event.success =
        // Caster must be alive
        event.source.alive &&
        // Caster must not be casting/channeling
        !!(event.source.casting || event.source.channeling) &&
        // Move must not be disabled
        !event.source.moves[event.move]?.disabled;

      // If the move target is a unit, make sure it is still alive
      if (event.target.type === MoveTargetType.Unit) {
        event.success = event.success && event.target.unit.alive;
      }
    }
  });

  battle.on(BattleEvents.UnitChannel, EventPriority.Exact, event => {
    const priority = event.source.checkMovePriority(event.move, event.target);
    const castTime = getCastTime(priority);

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

  battle.on(BattleEvents.UnitUpdateChannel, EventPriority.Exact, event => {
    if (event.source.channeling) {
      event.source.channeling = {
        ...event.source.channeling,
        ...event.data,
      };

      if (
        event.source.channeling.time.progress >=
        event.source.channeling.time.duration
      ) {
        event.source.finishChannel();
      }
    }
  });

  battle.on(BattleEvents.UnitStopChannel, EventPriority.Exact, event => {
    event.source.channeling = undefined;
    queue.delete(event.source);

    if (queue.size === 0) {
      timer.stop();
    }
  });

  battle.on(BattleEvents.UnitFinishChannel, EventPriority.Exact, event => {
    const channeling = event.source.channeling;
    if (channeling) {
      // Stop channeling
      event.source.stopChannel();

      // Trigger move
      event.source.triggerMove(
        channeling.move,
        channeling.target,
        channeling.steps,
      );

      // Recast move if step is more than 1
      if (channeling.steps > 0) {
        event.source.channel(
          channeling.move,
          channeling.target,
          channeling.steps - 1,
        );
      }
    }
  });

  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, event => {
    if (event.source === event.target) {
      // Look up all casting units and stop those whose current target
      // is the switching unit
      for (const unit of queue) {
        if (
          isChannelingTargetUnit(unit, event.source) ||
          isChannelingTargetUnit(unit, event.target)
        ) {
          unit.stopCast();
        }
      }
    } else {
      // Otherwise, update the casting target
      for (const unit of queue) {
        if (isChannelingTargetUnit(unit, event.source)) {
          unit.updateCast({
            target: {
              type: MoveTargetType.Unit,
              unit: event.target,
            },
          });
          // TODO should this swap targets?
        } else if (isChannelingTargetUnit(unit, event.target)) {
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

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, event => {
    // look up all channeling units whose current target is this unit.
    for (const unit of queue) {
      if (isChannelingTargetUnit(unit, event.source)) {
        unit.stopChannel();
      }
    }
  });

  battle.on(BattleEvents.UnitInterrupt, EventPriority.Exact, event => {
    if (event.source.channeling) {
      event.source.stopChannel();
    }
  });
}

export function setupCooldownMechanics(battle: Battle) {
  const queue = new Set<MoveState>();

  const PP_COOLDOWN_BASIS = 180; // How many usages is possible within 3 minutes

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, event => {
    for (const state of queue) {
      // advance timer
      if (state.cooldown) {
        state.source.updateCooldown(state.move, {
          progress: state.cooldown.progress + event.duration,
        });
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitStartCooldown, EventPriority.Exact, event => {
    const data = event.source.moves[event.move];
    if (data) {
      data.cooldown = {
        progress: 0,
        duration:
          (PP_COOLDOWN_BASIS /
            event.source.checkMovePP(event.move, event.target)) *
          1000,
      };

      queue.add(data);

      if (queue.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitFinishCooldown, EventPriority.Exact, event => {
    const data = event.source.moves[event.move];
    if (data) {
      data.cooldown = undefined;
      queue.delete(data);
      if (queue.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitUpdateCooldown, EventPriority.Exact, event => {
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

function targetTeamUnits(source: Unit, move: Moves, team: Team, steps: number) {
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

function targetAllianceUnits(
  source: Unit,
  move: Moves,
  alliance: Alliance,
  steps: number,
) {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      targetTeamUnits(source, move, team, steps);
    }
  }
}

function targetTeam(source: Unit, move: Moves, team: Team, steps: number) {
  source.triggerMoveTarget(
    move,
    {
      type: MoveTargetType.Team,
      team,
    },
    steps,
  );
}

function targetAllianceTeams(
  source: Unit,
  move: Moves,
  alliance: Alliance,
  steps: number,
) {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      targetTeam(source, move, team, steps);
    }
  }
}

export function setupTriggerMoveMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Exact, event => {
    const moveData = getMoveData(event.move);

    /**
     * For multiple target type, the casting doesn't require a pre-defined
     * target unit/team.
     *
     * Singular target types require a casting target.
     */
    if (moveData.target & MoveTargetFlags.Multiple) {
      // Check if target mode is per-unit
      if (moveData.target & MoveTargetFlags.Unit) {
        // Target the source first
        if (moveData.target & MoveTargetFlags.Self) {
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
        if (moveData.target & MoveTargetFlags.Own) {
          targetTeamUnits(
            event.source,
            event.move,
            event.source.team,
            event.steps,
          );
        }
        if (moveData.target & MoveTargetFlags.Ally) {
          targetAllianceUnits(
            event.source,
            event.move,
            event.source.team.alliance,
            event.steps,
          );
        }
        if (moveData.target & MoveTargetFlags.Enemy) {
          const ownAlliance = event.source.team.alliance;
          for (const alliance of battle.alliances) {
            if (alliance !== ownAlliance) {
              targetAllianceUnits(
                event.source,
                event.move,
                alliance,
                event.steps,
              );
            }
          }
        }
        // Otherwise, target by team
      } else if (moveData.target & MoveTargetFlags.Team) {
        if (moveData.target & MoveTargetFlags.Own) {
          targetTeam(event.source, event.move, event.source.team, event.steps);
        }
        if (moveData.target & MoveTargetFlags.Ally) {
          targetAllianceTeams(
            event.source,
            event.move,
            event.source.team.alliance,
            event.steps,
          );
        }
        if (moveData.target & MoveTargetFlags.Enemy) {
          const ownAlliance = event.source.team.alliance;
          for (const alliance of battle.alliances) {
            if (alliance !== ownAlliance) {
              targetAllianceTeams(
                event.source,
                event.move,
                alliance,
                event.steps,
              );
            }
          }
        }
      }
    } else {
      // Just forward the target by default
      event.source.triggerMoveTarget(event.move, event.target, event.steps);
    }
  });

  battle.on(
    BattleEvents.UnitTriggerMoveResolveAccuracy,
    EventPriority.Exact,
    event => {
      const parent = event.parent;
      /**
       *  Base modifier for accuracy
       */
      let accuracyStage = parent.source.checkStage(
        Stages.Accuracy,
        StatFlags.Attack,
      );
      if (parent.target.type === MoveTargetType.Unit) {
        accuracyStage -= parent.target.unit.checkStage(
          Stages.Evasion,
          StatFlags.Attack,
        );

        accuracyStage = Math.max(-6, Math.min(accuracyStage, 6));
      }
      event.accuracy *=
        accuracyStage < 0 ? 3 / (3 - accuracyStage) : (3 + accuracyStage) / 3;
    },
  );

  battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Exact, event => {
    event.hit = battle.random() * 100 <= event.accuracy;
  });

  function resolveMoveAccuracy(parent: UnitTriggerMoveEvent, accuracy: number) {
    const event: UnitTriggerMoveResolveAccuracyEvent = {
      id: 'UnitTriggerMoveResolveAccuracy',
      disabled: false,
      parent,
      accuracy,
    };
    battle.emit(BattleEvents.UnitTriggerMoveResolveAccuracy, event);
    return event.accuracy;
  }

  function rollHit(parent: UnitTriggerMoveEvent, accuracy: number) {
    const event: UnitTriggerMoveRollHitEvent = {
      id: 'TriggerMovUnitTriggerMoveRollHiteRollHit',
      disabled: false,
      parent,
      accuracy,
      hit: false,
    };
    battle.emit(BattleEvents.UnitTriggerMoveRollHit, event);
    return event.hit;
  }

  function triggerFailed(parent: UnitTriggerMoveEvent) {
    battle.emit(BattleEvents.UnitTriggerMoveFailed, {
      id: 'UnitTriggerMoveFailed',
      disabled: false,
      parent,
    });
  }

  function triggerMiss(parent: UnitTriggerMoveEvent) {
    battle.emit(BattleEvents.UnitTriggerMoveMissed, {
      id: 'UnitTriggerMoveMissed',
      disabled: false,
      parent,
    });
  }

  battle.on(BattleEvents.UnitTriggerMoveTarget, EventPriority.Exact, event => {
    const currentSource = event.source;
    const currentMove = event.move;
    // Get the move's type
    const currentType = currentSource.checkMoveType(currentMove, event.target);

    // Check for the target's immunity
    const isImmune = currentSource.checkMoveImmunity(
      currentMove,
      event.target,
      currentType,
    );

    // if the target is immune, skip
    if (isImmune) {
      triggerFailed(event);
      return;
    }

    if (event.target.type === MoveTargetType.Unit) {
      // For moves with accuracy, perform accuracy check
      const baseAccuracy = currentSource.checkMoveAccuracy(
        currentMove,
        event.target,
      );
      // Check if the move doesn't have perfect accuracy
      if (baseAccuracy != null) {
        const actualAccuracy = resolveMoveAccuracy(event, baseAccuracy);

        // Roll a hit
        if (!rollHit(event, actualAccuracy)) {
          triggerMiss(event);
          return;
        }
      }
    }

    // Trigger move effect
    currentSource.triggerMoveEffect(event.move, event.target, event.steps);
  });
}

export function setupAttackMechanics(battle: Battle) {
  function resolveCriticalHitRatio(parent: UnitAttackEvent) {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackCheckCriticalRatio',
      disabled: false,
      parent,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackCheckCriticalRatio, event);
    return event.value;
  }
  function resolveCriticalHit(parent: UnitAttackEvent, ratio: number) {
    const event: UnitAttackResolveCriticalEvent = {
      id: 'UnitAttackResolveCriticalHit',
      disabled: false,
      parent,
      value: ratio,
      critical: false,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);
    return event.critical;
  }

  function resolveDamage(parent: UnitAttackEvent) {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent,
      value: parent.value,
    };
    battle.emit(BattleEvents.UnitAttackResolveDamage, event);
    return event.value;
  }

  function resolveSTAB(parent: UnitAttackEvent) {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveStage',
      disabled: false,
      parent,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveSTAB, event);
    return event.value;
  }

  function resolveCriticalMult(parent: UnitAttackEvent) {
    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveStage',
      disabled: false,
      parent,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalMult, event);
    return event.value;
  }

  function resolveEffectiveness(parent: UnitAttackEvent, defendingType: Types) {
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

  battle.on(
    BattleEvents.UnitAttackResolveEffectiveness,
    EventPriority.Exact,
    event => {
      const effectivenessTable = TYPE_EFFECTIVENESS[event.parent.type];

      if (effectivenessTable) {
        const result = effectivenessTable[event.defendingType];

        if (result) {
          event.multiplier *= TYPE_EFFECTIVENESS_FACTOR[result];
        }
      }
    },
  );

  battle.on(
    BattleEvents.UnitAttackResolveCriticalMult,
    EventPriority.Exact,
    event => {
      event.value = 2;
    },
  );

  battle.on(BattleEvents.UnitAttackResolveSTAB, EventPriority.Exact, event => {
    if (event.parent.source.types.has(event.parent.type)) {
      event.value = 1.5;
    } else {
      event.value = 1;
    }
  });

  battle.on(
    BattleEvents.UnitAttackResolveCriticalHit,
    EventPriority.Exact,
    event => {
      event.critical = battle.random() <= event.value;
    },
  );

  battle.on(
    BattleEvents.UnitAttackResolveDamage,
    EventPriority.Exact,
    event => {
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
            const ratio =
              (1 / 16) *
              2 **
                Math.min(Math.max(0, resolveCriticalHitRatio(event.parent)), 4);

            isCritical = resolveCriticalHit(event.parent, ratio);
          }

          // Get stat stage
          const preferredAttackStat =
            category === MoveCategories.Physical
              ? Stats.Attack
              : Stats.SpecialAttack;
          const preferredDefenseStat =
            category === MoveCategories.Physical
              ? Stats.Defense
              : Stats.SpecialDefense;

          let statFlag = StatFlags.Attack;

          // For critical hit, set a flag that ignores the negative attack/positive defense stages
          if (isCritical) {
            statFlag |= StatFlags.Critical;
          }

          const attackStat = source.resolveStat(preferredAttackStat, statFlag);
          const defenseStat = target.resolveStat(
            preferredDefenseStat,
            statFlag,
          );

          base *= attackStat / defenseStat;
          base = base / 50 + 2;

          if (isCritical) {
            event.value *= resolveCriticalMult(parent);
          }

          // Random factor
          event.value *= 85 + ((100 - 85) * battle.random()) / 100;
        }

        // Calculate type effectiveness
        for (const type of target.types) {
          event.value *= resolveEffectiveness(parent, type);
        }

        // STAB
        event.value *= resolveSTAB(parent);
      }
    },
  );

  function runAttackEffect(parent: UnitAttackEvent) {
    battle.emit(BattleEvents.UnitAttackEffect, {
      id: 'UnitAttackEffect',
      disabled: false,
      parent,
    });
  }

  battle.on(BattleEvents.UnitAttack, EventPriority.Exact, event => {
    if (event.target.alive) {
      const amount = resolveDamage(event);

      let flags = 0;

      if (event.flags & MoveAttackFlags.NonLethal) {
        flags |= DamageFlags.NonLethal;
      }

      event.source.damage(
        { type: EffectType.Move, unit: event.source, move: event.move },
        event.target,
        amount,
        flags,
      );

      if (event.target.alive) {
        runAttackEffect(event);
      }
    }
  });
}
