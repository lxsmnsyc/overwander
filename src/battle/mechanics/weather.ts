import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags } from '../../data/ids/moves';
import { Weathers } from '../../data/ids/status';
import type Battle from '../core';
import { BattleModes } from '../core';
import { BattleEvents, EffectType } from '../events';
import type Unit from '../unit';

// Real-time analog of the per-turn residual: 1/16 max HP every second
const CHIP_INTERVAL = 1000;
const CHIP_FRACTION = 1 / 16;

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

  // The battle weather outranks team-local weather
  battle.on(BattleEvents.CheckUnitWeather, EventPriority.Exact, (event) => {
    const team = event.source.team;
    if (!battle.weather.disabled && battle.weather.current !== Weathers.None) {
      event.weather = battle.weather.current;
    } else if (!team.weather.disabled && team.weather.current !== Weathers.None) {
      event.weather = team.weather.current;
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
