import { Types } from '../constants/types';
import { MoveCategories, Moves } from '../ids/moves';
import { getMoveData } from './__create';

/**
 * The Z-Moves: what a held Z-Crystal turns a move into, once a side a
 * fight. The battle side is in `src/battle/moves/z-moves.ts`
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
 * What a type Z-Move hits with, for the moves the table by power gets
 * wrong: the ones with no power of their own, and a few the mainline
 * rounds its own way
 */
const Z_POWER_OVERRIDES: { [key in Moves]?: number } = {
  [Moves.MegaDrain]: 120,
  [Moves.WeatherBall]: 160,
  [Moves.Hex]: 160,
  [Moves.GearGrind]: 180,
  [Moves.VCreate]: 220,
  [Moves.FlyingPress]: 170,
  [Moves.CoreEnforcer]: 140,
  [Moves.StoredPower]: 160,
  [Moves.PowerTrip]: 160,
  [Moves.Fissure]: 180,
  [Moves.HornDrill]: 180,
  [Moves.Guillotine]: 180,
  [Moves.SheerCold]: 180,
  [Moves.FinalGambit]: 180,
  [Moves.Return]: 160,
  [Moves.Frustration]: 160,
  [Moves.Flail]: 160,
  [Moves.Reversal]: 160,
  [Moves.LowKick]: 160,
  [Moves.GrassKnot]: 160,
  [Moves.HeavySlam]: 160,
  [Moves.HeatCrash]: 160,
  [Moves.GyroBall]: 160,
  [Moves.ElectroBall]: 160,
  [Moves.Punishment]: 160,
  [Moves.TrumpCard]: 160,
  [Moves.NaturalGift]: 160,
  [Moves.Endeavor]: 160,
  [Moves.Magnitude]: 140,
  [Moves.CrushGrip]: 190,
  [Moves.WringOut]: 190,
  [Moves.Eruption]: 200,
  [Moves.WaterSpout]: 200,
};

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
