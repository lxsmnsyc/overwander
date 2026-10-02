import { EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility, createWaterAbsorbAbility, getAbilityHolders } from '../__create';

/** Every stat stage a unit can hold */
const ALL_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/** What Marshadow's moves are worth against something that has built itself up */
export const UMBRAL_STRIKE_SCALE = 1.25;

/**
 * Alola's four mythicals. The mainline does not present them as a set,
 * so each has a design of its own
 */
const setupAbilities = [
  // Magearna: what a fallen teammate had built up passes to it. A faint
  // clears the stages at Exact, so they are read before and handed over
  // after, once the faint has really happened
  createAbility(Abilities.SoulRelay, (battle) => {
    const raised = new Map<Unit, [Stages, number][]>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitFaints, EventPriority.Pre, (event) => {
        const kept: [Stages, number][] = [];

        for (const stage of ALL_STAGES) {
          const value = event.source.stages[stage];

          if (value > 0) {
            kept.push([stage, value]);
          }
        }
        raised.set(event.source, kept);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        const fallen = event.source;
        const kept = raised.get(fallen) ?? [];

        raised.delete(fallen);
        if (kept.length === 0) {
          return;
        }
        for (const heir of fallen.team.units) {
          if (heir === fallen || !heir.alive || !heir.hasAbility(Abilities.SoulRelay)) {
            continue;
          }

          const cause = {
            type: EffectType.Ability,
            ability: Abilities.SoulRelay,
            unit: heir,
          } as const;

          heir.triggerAbility(Abilities.SoulRelay);
          for (const [stage, value] of kept) {
            heir.addStage(stage, value, cause);
          }
        }
      }),
    ]);
  }),

  // Marshadow: it hunts whoever has built itself up
  createAbility(Abilities.UmbralStrike, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const { source, target } = event.parent;

      if (!source.hasAbility(Abilities.UmbralStrike)) {
        return;
      }
      for (const stage of ALL_STAGES) {
        if (target.stages[stage] > 0) {
          event.value *= UMBRAL_STRIKE_SCALE;
          return;
        }
      }
    }),
  ),

  // Zeraora: Plasma Fists' charge as a standing aura over its enemies
  createAbility(Abilities.IonField, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
      if (event.type !== Types.Normal) {
        return;
      }
      for (const holder of getAbilityHolders(battle, Abilities.IonField)) {
        if (
          holder.alive &&
          holder.hasAbility(Abilities.IonField) &&
          holder.team.alliance !== event.source.team.alliance
        ) {
          event.type = Types.Electric;
          return;
        }
      }
    }),
  ),

  // The Meltan line: it eats metal
  createWaterAbsorbAbility(Abilities.MetalEater, Types.Steel),
];

export default setupAbilities;
