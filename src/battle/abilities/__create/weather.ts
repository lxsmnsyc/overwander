import { EventPriority } from '../../../core/event-emitter';
import type { EventListenerLifecycle } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { getWeatherMove } from '../../../data/moves';
import type Abilities from '../../../data/ids/abilities';
import { Weathers } from '../../../data/ids/status';
import type Battle from '../../core';
import type { CheckUnitCanDamageEvent } from '../../events';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { isPrimalWeather } from '../../utils';
import type Unit from '../../unit';
import { createAbility } from './create';

/** Abilities that set the sky, read it, or run on it */
/**
 * Meta ability for Drizzle, Drought, Sand Stream and Snow Warning
 * https://bulbapedia.bulbagarden.net/wiki/Drizzle_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Drought_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Sand_Stream_(Ability)
 */
export function createDrizzleAbility(
  targetAbility: Abilities,
  targetWeather: Weathers,
): (battle: Battle) => void {
  function triggerWeather(battle: Battle, source: Unit): void {
    // A primal sky is not something an ability argues with
    if (source.hasAbility(targetAbility) && !isPrimalWeather(battle.weather.current)) {
      source.triggerAbility(targetAbility);
    }
  }
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        // For when the unit transforms
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          triggerWeather(battle, event.source);
        }),
        // For when the unit re-enters
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          triggerWeather(battle, event.source);
        }),
        /**
         * The weather change rides the trigger, and the trigger casts
         * the move that calls up that sky rather than setting it
         * itself: a Drought is a Sunny Day nobody had to learn.
         *
         * That way there is one weather-changing path rather than
         * two. Everything the move goes through on its way — the
         * scope resolving through the unit, whatever an item or an
         * ability has to say about weather landing — happens for the
         * ability as well, without either side having to remember
         * that the other exists
         */
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== targetAbility) {
            return;
          }

          const move = getWeatherMove(targetWeather);

          if (move == null) {
            // No move calls up this sky, so there is nothing to cast
            // and the ability sets it directly
            event.source.setWeather(targetWeather);
            return;
          }

          event.source.triggerMove(move, { type: MoveTargetType.None }, 0);
        }),
      ]),
  );
}

/**
 * Meta ability for the weather sprinters (Sand Rush, Slush Rush):
 * double Speed while their sky is up. `chipWeather` is the sky they
 * are also built to stand in, which Slush Rush is not
 * https://bulbapedia.bulbagarden.net/wiki/Sand_Rush_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Slush_Rush_(Ability)
 */
export function createSandRushAbility(
  targetAbility: Abilities,
  inWeather: (unit: Unit) => boolean,
  chipWeather?: Weathers,
): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (
            event.stat === Stats.Speed &&
            event.source.hasAbility(targetAbility) &&
            inWeather(event.source)
          ) {
            event.value *= 2;
          }
        }),
        ...(chipWeather == null ? [] : [chipImmunity(battle, targetAbility, chipWeather)]),
      ]),
  );
}

/**
 * Meta ability for the weather blinds (Cloud Nine, Air Lock): while a
 * holder is on the field, nothing stands under any sky at all. The
 * holders are kept as a set so the weather check is one size lookup
 * rather than a scan of every unit
 * https://bulbapedia.bulbagarden.net/wiki/Cloud_Nine_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Air_Lock_(Ability)
 */
export function createCloudNineAbility(targetAbility: Abilities): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) => {
    const holders = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitWeather, EventPriority.Post, (event) => {
        if (holders.size > 0) {
          event.weather = Weathers.None;
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(targetAbility)) {
          holders.add(event.source);

          // Announce on entry
          event.source.triggerAbility(targetAbility);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      // Losing the ability mid-battle also lifts the suppression
      battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
        if (event.ability === targetAbility) {
          holders.delete(event.source);
        }
      }),
    ]);
  });
}

/**
 * Vetoes the residual weather chip damage carried by the given weather
 * cause (see mechanics/weather.ts)
 */
export function chipImmunity(
  battle: Battle,
  ability: Abilities,
  weather: Weathers,
): EventListenerLifecycle<CheckUnitCanDamageEvent> {
  return battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.cause.type === EffectType.Weather &&
      event.cause.weather === weather &&
      event.target.hasAbility(ability)
    ) {
      event.success = false;
    }
  });
}
