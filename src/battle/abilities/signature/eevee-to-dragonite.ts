import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import type { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import {
  BATTLE_STATS,
  createFossilAbility,
  createStatExtremes,
  createUnitState,
  createWingbeatAbility,
  sideHolder,
} from './__create';

/** What the unspent half of a pokemon is worth */
export const LATENT_POTENTIAL_SCALE = 1.3;

/** How far back the snapshot reaches, and how often one is taken */
export const ROLLBACK_WINDOW = 4000;
export const ROLLBACK_SAMPLE = 1000;

/** The share of health that triggers the restore */
export const ROLLBACK_THRESHOLD = 1 / 2;

/** What the opening pass on each enemy is worth */
export const PREDATORS_DIVE_SCALE = 1.5;

/** What a full belly gives back, and what carrying it costs */
export const FULL_BELLY_HEAL_FRACTION = 1 / 16;
export const FULL_BELLY_CAST_SCALE = 1.25;

/** What its highest stat is worth, and what its lowest is left at */
export const GENETIC_APEX_HIGHEST_SCALE = 1.25;
export const GENETIC_APEX_LOWEST_SCALE = 0.8;

/** What a type it has already met takes off the next blow of that type */
export const ANCESTRAL_MEMORY_SCALE = 0.85;

/** What a pokemon looked like a moment ago */
interface Snapshot {
  age: number;
  health: number;
}

const eeveeToDragonite = [
  // Eevee: whatever it has least of is what has not been spent yet
  createAbility(Abilities.LatentPotential, (battle) => {
    const stats = createStatExtremes();

    return battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        stats.measuring() ||
        !BATTLE_STATS.includes(event.stat) ||
        !event.source.hasAbility(Abilities.LatentPotential)
      ) {
        return;
      }

      if (stats.extremes(event.source).lowest === event.stat) {
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

        for (const unit of getAbilityHolders(battle, Abilities.Rollback)) {
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

  // The two Kanto fossils: counterparts written on the same knob, the
  // shell raising its own defences and the blade cutting into another's
  createFossilAbility(Abilities.HelixShell, 'shell'),
  createFossilAbility(Abilities.DomeBlade, 'blade'),

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

  // Snorlax: it runs on what it ate, and carries it. The heal is paid
  // as it reaches for a move, since nothing here hangs on a clock
  createAbility(
    Abilities.FullBelly,
    (battle) =>
      new MergedLifecycle([
        ...onUnitActs(battle, (unit) => {
          if (!unit.hasAbility(Abilities.FullBelly)) {
            return;
          }

          unit.triggerAbility(Abilities.FullBelly);

          unit.heal(
            { type: EffectType.Ability, ability: Abilities.FullBelly, unit },
            unit,
            unit.checkStat(Stats.HP, 0) * FULL_BELLY_HEAL_FRACTION,
            0,
          );
        }),
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.FullBelly)) {
            event.duration *= FULL_BELLY_CAST_SCALE;
          }
        }),
      ]),
  ),

  // The three birds: one beat of the wings each as it takes the field,
  // in the stat that bird's own weather works on
  createWingbeatAbility(Abilities.Frostwing, Stages.Speed),
  createWingbeatAbility(Abilities.Stormwing, Stages.SpecialDefense),
  createWingbeatAbility(Abilities.Emberwing, Stages.Defense),

  // Dratini: the sky it calls up does not clear itself, and its own
  // side stands in it untouched
  createAbility(
    Abilities.SereneStorm,
    (battle) =>
      new MergedLifecycle([
        // Zero is how this engine spells weather that holds until
        // something replaces it
        battle.on(BattleEvents.CheckUnitWeatherDuration, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.SereneStorm)) {
            event.duration = 0;

            event.source.triggerAbility(Abilities.SereneStorm);
          }
        }),
        battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
          if (event.success && event.cause.type === EffectType.Weather) {
            if (sideHolder(battle, event.target, Abilities.SereneStorm)) {
              event.success = false;
            }
          }
        }),
      ]),
  ),

  // Mewtwo: built for one thing and left worse at everything else. The
  // deliberate opposite of what an Eevee has not spent yet
  createAbility(Abilities.GeneticApex, (battle) => {
    const stats = createStatExtremes();

    return battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        stats.measuring() ||
        !BATTLE_STATS.includes(event.stat) ||
        !event.source.hasAbility(Abilities.GeneticApex)
      ) {
        return;
      }

      const { highest, lowest } = stats.extremes(event.source);

      if (event.stat === highest) {
        event.value *= GENETIC_APEX_HIGHEST_SCALE;
      } else if (event.stat === lowest) {
        event.value *= GENETIC_APEX_LOWEST_SCALE;
      }
    });
  }),

  // Mew: it has been everything at some point, so a type it has already
  // met is a type it half remembers how to take
  createAbility(Abilities.AncestralMemory, (battle) => {
    const { state, lifecycles } = createUnitState<Set<Types>>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          event.unit === parent.source &&
          (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
          parent.target.hasAbility(Abilities.AncestralMemory) &&
          state.get(parent.target)?.has(parent.type) === true
        ) {
          event.value *= ANCESTRAL_MEMORY_SCALE;
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
          !target.hasAbility(Abilities.AncestralMemory)
        ) {
          return;
        }

        const met = state.get(target) ?? new Set<Types>();

        met.add(cause.unit.checkMoveType(cause.move, unitTarget(target)));
        state.set(target, met);

        target.triggerAbility(Abilities.AncestralMemory);
      }),
      ...lifecycles,
    ]);
  }),
];

export default eeveeToDragonite;
