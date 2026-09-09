import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createTimedMarks, createUnitState } from './__create';

/** What the unspent half of a pokemon is worth */
export const LATENT_POTENTIAL_SCALE = 1.3;

/** How far back the snapshot reaches, and how often one is taken */
export const ROLLBACK_WINDOW = 4000;
export const ROLLBACK_SAMPLE = 1000;

/** The share of health that triggers the restore */
export const ROLLBACK_THRESHOLD = 1 / 2;

/** What each repeat blow from one attacker loses, and the floor */
export const SPIRAL_SHELL_STEP = 0.1;
export const SPIRAL_SHELL_FLOOR = 0.6;

/** What a cut takes each time the cut one acts, and how long it stays open */
export const SERRATED_EDGE_FRACTION = 1 / 16;
export const SERRATED_EDGE_DURATION = 6000;

/** What the opening pass on each enemy is worth */
export const PREDATORS_DIVE_SCALE = 1.5;

/**
 * The five a fight is fought with. HP is left out: it is not a stat a
 * pokemon leans on, it is the room it has to be wrong in
 */
const BATTLE_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/** What a pokemon looked like a moment ago */
interface Snapshot {
  age: number;
  health: number;
}

const eeveeToDragonite = [
  // Eevee: whatever it has least of is what has not been spent yet.
  // Reading the other four means asking for them, so the listener steps
  // aside while it measures
  createAbility(Abilities.LatentPotential, (battle) => {
    let measuring = false;

    return battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        measuring ||
        !BATTLE_STATS.includes(event.stat) ||
        !event.source.hasAbility(Abilities.LatentPotential)
      ) {
        return;
      }

      measuring = true;

      let lowest = event.stat;
      let lowestValue = Number.POSITIVE_INFINITY;

      for (const stat of BATTLE_STATS) {
        const value = event.source.checkStat(stat, 0);

        if (value < lowestValue) {
          lowest = stat;
          lowestValue = value;
        }
      }

      measuring = false;

      if (lowest === event.stat) {
        event.value *= LATENT_POTENTIAL_SCALE;
      }
    });
  }),

  // Porygon: it keeps a snapshot of itself a few seconds back, and
  // spends it the first time the fight goes badly
  createAbility(Abilities.Rollback, (battle) => {
    const { state, lifecycles } = createUnitState<Snapshot[]>(battle);
    const spent = new Set<Unit>();

    let sampling = 0;

    return new MergedLifecycle([
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        sampling += event.duration;

        for (const snapshots of state.values()) {
          for (const snapshot of snapshots) {
            snapshot.age += event.duration;
          }
        }

        if (sampling < ROLLBACK_SAMPLE) {
          return;
        }

        sampling = 0;

        for (const unit of battle.units()) {
          if (!unit.alive || !unit.hasAbility(Abilities.Rollback)) {
            continue;
          }

          const snapshots = [...(state.get(unit) ?? []), { age: 0, health: unit.health }];

          // Anything older than the window plus one sample is past
          // being any use
          state.set(
            unit,
            snapshots.filter((snapshot) => snapshot.age <= ROLLBACK_WINDOW + ROLLBACK_SAMPLE),
          );
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          spent.has(target) ||
          !target.hasAbility(Abilities.Rollback) ||
          target.health >= target.checkStat(Stats.HP, 0) * ROLLBACK_THRESHOLD
        ) {
          return;
        }

        const restored = (state.get(target) ?? []).find(
          (snapshot) => snapshot.age >= ROLLBACK_WINDOW,
        );

        if (restored == null || restored.health <= target.health) {
          return;
        }

        spent.add(target);
        target.triggerAbility(Abilities.Rollback);

        target.heal(
          { type: EffectType.Ability, ability: Abilities.Rollback, unit: target },
          target,
          restored.health - target.health,
          0,
        );
      }),
      ...lifecycles,
    ]);
  }),

  // Omanyte: the shell learns the angle a blow comes in at, so the
  // same attacker gets less out of it each time
  createAbility(Abilities.SpiralShell, (battle) => {
    const { state, lifecycles } = createUnitState<Map<Unit, number>>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
        const parent = event.parent;
        const learned = state.get(parent.target)?.get(parent.source) ?? 0;

        if (
          learned > 0 &&
          event.unit === parent.source &&
          (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
          parent.target.hasAbility(Abilities.SpiralShell)
        ) {
          event.value *= Math.max(SPIRAL_SHELL_FLOOR, 1 - SPIRAL_SHELL_STEP * learned);
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const cause = event.cause;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !target.hasAbility(Abilities.SpiralShell)
        ) {
          return;
        }

        const learned = state.get(target) ?? new Map<Unit, number>();

        learned.set(cause.unit, (learned.get(cause.unit) ?? 0) + 1);
        state.set(target, learned);

        target.triggerAbility(Abilities.SpiralShell);
      }),
      ...lifecycles,
    ]);
  }),

  // Kabuto: the cut stays open, and it costs the cut one every time it
  // moves rather than on any clock of its own
  createAbility(Abilities.SerratedEdge, (battle) => {
    const bleeding = createTimedMarks(battle);
    const { state, lifecycles } = createUnitState<Unit>(battle);

    return new MergedLifecycle([
      ...bleeding.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          !event.target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.hasAbility(Abilities.SerratedEdge) ||
          !source.checkMoveContact(event.move, unitTarget(event.target))
        ) {
          return;
        }

        source.triggerAbility(Abilities.SerratedEdge);

        state.set(event.target, source);
        bleeding.mark(event.target, SERRATED_EDGE_DURATION);
      }),
      ...onUnitActs(battle, (unit) => {
        const cutter = state.get(unit);

        if (!cutter || !bleeding.has(unit)) {
          return;
        }

        cutter.damage(
          { type: EffectType.Ability, ability: Abilities.SerratedEdge, unit: cutter },
          unit,
          unit.checkStat(Stats.HP, 0) * SERRATED_EDGE_FRACTION,
          DamageFlags.Indirect,
        );
      }),
      ...lifecycles,
    ]);
  }),

  // Aerodactyl: the pass out of the sun is the dangerous one, and each
  // enemy only walks into it once
  createAbility(Abilities.PredatorsDive, (battle) => {
    const dived = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          event.unit === parent.source &&
          (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
          !dived.has(parent.target) &&
          parent.source.hasAbility(Abilities.PredatorsDive)
        ) {
          event.value *= PREDATORS_DIVE_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          event.source.hasAbility(Abilities.PredatorsDive)
        ) {
          dived.add(event.target);
        }
      }),
      // A fresh arrival has not been dived on yet
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          dived.delete(event.source);
        }
      }),
    ]);
  }),
];

export default eeveeToDragonite;
