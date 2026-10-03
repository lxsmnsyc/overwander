import { EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { createAbility, getAbilityHolders } from '../__create';
import { createSpentItemAbility } from './__create';

/** How long a jewel takes to grow another layer, and how many it grows */
export const CRYSTAL_GROWTH_INTERVAL = turns(5);
export const CRYSTAL_GROWTH_LIMIT = 3;

/**
 * The four Kalos keeps for last: the panda that resents being mended
 * against, the sweet shop that hands its stock round, the mouse that
 * is already moving, and the jewel that thickens while it waits
 */
const setupAbilities = [
  // Pancham: it takes anything put back as a slight, so every mend on
  // the other side is another reason to swing harder
  createAbility(Abilities.Begrudge, (battle) =>
    battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
      if (event.value <= 0) {
        return;
      }

      for (const holder of getAbilityHolders(battle, Abilities.Begrudge)) {
        if (!holder.alive || holder.team === event.target.team) {
          continue;
        }

        holder.triggerAbility(Abilities.Begrudge);
        holder.addStage(Stages.Attack, 1, {
          type: EffectType.Ability,
          ability: Abilities.Begrudge,
          unit: holder,
        });
      }
    }),
  ),

  // Swirlix: the shop hands its stock round
  createSpentItemAbility(Abilities.SugarRush, true),

  // Dedenne: it is already moving when the thought arrives. Priority
  // is cast time here, so nothing it does comes back off cooldown any
  // sooner
  createAbility(Abilities.QuickWhiskers, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.QuickWhiskers)) {
        event.priority += 1;
      }
    }),
  ),

  // Carbink: the jewel thickens where it sits, a layer at a time,
  // until it has three more than it came with
  createAbility(Abilities.CrystalGrowth, (battle) => {
    /** How long each jewel has been growing, and how far it has got */
    const growth = new Map<Unit, { since: number; grown: number }>();

    return new MergedLifecycle([
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const holder of getAbilityHolders(battle, Abilities.CrystalGrowth)) {
          if (!holder.alive || !holder.hasAbility(Abilities.CrystalGrowth)) {
            growth.delete(holder);
            continue;
          }

          const state = growth.get(holder) ?? { since: 0, grown: 0 };

          if (state.grown >= CRYSTAL_GROWTH_LIMIT) {
            continue;
          }

          state.since += event.duration;

          // A long frame is worth every layer it covers, so the jewel
          // grows at the same rate however the clock is driven
          while (state.since >= CRYSTAL_GROWTH_INTERVAL && state.grown < CRYSTAL_GROWTH_LIMIT) {
            state.since -= CRYSTAL_GROWTH_INTERVAL;
            state.grown += 1;

            const cause = {
              type: EffectType.Ability,
              ability: Abilities.CrystalGrowth,
              unit: holder,
            } as const;

            holder.triggerAbility(Abilities.CrystalGrowth);
            holder.addStage(Stages.Defense, 1, cause);
            holder.addStage(Stages.SpecialDefense, 1, cause);
          }

          growth.set(holder, state);
        }
      }),
    ]);
  }),
];

export default setupAbilities;
