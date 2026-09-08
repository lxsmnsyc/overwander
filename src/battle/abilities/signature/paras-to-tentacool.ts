import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { hasAnyStatus, stealableItem } from '../../utils';
import { createAbility } from '../__create';

/** What one status landed is worth to the fungus */
export const FUNGAL_BLOOM_FRACTION = 1 / 8;

/** What one ailing enemy is worth to the moth */
export const DUST_STORM_STEP = 0.12;

/** How many of them it can read at once */
export const DUST_STORM_MAX_STACKS = 4;

/** What one pass underneath leaves the ground worth */
export const UNDERMINE_STEP = 0.05;

/** How far the ground can be dug out */
export const UNDERMINE_MAX_STACKS = 5;

/** What a headache at its worst is worth */
export const HEADACHE_BURST_SCALE = 1.5;

/** The share of health the headache peaks at */
export const HEADACHE_BURST_THRESHOLD = 1 / 2;

/** Whether the head is bad enough for the burst */
function isSplitting(unit: Unit): boolean {
  return unit.health <= unit.checkStat(Stats.HP, 0) * HEADACHE_BURST_THRESHOLD;
}

/** How many enemies are standing there ailing, up to what it can read */
function ailingEnemies(battle: Battle, unit: Unit): number {
  let count = 0;

  for (const enemy of battle.units(unit.team.alliance)) {
    if (enemy.alive && hasAnyStatus(enemy, MAJOR_STATUS_CONDITIONS)) {
      count += 1;
    }
  }

  return Math.min(DUST_STORM_MAX_STACKS, count);
}

const parasToTentacool = [
  // Paras: the mushroom is what fights, and what it puts on somebody
  // else is what feeds it
  createAbility(Abilities.FungalBloom, (battle) =>
    battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      const cause = event.cause;

      if (
        !MAJOR_STATUS_CONDITIONS.has(event.status) ||
        cause.type === EffectType.None ||
        cause.type === EffectType.Weather
      ) {
        return;
      }

      const holder = cause.unit;

      if (
        holder === event.source ||
        holder.team.alliance === event.source.team.alliance ||
        !holder.hasAbility(Abilities.FungalBloom)
      ) {
        return;
      }

      holder.triggerAbility(Abilities.FungalBloom);

      holder.heal(
        { type: EffectType.Ability, ability: Abilities.FungalBloom, unit: holder },
        holder,
        holder.checkStat(Stats.HP, 0) * FUNGAL_BLOOM_FRACTION,
        0,
      );
    }),
  ),

  // Venonat: the dust is only worth what it has already settled on, so
  // a field full of ailing enemies is what it fights best in
  createAbility(Abilities.DustStorm, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat !== Stats.SpecialAttack || !event.source.hasAbility(Abilities.DustStorm)) {
        return;
      }

      const ailing = ailingEnemies(battle, event.source);

      if (ailing > 0) {
        event.value *= 1 + DUST_STORM_STEP * ailing;
      }
    }),
  ),

  // Diglett: it takes the ground out from under a target rather than
  // hitting it harder, so what it digs is worth something to the whole
  // party. The workings stay dug for the rest of the fight
  createAbility(Abilities.Undermine, (battle) => {
    const dug = new Map<Unit, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const passes = dug.get(event.target) ?? 0;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          passes >= UNDERMINE_MAX_STACKS ||
          !source.hasAbility(Abilities.Undermine)
        ) {
          return;
        }

        dug.set(event.target, passes + 1);
        source.triggerAbility(Abilities.Undermine);
      }),
      battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
        const parent = event.parent;
        const passes = dug.get(parent.target) ?? 0;

        if (
          passes > 0 &&
          event.unit === parent.source &&
          (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack)
        ) {
          event.value *= 1 + UNDERMINE_STEP * passes;
        }
      }),
    ]);
  }),

  // Meowth: it works the pockets once each. The knock rides the same
  // path Knock Off takes, so an item that cannot be taken stays put
  createAbility(Abilities.Cutpurse, (battle) => {
    const picked = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          picked.has(target) ||
          !source.hasAbility(Abilities.Cutpurse)
        ) {
          return;
        }

        picked.add(target);

        const item = stealableItem(target);

        if (item == null) {
          return;
        }

        source.triggerAbility(Abilities.Cutpurse);

        target.removeItem(item, {
          type: EffectType.Ability,
          ability: Abilities.Cutpurse,
          unit: source,
        });
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          picked.delete(event.source);
        }
      }),
    ]);
  }),

  // Psyduck: the headache is the weapon, and it only comes on properly
  // once the duck is in a bad way
  createAbility(
    Abilities.HeadacheBurst,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (
            event.stat === Stats.SpecialAttack &&
            event.source.hasAbility(Abilities.HeadacheBurst) &&
            isSplitting(event.source)
          ) {
            event.value *= HEADACHE_BURST_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.accuracy != null &&
            event.source.hasAbility(Abilities.HeadacheBurst) &&
            isSplitting(event.source) &&
            event.source.checkMoveType(event.move, event.target) === Types.Psychic
          ) {
            event.accuracy = undefined;
          }
        }),
      ]),
  ),
];

export default parasToTentacool;
