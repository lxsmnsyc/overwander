import { Moves } from '../ids/moves';
import { Weathers } from '../ids/status';

/**
 * The weather moves: what a pokemon does to the sky.
 *
 * They are the only way anything without the ability for it can change
 * the weather, and the sky is worth changing — the sun and the rain
 * move what a Fire or Water move is worth, a sandstorm and hail wear
 * down everything that is not built for them, and a good half of the
 * abilities in the game read the weather before they do anything.
 *
 * Each one is a Status move that takes no target: the sky is not
 * something a move points at. What the change actually lands on — the
 * whole battle, or only the caster's own side — is the unit's own
 * business, resolved through `setWeather`, so a raid's weather stays
 * team-local while a PvP fight's is shared.
 *
 * Their numbers are in `battle/weather.yaml` beside the rest; the
 * battle half is in
 * [`src/battle/moves/weather.ts`](../../battle/moves/weather.ts).
 */

/**
 * What each weather move calls up. It is read by the battle side and
 * by the abilities that do the same thing without a move — a Drought
 * is a Sunny Day nobody had to cast — so the pairing is written once
 */
export const MOVE_WEATHERS = new Map<Moves, Weathers>([
  [Moves.RainDance, Weathers.Rain],
  [Moves.SunnyDay, Weathers.Sunny],
  [Moves.Sandstorm, Weathers.Sandstorm],
  [Moves.Hail, Weathers.Hail],
]);

export function getWeatherMove(weather: Weathers): Moves | undefined {
  for (const [move, called] of MOVE_WEATHERS) {
    if (called === weather) {
      return move;
    }
  }
  return undefined;
}
