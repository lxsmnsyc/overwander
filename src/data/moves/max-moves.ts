import { Stages } from '../constants/stats';
import { Types } from '../constants/types';
import { Moves } from '../ids/moves';
import { Terrains, Weathers } from '../ids/status';
import { MAX_POWER_OVERRIDES } from '../battle';
import { getMoveData } from './__create';

/**
 * The Max Moves: what a Dynamaxed pokemon throws in place of the move
 * it reached for. The battle side is in `src/battle/moves/max-moves.ts`
 * https://bulbapedia.bulbagarden.net/wiki/Max_Move
 */

/** The Max Move a damaging move of each type becomes */
export const TYPE_MAX_MOVES = new Map<Types, Moves>([
  [Types.Normal, Moves.MaxStrike],
  [Types.Fighting, Moves.MaxKnuckle],
  [Types.Flying, Moves.MaxAirstream],
  [Types.Poison, Moves.MaxOoze],
  [Types.Ground, Moves.MaxQuake],
  [Types.Rock, Moves.MaxRockfall],
  [Types.Bug, Moves.MaxFlutterby],
  [Types.Ghost, Moves.MaxPhantasm],
  [Types.Steel, Moves.MaxSteelspike],
  [Types.Fire, Moves.MaxFlare],
  [Types.Water, Moves.MaxGeyser],
  [Types.Grass, Moves.MaxOvergrowth],
  [Types.Electric, Moves.MaxLightning],
  [Types.Psychic, Moves.MaxMindstorm],
  [Types.Ice, Moves.MaxHailstorm],
  [Types.Dragon, Moves.MaxWyrmwind],
  [Types.Dark, Moves.MaxDarkness],
  [Types.Fairy, Moves.MaxStarfall],
]);

/** Every Max Move, Max Guard among them. None is learned, copied or called */
export const MAX_MOVES = new Set<Moves>([...TYPE_MAX_MOVES.values(), Moves.MaxGuard]);

export function isMaxMove(move: Moves): boolean {
  return MAX_MOVES.has(move);
}

/** The sky each weather Max Move calls up */
export const MAX_MOVE_WEATHERS = new Map<Moves, Weathers>([
  [Moves.MaxFlare, Weathers.Sunny],
  [Moves.MaxGeyser, Weathers.Rain],
  [Moves.MaxHailstorm, Weathers.Hail],
  [Moves.MaxRockfall, Weathers.Sandstorm],
]);

/** The terrain each terrain Max Move lays */
export const MAX_MOVE_TERRAINS = new Map<Moves, Terrains>([
  [Moves.MaxLightning, Terrains.Electric],
  [Moves.MaxOvergrowth, Terrains.Grassy],
  [Moves.MaxMindstorm, Terrains.Psychic],
  [Moves.MaxStarfall, Terrains.Misty],
]);

/** The stage each Max Move drops a stage on every foe */
export const MAX_MOVE_FOE_STAGES = new Map<Moves, Stages>([
  [Moves.MaxStrike, Stages.Speed],
  [Moves.MaxFlutterby, Stages.SpecialAttack],
  [Moves.MaxPhantasm, Stages.Defense],
  [Moves.MaxWyrmwind, Stages.Attack],
  [Moves.MaxDarkness, Stages.SpecialDefense],
]);

/** The stage each Max Move raises a stage on the user's whole side */
export const MAX_MOVE_ALLY_STAGES = new Map<Moves, Stages>([
  [Moves.MaxKnuckle, Stages.Attack],
  [Moves.MaxSteelspike, Stages.Defense],
  [Moves.MaxOoze, Stages.SpecialAttack],
  [Moves.MaxQuake, Stages.SpecialDefense],
  [Moves.MaxAirstream, Stages.Speed],
]);

/** Fighting and Poison read the lower table, since their Max Moves raise or drop a stat as well */
const LOWER_TABLE = new Set<Types>([Types.Fighting, Types.Poison]);

/**
 * What a Max Move hits with, read off the move it replaces: the
 * mainline's table by base power, and 100 for a move with no power of
 * its own
 */
export function maxPowerOf(base: Moves): number {
  const override = MAX_POWER_OVERRIDES[base];

  if (override != null) {
    return override;
  }

  const data = getMoveData(base);
  const power = data.power ?? 0;
  const lower = LOWER_TABLE.has(data.type);

  if (power <= 0) {
    return 100;
  }
  if (power >= 150) {
    return lower ? 100 : 150;
  }
  if (power >= 110) {
    return lower ? 95 : 140;
  }
  if (power >= 75) {
    return lower ? 90 : 130;
  }
  if (power >= 65) {
    return lower ? 85 : 120;
  }
  if (power >= 55) {
    return lower ? 80 : 110;
  }
  if (power >= 45) {
    return lower ? 75 : 100;
  }
  return lower ? 70 : 90;
}
