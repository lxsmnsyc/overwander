import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { hasAnyStatus, stealableItem, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createNextCastPenalty } from './__create';

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

/** What blind rage is worth, and what it costs in aim */
export const BLIND_RAGE_ATTACK_SCALE = 1.4;
export const BLIND_RAGE_ACCURACY_SCALE = 0.85;

/** What a target already going down is worth to the chase */
export const CHASE_DOWN_SCALE = 1.5;

/** The share of health that marks a target as quarry */
export const CHASE_DOWN_THRESHOLD = 1 / 3;

/** What the spiral adds to the next thing an attacker reaches for */
export const HYPNOTIC_SPIRAL_CAST_SCALE = 1.3;

/** How long it takes to gather itself for another blink */
export const TELEPORT_GUARD_WINDOW = 10000;

/** What a throw is worth against something bigger, and something smaller */
export const OVERHEAD_THROW_HEAVY_SCALE = 1.4;
export const OVERHEAD_THROW_LIGHT_SCALE = 1.1;

/** What a swallowed meal is worth, and how far gone it has to be */
export const DIGEST_HEAL_FRACTION = 1 / 4;
export const DIGEST_THRESHOLD = 1 / 4;

/** Whether the target is far enough gone to be run down */
function isQuarry(unit: Unit): boolean {
  return unit.health <= unit.checkStat(Stats.HP, 0) * CHASE_DOWN_THRESHOLD;
}

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

  // Mankey: it fights past sense. The aim goes, the healing stops, and
  // what is left is the swing. Annihilape's rage, written early
  createAbility(
    Abilities.BlindRage,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (event.stat === Stats.Attack && event.source.hasAbility(Abilities.BlindRage)) {
            event.value *= BLIND_RAGE_ATTACK_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (event.accuracy != null && event.source.hasAbility(Abilities.BlindRage)) {
            event.accuracy *= BLIND_RAGE_ACCURACY_SCALE;
          }
        }),
        // Refused rather than reduced: rage is a wound that will not
        // close, whoever offers to close it
        battle.on(BattleEvents.CheckUnitCanHeal, EventPriority.Post, (event) => {
          if (event.success && event.target.hasAbility(Abilities.BlindRage)) {
            event.success = false;

            event.target.triggerAbility(Abilities.BlindRage);
          }
        }),
      ]),
  ),

  // Growlithe: a hunting dog finishes what runs. Below a third it is
  // quarry, and quarry does not get to leave
  createAbility(
    Abilities.ChaseDown,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.unit === parent.source &&
            (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
            parent.source.hasAbility(Abilities.ChaseDown) &&
            isQuarry(parent.target)
          ) {
            event.value *= CHASE_DOWN_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
          const source = event.source;

          if (!event.success || !isQuarry(source)) {
            return;
          }

          for (const hunter of battle.units(source.team.alliance)) {
            if (hunter.alive && hunter.hasAbility(Abilities.ChaseDown)) {
              event.success = false;

              // Every holder reacts, not just the first
              hunter.triggerAbility(Abilities.ChaseDown);
            }
          }
        }),
      ]),
  ),

  // Poliwag: the spiral on its belly catches whoever comes close, so
  // the next thing they reach for comes slower
  createAbility(Abilities.HypnoticSpiral, (battle) => {
    const spiral = createNextCastPenalty(battle, HYPNOTIC_SPIRAL_CAST_SCALE);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const cause = event.cause;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !target.hasAbility(Abilities.HypnoticSpiral) ||
          !cause.unit.checkMoveContact(cause.move, unitTarget(target))
        ) {
          return;
        }

        target.triggerAbility(Abilities.HypnoticSpiral);

        spiral.mark(cause.unit);
      }),
      ...spiral.lifecycles,
    ]);
  }),

  // Abra: it is not there when the blow arrives. One blink, then it
  // has to gather itself again
  createAbility(Abilities.TeleportGuard, (battle) => {
    const gathering = new Map<Unit, number>();

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      const ready: Unit[] = [];

      for (const [unit, left] of gathering) {
        const next = left - event.duration;

        if (next <= 0) {
          ready.push(unit);
        } else {
          gathering.set(unit, next);
        }
      }

      for (const unit of ready) {
        gathering.delete(unit);
      }

      if (gathering.size === 0) {
        clock.stop();
      }
    });

    clock.stop();

    return new MergedLifecycle([
      clock,
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (parent.target.type !== MoveTargetType.Unit) {
          return;
        }

        const target = parent.target.unit;

        if (
          !event.hit ||
          target === parent.source ||
          gathering.has(target) ||
          !target.hasAbility(Abilities.TeleportGuard)
        ) {
          return;
        }

        event.hit = false;

        gathering.set(target, TELEPORT_GUARD_WINDOW);
        clock.start();

        target.triggerAbility(Abilities.TeleportGuard);
      }),
    ]);
  }),

  // Machop: it fights by picking things up, so the bigger the thing
  // the better the throw
  createAbility(Abilities.OverheadThrow, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const source = parent.source;

      if (
        event.unit !== source ||
        (event.stat !== Stats.Attack && event.stat !== Stats.SpecialAttack) ||
        !source.hasAbility(Abilities.OverheadThrow) ||
        !source.checkMoveContact(parent.move, unitTarget(parent.target))
      ) {
        return;
      }

      event.value *=
        parent.target.checkWeight() > source.checkWeight()
          ? OVERHEAD_THROW_HEAVY_SCALE
          : OVERHEAD_THROW_LIGHT_SCALE;
    }),
  ),

  // Bellsprout: it swallows what is nearly finished, the kill included,
  // so the reading is taken once the blow has landed
  createAbility(Abilities.Digest, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        event.flags & MoveAttackFlags.Simulated ||
        target.health > target.checkStat(Stats.HP, 0) * DIGEST_THRESHOLD ||
        !source.hasAbility(Abilities.Digest)
      ) {
        return;
      }

      source.triggerAbility(Abilities.Digest);

      source.heal(
        { type: EffectType.Ability, ability: Abilities.Digest, unit: source },
        source,
        source.checkStat(Stats.HP, 0) * DIGEST_HEAL_FRACTION,
        0,
      );
    }),
  ),

  // Tentacool: eighty tentacles and no clock on them. What it has once
  // touched stays in the water with it
  createAbility(Abilities.TentacleGrasp, (battle) => {
    const held = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          event.source.hasAbility(Abilities.TentacleGrasp)
        ) {
          held.add(event.target);
        }
      }),
      battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
        const source = event.source;

        if (!event.success || !held.has(source)) {
          return;
        }

        for (const jelly of battle.units(source.team.alliance)) {
          if (jelly.alive && jelly.hasAbility(Abilities.TentacleGrasp)) {
            event.success = false;

            // Every holder reacts, not just the first
            jelly.triggerAbility(Abilities.TentacleGrasp);
          }
        }
      }),
    ]);
  }),
];

export default parasToTentacool;
