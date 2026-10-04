import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveTargets,
  Moves,
  affectsFoesOnly,
} from '../../data/ids/moves';
import { NON_VOLATILE_STATUSES, Statuses } from '../../data/ids/status';
import type Battle from '../core';
import {
  BattleEvents,
  type EffectCause,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../events';
import { ABILITY_MOVES } from '../moves/ability-moves';
import { STAGE_SWAP_MOVES } from '../moves/stage-swaps';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import type Unit from '../unit';
import { MergedLifecycle } from '../lifecycle';
import { createAbility } from './__create';

import PROTECTED_ABILITIES from './protected';

export { default as PROTECTED_ABILITIES } from './protected';

/**
 * A Boss' health is this many times what the species would otherwise have,
 * so a raid takes a party to bring down and a bulky boss is a longer
 * fight than a frail one all the way up
 */
export const BOSS_HEALTH_SCALE = 110;

/**
 * Every other stat simply doubles
 */
export const BOSS_STAT_SCALE = 2;

/**
 * How much longer a boss winds up than anything else. The wind-up is
 * the party's warning, long enough to see what is coming and answer it
 */
export const BOSS_CAST_SCALE = 2.5;

/**
 * The most one indirect or share-of-HP hit takes off a boss, whatever
 * its pool: a share of a raid pool would be worth more than the hits
 * the party is landing
 */
export const BOSS_DAMAGE_CAP = 200;

/**
 * The shares of its pool at which a boss shakes off what the party has
 * hung on it: its status, its stat drops, and the seeds, curses and
 * confusion riding it. A party built on keeping a boss burned and
 * charmed has to put it all back, twice
 */
export const BOSS_PHASES = [0.5, 0.25];

/** What a boss sheds as it crosses into a new phase */
const BOSS_SHED_STATUSES: readonly Statuses[] = [
  ...NON_VOLATILE_STATUSES,
  Statuses.Seeding,
  Statuses.Confused,
  Statuses.Cursed,
  Statuses.Nightmared,
];

/**
 * How fast a boss' allowance for indirect and share-of-HP damage
 * refills, per second. Every source draws on the one allowance, which
 * holds `BOSS_DAMAGE_CAP` when full: one clock pays its cap, and five
 * ticking together are worth no more than one would be
 */
export const BOSS_INDIRECT_RATE = 50;

/**
 * A share of a unit's max HP, for an effect measured against it: a
 * floor under a hit, a cut-off under which a blow does nothing. A
 * boss' pool is raid-sized, so its share is held to the same cap as
 * any other share-of-HP hit on it
 */
export function healthShare(unit: Unit, share: number): number {
  const amount = unit.checkStat(Stats.HP, 0) * share;

  return unit.hasAbility(Abilities.Boss) ? Math.min(amount, BOSS_DAMAGE_CAP) : amount;
}

/**
 * The most a boss puts back in a second. A flat figure rather than a
 * share, so a bulky boss heals no more than a frail one, and a stack
 * of heals landing together is worth no more than one
 */
export const BOSS_HEAL_CAP = 1000;
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
 * What a boss refuses at either end. Nothing may move its ability
 * about, and a stage swap leaks whichever way it is cast: the boss
 * turns away the negative half and the positive half lands on its
 * own, so whoever swapped keeps a copy of what the other side had.
 * A split averages the stats before a boss' own doubling, so the boss
 * drops to the average and the other side climbs to it
 */
const BOSS_REFUSED_MOVES = new Set<Moves>([
  ...ABILITY_MOVES,
  ...STAGE_SWAP_MOVES,
  Moves.GuardSplit,
  Moves.PowerSplit,
]);

/**
 * What a boss shrugs off when it is aimed at. Quash restarts its
 * wind-up, Me First cuts it off and Sky Drop carries it where it cannot
 * act. Powder spends a Fire cast and Electrify turns the next move
 * Electric for a Ground type to ignore. A lobby taking turns with any
 * of them would keep it out of the fight
 */
const BOSS_IMMUNE_MOVES = new Set<Moves>([
  Moves.Quash,
  Moves.MeFirst,
  Moves.SkyDrop,
  Moves.Powder,
  Moves.Electrify,
]);

/**
 * The moves that hold a pokemon to part of its move set. A boss
 * refuses each of them, so the AI never spends a cast finding out
 */
const MOVE_HOLDS = new Set<Moves>([
  Moves.Disable,
  Moves.Taunt,
  Moves.Torment,
  Moves.Imprison,
  Moves.Encore,
]);

/**
 * Statuses a Boss shrugs off unless self-inflicted (e.g. Rest).
 *
 * All of them take the fight away from the player rather than making
 * it harder: a boss that cannot act is not a boss anybody fought.
 * **Infatuation** is on the list for that reason and one more: a
 * lobby is up to ten parties, so somebody always has the gender the
 * boss would fall for, and an Attract landing would turn the raid into
 * a queue of who brought the right pokemon.
 *
 * The last four are what the moves that hold a pokemon to part of its
 * move set leave behind, and a boss held to one move is a boss the
 * party has stopped fighting. A Disable never sticks to one either,
 * which is the same rule written where the disabling happens
 */
const BOSS_BLOCKED_STATUSES = new Set<Statuses>([
  Statuses.Trapped,
  Statuses.Flinched,
  Statuses.Frozen,
  Statuses.Sleeping,
  Statuses.Infatuated,
  Statuses.Taunted,
  Statuses.Tormented,
  Statuses.Imprisoned,
  Statuses.Encored,
]);

/** Moves that fail outright when aimed at a boss */
const BOSS_FAILED_MOVES = new Set<Moves>([...FORCED_SWITCH_MOVES, Moves.Spite]);

/**
 * What a boss refuses from itself as well. A Perish Song is a timer
 * on a fight whose only clock is the pool, so one that landed would
 * end the raid on its own, and a boss that knows the move would sing
 * itself to death
 */
const BOSS_REFUSED_STATUSES = new Set<Statuses>([Statuses.Perishing]);

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
   * Boss: a raid-style stat wall, `BOSS_HEALTH_SCALE` times the HP and doubled
   * everything else, immune to forced switch-outs and Spite, to
   * trapping and disruption statuses (unless self-inflicted), to the
   * moves that move abilities or stages about, to a Perish Song
   * whoever sang it, and to anything that would fell it while its
   * pool still holds. Indirect and share-of-HP damage draws on one
   * allowance of `BOSS_DAMAGE_CAP` refilling at `BOSS_INDIRECT_RATE` a
   * second, it heals at most `BOSS_HEAL_CAP` a second, and it sheds
   * what the party hung on it at each of `BOSS_PHASES`. Its
   * single-target enemy moves strike every enemy instead.
   */
  createAbility(Abilities.Boss, (battle) => {
    // Units that already went through their first-entry dormancy
    const awakened = new Set<Unit>();
    // How much of its allowance each boss has spent. It drains as the
    // fight runs, so healing is capped by the second rather than by
    // the heal: ten drains landing at once are worth one
    const spent = new Map<Unit, number>();
    // The same for the indirect damage it takes
    const worn = new Map<Unit, number>();
    // How many of the phases each boss has crossed into
    const phases = new Map<Unit, number>();

    /** Shed everything the party hung on it, once for each phase it crossed */
    function shed(unit: Unit, health: number): void {
      const crossed = phases.get(unit) ?? 0;
      let reached = crossed;

      while (
        reached < BOSS_PHASES.length &&
        health <= unit.checkStat(Stats.HP, 0) * BOSS_PHASES[reached]
      ) {
        reached++;
      }
      if (reached === crossed) {
        return;
      }
      phases.set(unit, reached);

      const cause = { type: EffectType.Ability, ability: Abilities.Boss, unit } as const;

      unit.triggerAbility(Abilities.Boss);
      for (const status of BOSS_SHED_STATUSES) {
        const held = unit.status[status];

        if (held != null) {
          unit.removeStatus(status, held);
        }
      }
      unit.resetStages(cause);
    }

    /** Whether either end of this move is a raid boss */
    function touchesBoss(event: { source: Unit; target: MoveTarget }): boolean {
      return (
        event.source.hasAbility(Abilities.Boss) ||
        (event.target.type === MoveTargetType.Unit && event.target.unit.hasAbility(Abilities.Boss))
      );
    }

    /** What this boss may still take back, and what taking it costs */
    function takeHealing(unit: Unit, wanted: number): number {
      const taken = Math.max(0, Math.min(wanted, BOSS_HEAL_CAP - (spent.get(unit) ?? 0)));

      spent.set(unit, (spent.get(unit) ?? 0) + taken);
      return taken;
    }

    /** What indirect damage this boss may still take, and what taking it costs */
    function takeWear(unit: Unit, wanted: number): number {
      const taken = Math.max(
        0,
        Math.min(wanted, BOSS_DAMAGE_CAP - (worn.get(unit) ?? 0)),
      );

      worn.set(unit, (worn.get(unit) ?? 0) + taken);
      return taken;
    }

    function refill(used: Map<Unit, number>, rate: number, duration: number): void {
      for (const [unit, amount] of used) {
        const refilled = amount - rate * duration;

        if (refilled <= 0) {
          used.delete(unit);
        } else {
          used.set(unit, refilled);
        }
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        refill(spent, BOSS_HEAL_CAP / BOSS_HEAL_WINDOW, event.duration);
        refill(worn, BOSS_INDIRECT_RATE / 1000, event.duration);
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
      battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
        if (event.source.alive && event.source.hasAbility(Abilities.Boss)) {
          shed(event.source, event.value);
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

      // Boss moves wind up slowly
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Boss)) {
          event.duration *= BOSS_CAST_SCALE;
        }
      }),
      // Nothing short of fainting interrupts a boss cast (the faint
      // interrupt fires at zero health and passes through)
      battle.on(BattleEvents.UnitInterrupt, EventPriority.Pre, (event) => {
        if (event.source.health > 0 && event.source.hasAbility(Abilities.Boss)) {
          event.disabled = true;
        }
      }),
      /**
       * The moves that move abilities about find nothing to take hold
       * of at either end of a raid. What a boss is is not a thing to
       * copy, trade or shut off, and a move that took half of it
       * would leave the fight without the pool it is built around
       */
      battle.on(BattleEvents.CheckUnitTriggerMoveEffect, EventPriority.Post, (event) => {
        if (event.success && BOSS_REFUSED_MOVES.has(event.move) && touchesBoss(event)) {
          event.success = false;

          event.source.triggerAbility(Abilities.Boss);
        }
        if (
          event.success &&
          BOSS_IMMUNE_MOVES.has(event.move) &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          event.target.unit.hasAbility(Abilities.Boss)
        ) {
          event.success = false;

          // For visual cues
          event.target.unit.triggerAbility(Abilities.Boss);
        }
      }),
      // And the AI is told rather than left to spend a cast finding out
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
        if (event.usable && BOSS_REFUSED_MOVES.has(event.move) && touchesBoss(event)) {
          event.usable = false;
        }
      }),

      // An OHKO move or a Super Fang resolves to the cap, so the AI
      // weighs it at what it will really take off
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        if (
          event.parent.flags & MoveAttackFlags.HealthScaled &&
          event.parent.target.hasAbility(Abilities.Boss)
        ) {
          event.value = Math.min(event.value, BOSS_DAMAGE_CAP);
        }
      }),
      // Indirect and share-of-HP damage lands only for what a hit is
      // worth. A cost is what the boss chose to spend, so it is paid in
      // full, and a negative amount is a heal, held to the same
      // allowance as any other
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        if (event.flags & DamageFlags.Cost || !event.target.hasAbility(Abilities.Boss)) {
          return;
        }
        if (event.value < 0) {
          event.value = -takeHealing(event.target, -event.value);
          return;
        }
        if (event.flags & (DamageFlags.Indirect | DamageFlags.HealthScaled)) {
          event.value = takeWear(event.target, event.value);
        }
      }),
      // A boss may put health back, up to the heal cap a second.
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
      // A boss goes down when its pool is empty and no other way. An
      // effect that fells a pokemon outright, Destiny Bond among
      // them, skips damage entirely, so none of the refusals above
      // ever sees it: one bond would end a raid at full health
      battle.on(BattleEvents.UnitFaints, EventPriority.Pre, (event) => {
        if (event.source.health > 0 && event.source.hasAbility(Abilities.Boss)) {
          event.disabled = true;

          // For visual cues
          event.source.triggerAbility(Abilities.Boss);
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
      // None of these is worth casting at a boss, so the AI is told
      // before it picks one: a forced switch-out and a Spite fail
      // outright, and nothing that holds a pokemon to part of its move
      // set sticks
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
        if (
          event.usable &&
          (BOSS_FAILED_MOVES.has(event.move) ||
            MOVE_HOLDS.has(event.move) ||
            BOSS_IMMUNE_MOVES.has(event.move)) &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          event.target.unit.hasAbility(Abilities.Boss)
        ) {
          event.usable = false;
        }
      }),
      // Unfriendly switch-outs (e.g. Roar, Whirlwind) fail outright,
      // and so does a Spite, which locks a move away like Disable does
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Pre, (event) => {
        if (
          event.steps === 0 &&
          BOSS_FAILED_MOVES.has(event.move) &&
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
