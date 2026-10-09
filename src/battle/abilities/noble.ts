import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Items } from '../../data/ids/items';
import { MoveCategories, Moves } from '../../data/ids/moves';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import { FRENZY_MOVES, getNobleBurst } from '../../data/moves/frenzy-moves';
import { getSpeciesData } from '../../data/species';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { setStealthRock } from '../moves/stealth-rock';
import type Team from '../team';
import turns from '../turn';
import type Unit from '../unit';
import { createAbility } from './__create';

/**
 * The shares of its Frenzy at which a Noble staggers. Its HP bar is
 * the Frenzy: draining it is the fight, and empty is calmed
 */
export const NOBLE_THRESHOLDS = [0.75, 0.5, 0.25];

/** What every attack is worth against a staggered Noble */
export const NOBLE_STAGGER_DAMAGE = 1.5;

/** How long a Noble rages between bursts, counted only while it can act */
export const NOBLE_BURST_EVERY = turns(5);

/**
 * How long a burst winds up. Short of a boss's own wind-up on purpose:
 * long enough to read and raise a guard against, short enough that a
 * party that does not watch for it pays
 */
export const NOBLE_BURST_WINDUP = 1800;

/**
 * How much of a Noble's Frenzy one Balm soothes away. Small, since
 * every party in a lobby throws its own: a full pack is 6% from each
 * player, a help rather than the fight
 */
export const BALM_SHARE = 1 / 50;

/** How long a party waits between two Balms */
export const BALM_EVERY = turns(5);

/** What the plain burst leaves behind, by the type it is thrown in */
type BurstEffect = { status: Statuses; chance: number } | { stage: Stages; chance: number };

const LOWERS = (stage: Stages): BurstEffect => ({ stage, chance: 100 });

export const BURST_EFFECTS: Partial<Record<Types, BurstEffect>> = {
  [Types.Fire]: { status: Statuses.Burned, chance: 30 },
  [Types.Electric]: { status: Statuses.Paralyzed, chance: 30 },
  [Types.Ice]: { status: Statuses.Frozen, chance: 10 },
  [Types.Poison]: { status: Statuses.Poisoned, chance: 30 },
  [Types.Psychic]: { status: Statuses.Confused, chance: 30 },
  [Types.Dark]: { status: Statuses.Flinched, chance: 30 },
  [Types.Rock]: { status: Statuses.Flinched, chance: 30 },
  [Types.Water]: LOWERS(Stages.Speed),
  [Types.Grass]: LOWERS(Stages.Speed),
  [Types.Flying]: LOWERS(Stages.Speed),
  [Types.Ground]: LOWERS(Stages.Accuracy),
  [Types.Normal]: LOWERS(Stages.Defense),
  [Types.Fighting]: LOWERS(Stages.Defense),
  [Types.Steel]: LOWERS(Stages.Defense),
  [Types.Bug]: LOWERS(Stages.SpecialDefense),
  [Types.Ghost]: LOWERS(Stages.SpecialDefense),
  [Types.Dragon]: LOWERS(Stages.Attack),
  [Types.Fairy]: LOWERS(Stages.Attack),
};

/** What the plain burst leaves in a type, a Defense drop where the table is silent */
export function burstEffectOf(type: Types): BurstEffect {
  return BURST_EFFECTS[type] ?? LOWERS(Stages.Defense);
}

/** The type a Noble's plain burst is thrown in: its species' first */
export function burstTypeOf(unit: Unit): Types {
  return getSpeciesData(unit.species).types[0];
}

/** The Balms each party brought to a Noble raid, by team */
const packed = new WeakMap<Team, number>();

/**
 * Give a party the Balms its player packed. The battle builder hands
 * them over as it fields each party, and the party throws them one at
 * a time while a Noble stands
 */
export function holdBalms(team: Team, count: number): void {
  packed.set(team, (packed.get(team) ?? 0) + count);
}

/** How many Balms a party has left to throw */
export function balmsLeft(team: Team): number {
  return packed.get(team) ?? 0;
}

/**
 * Noble: a frenzied lord of the land. It never faints: its HP is its
 * Frenzy, and when that is drained it is calmed and leaves the field,
 * which wins the raid. Each time the Frenzy falls past one of
 * `NOBLE_THRESHOLDS` it staggers, and every `NOBLE_BURST_EVERY` it can
 * act in between it unleashes its burst on every foe after a
 * `NOBLE_BURST_WINDUP` windup. A party that packed Balms throws one
 * every `BALM_EVERY`, each soothing `BALM_SHARE` of the Frenzy
 */
export default createAbility(Abilities.Noble, (battle: Battle) => {
  /** The Nobles on the field */
  const nobles = new Set<Unit>();
  /** How many of the thresholds each Noble has fallen past */
  const crossed = new Map<Unit, number>();
  /** How long each Noble has raged since its last burst */
  const raging = new Map<Unit, number>();
  /** How long each party has waited since its last Balm */
  const waiting = new Map<Team, number>();
  const calmed = new Set<Unit>();

  /** Whether the Noble can rage right now, which is what counts towards a burst */
  function rages(noble: Unit): boolean {
    return (
      noble.alive &&
      noble.status[Statuses.Dormant] == null &&
      noble.status[Statuses.Staggered] == null
    );
  }

  /** Calmed: off the field, and the fight is the party's */
  function calm(noble: Unit): void {
    calmed.add(noble);
    nobles.delete(noble);
    noble.stopCast();
    noble.stopChannel();
    noble.leave();
    noble.team.removeUnit(noble);
    noble.alive = false;
  }

  /** The first of a party still standing, who throws its Balm */
  function throwerOf(team: Team): Unit | undefined {
    for (const unit of team.units) {
      if (unit.alive) {
        return unit;
      }
    }
    return undefined;
  }

  function throwBalm(team: Team, noble: Unit): void {
    const thrower = throwerOf(team);

    if (thrower == null) {
      return;
    }
    packed.set(team, balmsLeft(team) - 1);
    thrower.damage(
      { type: EffectType.Item, item: Items.Balm, unit: thrower },
      noble,
      noble.checkStat(Stats.HP, 0) * BALM_SHARE,
      0,
    );
  }

  /** Every party with Balms left counts down to its next one */
  function waitOnBalms(noble: Unit, duration: number): void {
    for (const team of battle.teams(noble.team.alliance)) {
      if (balmsLeft(team) <= 0) {
        continue;
      }

      const waited = (waiting.get(team) ?? 0) + duration;

      if (waited >= BALM_EVERY) {
        waiting.set(team, 0);
        throwBalm(team, noble);
      } else {
        waiting.set(team, waited);
      }
    }
  }

  return new MergedLifecycle([
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      const noble = event.source;

      if (!noble.hasAbility(Abilities.Noble)) {
        return;
      }
      nobles.add(noble);

      const burst = getNobleBurst(noble.species);

      if (noble.moves[burst] == null) {
        noble.addMove(burst);
      }
    }),

    // The burst and the Balms keep their own clocks
    battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const noble of nobles) {
        if (!rages(noble)) {
          continue;
        }

        const raged = (raging.get(noble) ?? 0) + event.duration;

        // A cast already under way finishes first; the burst comes the
        // moment it is free
        if (raged >= NOBLE_BURST_EVERY && noble.casting == null && noble.channeling == null) {
          raging.set(noble, 0);
          noble.cast(getNobleBurst(noble.species), { type: MoveTargetType.None });
        } else {
          raging.set(noble, raged);
        }
      }

      // One Noble to a raid, so the Balms go to the first standing
      const first = nobles.values().next();

      if (first.done !== true) {
        waitOnBalms(first.value, event.duration);
      }
    }),

    // Its own clock says when a burst comes, never its trainer
    battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
      if (event.usable && FRENZY_MOVES.has(event.move)) {
        event.usable = false;
      }
    }),
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      if (FRENZY_MOVES.has(event.move)) {
        event.duration = NOBLE_BURST_WINDUP;
      }
    }),
    battle.on(BattleEvents.CheckUnitMoveCooldown, EventPriority.Post, (event) => {
      if (FRENZY_MOVES.has(event.move)) {
        event.duration = 0;
      }
    }),

    // The staggers: detection here, the effect on the cue
    battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
      const noble = event.source;

      if (!noble.alive || calmed.has(noble) || !noble.hasAbility(Abilities.Noble)) {
        return;
      }

      const before = crossed.get(noble) ?? 0;
      const max = noble.checkStat(Stats.HP, 0);
      let reached = before;

      while (reached < NOBLE_THRESHOLDS.length && event.value <= max * NOBLE_THRESHOLDS[reached]) {
        reached++;
      }
      // Calmed rather than staggered when the Frenzy is gone
      if (reached > before && event.value > 0) {
        crossed.set(noble, reached);
        noble.triggerAbility(Abilities.Noble);
      }
    }),
    // The burst it was winding up is lost, but its rage is only paused:
    // a party draining it fast still meets a burst between staggers
    battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
      if (event.ability !== Abilities.Noble) {
        return;
      }
      event.source.addStatus(Statuses.Staggered, {
        type: EffectType.Ability,
        ability: Abilities.Noble,
        unit: event.source,
      });
    }),
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      if (event.parent.target.status[Statuses.Staggered] != null) {
        event.value *= NOBLE_STAGGER_DAMAGE;
      }
    }),

    // Never felled: an empty Frenzy is a Noble calmed
    battle.on(BattleEvents.UnitFaints, EventPriority.Pre, (event) => {
      const noble = event.source;

      if (!noble.hasAbility(Abilities.Noble) && !calmed.has(noble)) {
        return;
      }
      event.disabled = true;
      if (noble.health <= 0 && !calmed.has(noble)) {
        calm(noble);
      }
    }),

    // The plain burst, in the Noble's own type and from its stronger side
    battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
      if (event.move === Moves.FrenzyBurst) {
        event.type = burstTypeOf(event.source);
      }
    }),
    battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
      if (event.move === Moves.FrenzyBurst) {
        event.category =
          event.source.checkStat(Stats.Attack, 0) >= event.source.checkStat(Stats.SpecialAttack, 0)
            ? MoveCategories.Physical
            : MoveCategories.Special;
      }
    }),
    battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
      if (event.parent.move === Moves.FrenzyBurst) {
        event.value = burstEffectOf(event.parent.type).chance;
      }
    }),
    battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
      const { move, source, target, type } = event.parent;

      if (move !== Moves.FrenzyBurst) {
        return;
      }

      const effect = burstEffectOf(type);
      const cause = { type: EffectType.Move, move, unit: source } as const;

      if ('status' in effect) {
        target.addStatus(effect.status, cause);
      } else {
        target.addStage(effect.stage, -1, cause);
      }
    }),

    // What two of the canon bursts leave on the ground, on a hit
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      if (!event.success) {
        return;
      }

      const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
      const team = event.target.team;

      if (event.move === Moves.FrenzyStoneAxe) {
        setStealthRock(team, true, cause);
      }
      if (event.move === Moves.FrenzyWildfire && team.status[TeamStatuses.SeaOfFire] == null) {
        team.addStatus(TeamStatuses.SeaOfFire, cause);
      }
    }),

    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      nobles.delete(event.source);
    }),
  ]);
});
