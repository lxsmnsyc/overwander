import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { Weathers } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleModes } from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

// The per-turn residual on this engine's clock: a sixteenth of the
// pool every turn, the same rate a status chips at
const CHIP_INTERVAL = turns(1);
const CHIP_FRACTION = 1 / 16;

/**
 * What each sky does to the two types it has an opinion about. A
 * primal sky carries the same numbers as its ordinary counterpart;
 * what makes it primal is `WEATHER_NULLIFIED` below
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
 * What a primal sky refuses outright. Damaging moves only: a status
 * move of that type still goes off
 */
const WEATHER_NULLIFIED: { [key in Weathers]?: Types } = {
  [Weathers.ExtremeSunny]: Types.Water,
  [Weathers.HeavyRain]: Types.Fire,
};

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
    if (event.global || battle.mode === BattleModes.PvP || battle.mode === BattleModes.Npc) {
      battle.setWeather(event.weather, event.duration);
    } else {
      event.source.team.setWeather(event.weather, event.duration);
    }
  });

  /**
   * The sky a unit stands under, battle weather outranking the team's,
   * before anything the unit carries has its say. Callers want
   * `checkWeather` unless the rule belongs to the field itself — an
   * umbrella holder walks around under its own clear sky
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
   * Whether a weather is over the unit without reaching it, which is
   * what a Utility Umbrella looks like from outside. Asked instead of
   * the item, so any future shelter works too; a unit whose team has
   * different weather is not sheltered, it is somewhere else
   */
  function sheltered(unit: Unit, weather: Weathers): boolean {
    return skyOver(unit) === weather && unit.checkWeather() !== weather;
  }

  // What the sky does to a blow thrown under it. Either end can be
  // sheltered from it
  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    const parent = event.parent;

    // A fixed-damage move is not calculated, so there is nothing for
    // the weather to be a factor of
    if (parent.category === MoveCategories.Status || parent.flags & MoveAttackFlags.Pure) {
      return;
    }

    const weather = parent.source.checkWeather();
    const factor = WEATHER_DAMAGE[weather]?.get(parent.type);

    if (factor != null && !sheltered(parent.target, weather)) {
      event.value *= factor;
    }
  });

  // The strong winds take a Flying type's weaknesses away. Not turned
  // into resistances: the blow lands, it lands like anybody else's
  battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
    if (
      event.multiplier > 1 &&
      event.defendingType === Types.Flying &&
      skyOver(event.parent.target) === Weathers.StrongWinds
    ) {
      event.multiplier = 1;
    }
  });

  // And what a primal sky refuses. Read off the field, not the
  // caster: no umbrella lights a fire in that much rain
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      getMoveData(event.move).category !== MoveCategories.Status &&
      WEATHER_NULLIFIED[skyOver(event.source)] === event.type
    ) {
      event.immune = true;
    }
  });

  // A sandstorm covers whatever is made of the same stuff
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
