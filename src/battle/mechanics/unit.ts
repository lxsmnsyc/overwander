import { AttackPriority, EventPriority } from '../../core/event-emitter';
import {
  Stats,
  StatsKind,
  createStagesField,
  getHealthStat,
  getOtherStat,
  getStageFromStat,
} from '../../data/constants/stats';
import { DamageFlags, StatFlags } from '../../data/ids/moves';
import { getNatureFactor } from '../../data/ids/natures';
import { getSpeciesData } from '../../data/species';
import type Battle from '../core';
import { BattleEvents } from '../events';

function setupUnitStatusMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Exact, (event) => {
    event.source.status[event.status] = event.cause;
  });
  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Exact, (event) => {
    event.source.status[event.status] = undefined;
  });
}

const MIN_STAGE = -6;
const MAX_STAGE = 6;

function setupUnitStageMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitAddStage, EventPriority.Exact, (event) => {
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

  battle.on(BattleEvents.UnitRemoveStage, EventPriority.Exact, (event) => {
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

  battle.on(BattleEvents.CheckUnitStage, EventPriority.Exact, (event) => {
    event.value = event.source.stages[event.stage];
  });

  battle.on(BattleEvents.UnitResetStages, EventPriority.Exact, (event) => {
    event.source.stages = createStagesField();
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Exact, (event) => {
    event.source.stages = createStagesField();
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, (event) => {
    event.source.stages = createStagesField();
  });
}

function setupUnitTypeMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitAddType, EventPriority.Exact, (event) => {
    event.source.types.add(event.type);
  });
  battle.on(BattleEvents.UnitRemoveType, EventPriority.Exact, (event) => {
    event.source.types.delete(event.type);
  });
}

function setupUnitDamageMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitHeal, EventPriority.Exact, (event) => {
    if (event.target.alive) {
      // setHealth clamps to the max HP
      event.target.setHealth(event.target.health + event.value);
    }
  });

  battle.on(BattleEvents.UnitDamage, AttackPriority.Exact, (event) => {
    if (event.target.alive) {
      let value = Math.max(0, event.target.health - event.value);

      // Prevent knocking out
      if (event.flags & DamageFlags.NonLethal) {
        value = Math.max(1, value);
      }

      event.target.setHealth(value);

      if (event.target.health <= 0) {
        event.target.faint(event.source);
      }

      event.success = true;
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, (event) => {
    event.source.interrupt();
    event.source.alive = false;
  });
}

function setupUnitStatMechancis(battle: Battle): void {
  battle.on(BattleEvents.UnitSetLevel, EventPriority.Exact, (event) => {
    event.source.level = event.value;
  });
  battle.on(BattleEvents.UnitSetHealth, EventPriority.Exact, (event) => {
    const max = event.source.checkStat(Stats.HP, 0);
    event.source.health = Math.min(event.value, max);
  });

  battle.on(BattleEvents.UnitSetStat, EventPriority.Exact, (event) => {
    // when changing HP stat, scale current health
    if (event.stat === Stats.HP) {
      const max = event.source.checkStat(event.stat, 0);
      const current = event.source.health;
      event.source.setHealth((current / max) * event.value);
    }
    event.source.stats[event.kind][event.stat] = event.value;
  });

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Exact, (event) => {
    // TODO apply level formula
    if (event.stat === Stats.HP) {
      event.value = getHealthStat(
        event.source.level,
        event.source.stats[StatsKind.Base][event.stat],
        event.source.stats[StatsKind.Individual][event.stat],
        event.source.stats[StatsKind.Effort][event.stat],
      );
    } else {
      event.value = getOtherStat(
        event.source.level,
        event.source.stats[StatsKind.Base][event.stat],
        event.source.stats[StatsKind.Individual][event.stat],
        event.source.stats[StatsKind.Effort][event.stat],
        getNatureFactor(event.source.nature, event.stat),
      );
    }
  });

  function getNormalStage(value: number, stat: Stats, flags: number): number {
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
        // HP and Speed stages are unaffected by critical hits
        case Stats.HP:
        case Stats.Speed:
          break;
      }
    }
    return value;
  }

  function getStageFactor(value: number): number {
    return value < 0 ? 2 / (2 - value) : (2 + value) / 2;
  }

  battle.on(BattleEvents.ResolveUnitStat, EventPriority.Exact, (event) => {
    event.value = event.source.checkStat(event.stat, event.flags);

    const targetStage = getStageFromStat(event.stat);
    const stageValue = targetStage == null ? 0 : event.source.checkStage(targetStage, event.flags);
    const normalStage = getNormalStage(stageValue, event.stat, event.flags);
    event.value *= getStageFactor(normalStage);
  });
}

const ALL_STATS = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

function setupUnitSpeciesMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitSetSpecies, EventPriority.Exact, (event) => {
    const data = getSpeciesData(event.species);

    event.source.species = event.species;

    // Apply the species' base stats
    for (const stat of ALL_STATS) {
      event.source.setStat(StatsKind.Base, stat, data.stats[stat]);
    }

    // Replace the unit's types
    for (const type of [...event.source.types]) {
      event.source.removeType(type);
    }
    for (const type of data.types) {
      event.source.addType(type);
    }

    // The appearance follows the actual species unless overridden later
    event.source.setAppearance(event.species);
  });

  battle.on(BattleEvents.UnitSetAppearance, EventPriority.Exact, (event) => {
    event.source.appearance = event.species;
  });

  battle.on(BattleEvents.UnitSetGender, EventPriority.Exact, (event) => {
    event.source.gender = event.gender;
  });

  battle.on(BattleEvents.UnitSetNature, EventPriority.Exact, (event) => {
    event.source.nature = event.nature;
  });

  // Measurements are per-individual, so nothing derives them here:
  // whoever builds the unit supplies them, and an effect that shrinks
  // or lightens one writes through the same setter. Neither may reach
  // zero — a weightless unit would break the weight-driven moves
  battle.on(BattleEvents.UnitSetHeight, EventPriority.Exact, (event) => {
    event.source.height = Math.max(0.01, event.value);
  });

  battle.on(BattleEvents.UnitSetWeight, EventPriority.Exact, (event) => {
    event.source.weight = Math.max(0.1, event.value);
  });
}

function setupUnitSwitchMechanics(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitEscape, EventPriority.Exact, (event) => {
    event.success = !event.source.channeling;
  });
  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, (event) => {
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

export default function setupUnitMechanics(battle: Battle): void {
  setupUnitStatusMechanics(battle);
  setupUnitTypeMechanics(battle);
  setupUnitStatMechancis(battle);
  setupUnitStageMechanics(battle);
  setupUnitDamageMechanics(battle);
  setupUnitSpeciesMechanics(battle);
  setupUnitSwitchMechanics(battle);
}
