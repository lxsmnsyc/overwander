import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories } from '../../../data/ids/moves';
import { Species } from '../../../data/ids/species';
import { Statuses } from '../../../data/ids/status';
import { isKickMove } from '../../../data/moves/kicks';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';

/** What a lone Wishiwashi heals each time it acts */
export const REGROUP_HEAL_FRACTION = 1 / 8;

/** How much each kilogram of its own weight adds to a physical move */
export const HEAVY_HOOVES_PER_KG = 1 / 2000;

/** The most its weight is ever worth */
export const HEAVY_HOOVES_CAP = 1.4;

/** What a Fire move keeps of itself against a bubbled teammate */
export const BUBBLE_WARD_SCALE = 0.75;

/** What the first attack out of the flower is worth */
export const ORCHID_GUISE_SCALE = 1.3;

/** What a kick is worth to it */
export const TROP_STRIDE_SCALE = 1.3;

/** Whether a standing Bubble Ward holder other than this unit is on its team */
function bubbled(unit: Unit): boolean {
  for (const holder of getAbilityHolders(unit.battle, Abilities.BubbleWard)) {
    if (
      holder !== unit &&
      holder.alive &&
      holder.team === unit.team &&
      holder.hasAbility(Abilities.BubbleWard)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Akala's first roads and Brooklet Hill: the fish that heals until its
 * school can gather again, the horse that puts its weight behind a
 * blow, the spider that shares its bubble, the mantis that passes for
 * a flower, and the fruit that kicks
 */
const setupAbilities = [
  createAbility(
    Abilities.Regroup,
    (battle) =>
      new MergedLifecycle([
        ...onUnitActs(battle, (unit) => {
          if (
            unit.species !== Species.Wishiwashi ||
            !unit.hasAbility(Abilities.Regroup) ||
            unit.health >= unit.checkStat(Stats.HP, 0)
          ) {
            return;
          }
          unit.triggerAbility(Abilities.Regroup);
          unit.heal(
            { type: EffectType.Ability, ability: Abilities.Regroup, unit },
            unit,
            unit.checkStat(Stats.HP, 0) * REGROUP_HEAL_FRACTION,
            0,
          );
        }),
      ]),
  ),

  // Mudbray: read off its own weight rather than the target's, so the
  // horse is worth more than the foal
  createAbility(Abilities.HeavyHooves, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const source = parent.source;

      if (
        event.unit === source &&
        event.stat === Stats.Attack &&
        parent.category === MoveCategories.Physical &&
        source.hasAbility(Abilities.HeavyHooves)
      ) {
        event.value *= Math.min(1 + source.checkWeight() * HEAVY_HOOVES_PER_KG, HEAVY_HOOVES_CAP);
      }
    }),
  ),

  // Dewpider: the bubble's guard shared with its own team, never the
  // whole alliance, and not with itself, which Water Bubble covers
  createAbility(
    Abilities.BubbleWard,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.value > 0 &&
            parent.type === Types.Fire &&
            !(parent.flags & MoveAttackFlags.Simulated) &&
            bubbled(parent.target)
          ) {
            event.value *= BUBBLE_WARD_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (!event.immune && event.status === Statuses.Burned && bubbled(event.source)) {
            event.immune = true;
          }
        }),
      ]),
  ),

  // Fomantis: a flower nobody aims at until the first attack gives it
  // away, which lands the harder for it. Once a fight, not once a visit
  createAbility(Abilities.OrchidGuise, (battle) => {
    const revealed = new Set<Unit>();

    function hidden(unit: Unit, from: Unit): boolean {
      return (
        unit !== from &&
        unit.team.alliance !== from.team.alliance &&
        !revealed.has(unit) &&
        unit.hasAbility(Abilities.OrchidGuise)
      );
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          !event.immune &&
          target.type === MoveTargetType.Unit &&
          hidden(target.unit, event.source)
        ) {
          event.immune = true;
        }
      }),
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          event.usable &&
          target.type === MoveTargetType.Unit &&
          hidden(target.unit, event.source)
        ) {
          event.usable = false;
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;
        const source = parent.source;

        if (
          event.value > 0 &&
          !(parent.flags & MoveAttackFlags.Simulated) &&
          !revealed.has(source) &&
          source.hasAbility(Abilities.OrchidGuise)
        ) {
          revealed.add(source);
          source.triggerAbility(Abilities.OrchidGuise);
          event.value *= ORCHID_GUISE_SCALE;
        }
      }),
    ]);
  }),

  // Bounsweet: the queen's legs, which is where a Tsareena's power is
  createAbility(Abilities.TropStride, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        isKickMove(event.move) &&
        event.source.hasAbility(Abilities.TropStride)
      ) {
        event.power *= TROP_STRIDE_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
