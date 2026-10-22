import { Types } from '../constants/types';
import { MoveCategories, Moves } from '../ids/moves';
import { type ZStatusEffect, Z_POWER_OVERRIDES, Z_STATUS_EFFECTS } from '../battle';
import { getMoveData } from './__create';

/**
 * The Z-Moves: what a held Z-Crystal turns a move into, once a side a
 * fight. The battle side is in `src/battle/gimmicks/z-moves.ts`
 * https://bulbapedia.bulbagarden.net/wiki/Z-Move
 */

/** The Z-Move each type's crystal turns a damaging move of that type into */
export const TYPE_Z_MOVES = new Map<Types, Moves>([
  [Types.Normal, Moves.BreakneckBlitz],
  [Types.Fighting, Moves.AllOutPummeling],
  [Types.Flying, Moves.SupersonicSkystrike],
  [Types.Poison, Moves.AcidDownpour],
  [Types.Ground, Moves.TectonicRage],
  [Types.Rock, Moves.ContinentalCrush],
  [Types.Bug, Moves.SavageSpinOut],
  [Types.Ghost, Moves.NeverEndingNightmare],
  [Types.Steel, Moves.CorkscrewCrash],
  [Types.Fire, Moves.InfernoOverdrive],
  [Types.Water, Moves.HydroVortex],
  [Types.Grass, Moves.BloomDoom],
  [Types.Electric, Moves.GigavoltHavoc],
  [Types.Psychic, Moves.ShatteredPsyche],
  [Types.Ice, Moves.SubzeroSlammer],
  [Types.Dragon, Moves.DevastatingDrake],
  [Types.Dark, Moves.BlackHoleEclipse],
  [Types.Fairy, Moves.TwinkleTackle],
]);

/** The type Z-Moves, whose power and category come from the move they replace */
export const GENERIC_Z_MOVES = new Set<Moves>(TYPE_Z_MOVES.values());

/** The seventeen that belong to one line and one move each */
export const SIGNATURE_Z_MOVES = new Set<Moves>([
  Moves.Catastropika,
  Moves.SinisterArrowRaid,
  Moves.MaliciousMoonsault,
  Moves.OceanicOperetta,
  Moves.GuardianOfAlola,
  Moves.SoulStealing7StarStrike,
  Moves.StokedSparksurfer,
  Moves.PulverizingPancake,
  Moves.ExtremeEvoboost,
  Moves.GenesisSupernova,
  Moves.TenMillionVoltThunderbolt,
  Moves.LightThatBurnsTheSky,
  Moves.SearingSunrazeSmash,
  Moves.MenacingMoonrazeMaelstrom,
  Moves.LetsSnuggleForever,
  Moves.SplinteredStormshards,
  Moves.ClangorousSoulblaze,
]);

/** Every Z-Move. None of them is learned, copied, called or remembered */
export const Z_MOVES = new Set<Moves>([...GENERIC_Z_MOVES, ...SIGNATURE_Z_MOVES]);

export function isZMove(move: Moves): boolean {
  return Z_MOVES.has(move);
}

/**
 * What a type Z-Move hits with, read off the move it replaces: the
 * mainline's table by base power, and 100 for a move that deals fixed
 * damage or has no power at all
 */
export function zPowerOf(base: Moves): number {
  const override = Z_POWER_OVERRIDES[base];

  if (override != null) {
    return override;
  }

  const power = getMoveData(base).power ?? 0;

  if (power >= 140) {
    return 200;
  }
  if (power >= 130) {
    return 195;
  }
  if (power >= 120) {
    return 190;
  }
  if (power >= 110) {
    return 185;
  }
  if (power >= 100) {
    return 180;
  }
  if (power >= 90) {
    return 175;
  }
  if (power >= 80) {
    return 160;
  }
  if (power >= 70) {
    return 140;
  }
  if (power >= 60) {
    return 120;
  }
  return 100;
}

/** Whether a move is one a crystal may turn into its Z-Move at all */
export function canBecomeZMove(move: Moves): boolean {
  return getMoveData(move).category !== MoveCategories.Status && !Z_MOVES.has(move);
}

export { Z_STATUS_EFFECTS, type ZStatusEffect };
