import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { ItemTypes, type Items } from '../../../data/ids/items';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  Moves,
  StatFlags,
} from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BERRY_HEALS, BERRY_STATUS_CURES } from '../../../data/items/berries';
import { listItemsByType } from '../../../data/items';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { isWeatherRainy, onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitCounter, createUnitState, isPhysicalMove } from './__create';

/** What a claw with strength behind it is worth */
export const HEAVY_PINCER_SCALE = 1.45;

/** The share of health the claw needs to close properly */
export const HEAVY_PINCER_THRESHOLD = 1 / 2;

/** What a sphere running hot is worth, and how hurt it has to be */
export const OVERLOAD_SPEED_SCALE = 2;
export const OVERLOAD_THRESHOLD = 1 / 2;

/** What grief is worth to the last one standing */
export const MOURNING_BONE_SCALE = 1.4;

/** What getting up again is worth, and how far down it happens */
export const SECOND_WIND_HEAL_FRACTION = 1 / 3;
export const SECOND_WIND_THRESHOLD = 1 / 4;

/** What the smog costs an enemy trying to aim through it */
export const SMOG_SCREEN_ACCURACY_SCALE = 0.85;

/** What the horn is worth once it is through the guard */
export const CORKSCREW_SCALE = 1.15;

/** The most one blow may take off a cushion */
export const CUSHIONED_CAP_FRACTION = 1 / 6;

/** The share of health that puts an ally behind her */
export const MOTHERS_SHIELD_THRESHOLD = 1 / 2;

/** What the current adds to a wind-up in the wet */
export const WHIRL_CURRENT_CAST_SCALE = 1.2;

/** What swimming against something bigger is worth */
export const UPSTREAM_SCALE = 1.35;

/** What holding a screen up by hand costs the one holding it */
export const MIMED_BARRIER_SELF_SCALE = 1.15;

/** What a muddled head is worth to it */
export const ICY_CHARM_SCALE = 1.5;

/** What one touch charges it by, and how much charge it holds */
export const STATIC_FIELD_STEP = 0.15;
export const STATIC_FIELD_MAX_STACKS = 4;

/** How often what it throws sets the target alight */
export const BLAST_FURNACE_CHANCE = 0.3;

/** What catching something mid-swing is worth */
export const SNAPJAW_SCALE = 1.5;

/** What each stretch of the fight adds, how long a stretch is, and the ceiling */
export const LATE_BLOOMER_STEP = 0.05;
export const LATE_BLOOMER_INTERVAL = 10000;
export const LATE_BLOOMER_MAX_STACKS = 10;

/** What a shape it has already worn takes off the next blow like it */
export const ADAPTIVE_CELL_SCALE = 0.5;

/** What fighting with no guard is worth, and what it costs */
export const BULLHEADED_POWER_SCALE = 1.3;
export const BULLHEADED_EXPOSED_SCALE = 1.15;

/** The stat stages a core rights itself in, in the order it tries them */
const CORE_RESET_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/** The berry the target is holding, if it is holding one */
function heldBerry(unit: Unit): Items | undefined {
  for (const item of listItemsByType(ItemTypes.Berry)) {
    if (unit.items[item] != null) {
      return item;
    }
  }

  return undefined;
}

/** Whether a ferry is standing on this unit's side */
function carriedBy(battle: Battle, unit: Unit): boolean {
  for (const ferry of battle.units()) {
    if (
      ferry.alive &&
      ferry.team.alliance === unit.team.alliance &&
      ferry.hasAbility(Abilities.SafePassage)
    ) {
      return true;
    }
  }

  return false;
}

/** Whether anybody else on its side is still standing */
function fightsAlone(battle: Battle, unit: Unit): boolean {
  for (const ally of battle.units()) {
    if (ally !== unit && ally.alive && ally.team.alliance === unit.team.alliance) {
      return false;
    }
  }

  return true;
}

const krabbyToPinsir = [
  // Krabby: the claw is only worth anything while there is strength
  // behind it, so the line is front-loaded on purpose
  createAbility(Abilities.HeavyPincer, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        event.power != null &&
        isPhysicalMove(event.move) &&
        source.hasAbility(Abilities.HeavyPincer) &&
        source.health >= source.checkStat(Stats.HP, 0) * HEAVY_PINCER_THRESHOLD
      ) {
        event.power *= HEAVY_PINCER_SCALE;
      }
    }),
  ),

  // Voltorb: the closer it is to going off, the faster it rolls
  createAbility(Abilities.Overload, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        event.stat === Stats.Speed &&
        source.hasAbility(Abilities.Overload) &&
        source.health < source.checkStat(Stats.HP, 0) * OVERLOAD_THRESHOLD
      ) {
        event.value *= OVERLOAD_SPEED_SCALE;
      }
    }),
  ),

  // Exeggcute: the seed goes into the mind, and what a seed does to
  // whoever carries it is Leech Seed's business
  createAbility(Abilities.Psyseed, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const cause = event.cause;
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        event.flags & DamageFlags.Indirect ||
        cause.type !== EffectType.Move ||
        cause.unit === target ||
        !source.hasAbility(Abilities.Psyseed) ||
        source.checkMoveType(cause.move, unitTarget(target)) !== Types.Psychic
      ) {
        return;
      }

      source.triggerAbility(Abilities.Psyseed);
      source.triggerMove(Moves.LeechSeed, unitTarget(target), 0);
    }),
  ),

  // Cubone: it fights hardest with nobody left beside it, which is the
  // whole of what the line is about
  createAbility(Abilities.MourningBone, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(Abilities.MourningBone) &&
        fightsAlone(battle, event.source)
      ) {
        event.power *= MOURNING_BONE_SCALE;
      }
    }),
  ),

  // Tyrogue: a fighter gets up once. Kept per unit for the whole fight
  // rather than per arrival, so leaving and coming back is not a second
  // wind
  createAbility(Abilities.SecondWind, (battle) => {
    const spent = new Set<Unit>();

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        spent.has(target) ||
        !target.hasAbility(Abilities.SecondWind)
      ) {
        return;
      }

      const maxHP = target.checkStat(Stats.HP, 0);

      if (target.health >= maxHP * SECOND_WIND_THRESHOLD) {
        return;
      }

      spent.add(target);
      target.triggerAbility(Abilities.SecondWind);

      target.heal(
        { type: EffectType.Ability, ability: Abilities.SecondWind, unit: target },
        target,
        maxHP * SECOND_WIND_HEAL_FRACTION,
        0,
      );
    });
  }),

  // Lickitung: it tastes what it licks. Only the two things a berry
  // does out of context are honoured: the heal and the cure
  createAbility(Abilities.TasteEverything, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        event.flags & MoveAttackFlags.Simulated ||
        !source.hasAbility(Abilities.TasteEverything) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      const berry = heldBerry(target);

      if (berry == null) {
        return;
      }

      const cause = {
        type: EffectType.Ability,
        ability: Abilities.TasteEverything,
        unit: source,
      } as const;

      source.triggerAbility(Abilities.TasteEverything);
      target.removeItem(berry, cause);

      const restores = BERRY_HEALS.get(berry);

      if (restores) {
        source.heal(cause, source, restores.heal(source.checkStat(Stats.HP, 0)), 0);
      }

      for (const status of BERRY_STATUS_CURES.get(berry) ?? []) {
        if (source.status[status] != null) {
          source.removeStatus(status, cause);
        }
      }
    }),
  ),

  // Koffing: the gas hangs over the whole far side. Its own side is
  // used to the smell
  createAbility(Abilities.SmogScreen, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
      if (event.accuracy == null) {
        return;
      }

      const source = event.source;

      for (const cloud of battle.units(source.team.alliance)) {
        if (cloud.alive && cloud.hasAbility(Abilities.SmogScreen)) {
          event.accuracy *= SMOG_SCREEN_ACCURACY_SCALE;
          return;
        }
      }
    }),
  ),

  // Rhyhorn: the horn goes through whatever the target has put up, so
  // the defending stat is read the way a critical hit reads it
  createAbility(
    Abilities.Corkscrew,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          if (
            event.power != null &&
            event.source.hasAbility(Abilities.Corkscrew) &&
            event.source.checkMoveContact(event.move, event.target)
          ) {
            event.power *= CORKSCREW_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;
          const target = parent.target;

          if (
            event.unit !== target ||
            (event.stat !== Stats.Defense && event.stat !== Stats.SpecialDefense) ||
            !parent.source.hasAbility(Abilities.Corkscrew) ||
            !parent.source.checkMoveContact(parent.move, unitTarget(target))
          ) {
            return;
          }

          // The critical flag is what ignores a raised defence, so the
          // stat is asked for again with it rather than scaled by hand
          event.value = target.resolveStat(event.stat, StatFlags.Attack | StatFlags.Critical);
        }),
      ]),
  ),

  // Chansey: all that health finally counts for something. A cap rather
  // than a reduction, so burst cannot get through and a grind still can
  createAbility(Abilities.Cushioned, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const target = event.target;

      if (!target.hasAbility(Abilities.Cushioned)) {
        return;
      }

      const cap = target.checkStat(Stats.HP, 0) * CUSHIONED_CAP_FRACTION;

      if (event.value > cap) {
        event.value = cap;

        target.triggerAbility(Abilities.Cushioned);
      }
    }),
  ),

  // Tangela: the vines are laid rather than swung, which is what Spikes
  // already is. Each arrival lays another layer, up to the move's own
  // ceiling
  createAbility(
    Abilities.VineWeb,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.VineWeb)) {
            event.source.triggerAbility(Abilities.VineWeb);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.VineWeb) {
            return;
          }

          for (const enemy of battle.units(event.source.team.alliance)) {
            if (enemy.alive) {
              event.source.triggerMove(
                Moves.Spikes,
                { type: MoveTargetType.Team, team: enemy.team },
                0,
              );
              return;
            }
          }
        }),
      ]),
  ),

  // Kangaskhan: she steps in front of whoever is hurt. The same
  // retargeting a Lightning Rod does, read off health rather than type
  createAbility(Abilities.MothersShield, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
      if (event.target.type !== MoveTargetType.Unit) {
        return;
      }

      const aimedAt = event.target.unit;

      if (
        aimedAt.team.alliance === event.source.team.alliance ||
        aimedAt.hasAbility(Abilities.MothersShield) ||
        aimedAt.health >= aimedAt.checkStat(Stats.HP, 0) * MOTHERS_SHIELD_THRESHOLD
      ) {
        return;
      }

      for (const mother of battle.units()) {
        if (
          mother.alive &&
          mother !== event.source &&
          mother.team.alliance === aimedAt.team.alliance &&
          mother.hasAbility(Abilities.MothersShield)
        ) {
          event.target = { type: MoveTargetType.Unit, unit: mother };

          mother.triggerAbility(Abilities.MothersShield);
          return;
        }
      }
    }),
  ),

  // Horsea: it stirs the water against whoever is standing in it, so
  // the rain its own line calls up works for it twice
  createAbility(Abilities.WhirlCurrent, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      const source = event.source;

      if (!isWeatherRainy(source)) {
        return;
      }

      for (const swirl of battle.units(source.team.alliance)) {
        if (swirl.alive && swirl.hasAbility(Abilities.WhirlCurrent)) {
          event.duration *= WHIRL_CURRENT_CAST_SCALE;
          return;
        }
      }
    }),
  ),

  // Goldeen: it spends its life swimming against the current, so what
  // it fights best is whatever is bigger than it
  createAbility(Abilities.Upstream, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const source = parent.source;

      if (
        event.unit === source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        source.hasAbility(Abilities.Upstream) &&
        parent.target.checkStat(Stats.HP, 0) > source.checkStat(Stats.HP, 0)
      ) {
        event.value *= UPSTREAM_SCALE;
      }
    }),
  ),

  // Staryu: the core rights itself as it turns, one drop at a time, so
  // wearing it down has to be done again and again
  createAbility(
    Abilities.CoreReset,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (!unit.hasAbility(Abilities.CoreReset)) {
            return;
          }

          for (const stage of CORE_RESET_STAGES) {
            if (unit.stages[stage] < 0) {
              unit.triggerAbility(Abilities.CoreReset);

              unit.addStage(stage, 1, {
                type: EffectType.Ability,
                ability: Abilities.CoreReset,
                unit,
              });

              return;
            }
          }
        }),
      ),
  ),

  // Mr. Mime: the screen it holds up is Light Screen. What it turns
  // aside for the party it cannot turn aside for itself
  createAbility(
    Abilities.MimedBarrier,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.MimedBarrier)) {
            event.source.triggerAbility(Abilities.MimedBarrier);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.MimedBarrier) {
            event.source.triggerMove(
              Moves.LightScreen,
              { type: MoveTargetType.Team, team: event.source.team },
              0,
            );
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.unit === parent.source &&
            event.stat === Stats.Attack &&
            parent.category === MoveCategories.Physical &&
            parent.target.hasAbility(Abilities.MimedBarrier)
          ) {
            event.value *= MIMED_BARRIER_SELF_SCALE;
          }
        }),
      ]),
  ),

  // Scyther: a cut that lands properly goes through everything the
  // target has put up, and everything it was born with
  createAbility(Abilities.CleanCut, (battle) => {
    // Whether the blow in flight is a critical. The resolver settles
    // that before it asks for either stat, so the answer is waiting
    const critical = new WeakMap<object, boolean>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
        if (event.critical && event.parent.source.hasAbility(Abilities.CleanCut)) {
          critical.set(event.parent, true);

          event.parent.source.triggerAbility(Abilities.CleanCut);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          event.unit === parent.target &&
          (event.stat === Stats.Defense || event.stat === Stats.SpecialDefense) &&
          critical.get(parent) === true
        ) {
          // The bare stat, with no stage of any sign left on it
          event.value = parent.target.checkStat(event.stat, 0);
        }
      }),
    ]);
  }),

  // Jynx: it works on a head that is already turned
  createAbility(Abilities.IcyCharm, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (
        event.unit === parent.source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        parent.source.hasAbility(Abilities.IcyCharm) &&
        (target.status[Statuses.Infatuated] != null || target.status[Statuses.Confused] != null)
      ) {
        event.value *= ICY_CHARM_SCALE;
      }
    }),
  ),

  // Electabuzz: it takes the charge out of whatever touches it, so a
  // fight fought close is a fight it gets faster in
  createAbility(Abilities.StaticField, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        const charge = counter.get(event.source);

        if (
          charge > 0 &&
          event.stat === Stats.Speed &&
          event.source.hasAbility(Abilities.StaticField)
        ) {
          event.value *= 1 + STATIC_FIELD_STEP * charge;
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const cause = event.cause;
        const charge = counter.get(target);

        if (
          !event.success ||
          !target.alive ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          charge >= STATIC_FIELD_MAX_STACKS ||
          !target.hasAbility(Abilities.StaticField) ||
          !cause.unit.checkMoveContact(cause.move, unitTarget(target))
        ) {
          return;
        }

        counter.set(target, charge + 1);
        target.triggerAbility(Abilities.StaticField);
      }),
      ...lifecycles,
    ]);
  }),

  // Magmar: everything it throws is still on fire when it lands
  createAbility(Abilities.BlastFurnace, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        !event.target.alive ||
        event.flags & MoveAttackFlags.Simulated ||
        !source.hasAbility(Abilities.BlastFurnace) ||
        source.checkMoveType(event.move, unitTarget(event.target)) !== Types.Fire ||
        battle.random() >= BLAST_FURNACE_CHANCE
      ) {
        return;
      }

      source.triggerAbility(Abilities.BlastFurnace);

      event.target.addStatus(Statuses.Burned, {
        type: EffectType.Ability,
        ability: Abilities.BlastFurnace,
        unit: source,
      });
    }),
  ),

  // Pinsir: it catches things mid-swing, which is a real-time reward
  // for reading what the enemy is winding up
  createAbility(Abilities.Snapjaw, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (
        event.unit === parent.source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        parent.source.hasAbility(Abilities.Snapjaw) &&
        (target.casting != null || target.channeling != null)
      ) {
        event.value *= SNAPJAW_SCALE;
      }
    }),
  ),

  // Tauros: it fights with no guard at all, which reads the same on a
  // bull of any breed
  createAbility(
    Abilities.Bullheaded,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          if (
            event.power != null &&
            event.source.hasAbility(Abilities.Bullheaded) &&
            event.source.checkMoveContact(event.move, event.target)
          ) {
            event.power *= BULLHEADED_POWER_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.unit === parent.source &&
            (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
            parent.target.hasAbility(Abilities.Bullheaded)
          ) {
            event.value *= BULLHEADED_EXPOSED_SCALE;
          }
        }),
      ]),
  ),

  // Magikarp: it is worth nothing early and everything late, counted
  // from when it arrived rather than from the first bell
  createAbility(Abilities.LateBloomer, (battle) => {
    let elapsed = 0;

    return new MergedLifecycle([
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        elapsed += event.duration;
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const grown = Math.min(
          LATE_BLOOMER_MAX_STACKS,
          Math.floor(elapsed / LATE_BLOOMER_INTERVAL),
        );

        if (event.power != null && grown > 0 && event.source.hasAbility(Abilities.LateBloomer)) {
          event.power *= 1 + LATE_BLOOMER_STEP * grown;
        }
      }),
    ]);
  }),

  // Lapras: it carries the party through, which is Safeguard's job. The
  // escape answer runs after every other one, since restoring a refusal
  // is only meaningful once the refusals have been made
  createAbility(
    Abilities.SafePassage,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.SafePassage)) {
            event.source.triggerAbility(Abilities.SafePassage);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.SafePassage) {
            event.source.triggerMove(
              Moves.Safeguard,
              { type: MoveTargetType.Team, team: event.source.team },
              0,
            );
          }
        }),
        battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
          if (!event.success && carriedBy(battle, event.source)) {
            event.success = true;
          }
        }),
      ]),
  ),

  // Ditto: it takes the shape of whatever hit it last, so the same blow
  // twice is worth half the second time
  createAbility(Abilities.AdaptiveCell, (battle) => {
    const { state, lifecycles } = createUnitState<Types>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;
        const target = event.target;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !target.hasAbility(Abilities.AdaptiveCell)
        ) {
          return;
        }

        target.triggerAbility(Abilities.AdaptiveCell);

        state.set(target, cause.unit.checkMoveType(cause.move, unitTarget(target)));
      }),
      battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          event.unit === parent.source &&
          (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
          parent.target.hasAbility(Abilities.AdaptiveCell) &&
          state.get(parent.target) === parent.type
        ) {
          event.value *= ADAPTIVE_CELL_SCALE;
        }
      }),
      ...lifecycles,
    ]);
  }),
];

export default krabbyToPinsir;
