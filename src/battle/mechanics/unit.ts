import { EventPriority } from '../../core/event-emitter';
import {
  createStagesField,
  getStageFromStat,
  Stats,
  StatsKind,
} from '../../data/constants/stats';
import { DamageFlags, StatFlags } from '../../data/ids/moves';
import type { Battle } from '../core';
import { BattleEvents } from '../events';

function setupUnitStatusMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Exact, event => {
    event.source.status[event.status] = event.cause;
  });
  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Exact, event => {
    event.source.status[event.status] = undefined;
  });
}

const MIN_STAGE = -6;
const MAX_STAGE = 6;

function setupUnitStageMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitAddStage, EventPriority.Exact, event => {
    // Get the current stage
    const current = event.source.stages[event.stage];
    // Get the new stage
    const newStage = current + event.value;
    const clampedStage = Math.max(MIN_STAGE, Math.min(newStage, MAX_STAGE));
    // Assign new stage
    event.source.stages[event.stage] = clampedStage;
    // Calculate the new clamped amount
    event.value = clampedStage - current;
  });

  battle.on(BattleEvents.UnitRemoveStage, EventPriority.Exact, event => {
    // Get the current stage
    const current = event.source.stages[event.stage];
    // Get the new stage
    const newStage = current - event.value;
    const clampedStage = Math.max(MIN_STAGE, Math.min(newStage, MAX_STAGE));
    // Assign new stage
    event.source.stages[event.stage] = clampedStage;
    // Calculate the new clamped amount
    event.value = clampedStage - current;
  });

  battle.on(BattleEvents.UnitCheckStage, EventPriority.Exact, event => {
    event.value = event.source.stages[event.stage];
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Exact, event => {
    event.source.stages = createStagesField();
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, event => {
    event.source.stages = createStagesField();
  });
}

function setupUnitTypeMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitAddType, EventPriority.Exact, event => {
    event.source.types.add(event.type);
  });
  battle.on(BattleEvents.UnitRemoveType, EventPriority.Exact, event => {
    event.source.types.delete(event.type);
  });
}

function setupUnitDamageMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitDamage, EventPriority.Exact, event => {
    let value = event.target.health - event.value;

    // Prevent knocking out
    if (event.flags & DamageFlags.NonLethal) {
      value = Math.max(1, value);
    }

    event.target.setHealth(value);

    if (event.target.health <= 0) {
      event.target.faint(event.source);
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, event => {
    event.source.interrupt();
    event.source.alive = false;
  });
}

function checkSharedStat(level: number, base: number, iv: number, ev: number) {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
}

function checkHPStat(level: number, base: number, iv: number, ev: number) {
  // TODO make the pokemon's tankier?
  return checkSharedStat(level, base, iv, ev) + level + 10;
}

function checkOtherStat(
  level: number,
  base: number,
  iv: number,
  ev: number,
  nature: number,
) {
  return Math.floor((checkSharedStat(level, base, iv, ev) + 5) * nature);
}

function setupUnitStatMechancis(battle: Battle) {
  battle.on(BattleEvents.UnitSetLevel, EventPriority.Exact, event => {
    event.source.level = event.value;
  });
  battle.on(BattleEvents.UnitSetHealth, EventPriority.Exact, event => {
    const max = event.source.checkStat(Stats.HP, 0);
    event.source.health = Math.min(event.value, max);
  });

  battle.on(BattleEvents.UnitSetStat, EventPriority.Exact, event => {
    // when changing HP stat, scale current health
    if (event.stat === Stats.HP) {
      const max = event.source.checkStat(event.stat, 0);
      const current = event.source.health;
      event.source.setHealth((current / max) * event.value);
    }
    event.source.stats[event.kind][event.stat] = event.value;
  });

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Exact, event => {
    // TODO apply level formula
    if (event.stat === Stats.HP) {
      event.value = checkHPStat(
        event.source.level,
        event.source.stats[StatsKind.Base][event.stat],
        event.source.stats[StatsKind.Individual][event.stat],
        event.source.stats[StatsKind.Effort][event.stat],
      );
    } else {
      event.value = checkOtherStat(
        event.source.level,
        event.source.stats[StatsKind.Base][event.stat],
        event.source.stats[StatsKind.Individual][event.stat],
        event.source.stats[StatsKind.Effort][event.stat],
        // TODO nature
        1.0,
      );
    }
  });

  function getNormalStage(value: number, stat: Stats, flags: number) {
    if (flags & StatFlags.Critical) {
      switch (stat) {
        case Stats.Attack:
        case Stats.SpecialAttack:
          if (value <= 0) {
            return 0;
          }
          return value;
        case Stats.Defense:
        case Stats.SpecialDefense:
          if (value >= 0) {
            return 0;
          }
          return value;
      }
    }
    return value;
  }

  function getStageFactor(value: number): number {
    return value < 0 ? 2 / (2 - value) : (2 + value) / 2;
  }

  battle.on(BattleEvents.ResolveUnitStat, EventPriority.Exact, event => {
    event.value = event.source.checkStat(event.stat, event.flags);

    const targetStage = getStageFromStat(event.stat);
    const stageValue =
      targetStage == null
        ? 0
        : event.source.checkStage(targetStage, event.flags);
    const normalStage = getNormalStage(stageValue, event.stat, event.flags);
    event.value *= getStageFactor(normalStage);
  });
}

function setupUnitSwitchMechanics(battle: Battle) {
  battle.on(BattleEvents.CheckUnitEscape, EventPriority.Exact, event => {
    event.success = !event.source.channeling;
  });
  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, event => {
    event.source.leave();
    if (event.source !== event.target) {
      event.target.leave();
    }
    // Trigger re-entry
    event.source.enter();
    if (event.source !== event.target) {
      event.target.enter();
    }
  });
}

export function setupUnitMechanics(battle: Battle) {
  setupUnitStatusMechanics(battle);
  setupUnitTypeMechanics(battle);
  setupUnitStatMechancis(battle);
  setupUnitStageMechanics(battle);
  setupUnitDamageMechanics(battle);
  setupUnitSwitchMechanics(battle);
}
