import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState, isPhysicalMove } from './__create';

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
];

export default krabbyToPinsir;
