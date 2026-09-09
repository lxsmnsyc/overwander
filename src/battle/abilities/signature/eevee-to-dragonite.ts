import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import type { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { BATTLE_STATS, createStatExtremes, createTimedMarks, createUnitState } from './__create';

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

/** What a full belly gives back, and what carrying it costs */
export const FULL_BELLY_HEAL_FRACTION = 1 / 16;
export const FULL_BELLY_CAST_SCALE = 1.25;

/** What nothing rattling it takes off a status */
export const ABSOLUTE_CALM_STATUS_SCALE = 0.5;

/** The statuses that never take on a bird that cannot be rattled */
const ABSOLUTE_CALM_IMMUNE = new Set<Statuses>([
  Statuses.Flinched,
  Statuses.Confused,
  Statuses.Infatuated,
]);

/** What thinking faster than the storm takes off a wind-up */
export const LIGHTNING_REFLEXES_CAST_SCALE = 0.75;

/** The two things a bird that moves first is never caught by */
const LIGHTNING_REFLEXES_IMMUNE = new Set<Statuses>([Statuses.Paralyzed, Statuses.Flinched]);

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

  // Articuno: nothing rattles it, and what does land on it does not
  // stay. None of it reads its type, so the Galarian bird gets the same
  createAbility(
    Abilities.AbsoluteCalm,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            ABSOLUTE_CALM_IMMUNE.has(event.status) &&
            event.source.hasAbility(Abilities.AbsoluteCalm)
          ) {
            event.immune = true;

            event.source.triggerAbility(Abilities.AbsoluteCalm);
          }
        }),
        battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.AbsoluteCalm)) {
            event.duration *= ABSOLUTE_CALM_STATUS_SCALE;
          }
        }),
      ]),
  ),

  // Zapdos: it is already moving. Cast time rather than cooldown, which
  // is Speed's own business
  createAbility(
    Abilities.LightningReflexes,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.LightningReflexes)) {
            event.duration *= LIGHTNING_REFLEXES_CAST_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            LIGHTNING_REFLEXES_IMMUNE.has(event.status) &&
            event.source.hasAbility(Abilities.LightningReflexes)
          ) {
            event.immune = true;

            event.source.triggerAbility(Abilities.LightningReflexes);
          }
        }),
      ]),
  ),

  // Moltres: the fire does not go out with it. What it leaves on the far
  // side is Will-O-Wisp's, so the move's own roll decides what catches
  createAbility(Abilities.Ashfall, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const fallen = event.source;

      if (!fallen.hasAbility(Abilities.Ashfall)) {
        return;
      }

      fallen.triggerAbility(Abilities.Ashfall);

      for (const enemy of battle.units(fallen.team.alliance)) {
        if (enemy.alive) {
          fallen.triggerMove(Moves.WillOWisp, unitTarget(enemy), 0);
        }
      }
    }),
  ),

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
            for (const dragon of battle.units()) {
              if (
                dragon.alive &&
                dragon.team.alliance === event.target.team.alliance &&
                dragon.hasAbility(Abilities.SereneStorm)
              ) {
                event.success = false;
                return;
              }
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
