import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';
import { createUnitCounter, createUnitState } from './__create';

/** What a settled score is worth against the one it is settled with */
export const SCORE_TO_SETTLE_SCALE = 1.3;

/** What each Electric move landed anywhere adds, and how many count */
export const TRICKLE_CHARGE_SHARE = 0.1;
export const TRICKLE_CHARGE_LIMIT = 5;

/**
 * The three the first roads out of Melemele's towns walk past: the
 * woodpecker that gets one more beat in, the mongoose that remembers
 * who hit it, and the grub that soaks up whatever current is going
 */
const setupAbilities = [
  // At Pre, so a Skill Link setting the count to the ceiling at Post
  // reads the ceiling this one has already raised
  createAbility(Abilities.Drumroll, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveHits, EventPriority.Pre, (event) => {
      if (event.max > 1 && event.source.hasAbility(Abilities.Drumroll)) {
        event.hits += 1;
        event.max += 1;
      }
    }),
  ),

  createAbility(Abilities.ScoreToSettle, (battle) => {
    // Kept on the holder, so the grudge goes when the holder falls or
    // comes back in fresh
    const { state, lifecycles } = createUnitState<Unit>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const holder = event.target;
        const attacker = event.source;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          attacker.team.alliance === holder.team.alliance ||
          !holder.hasAbility(Abilities.ScoreToSettle)
        ) {
          return;
        }
        if (state.get(holder) !== attacker) {
          state.set(holder, attacker);
          holder.triggerAbility(Abilities.ScoreToSettle);
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.power != null &&
          target.type === MoveTargetType.Unit &&
          event.source.hasAbility(Abilities.ScoreToSettle) &&
          state.get(event.source) === target.unit
        ) {
          event.power *= SCORE_TO_SETTLE_SCALE;
        }
      }),
    ]);
  }),

  createAbility(Abilities.TrickleCharge, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      ...lifecycles,
      // The same current Static Feed drinks: any Electric move that
      // lands on anybody, whoever threw it
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit.checkMoveType(cause.move, {
            type: MoveTargetType.Unit,
            unit: event.target,
          }) !== Types.Electric
        ) {
          return;
        }

        for (const unit of battle.units()) {
          const charge = counter.get(unit);

          if (
            unit.alive &&
            charge < TRICKLE_CHARGE_LIMIT &&
            unit.hasAbility(Abilities.TrickleCharge)
          ) {
            counter.set(unit, charge + 1);
            unit.triggerAbility(Abilities.TrickleCharge);
          }
        }
      }),
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (
          event.stat === Stats.SpecialAttack &&
          event.source.hasAbility(Abilities.TrickleCharge)
        ) {
          event.value *= 1 + counter.get(event.source) * TRICKLE_CHARGE_SHARE;
        }
      }),
    ]);
  }),
];

export default setupAbilities;
