import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, StatFlags } from '../../data/ids/moves';
import { Stages } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';

function setupUnitStatusMechanics(battle: Battle) {
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Exact, event => {
    event.source.status.add(event.status);
  });
  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Exact, event => {
    event.source.status.delete(event.status);
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
    event.source.alive = false;
  });
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
      const max = event.source.stats[event.stat];
      const current = event.source.health;
      event.source.setHealth((current / max) * event.value);
    }
    event.source.stats[event.stat] = event.value;
  });
  battle.on(BattleEvents.CheckUnitStat, EventPriority.Exact, event => {
    event.value = event.source.stats[event.stat];
  });

  function getStageFromStat(stat: Stats): Stages | undefined {
    switch (stat) {
      case Stats.Attack:
        return Stages.Attack;
      case Stats.Defense:
        return Stages.Defense;
      case Stats.SpecialAttack:
        return Stages.SpecialAttack;
      case Stats.SpecialDefense:
        return Stages.SpecialDefense;
      case Stats.Speed:
        return Stages.Speed;
      default:
        return undefined;
    }
  }

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

export function setupUnitMechanics(battle: Battle) {
  setupUnitStatusMechanics(battle);
  setupUnitTypeMechanics(battle);
  setupUnitStatMechancis(battle);
  setupUnitStageMechanics(battle);
  setupUnitDamageMechanics(battle);
}
