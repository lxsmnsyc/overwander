import type { CastAnimation } from '../constants/cast';
import { SpriteAnim } from '../ids/sprite-anims';
import { Types } from '../constants/types';
import { MoveCategories, Moves } from '../ids/moves';
import { Weathers } from '../ids/status';
import { registerMove } from './__create';

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
 * The battle half is in
 * [`src/battle/moves/weather.ts`](../../battle/moves/weather.ts).
 */

/**
 * The move, the sky it calls up, and what its caster looks like doing
 * it
 */
const WEATHER_MOVES: {
  move: Moves;
  name: string;
  description: string;
  type: Types;
  weather: Weathers;
  pp: number;
  cast: CastAnimation[];
}[] = [
  {
    move: Moves.RainDance,
    name: 'Rain Dance',
    description: 'Calls up rain for ten seconds.',
    type: Types.Water,
    weather: Weathers.Rain,
    pp: 5,
    cast: [SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Swing],
  },
  {
    move: Moves.SunnyDay,
    name: 'Sunny Day',
    description: 'Calls up sun for ten seconds.',
    type: Types.Fire,
    weather: Weathers.Sunny,
    pp: 5,
    cast: [SpriteAnim.RearUp, SpriteAnim.Swell, SpriteAnim.Charge],
  },
  {
    move: Moves.Sandstorm,
    name: 'Sandstorm',
    description: 'Calls up a sandstorm for ten seconds.',
    type: Types.Rock,
    weather: Weathers.Sandstorm,
    pp: 10,
    cast: [SpriteAnim.Shake, SpriteAnim.Twirl, SpriteAnim.Charge],
  },
  {
    move: Moves.Hail,
    name: 'Hail',
    description: 'Calls up hail for ten seconds.',
    type: Types.Ice,
    weather: Weathers.Hail,
    pp: 10,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Attack],
  },
];

/**
 * What each weather move calls up. It is read by the battle side and
 * by the abilities that do the same thing without a move — a Drought
 * is a Sunny Day nobody had to cast — so the pairing is written once
 */
export const MOVE_WEATHERS = new Map<Moves, Weathers>(
  WEATHER_MOVES.map(({ move, weather }) => [move, weather]),
);

export function getWeatherMove(weather: Weathers): Moves | undefined {
  for (const [move, called] of MOVE_WEATHERS) {
    if (called === weather) {
      return move;
    }
  }
  return undefined;
}

export default function registerWeatherMoves(): void {
  for (const { move, name, description, type, pp, cast } of WEATHER_MOVES) {
    registerMove(move, {
      name,
      description,
      type,
      category: MoveCategories.Status,
      pp,
      // The sky is not a thing a move is aimed at
      target: 0,
      flags: 0,
      cast,
    });
  }
}
