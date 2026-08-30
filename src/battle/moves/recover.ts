import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Weathers } from '../../data/ids/status';
import { scoreSelfHeal } from '../ai/score';
import type Battle from '../core';
import type Unit from '../unit';
import { BattleEvents, EffectType } from '../events';
import { isWeatherSunny } from '../utils';

/**
 * Self-healing moves and the fraction of max health they restore
 */
const HEAL_FRACTION: { [key in Moves]?: number } = {
  // https://bulbapedia.bulbagarden.net/wiki/Recover_(move)
  [Moves.Recover]: 0.5,
  // Chansey's own Recover, down to the fraction
  // https://bulbapedia.bulbagarden.net/wiki/Soft-Boiled_(move)
  [Moves.SoftBoiled]: 0.5,
  // https://bulbapedia.bulbagarden.net/wiki/Milk_Drink_(move)
  [Moves.MilkDrink]: 0.5,
};

/**
 * The heals that read the sky: full measure under a clear one, more
 * in the sun, and little enough under anything else that the weather
 * is worth changing first
 */
const WEATHER_HEALS = new Set<Moves>([Moves.MorningSun, Moves.Synthesis, Moves.Moonlight]);

const SUNLIT_HEAL = 2 / 3;

const OVERCAST_HEAL = 0.25;

const CLEAR_HEAL = 0.5;

/**
 * What share of its health a move puts back for this unit, or nothing
 * if the move does not heal at all
 */
function healFraction(unit: Unit, move: Moves): number | undefined {
  if (!WEATHER_HEALS.has(move)) {
    return HEAL_FRACTION[move];
  }
  if (isWeatherSunny(unit)) {
    return SUNLIT_HEAL;
  }
  return unit.checkWeather() === Weathers.None ? CLEAR_HEAL : OVERCAST_HEAL;
}

export default function setupRecoverMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const fraction = healFraction(event.source, event.move);

    if (fraction != null) {
      event.source.heal(
        { type: EffectType.Move, move: event.move, unit: event.source },
        event.source,
        event.source.checkStat(Stats.HP, 0) * fraction,
        0,
      );
    }
  });

  // Worth what it would actually put back, so a full unit does not
  // spend a cast topping itself off
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const fraction = healFraction(event.source, event.move);

    if (fraction != null) {
      scoreSelfHeal(event, fraction);
    }
  });
}
