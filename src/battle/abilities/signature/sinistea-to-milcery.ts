import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { type Lifecycle, MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { fieldHasAbility, isPseudoMove, worstHurtMate } from './__create';

/** What a stat raised under Hatenna's glare costs the raiser */
export const SILENT_WRATH_FRACTION = 1 / 8;

/** What each enemy stage lost feeds Impidimp */
export const DESPAIR_FEAST_FRACTION = 1 / 8;

/** The holders standing on the field, kept as they come and go */
function trackHolders(battle: Battle, ability: Abilities, holders: Set<Unit>): Lifecycle[] {
  return [
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      if (event.source.hasAbility(ability)) {
        holders.add(event.source);
      }
    }),
    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      holders.delete(event.source);
    }),
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      holders.delete(event.source);
    }),
    battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
      if (event.ability === ability) {
        holders.delete(event.source);
      }
    }),
  ];
}

/**
 * Glimwood Tangle: the teacup that pours itself out for its team, the
 * two that read and feed on a mood and cancel each other out, and the
 * cream that frosts whatever it hands a teammate
 */
const setupAbilities = [
  // Sinistea: the last of the tea goes to whoever needs it, which is
  // Healing Wish's business. Nothing is left to pay for it with
  createAbility(Abilities.LastPour, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const source = event.source;

      if (!source.hasAbility(Abilities.LastPour)) {
        return;
      }

      const mate = worstHurtMate(source);

      if (mate == null) {
        return;
      }

      source.triggerAbility(Abilities.LastPour);
      source.triggerMove(Moves.HealingWish, unitTarget(mate), 0);
    }),
  ),

  // Hatenna: it cannot stand a mood rising near it, and makes the
  // enemy pay for each one. Impidimp feeding on the mood drowns it out
  createAbility(Abilities.SilentWrath, (battle) => {
    const holders = new Set<Unit>();

    return new MergedLifecycle([
      ...trackHolders(battle, Abilities.SilentWrath, holders),
      battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
        const raiser = event.source;
        const cause = event.cause;

        if (
          event.value <= 0 ||
          holders.size === 0 ||
          !raiser.alive ||
          cause.type === EffectType.None ||
          cause.unit !== raiser ||
          fieldHasAbility(battle, Abilities.DespairFeast)
        ) {
          return;
        }

        let striker: Unit | undefined;

        for (const holder of holders) {
          if (
            holder.team.alliance !== raiser.team.alliance &&
            holder.hasAbility(Abilities.SilentWrath)
          ) {
            holder.triggerAbility(Abilities.SilentWrath);
            striker ??= holder;
          }
        }
        if (striker == null) {
          return;
        }

        striker.damage(
          { type: EffectType.Ability, ability: Abilities.SilentWrath, unit: striker },
          raiser,
          raiser.checkStat(Stats.HP, 0) * SILENT_WRATH_FRACTION,
          DamageFlags.Indirect | DamageFlags.HealthScaled,
        );
      }),
    ]);
  }),

  // Impidimp: it feeds on an enemy's mood falling. Hatenna's quiet
  // leaves it nothing to feed on
  createAbility(Abilities.DespairFeast, (battle) => {
    const holders = new Set<Unit>();

    return new MergedLifecycle([
      ...trackHolders(battle, Abilities.DespairFeast, holders),
      battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
        const loser = event.source;

        if (
          event.value >= 0 ||
          holders.size === 0 ||
          fieldHasAbility(battle, Abilities.SilentWrath)
        ) {
          return;
        }

        for (const holder of holders) {
          if (
            holder.team.alliance !== loser.team.alliance &&
            holder.hasAbility(Abilities.DespairFeast)
          ) {
            holder.triggerAbility(Abilities.DespairFeast);
          }
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.DespairFeast) {
          const unit = event.source;

          unit.heal(
            { type: EffectType.Ability, ability: Abilities.DespairFeast, unit },
            unit,
            unit.checkStat(Stats.HP, 0) * DESPAIR_FEAST_FRACTION,
            0,
          );
        }
      }),
    ]);
  }),

  // Milcery: whatever it hands a teammate comes with a frosting, which
  // is Decorate's business
  createAbility(Abilities.Sugarcoat, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        event.steps !== 0 ||
        event.move === Moves.Decorate ||
        isPseudoMove(event.move) ||
        target.type !== MoveTargetType.Unit ||
        target.unit === source ||
        target.unit.team !== source.team ||
        !target.unit.alive ||
        getMoveData(event.move).category !== MoveCategories.Status ||
        !source.hasAbility(Abilities.Sugarcoat)
      ) {
        return;
      }

      source.triggerAbility(Abilities.Sugarcoat);
      source.triggerMove(Moves.Decorate, unitTarget(target.unit), 0);
    }),
  ),
];

export default setupAbilities;
