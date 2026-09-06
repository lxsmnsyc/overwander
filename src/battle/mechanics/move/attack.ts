import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  type Types,
} from '../../../data/constants/types';
import { DamageFlags, MoveAttackFlags, MoveCategories, StatFlags } from '../../../data/ids/moves';
import type Battle from '../../core';
import type {
  CheckUnitAttackEffectChanceEvent,
  CheckUnitAttackEffectEvent,
  UnitAttackEvent,
  UnitAttackResolveAmountEvent,
  UnitAttackResolveCriticalEvent,
  UnitAttackResolveEffectivenessEvent,
  UnitAttackResolveStatEvent,
} from '../../events';
import { BattleEvents, EffectType } from '../../events';
import type Unit from '../../unit';

/** The middle of the damage range, for a simulated attack */
const SIMULATED_DAMAGE_ROLL = 0.925;

/**
 * What each critical hit stage is worth, gen VI onwards: one in
 * sixteen bare, and a certainty three stages up
 * https://bulbapedia.bulbagarden.net/wiki/Critical_hit
 */
const CRITICAL_CHANCES = [1 / 16, 1 / 8, 1 / 2, 1];

/**
 * The odds of a critical hit at the given stage. Exported because the
 * tests pin the roll against it, and a table written out twice is a
 * table that goes out of step
 */
export function criticalChance(stage: number): number {
  return CRITICAL_CHANCES[Math.min(Math.max(0, Math.floor(stage)), CRITICAL_CHANCES.length - 1)];
}

/** A blow landing: what it is worth, what it is doubled or halved by, and what it leaves behind */
export default function setupAttackMechanics(battle: Battle): void {
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
    event.value = criticalChance(resolveCriticalHitRatio(event.parent));
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

    // A fixed-damage move is handed the number it takes off, and a
    // status move carries no damage at all: neither has anything for
    // the type chart or the stab to be a factor of
    if (parent.flags & MoveAttackFlags.Pure || category === MoveCategories.Status) {
      return;
    }

    // Base amount
    let base = (2 * source.level) / 5 + 2;

    // multiply to power
    base *= event.value;

    let isCritical = false;

    // If critical is enabled, roll for a hit
    if (parent.flags & MoveAttackFlags.Critical) {
      isCritical = resolveCriticalHit(parent);
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

    // Random factor: 85% to 100%. A simulation takes the middle
    // of that range instead of rolling: the AI runs this pipeline
    // once per move it is weighing, so a roll here would both make
    // its estimates noisy enough to flip a KO and tie the fight's
    // random stream to how many moves it had to consider
    event.value *=
      parent.flags & MoveAttackFlags.Simulated
        ? SIMULATED_DAMAGE_ROLL
        : battle.randomRange(0.85, 1);

    // A confused pokemon hits itself with nobody's type behind it
    if (parent.flags & MoveAttackFlags.Confused) {
      return;
    }

    // Calculate type effectiveness
    for (const type of target.types) {
      event.value *= resolveEffectiveness(parent, type);
    }

    // STAB
    event.value *= resolveSTAB(parent);
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
    if (event.success) {
      // A blow that never landed carries no secondary either: an
      // immunity and a substitute stop the effect the way they stop
      // the damage
      event.success =
        event.parent.success && event.parent.source.alive && event.parent.target.alive;
    }
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
