import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { ItemTypes, type Items } from '../../../data/ids/items';
import { DamageFlags, MoveAttackFlags, MoveCategories, StatFlags } from '../../../data/ids/moves';
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

/** What the seed takes out of a mind each time that mind is used */
export const PSYSEED_FRACTION = 1 / 16;

/** What grief is worth to the last one standing */
export const MOURNING_BONE_SCALE = 1.4;

/** What getting up again is worth, and how far down it happens */
export const SECOND_WIND_HEAL_FRACTION = 1 / 3;
export const SECOND_WIND_THRESHOLD = 1 / 4;

/** What the smog costs an enemy trying to aim through it */
export const SMOG_SCREEN_ACCURACY_SCALE = 0.85;

/** What the horn is worth once it is through the guard */
export const DRILL_HORN_SCALE = 1.15;

/** The most one blow may take off a cushion */
export const CUSHIONED_CAP_FRACTION = 1 / 6;

/** What one more turn of growth is worth, and how long it grows for */
export const ENDLESS_GROWTH_STEP = 0.05;
export const ENDLESS_GROWTH_MAX_STACKS = 10;
export const ENDLESS_GROWTH_HEAL_FRACTION = 1 / 16;

/** The share of health that puts an ally behind her */
export const MOTHERS_SHIELD_THRESHOLD = 1 / 2;

/** What the current adds to a wind-up in the wet */
export const WHIRL_CURRENT_CAST_SCALE = 1.2;

/** What swimming against something bigger is worth */
export const UPSTREAM_SCALE = 1.35;

/** What the mimed screen turns aside, and what holding it costs */
export const MIMED_BARRIER_ALLY_SCALE = 0.85;
export const MIMED_BARRIER_SELF_SCALE = 1.15;

/** What a muddled head is worth to it */
export const ICY_CHARM_SCALE = 1.5;

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

  // Exeggcute: the seed goes into the mind rather than the ground, so
  // it is paid whenever that mind is used. The state is keyed on the
  // seeded enemy, which is what drops it when that enemy leaves or
  // falls
  createAbility(Abilities.Psyseed, (battle) => {
    const { state, lifecycles } = createUnitState<Unit>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;
        const source = event.source;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === event.target ||
          !source.hasAbility(Abilities.Psyseed) ||
          source.checkMoveType(cause.move, unitTarget(event.target)) !== Types.Psychic
        ) {
          return;
        }

        state.set(event.target, source);
      }),
      ...onUnitActs(battle, (unit) => {
        const seeder = state.get(unit);

        if (!seeder?.alive || !seeder.hasAbility(Abilities.Psyseed)) {
          return;
        }

        seeder.triggerAbility(Abilities.Psyseed);

        seeder.heal(
          { type: EffectType.Ability, ability: Abilities.Psyseed, unit: seeder },
          seeder,
          seeder.checkStat(Stats.HP, 0) * PSYSEED_FRACTION,
          0,
        );
      }),
      ...lifecycles,
    ]);
  }),

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
    Abilities.DrillHorn,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          if (
            event.power != null &&
            event.source.hasAbility(Abilities.DrillHorn) &&
            event.source.checkMoveContact(event.move, event.target)
          ) {
            event.power *= DRILL_HORN_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;
          const target = parent.target;

          if (
            event.unit !== target ||
            (event.stat !== Stats.Defense && event.stat !== Stats.SpecialDefense) ||
            !parent.source.hasAbility(Abilities.DrillHorn) ||
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

  // Tangela: it never stops putting out vines, so a fight it is left
  // alive in is a fight it wins. Nothing here has a clock: the growth
  // is paid as it reaches for a move
  createAbility(Abilities.EndlessGrowth, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        const grown = counter.get(event.source);

        if (
          grown > 0 &&
          event.stat === Stats.Defense &&
          event.source.hasAbility(Abilities.EndlessGrowth)
        ) {
          event.value *= 1 + ENDLESS_GROWTH_STEP * grown;
        }
      }),
      ...onUnitActs(battle, (unit) => {
        if (!unit.hasAbility(Abilities.EndlessGrowth)) {
          return;
        }

        const grown = counter.get(unit);

        if (grown < ENDLESS_GROWTH_MAX_STACKS) {
          counter.set(unit, grown + 1);
        }

        unit.triggerAbility(Abilities.EndlessGrowth);

        unit.heal(
          { type: EffectType.Ability, ability: Abilities.EndlessGrowth, unit },
          unit,
          unit.checkStat(Stats.HP, 0) * ENDLESS_GROWTH_HEAL_FRACTION,
          0,
        );
      }),
      ...lifecycles,
    ]);
  }),

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

  // Mr. Mime: it holds a screen up by hand. What it turns aside for the
  // party it cannot turn aside for itself
  createAbility(Abilities.MimedBarrier, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (event.unit !== parent.source) {
        return;
      }

      if (
        event.stat === Stats.Attack &&
        parent.category === MoveCategories.Physical &&
        target.hasAbility(Abilities.MimedBarrier)
      ) {
        event.value *= MIMED_BARRIER_SELF_SCALE;
        return;
      }

      if (event.stat !== Stats.SpecialAttack || parent.category !== MoveCategories.Special) {
        return;
      }

      for (const mime of battle.units()) {
        if (
          mime.alive &&
          mime.team.alliance === target.team.alliance &&
          mime.hasAbility(Abilities.MimedBarrier)
        ) {
          event.value *= MIMED_BARRIER_ALLY_SCALE;
          return;
        }
      }
    }),
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
];

export default krabbyToPinsir;
