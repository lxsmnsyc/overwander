import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { Weathers } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleModes } from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

// Real-time analog of the per-turn residual: 1/16 max HP every second
const CHIP_INTERVAL = 1000;
const CHIP_FRACTION = 1 / 16;

/**
 * What each sky does to the two types it has an opinion about. A sun
 * that does not make a Flamethrower hurt more is a sun nobody would
 * call up, so this is most of what the weather is for: the rest of
 * it — a Chlorophyll, a Rain Dish, a Solar Beam skipping its charge —
 * is what particular pokemon make of a sky that was already worth
 * having.
 *
 * The primal skies carry the same numbers as their ordinary
 * counterparts. What makes them primal is the other half of the rule,
 * below: the type they work against does not merely land softly, it
 * does not land at all
 */
const WEATHER_DAMAGE: { [key in Weathers]?: Map<Types, number> } = {
  [Weathers.Sunny]: new Map([
    [Types.Fire, 1.5],
    [Types.Water, 0.5],
  ]),
  [Weathers.ExtremeSunny]: new Map([[Types.Fire, 1.5]]),
  [Weathers.Rain]: new Map([
    [Types.Water, 1.5],
    [Types.Fire, 0.5],
  ]),
  [Weathers.HeavyRain]: new Map([[Types.Water, 1.5]]),
};

/**
 * What a primal sky refuses outright. Only damaging moves fizzle —
 * a Sunny Day is a Normal-type move and calls up nothing here, and
 * neither does anything else a pokemon might do that happens to be
 * Fire or Water without being an attack
 */
const WEATHER_NULLIFIED: { [key in Weathers]?: Types } = {
  [Weathers.ExtremeSunny]: Types.Water,
  [Weathers.HeavyRain]: Types.Fire,
};

/**
 * What a sandstorm is worth to whatever is built out of the same
 * thing it is made of
 */
const SANDSTORM_DEFENSE_FACTOR = 1.5;

// Damaging weathers, mapped to the types they cannot harm; ability
// immunities (e.g. Sand Veil, Ice Body) answer CheckUnitCanDamage in
// their own modules instead
const CHIP_IMMUNE_TYPES: { [key in Weathers]?: Set<Types> } = {
  [Weathers.Sandstorm]: new Set([Types.Rock, Types.Ground, Types.Steel]),
  [Weathers.Hail]: new Set([Types.Ice]),
};

function isChipImmune(unit: Unit, immune: Set<Types>): boolean {
  for (const type of unit.types) {
    if (immune.has(type)) {
      return true;
    }
  }
  return false;
}

function hasDamagingWeather(battle: Battle): boolean {
  if (!battle.weather.disabled && CHIP_IMMUNE_TYPES[battle.weather.current]) {
    return true;
  }
  for (const team of battle.teams()) {
    if (!team.weather.disabled && CHIP_IMMUNE_TYPES[team.weather.current]) {
      return true;
    }
  }
  return false;
}

export default function setupWeatherMechanics(battle: Battle): void {
  battle.on(BattleEvents.SetWeather, EventPriority.Exact, (event) => {
    battle.weather.current = event.weather;
  });

  battle.on(BattleEvents.TeamSetWeather, EventPriority.Exact, (event) => {
    event.team.weather.current = event.weather;
  });

  // Weather changes coming from a unit route by battle mode: PvP is
  // always battle-wide, raid stays team-local unless a listener
  // (e.g. Boss) widened the scope
  battle.on(BattleEvents.UnitSetWeather, EventPriority.Exact, (event) => {
    if (event.global || battle.mode === BattleModes.PvP) {
      battle.setWeather(event.weather, event.duration);
    } else {
      event.source.team.setWeather(event.weather, event.duration);
    }
  });

  /**
   * The sky a unit is standing under, before anything the unit itself
   * carries has its say. The battle weather outranks team-local
   * weather.
   *
   * Almost everything wants `checkWeather` instead, which is this
   * answer put to the unit — a Utility Umbrella holder walks around
   * under its own clear sky. What wants this one is a rule that
   * belongs to the field rather than to whoever is standing in it
   */
  function skyOver(unit: Unit): Weathers {
    const team = unit.team;

    if (!battle.weather.disabled && battle.weather.current !== Weathers.None) {
      return battle.weather.current;
    }
    if (!team.weather.disabled && team.weather.current !== Weathers.None) {
      return team.weather.current;
    }
    return Weathers.None;
  }

  battle.on(BattleEvents.CheckUnitWeather, EventPriority.Exact, (event) => {
    event.weather = skyOver(event.source);
  });

  /**
   * Whether the unit is standing in a weather that is not reaching it:
   * the field says one thing and the unit answers another, which is
   * what a Utility Umbrella looks like from the outside.
   *
   * It is asked rather than the item, so anything else that ever
   * shelters a unit from a sky gets the same treatment for free — and
   * a unit whose team simply has different weather is not sheltered
   * from anything, it is somewhere else
   */
  function sheltered(unit: Unit, weather: Weathers): boolean {
    return skyOver(unit) === weather && unit.checkWeather() !== weather;
  }

  /**
   * What the sky does to a blow thrown under it. Either end of the
   * blow can be out of the weather: an umbrella keeps its holder's
   * Water moves out of the sun's way, and keeps the sun off a Fire
   * move thrown at its holder
   */
  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    const parent = event.parent;

    // A fixed-damage move is not calculated, so there is nothing here
    // for the weather to be a factor of
    if (parent.category === MoveCategories.Status || parent.flags & MoveAttackFlags.Pure) {
      return;
    }

    const weather = parent.source.checkWeather();
    const factor = WEATHER_DAMAGE[weather]?.get(parent.type);

    if (factor != null && !sheltered(parent.target, weather)) {
      event.value *= factor;
    }
  });

  /**
   * What the strong winds are for: nothing gets at a Flying type from
   * above while they are blowing. The weakness is not turned into a
   * resistance — the blow lands, it simply lands like anybody else's
   */
  battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
    if (
      event.multiplier > 1 &&
      event.defendingType === Types.Flying &&
      skyOver(event.parent.target) === Weathers.StrongWinds
    ) {
      event.multiplier = 1;
    }
  });

  /**
   * And what a primal sky refuses. This one reads the field, not the
   * caster: an umbrella is something to stand under, and no umbrella
   * lights a fire in that much rain
   */
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      getMoveData(event.move).category !== MoveCategories.Status &&
      WEATHER_NULLIFIED[skyOver(event.source)] === event.type
    ) {
      event.immune = true;
    }
  });

  // A sandstorm covers whatever is made of the same stuff it is
  battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
    if (
      event.stat === Stats.SpecialDefense &&
      event.source.types.has(Types.Rock) &&
      event.source.checkWeather() === Weathers.Sandstorm
    ) {
      event.value *= SANDSTORM_DEFENSE_FACTOR;
    }
  });

  let progress = 0;

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    progress += event.duration;

    if (progress < CHIP_INTERVAL) {
      return;
    }
    progress = 0;

    for (const unit of battle.units()) {
      const weather = unit.checkWeather();
      const immune = CHIP_IMMUNE_TYPES[weather];

      if (immune && !isChipImmune(unit, immune)) {
        const amount = unit.checkStat(Stats.HP, 0) * CHIP_FRACTION;

        unit.damage(
          { type: EffectType.Weather, weather, unit },
          unit,
          amount,
          DamageFlags.Indirect | DamageFlags.HealthScaled,
        );
      }
    }
  });

  timer.stop();

  // Lazy: the chip timer only runs while a damaging weather is set
  // somewhere (per-unit exposure still resolves through checkWeather)
  const sync = (): void => {
    if (hasDamagingWeather(battle)) {
      timer.start();
    } else {
      timer.stop();
      progress = 0;
    }
  };

  battle.on(BattleEvents.SetWeather, EventPriority.Post, sync);
  battle.on(BattleEvents.TeamSetWeather, EventPriority.Post, sync);
}
