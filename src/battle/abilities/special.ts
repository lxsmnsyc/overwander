import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveTargets, Moves, affectsFoesOnly } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType, MoveTargetType } from '../events';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import type Unit from '../unit';
import { MergedLifecycle } from '../lifecycle';
import { createAbility } from './__create';

/**
 * Special-tier abilities that can never be disabled (e.g. by
 * Neutralizing Gas or future ability-suppressing effects)
 */
export const PROTECTED_ABILITIES = new Set<Abilities>([Abilities.Boss, Abilities.Shadow]);

/**
 * A Boss' health is twentyfold what the species would otherwise have,
 * so a raid takes a party to bring down and a bulky boss is a longer
 * fight than a frail one all the way up
 */
export const BOSS_HEALTH_SCALE = 20;

/**
 * Every other stat simply doubles
 */
export const BOSS_STAT_SCALE = 2;

/**
 * The most one indirect hit takes off a boss. A burn, a seed or a
 * sandstorm counts for something now, and counts the same whatever
 * pool it is chipping at: a share of a raid pool would be worth more
 * than the hits the party is landing
 */
export const BOSS_INDIRECT_DAMAGE_CAP = 100;

/**
 * The most a boss puts back in a second, as a share of its pool. The
 * pool is the fight's clock, so a boss may wind it back a little and
 * never reset it, and a stack of heals landing together is worth no
 * more than one: the allowance refills as the fight runs rather than
 * being handed out per heal
 */
export const BOSS_HEAL_FRACTION = 1 / 8;
export const BOSS_HEAL_WINDOW = 1000;

/**
 * What a shadow is: sharper and more brittle. The two attacking stats
 * rise and the two defending ones fall, so it hits a quarter harder
 * and takes a third more, and the trade shows on its stat sheet
 */
export const SHADOW_OFFENSE_SCALE = 1.25;
export const SHADOW_DEFENSE_SCALE = 0.75;

const SHADOW_STAT_SCALES = new Map<Stats, number>([
  [Stats.Attack, SHADOW_OFFENSE_SCALE],
  [Stats.SpecialAttack, SHADOW_OFFENSE_SCALE],
  [Stats.Defense, SHADOW_DEFENSE_SCALE],
  [Stats.SpecialDefense, SHADOW_DEFENSE_SCALE],
]);

// The list a raid is staged against, kept with the data it filters
// rather than with the ability that made it necessary
export { default as BANNED_BOSS_MOVES, getBannedBossMoves } from '../../data/overworld/boss-moves';

/**
 * Statuses a Boss shrugs off unless self-inflicted (e.g. Rest).
 *
 * All of them take the fight away from the player rather than making
 * it harder: a boss that cannot act is not a boss anybody fought.
 * **Infatuation** is on the list for that reason and one more — a
 * lobby is up to ten parties, so somebody always has the gender the
 * boss would fall for, and an Attract landing would turn the raid into
 * a queue of who brought the right pokemon
 */
const BOSS_BLOCKED_STATUSES = new Set<Statuses>([
  Statuses.Trapped,
  Statuses.Flinched,
  Statuses.Frozen,
  Statuses.Sleeping,
  Statuses.Infatuated,
]);

/**
 * What a boss refuses from itself as well. A Perish Song is a timer
 * on a fight whose only clock is the pool, so one that landed would
 * end the raid on its own, and a boss that knows the move would sing
 * itself to death
 */
const BOSS_REFUSED_STATUSES = new Set<Statuses>([Statuses.Perishing]);

/** The most this boss may put back in a second */
function healingRate(unit: Unit): number {
  return unit.checkStat(Stats.HP, 0) * BOSS_HEAL_FRACTION;
}

function isSelfInflicted(cause: EffectCause, source: unknown): boolean {
  return 'unit' in cause && cause.unit === source;
}

function refusesStatus(status: Statuses, cause: EffectCause, source: unknown): boolean {
  return (
    BOSS_REFUSED_STATUSES.has(status) ||
    (BOSS_BLOCKED_STATUSES.has(status) && !isSelfInflicted(cause, source))
  );
}

const setupAbilities = [
  /**
   * Boss: a raid-style stat wall — twentyfold HP, doubled everything
   * else, immune to negative stage applications, to damage measured
   * as a share of its pool, to forced switch-outs, trapping and
   * disruption statuses (unless self-inflicted), and to a Perish Song
   * whoever sang it. Indirect damage lands for at most
   * `BOSS_INDIRECT_DAMAGE_CAP`, and it heals at most
   * `BOSS_HEAL_FRACTION` of its pool at a time. Its single-target
   * enemy moves strike every enemy instead.
   */
  createAbility(Abilities.Boss, (battle) => {
    // Units that already went through their first-entry dormancy
    const awakened = new Set<Unit>();
    // How much of its allowance each boss has spent. It drains as the
    // fight runs, so healing is capped by the second rather than by
    // the heal: ten drains landing at once are worth one
    const spent = new Map<Unit, number>();

    /** What this boss may still take back, and what taking it costs */
    function takeHealing(unit: Unit, wanted: number): number {
      const taken = Math.max(0, Math.min(wanted, healingRate(unit) - (spent.get(unit) ?? 0)));

      spent.set(unit, (spent.get(unit) ?? 0) + taken);
      return taken;
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const [unit, used] of spent) {
          const refilled = used - (healingRate(unit) * event.duration) / BOSS_HEAL_WINDOW;

          if (refilled <= 0) {
            spent.delete(unit);
          } else {
            spent.set(unit, refilled);
          }
        }
      }),
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Boss)) {
          event.value =
            event.stat === Stats.HP
              ? event.value * BOSS_HEALTH_SCALE
              : event.value * BOSS_STAT_SCALE;
        }
      }),
      // The first time a Boss takes the field it lies dormant,
      // unable to act while the warm-up runs out
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (
          !event.reactivation &&
          event.source.hasAbility(Abilities.Boss) &&
          !awakened.has(event.source)
        ) {
          awakened.add(event.source);

          event.source.addStatus(Statuses.Dormant, {
            type: EffectType.Ability,
            ability: Abilities.Boss,
            unit: event.source,
          });
        }
      }),
      // Half health rouses it early: a party that hits hard enough
      // buys the fight instead of waiting the warm-up out
      battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
        if (
          event.source.hasAbility(Abilities.Boss) &&
          event.source.status[Statuses.Dormant] != null &&
          event.value <= event.source.checkStat(Stats.HP, 0) / 2
        ) {
          event.source.removeStatus(Statuses.Dormant, {
            type: EffectType.Ability,
            ability: Abilities.Boss,
            unit: event.source,
          });
        }
      }),

      // Boss moves wind up slowly: casts take twice as long
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Boss)) {
          event.duration *= 2;
        }
      }),
      // Nothing short of fainting interrupts a boss cast (the faint
      // interrupt fires at zero health and passes through)
      battle.on(BattleEvents.UnitInterrupt, EventPriority.Pre, (event) => {
        if (event.source.health > 0 && event.source.hasAbility(Abilities.Boss)) {
          event.disabled = true;
        }
      }),
      // Negative stage applications fail outright
      battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
        if (event.success && event.value < 0 && event.source.hasAbility(Abilities.Boss)) {
          event.success = false;

          // For visual cues
          event.source.triggerAbility(Abilities.Boss);
        }
      }),
      battle.on(BattleEvents.CheckUnitCanRemoveStage, EventPriority.Post, (event) => {
        if (event.success && event.value > 0 && event.source.hasAbility(Abilities.Boss)) {
          event.success = false;

          // For visual cues
          event.source.triggerAbility(Abilities.Boss);
        }
      }),
      // A share of a raid pool is worth more than anything the party
      // is landing, so nothing may take one: an OHKO move and a Super
      // Fang are refused outright.
      //
      // A **cost** is exempt, and always was: a boss that explodes
      // still dies by it, and one that puts up a Substitute still
      // pays for it. So is a negative amount, which is a heal riding
      // the damage event the way the drains do
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        const refused =
          event.flags & DamageFlags.HealthScaled &&
          !(event.flags & (DamageFlags.Indirect | DamageFlags.Cost));

        if (
          event.success &&
          refused &&
          event.value > 0 &&
          event.target.hasAbility(Abilities.Boss)
        ) {
          event.success = false;

          // For visual cues
          event.target.triggerAbility(Abilities.Boss);
        }
      }),
      // What is indirect lands, but only for what a hit is worth: a
      // burn, a seed, the weather and a crash off a missed Jump Kick
      // all count, and none of them counts as a share of the pool. A
      // cost is what the boss chose to spend, so it is paid in full,
      // and a negative amount is a heal, held to the same fraction as
      // any other
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        if (event.flags & DamageFlags.Cost || !event.target.hasAbility(Abilities.Boss)) {
          return;
        }
        if (event.value < 0) {
          event.value = -takeHealing(event.target, -event.value);
          return;
        }
        if (event.flags & DamageFlags.Indirect) {
          event.value = Math.min(event.value, BOSS_INDIRECT_DAMAGE_CAP);
        }
      }),
      // A boss may put health back, an eighth of its pool a second.
      // The pool is the fight's clock, so winding it back is allowed
      // and resetting it is not: a party that stops hitting loses
      // ground, and one that keeps hitting still gets there
      battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
        if (event.value > 0 && event.target.hasAbility(Abilities.Boss)) {
          event.value = takeHealing(event.target, event.value);

          // For visual cues
          event.target.triggerAbility(Abilities.Boss);
        }
      }),
      // Recoil never comes back to a boss (Rock Head style)
      battle.on(BattleEvents.CheckUnitRecoil, EventPriority.Post, (event) => {
        if (event.recoil && event.parent.source.hasAbility(Abilities.Boss)) {
          event.recoil = false;
        }
      }),
      // Pure query: trapping and disruption statuses cannot land
      // unless the boss inflicted them on itself (e.g. Rest)
      battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          refusesStatus(event.status, event.cause, event.source) &&
          event.source.hasAbility(Abilities.Boss)
        ) {
          event.immune = true;
        }
      }),
      // The cue only fires when a real application was blocked
      battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
        if (
          refusesStatus(event.status, event.cause, event.source) &&
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
      // Neither of the two above is worth casting at a boss, so the
      // AI is told before it picks one: a forced switch-out fails
      // outright, and a disabling never sticks
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
        if (
          event.usable &&
          (FORCED_SWITCH_MOVES.has(event.move) || event.move === Moves.Disable) &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          event.target.unit.hasAbility(Abilities.Boss)
        ) {
          event.usable = false;
        }
      }),
      // Unfriendly switch-outs (e.g. Roar, Whirlwind) fail outright
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Pre, (event) => {
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
      // A move the boss casts at one enemy is cast at nobody
      // instead, so it goes out to the whole far side it already
      // says it reaches. Anything it does to the boss itself still
      // resolves once, since the fan-out names the caster a single
      // time
      battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Post, (event) => {
        if (
          event.target === MoveTargets.Unit &&
          affectsFoesOnly(event.affects) &&
          event.source.hasAbility(Abilities.Boss)
        ) {
          event.target = MoveTargets.None;
        }
      }),
    ]);
  }),

  /**
   * Shadow: a glass cannon written into the stats. What it hits with
   * is sharpened and what it stands behind is worn thin, so it is
   * read off the sheet rather than felt only in the numbers a fight
   * prints
   */
  createAbility(Abilities.Shadow, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (!event.source.hasAbility(Abilities.Shadow)) {
        return;
      }

      const factor = SHADOW_STAT_SCALES.get(event.stat);

      if (factor != null) {
        event.value *= factor;
      }
    }),
  ),
];

export default function setupSpecialAbilities(battle: Battle): void {
  // Always active: special-tier abilities cannot be switched off
  battle.on(BattleEvents.UnitDisableAbility, EventPriority.Pre, (event) => {
    if (PROTECTED_ABILITIES.has(event.ability)) {
      event.disabled = true;
    }
  });

  for (const setup of setupAbilities) {
    setup(battle);
  }
}
