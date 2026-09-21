import { EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { isWeatherRainy, isWeatherSunny } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import { isSingleTargetMove } from './__create';

/** How long a court waits between gifts, and how many it is given */
export const REGALIA_INTERVAL = turns(5);
export const REGALIA_LIMIT = 3;

/** How often a ring sends a move back where it came from */
export const RINGBACK_CHANCE = 0.2;

/** What a move of its own halves is worth in the weather that damps it */
export const BOILER_SCALE = 1.15;

/**
 * Kalos's three mythicals: the queen that hands its court a shell,
 * the rings that send a blow back through themselves, and the boiler
 * that will not be damped by the sky
 */
const setupAbilities = [
  // Diancie: the same clock a Carbink thickens on, given away rather
  // than kept
  createAbility(Abilities.Regalia, (battle) => {
    /** How long each queen has been giving, and how much it has given */
    const court = new Map<Unit, { since: number; given: number }>();

    return new MergedLifecycle([
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const holder of getAbilityHolders(battle, Abilities.Regalia)) {
          if (!holder.alive || !holder.hasAbility(Abilities.Regalia)) {
            court.delete(holder);
            continue;
          }

          const state = court.get(holder) ?? { since: 0, given: 0 };

          state.since += event.duration;

          while (state.since >= REGALIA_INTERVAL && state.given < REGALIA_LIMIT) {
            state.since -= REGALIA_INTERVAL;
            state.given += 1;

            const cause = {
              type: EffectType.Ability,
              ability: Abilities.Regalia,
              unit: holder,
            } as const;

            holder.triggerAbility(Abilities.Regalia);

            for (const mate of holder.team.units) {
              if (mate.alive) {
                mate.addStage(Stages.Defense, 1, cause);
              }
            }
          }

          court.set(holder, state);
        }
      }),
    ]);
  }),

  // Hoopa: a ring is a way in and a way back out, so some share of
  // what is thrown at it arrives behind whoever threw it
  createAbility(Abilities.Ringback, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveRedirect, EventPriority.Post, (event) => {
      const aimed = event.redirect;

      if (
        aimed.type !== MoveTargetType.Unit ||
        !aimed.unit.hasAbility(Abilities.Ringback) ||
        aimed.unit === event.source ||
        !isSingleTargetMove(event.move) ||
        battle.random() >= RINGBACK_CHANCE
      ) {
        return;
      }

      aimed.unit.triggerAbility(Abilities.Ringback);
      event.redirect = { type: MoveTargetType.Unit, unit: event.source };
    }),
  ),

  // Volcanion: the fire and the water are the same machine, so the
  // sky cannot damp one half without the other making up for it
  createAbility(Abilities.Boiler, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (!parent.source.hasAbility(Abilities.Boiler)) {
        return;
      }

      const damped =
        (parent.type === Types.Fire && isWeatherRainy(parent.source)) ||
        (parent.type === Types.Water && isWeatherSunny(parent.source));

      if (damped) {
        event.value *= BOILER_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
