import { EventPriority } from '../../../core/event-emitter';
import type { EventListenerLifecycle } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { getWeatherMove } from '../../../data/moves';
import type Abilities from '../../../data/ids/abilities';
import { Items } from '../../../data/ids/items';
import type { Moves } from '../../../data/ids/moves';
import { Weathers } from '../../../data/ids/status';
import type Battle from '../../core';
import type { CheckUnitCanDamageEvent } from '../../events';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { isPrimalWeather, skyOverTeam } from '../../utils';
import { spendItem } from '../../items/__create';
import type Unit from '../../unit';
import { createAbility, getAbilityHolders } from './create';

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
 * Meta ability for Primordial Sea, Desolate Land and Delta Stream: a
 * primal sky that holds for as long as its holder stands, and clears
 * once nobody left on the field is raising it. Being primal is what
 * keeps every other sky out while it lasts
 * https://bulbapedia.bulbagarden.net/wiki/Primordial_Sea_(Ability)
 */
export function createPrimalWeatherAbility(
  targetAbility: Abilities,
  targetWeather: Weathers,
): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) => {
    function raise(unit: Unit): void {
      if (unit.alive && unit.hasAbility(targetAbility)) {
        unit.triggerAbility(targetAbility);
      }
    }

    function still(unit: Unit): void {
      if (!unit.hasAbility(targetAbility) || skyOverTeam(unit.team) !== targetWeather) {
        return;
      }
      for (const other of battle.units()) {
        if (other !== unit && other.alive && other.hasAbility(targetAbility)) {
          return;
        }
      }
      unit.setWeather(Weathers.None);
    }

    return new MergedLifecycle([
      // Worn the moment a shape is taken, which is already on the field
      battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
        raise(event.source);
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        raise(event.source);
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === targetAbility) {
          event.source.setWeather(targetWeather);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        still(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        still(event.source);
      }),
    ]);
  });
}

/**
 * Meta ability for the terrain setters (Misty Surge, Electric Surge):
 * they cast the terrain's move on entry, so the move's own clock runs it
 * https://bulbapedia.bulbagarden.net/wiki/Electric_Surge_(Ability)
 */
export function createSurgeAbility(
  targetAbility: Abilities,
  terrainMove: Moves,
): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(targetAbility)) {
            event.source.triggerAbility(targetAbility);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === targetAbility) {
            event.source.triggerMove(terrainMove, { type: MoveTargetType.None }, 0);
          }
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

/** What the two Paradox abilities make of the stat they lift */
export const PARADOX_SCALE = 1.3;
export const PARADOX_SPEED_SCALE = 1.5;

/** The stats a Paradox ability can lift, in the order a tie goes */
const PARADOX_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/**
 * Meta ability for the Paradox pair (Protosynthesis, Quark Drive):
 * while `active` holds, or once a held Booster Energy is spent, the
 * holder's highest stat is lifted. The stat is picked as the boost
 * starts and kept while it lasts, the mainline's rule; the Booster
 * Energy's boost lasts until the holder leaves the field
 * https://bulbapedia.bulbagarden.net/wiki/Protosynthesis_(Ability)
 */
export function createProtosynthesisAbility(
  ability: Abilities,
  active: (unit: Unit) => boolean,
): (battle: Battle) => void {
  return createAbility(ability, (battle) => {
    const boosted = new Map<Unit, Stats>();
    const energized = new Set<Unit>();

    function highest(unit: Unit): Stats {
      let best = PARADOX_STATS[0];
      let value = -1;

      for (const stat of PARADOX_STATS) {
        const current = unit.resolveStat(stat, 0);

        if (current > value) {
          best = stat;
          value = current;
        }
      }
      return best;
    }

    function settle(unit: Unit): void {
      if (!unit.alive || !unit.hasAbility(ability)) {
        boosted.delete(unit);
        return;
      }

      let on = energized.has(unit) || active(unit);

      // The energy is only drunk when nothing else is lifting it
      if (!on && spendItem(unit, Items.BoosterEnergy) != null) {
        energized.add(unit);
        on = true;
      }
      if (!on) {
        boosted.delete(unit);
        return;
      }
      if (!boosted.has(unit)) {
        boosted.set(unit, highest(unit));
        unit.triggerAbility(ability);
      }
    }

    function settleAll(): void {
      for (const unit of getAbilityHolders(battle, ability)) {
        settle(unit);
      }
    }

    function leave(unit: Unit): void {
      boosted.delete(unit);
      energized.delete(unit);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (boosted.get(event.source) === event.stat && event.source.hasAbility(ability)) {
          event.value *= event.stat === Stats.Speed ? PARADOX_SPEED_SCALE : PARADOX_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        settle(event.source);
      }),
      battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
        if (event.ability === ability) {
          settle(event.source);
        }
      }),
      battle.on(BattleEvents.UnitAddItem, EventPriority.Post, (event) => {
        settle(event.source);
      }),
      battle.on(BattleEvents.SetWeather, EventPriority.Post, settleAll),
      battle.on(BattleEvents.TeamSetWeather, EventPriority.Post, settleAll),
      battle.on(BattleEvents.SetTerrain, EventPriority.Post, settleAll),
      battle.on(BattleEvents.TeamSetTerrain, EventPriority.Post, settleAll),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        leave(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        leave(event.source);
      }),
    ]);
  });
}

/** What the two box legends make of their stat on their own ground */
export const PULSE_SCALE = 5461 / 4096;

/**
 * The stat half of the two box legends (Orichalcum Pulse, Hadron
 * Engine): one stat at 1.33x while `active` holds. What they lay on
 * arrival is the Drought or Surge they are paired with
 * https://bulbapedia.bulbagarden.net/wiki/Orichalcum_Pulse_(Ability)
 */
export function createOrichalcumPulseAbility(
  ability: Abilities,
  stat: Stats,
  active: (unit: Unit) => boolean,
): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat === stat && event.source.hasAbility(ability) && active(event.source)) {
        event.value *= PULSE_SCALE;
      }
    }),
  );
}
