import { describe, expect, it } from 'vitest';
import type Battle from '../../src/battle/core';
import { BattleModes } from '../../src/battle/core';
import { BattleEvents, type MoveTarget, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { WEATHER_ROCK_FACTOR } from '../../src/battle/items/gear';
import { MOVE_DELAY } from '../../src/battle/mechanics/move';
import { WEATHER_DURATION } from '../../src/battle/moves/weather';
import turns from '../../src/battle/turn';
import { Stats } from '../../src/data/constants/stats';
import { Items } from '../../src/data/ids/items';
import { Types } from '../../src/data/constants/types';
import { Moves } from '../../src/data/ids/moves';
import { Weathers } from '../../src/data/ids/status';
import { MOVE_WEATHERS, getWeatherMove } from '../../src/data/moves';
import { createBattle, createUnit } from './harness';

/**
 * What the AI asks before it scores a move at all
 */
function usable(battle: Battle, source: Unit, move: Moves, target: MoveTarget): boolean {
  const event = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target,
    usable: true,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

function castOnce(unit: Unit, move: Moves): void {
  unit.addMove(move);
  unit.cast(move, { type: MoveTargetType.None });
  unit.finishCast();
  // The sky changes when the move lands, not when it goes off
  unit.battle.tick(MOVE_DELAY);
}

describe('weather moves', () => {
  it('name one sky each, both ways round', () => {
    expect(MOVE_WEATHERS.get(Moves.RainDance)).toBe(Weathers.Rain);
    expect(MOVE_WEATHERS.get(Moves.SunnyDay)).toBe(Weathers.Sunny);
    expect(MOVE_WEATHERS.get(Moves.Sandstorm)).toBe(Weathers.Sandstorm);
    expect(MOVE_WEATHERS.get(Moves.Hail)).toBe(Weathers.Hail);

    expect(getWeatherMove(Weathers.Rain)).toBe(Moves.RainDance);
    expect(getWeatherMove(Weathers.Sunny)).toBe(Moves.SunnyDay);
    // Nothing calls up a primal sky
    expect(getWeatherMove(Weathers.ExtremeSunny)).toBeUndefined();
  });

  it('put their weather over the whole field in a PvP fight', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);
    const caster = createUnit(battle, teamA);

    expect(battle.weather.current).toBe(Weathers.None);

    castOnce(caster, Moves.RainDance);

    expect(battle.weather.current).toBe(Weathers.Rain);
    expect(caster.checkWeather()).toBe(Weathers.Rain);

    // And one replaces another: there is only one sky
    castOnce(caster, Moves.SunnyDay);
    expect(battle.weather.current).toBe(Weathers.Sunny);
  });

  it('keep to the caster’s own side in a raid', () => {
    const { battle, teamA, teamB } = createBattle('weather-seed', BattleModes.Raid);
    const caster = createUnit(battle, teamA);
    const other = createUnit(battle, teamB);

    castOnce(caster, Moves.RainDance);

    expect(caster.checkWeather()).toBe(Weathers.Rain);
    expect(other.checkWeather()).toBe(Weathers.None);
  });

  it('wear down whoever is not built for the sky they call up', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);
    const caster = createUnit(battle, teamA, [Types.Rock]);
    const soft = createUnit(battle, teamA, [Types.Normal]);
    const maxHealth = soft.checkStat(Stats.HP, 0);

    castOnce(caster, Moves.Sandstorm);
    battle.tick(turns(1));

    // The sandstorm goes round the Rock type and not round the other
    expect(soft.health).toBeLessThan(maxHealth);
    expect(caster.health).toBe(caster.checkStat(Stats.HP, 0));
  });

  it('clear on their own once they have had their run', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);
    const caster = createUnit(battle, teamA);

    castOnce(caster, Moves.RainDance);

    // The cast's own delay is already on the clock: the sky started
    // running out the moment the move landed
    battle.tick(WEATHER_DURATION - MOVE_DELAY - 1);
    expect(battle.weather.current).toBe(Weathers.Rain);

    battle.tick(1);
    expect(battle.weather.current).toBe(Weathers.None);
  });

  it('leave weather nobody called up alone', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);

    createUnit(battle, teamA);

    // What the overworld hands a battle carries no clock: it is the
    // weather the fight is happening in, not something somebody did
    battle.setWeather(Weathers.Rain);
    battle.tick(WEATHER_DURATION * 10);

    expect(battle.weather.current).toBe(Weathers.Rain);
  });

  it('cannot argue with a primal sky', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);
    const caster = createUnit(battle, teamA);

    battle.setWeather(Weathers.HeavyRain);
    castOnce(caster, Moves.SunnyDay);

    expect(battle.weather.current).toBe(Weathers.HeavyRain);

    battle.tick(WEATHER_DURATION * 10);
    expect(battle.weather.current).toBe(Weathers.HeavyRain);
  });

  it('stay out longer for whoever called them up holding the rock for it', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);
    const caster = createUnit(battle, teamA);

    caster.addItem(Items.DampRock);
    castOnce(caster, Moves.RainDance);

    battle.tick(WEATHER_DURATION);
    expect(battle.weather.current).toBe(Weathers.Rain);

    battle.tick(WEATHER_DURATION * (WEATHER_ROCK_FACTOR - 1));
    expect(battle.weather.current).toBe(Weathers.None);
  });

  it('give a rock nothing for a sky it does not keep', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);
    const caster = createUnit(battle, teamA);

    // A Damp Rock is for rain; the sun runs out on time
    caster.addItem(Items.DampRock);
    castOnce(caster, Moves.SunnyDay);

    battle.tick(WEATHER_DURATION);
    expect(battle.weather.current).toBe(Weathers.None);
  });

  it('are not worth a cast to the AI when the sky is already theirs', () => {
    const { battle, teamA } = createBattle('weather-seed', BattleModes.PvP);
    const caster = createUnit(battle, teamA);
    const target = { type: MoveTargetType.None } as const;

    expect(usable(battle, caster, Moves.RainDance, target)).toBe(true);

    castOnce(caster, Moves.RainDance);

    expect(usable(battle, caster, Moves.RainDance, target)).toBe(false);
    expect(usable(battle, caster, Moves.SunnyDay, target)).toBe(true);
  });
});
