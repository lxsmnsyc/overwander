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
import type { Alliance, Battle, Move, Team, Unit } from '../core';
import type {
  TriggerMoveResolveAccuracyEvent,
  TriggerMoveRollHitEvent,
  TriggerMoveTargetEvent,
  UnitAttackEvent,
  UnitAttackResolveAmountEvent,
  UnitAttackResolveCriticalEvent,
  UnitAttackResolveEffectivenessEvent,
} from '../events';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

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

export function setupMoveMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitAddMove, EventPriority.Exact, event => {
    event.source.moves.add(event.move);
  });
  battle.on(BattleEvents.UnitRemoveMove, EventPriority.Exact, event => {
    event.source.moves.delete(event.move);
  });
  battle.on(BattleEvents.EnableMove, EventPriority.Exact, event => {
    event.move.disabled = false;
  });
  battle.on(BattleEvents.DisableMove, EventPriority.Exact, event => {
    event.move.disabled = true;
  });

  // Checks
  battle.on(BattleEvents.CheckMoveType, EventPriority.Exact, event => {
    event.type = getMoveData(event.move).type;
  });
  battle.on(BattleEvents.CheckMoveImmunity, EventPriority.Exact, event => {
    event.immune = isUnitImmune(event.target, event.type);
  });
  battle.on(BattleEvents.CheckMoveAccuracy, EventPriority.Exact, event => {
    event.accuracy = getMoveData(event.move).accuracy;
  });
  battle.on(BattleEvents.CheckMovePower, EventPriority.Exact, event => {
    event.power = getMoveData(event.move).power;
  });
  battle.on(BattleEvents.CheckMovePP, EventPriority.Exact, event => {
    event.pp = getMoveData(event.move).pp;
  });
  battle.on(BattleEvents.CheckMovePriority, EventPriority.Exact, event => {
    event.priority = getMoveData(event.move).priority ?? 0;
  });
}

export function setupCastingMechanics(battle: Battle) {
  const queue = new Set<Move>();

  battle.on(BattleEvents.MoveStartCast, EventPriority.Exact, event => {
    const priority = event.move.source.checkMovePriority(event.move.id);
    const castTime = getCastTime(priority);

    event.move.casting = {
      target: event.target,
      progress: 0,
      duration: castTime,
    };
    event.move.source.casting = event.move;

    // Add new entry for the tick updates
    queue.add(event.move);
  });

  battle.on(BattleEvents.Tick, EventPriority.Exact, event => {
    for (const move of queue) {
      // advance timer
      if (move.casting) {
        move.updateCast({
          progress: move.casting.progress + event.duration,
        });
      } else {
        move.endCast();
      }
    }
  });

  battle.on(BattleEvents.MoveUpdateCast, EventPriority.Exact, event => {
    event.move.casting = event.casting;
    if (
      event.casting.target.type === MoveTargetType.Unit &&
      event.casting.target.unit.alive
    ) {
      if (event.casting.progress >= event.casting.duration) {
        event.move.endCast();
      }
    } else {
      event.move.stopCast();
    }
  });

  battle.on(BattleEvents.MoveStopCast, EventPriority.Exact, event => {
    event.move.source.casting = undefined;
    event.move.casting = undefined;
    queue.delete(event.move);
  });

  battle.on(BattleEvents.MoveEndCast, EventPriority.Exact, event => {
    event.move.source.triggerMove(event.move.id, event.target);

    event.move.source.casting = undefined;
    event.move.casting = undefined;
    queue.delete(event.move);

    event.move.startCooldown();
  });

  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, event => {
    if (event.source === event.target) {
      // Setup cast cancel
    } else {
      // TODO setup target switch
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, event => {
    if (event.source.casting) {
      event.source.casting.endCast();
    }
  });
}

export function setupCooldownMechanics(battle: Battle) {
  const queue = new Set<Move>();

  const PP_COOLDOWN_BASIS = 180; // How many usages is possible within 3 minutes

  battle.on(BattleEvents.MoveStartCooldown, EventPriority.Exact, event => {
    event.move.cooldown = {
      progress: 0,
      duration:
        (PP_COOLDOWN_BASIS / event.source.checkMovePP(event.move.id)) * 1000,
    };
  });

  battle.on(BattleEvents.MoveEndCooldown, EventPriority.Exact, event => {
    event.move.cooldown = undefined;
    queue.delete(event.move);
  });

  battle.on(BattleEvents.MoveUpdateCooldown, EventPriority.Exact, event => {
    event.move.cooldown = event.cooldown;
    if (event.cooldown.progress >= event.cooldown.duration) {
      event.move.endCooldown();
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Exact, event => {
    for (const move of queue) {
      // advance timer
      if (move.cooldown) {
        move.updateCooldown({
          progress: move.cooldown.progress + event.duration,
        });
      } else {
        move.endCooldown();
      }
    }
  });
}

function targetTeamUnits(source: Unit, move: Moves, team: Team) {
  for (const unit of team.units) {
    if (source !== unit) {
      source.triggerMoveTarget(move, {
        type: MoveTargetType.Unit,
        unit,
      });
    }
  }
}

function targetAllianceUnits(source: Unit, move: Moves, alliance: Alliance) {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      targetTeamUnits(source, move, team);
    }
  }
}

function targetTeam(source: Unit, move: Moves, team: Team) {
  source.triggerMoveTarget(move, {
    type: MoveTargetType.Team,
    team,
  });
}

function targetAllianceTeams(source: Unit, move: Moves, alliance: Alliance) {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      targetTeam(source, move, team);
    }
  }
}

export function setupTriggerMoveMechanics(battle: Battle) {
  battle.on(BattleEvents.TriggerMove, EventPriority.Exact, event => {
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
          event.source.triggerMoveTarget(event.move, {
            type: MoveTargetType.Unit,
            unit: event.source,
          });
        }
        // Target the units from own team
        if (moveData.target & MoveTargetFlags.Own) {
          targetTeamUnits(event.source, event.move, event.source.team);
        }
        if (moveData.target & MoveTargetFlags.Ally) {
          targetAllianceUnits(
            event.source,
            event.move,
            event.source.team.alliance,
          );
        }
        if (moveData.target & MoveTargetFlags.Enemy) {
          const ownAlliance = event.source.team.alliance;
          for (const alliance of battle.alliances) {
            if (alliance !== ownAlliance) {
              targetAllianceUnits(event.source, event.move, alliance);
            }
          }
        }
        // Otherwise, target by team
      } else if (moveData.target & MoveTargetFlags.Team) {
        if (moveData.target & MoveTargetFlags.Own) {
          targetTeam(event.source, event.move, event.source.team);
        }
        if (moveData.target & MoveTargetFlags.Ally) {
          targetAllianceTeams(
            event.source,
            event.move,
            event.source.team.alliance,
          );
        }
        if (moveData.target & MoveTargetFlags.Enemy) {
          const ownAlliance = event.source.team.alliance;
          for (const alliance of battle.alliances) {
            if (alliance !== ownAlliance) {
              targetAllianceTeams(event.source, event.move, alliance);
            }
          }
        }
      }
    } else {
      // Just forward the target by default
      event.source.triggerMoveTarget(event.move, event.target);
    }
  });

  battle.on(
    BattleEvents.TriggerMoveResolveAccuracy,
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

  battle.on(BattleEvents.TriggerMoveRollHit, EventPriority.Exact, event => {
    event.hit = battle.random() * 100 <= event.accuracy;
  });

  function resolveMoveAccuracy(
    parent: TriggerMoveTargetEvent,
    accuracy: number,
  ) {
    const event: TriggerMoveResolveAccuracyEvent = {
      id: 'TriggerMoveResolveAccuracy',
      disabled: false,
      parent,
      accuracy,
    };
    battle.emit(BattleEvents.TriggerMoveResolveAccuracy, event);
    return event.accuracy;
  }

  function rollHit(parent: TriggerMoveTargetEvent, accuracy: number) {
    const event: TriggerMoveRollHitEvent = {
      id: 'TriggerMoveRollHit',
      disabled: false,
      parent,
      accuracy,
      hit: false,
    };
    battle.emit(BattleEvents.TriggerMoveRollHit, event);
    return event.hit;
  }

  function triggerFailed(parent: TriggerMoveTargetEvent) {
    battle.emit(BattleEvents.TriggerMoveFailed, {
      id: 'TriggerMoveFailed',
      disabled: false,
      parent,
    });
  }

  function triggerMiss(parent: TriggerMoveTargetEvent) {
    battle.emit(BattleEvents.TriggerMoveMissed, {
      id: 'TriggerMoveMissed',
      disabled: false,
      parent,
    });
  }

  battle.on(BattleEvents.TriggerMoveTarget, EventPriority.Exact, event => {
    const currentSource = event.source;

    if (event.target.type === MoveTargetType.Unit) {
      const currentMove = event.move;
      const currentTarget = event.target.unit;
      // Get the move's type
      const currentType = currentSource.checkMoveType(
        currentMove,
        currentTarget,
      );

      // Check for the target's immunity
      const isImmune = currentSource.checkMoveImmunity(
        currentMove,
        currentTarget,
        currentType,
      );

      // if the target is immune, skip
      if (isImmune) {
        triggerFailed(event);
        return;
      }
      // For moves with accuracy, perform accuracy check
      const baseAccuracy = currentSource.checkMoveAccuracy(
        currentMove,
        currentTarget,
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
    currentSource.triggerMoveEffect(event.move, event.target);
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
