import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, MoveTargetFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, MoveTargetType } from '../events';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import { MergedAbilityLifecycle, createAbility } from './__create';

/**
 * Statuses a Boss shrugs off unless self-inflicted (e.g. Rest)
 */
const BOSS_BLOCKED_STATUSES = new Set<Statuses>([
  Statuses.Trapped,
  Statuses.Flinched,
  Statuses.Frozen,
  Statuses.Sleeping,
]);

function isSelfInflicted(cause: EffectCause, source: unknown): boolean {
  return 'unit' in cause && cause.unit === source;
}

const setupAbilities = [
  /**
   * Boss: a raid-style stat wall — tenfold HP, doubled everything
   * else, immune to negative stage applications, health-scaling
   * damage (OHKO moves, Super Fang, residual max-HP fractions),
   * forced switch-outs, trapping, and disruption statuses (unless
   * self-inflicted). Its single-target enemy moves strike every
   * enemy instead.
   */
  createAbility(
    Abilities.Boss,
    (battle) =>
      new MergedAbilityLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.Boss)) {
            event.value *= event.stat === Stats.HP ? 10 : 2;
          }
        }),
        // Negative stage applications fail outright
        battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
          if (event.success && event.value < 0 && event.source.hasAbility(Abilities.Boss)) {
            event.success = false;

            // For visual cues
            event.source.triggerAbility(Abilities.Boss);
          }
        }),
        battle.on(BattleEvents.CheckUnitRemoveStage, EventPriority.Post, (event) => {
          if (event.success && event.value > 0 && event.source.hasAbility(Abilities.Boss)) {
            event.success = false;

            // For visual cues
            event.source.triggerAbility(Abilities.Boss);
          }
        }),
        // Health-scaling damage never lands, direct or indirect
        battle.on(BattleEvents.UnitDamage, EventPriority.Pre, (event) => {
          if (event.flags & DamageFlags.HealthScaled && event.target.hasAbility(Abilities.Boss)) {
            event.disabled = true;

            // For visual cues
            event.target.triggerAbility(Abilities.Boss);
          }
        }),
        // Pure query: trapping and disruption statuses cannot land
        // unless the boss inflicted them on itself (e.g. Rest)
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            BOSS_BLOCKED_STATUSES.has(event.status) &&
            !isSelfInflicted(event.cause, event.source) &&
            event.source.hasAbility(Abilities.Boss)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (
            BOSS_BLOCKED_STATUSES.has(event.status) &&
            !isSelfInflicted(event.cause, event.source) &&
            event.source.hasAbility(Abilities.Boss)
          ) {
            event.source.triggerAbility(Abilities.Boss);
          }
        }),
        // Move disabling (e.g. Disable) never sticks
        battle.on(BattleEvents.UnitDisableMove, EventPriority.Pre, (event) => {
          if (event.source.hasAbility(Abilities.Boss)) {
            event.disabled = true;

            // For visual cues
            event.source.triggerAbility(Abilities.Boss);
          }
        }),
        // Unfriendly switch-outs (e.g. Roar, Whirlwind) fail outright
        battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Pre, (event) => {
          if (
            event.steps === 0 &&
            FORCED_SWITCH_MOVES.has(event.move) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.Boss)
          ) {
            event.disabled = true;

            // For visual cues
            event.target.unit.triggerAbility(Abilities.Boss);

            event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
          }
        }),
        // Boss weather changes always land battle-wide (raid teams
        // only weather their own side otherwise)
        battle.on(BattleEvents.UnitSetWeather, EventPriority.Pre, (event) => {
          if (event.source.hasAbility(Abilities.Boss)) {
            event.global = true;
          }
        }),
        // Single-target, enemy-only moves widen to every enemy;
        // self-affecting components still resolve once (the Self
        // branch of the fan-out targets the user a single time)
        battle.on(BattleEvents.CheckUnitMoveTargetFlags, EventPriority.Post, (event) => {
          if (
            !(event.flags & MoveTargetFlags.Multiple) &&
            event.flags & MoveTargetFlags.Enemy &&
            !(event.flags & (MoveTargetFlags.Own | MoveTargetFlags.Ally)) &&
            event.source.hasAbility(Abilities.Boss)
          ) {
            event.flags |= MoveTargetFlags.Multiple;
          }
        }),
      ]),
  ),

  /**
   * Shadow: a glass-cannon aura — attack damage dealt and received
   * both rise by 20% (stacking to 44% when both sides carry it).
   * Pure attacks (fixed damage) stay exact.
   */
  createAbility(Abilities.Shadow, (battle) => {
    const FACTOR = 1.2;

    return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      if (event.parent.flags & MoveAttackFlags.Pure) {
        return;
      }

      if (event.parent.source.hasAbility(Abilities.Shadow)) {
        event.value *= FACTOR;
      }

      if (event.parent.target.hasAbility(Abilities.Shadow)) {
        event.value *= FACTOR;
      }
    });
  }),
];

export default function setupSpecialAbilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
