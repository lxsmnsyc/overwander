import { Stages } from '../constants/stats';
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

/** What a type crystal adds to a status move of its type, just before the move goes off */
export type ZStatusEffect =
  | { kind: 'stages'; stages: readonly Stages[]; value: number }
  /** Back to full HP */
  | { kind: 'heal' }
  /** Every lowered stage back to 0 */
  | { kind: 'clear' }
  /** Critical hit ratio 2 stages up, as Focus Energy */
  | { kind: 'critical' }
  /** Draws the other side's moves, as Follow Me */
  | { kind: 'centre' }
  /** Full HP for a Ghost, Attack a stage for anything else */
  | { kind: 'curse' };

const ALL_STATS = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
] as const;

/** The mainline's stage Z-effects, by the stages raised and how far */
const Z_STAGE_EFFECTS: [stages: readonly Stages[], value: number, moves: Moves[]][] = [
  [
    [Stages.Attack],
    1,
    [
      Moves.Leer,
      Moves.TailWhip,
      Moves.Screech,
      Moves.Meditate,
      Moves.Sharpen,
      Moves.WillOWisp,
      Moves.Taunt,
      Moves.OdorSleuth,
      Moves.Howl,
      Moves.BulkUp,
      Moves.PowerTrick,
      Moves.HoneClaws,
      Moves.WorkUp,
      Moves.Rototiller,
      Moves.TopsyTurvy,
      Moves.LaserFocus,
    ],
  ],
  [[Stages.Attack], 2, [Moves.MirrorMove]],
  [[Stages.Attack], 3, [Moves.Splash]],
  [
    [Stages.Defense],
    1,
    [
      Moves.Growl,
      Moves.PoisonPowder,
      Moves.Toxic,
      Moves.Reflect,
      Moves.Withdraw,
      Moves.Harden,
      Moves.Roar,
      Moves.PoisonGas,
      Moves.SpiderWeb,
      Moves.Spikes,
      Moves.Charm,
      Moves.PainSplit,
      Moves.Torment,
      Moves.FeatherDance,
      Moves.Tickle,
      Moves.Block,
      Moves.ToxicSpikes,
      Moves.AquaRing,
      Moves.StealthRock,
      Moves.DefendOrder,
      Moves.WideGuard,
      Moves.QuickGuard,
      Moves.MatBlock,
      Moves.NobleRoar,
      Moves.FlowerShield,
      Moves.GrassyTerrain,
      Moves.FairyLock,
      Moves.PlayNice,
      Moves.SpikyShield,
      Moves.VenomDrench,
      Moves.BabyDollEyes,
      Moves.BanefulBunker,
      Moves.StrengthSap,
      Moves.TearfulLook,
    ],
  ],
  [
    [Stages.SpecialAttack],
    1,
    [
      Moves.Growth,
      Moves.ConfuseRay,
      Moves.MindReader,
      Moves.Nightmare,
      Moves.SweetKiss,
      Moves.TeeterDance,
      Moves.FakeTears,
      Moves.MetalSound,
      Moves.Gravity,
      Moves.MiracleEye,
      Moves.Embargo,
      Moves.Telekinesis,
      Moves.Soak,
      Moves.SimpleBeam,
      Moves.ReflectType,
      Moves.IonDeluge,
      Moves.Electrify,
      Moves.GearUp,
      Moves.PsychicTerrain,
      Moves.Instruct,
    ],
  ],
  [[Stages.SpecialAttack], 2, [Moves.PsychoShift, Moves.HealBlock]],
  [
    [Stages.SpecialDefense],
    1,
    [
      Moves.StunSpore,
      Moves.Whirlwind,
      Moves.Glare,
      Moves.ThunderWave,
      Moves.LightScreen,
      Moves.MeanLook,
      Moves.Flatter,
      Moves.Charge,
      Moves.Wish,
      Moves.Ingrain,
      Moves.MudSport,
      Moves.CosmicPower,
      Moves.WaterSport,
      Moves.WonderRoom,
      Moves.MagicRoom,
      Moves.Entrainment,
      Moves.CraftyShield,
      Moves.MistyTerrain,
      Moves.Confide,
      Moves.EerieImpulse,
      Moves.MagneticFlux,
      Moves.Spotlight,
    ],
  ],
  [
    [Stages.SpecialDefense],
    2,
    [Moves.MagicCoat, Moves.Imprison, Moves.Captivate, Moves.AromaticMist, Moves.Powder],
  ],
  [
    [Stages.Speed],
    1,
    [
      Moves.SleepPowder,
      Moves.StringShot,
      Moves.Supersonic,
      Moves.Sing,
      Moves.Hypnosis,
      Moves.LovelyKiss,
      Moves.ScaryFace,
      Moves.LockOn,
      Moves.Safeguard,
      Moves.Encore,
      Moves.RolePlay,
      Moves.Yawn,
      Moves.SkillSwap,
      Moves.GrassWhistle,
      Moves.GastroAcid,
      Moves.PowerSwap,
      Moves.GuardSwap,
      Moves.WorrySeed,
      Moves.GuardSplit,
      Moves.PowerSplit,
      Moves.AfterYou,
      Moves.Quash,
      Moves.StickyWeb,
      Moves.ElectricTerrain,
      Moves.ToxicThread,
      Moves.SpeedSwap,
      Moves.AuroraVeil,
      Moves.RainDance,
      Moves.SunnyDay,
      Moves.Sandstorm,
      Moves.Hail,
    ],
  ],
  [
    [Stages.Speed],
    2,
    [
      Moves.Trick,
      Moves.Recycle,
      Moves.Snatch,
      Moves.MeFirst,
      Moves.Switcheroo,
      Moves.AllySwitch,
      Moves.Bestow,
    ],
  ],
  [
    [Stages.Accuracy],
    1,
    [
      Moves.Mimic,
      Moves.FocusEnergy,
      Moves.DefenseCurl,
      Moves.SweetScent,
      Moves.Copycat,
      Moves.Defog,
      Moves.TrickRoom,
    ],
  ],
  [
    [Stages.Evasion],
    1,
    [
      Moves.Flash,
      Moves.SandAttack,
      Moves.SmokeScreen,
      Moves.Kinesis,
      Moves.Detect,
      Moves.Camouflage,
      Moves.LuckyChant,
      Moves.MagnetRise,
    ],
  ],
  [
    ALL_STATS,
    1,
    [
      Moves.Conversion,
      Moves.Sketch,
      Moves.TrickOrTreat,
      Moves.ForestsCurse,
      Moves.Geomancy,
      Moves.HappyHour,
      Moves.Celebrate,
      Moves.HoldHands,
      Moves.Purify,
    ],
  ],
];

const Z_OTHER_EFFECTS: [effect: ZStatusEffect, moves: Moves[]][] = [
  [
    { kind: 'heal' },
    [
      Moves.Teleport,
      Moves.Haze,
      Moves.Mist,
      Moves.Transform,
      Moves.Conversion2,
      Moves.Spite,
      Moves.BellyDrum,
      Moves.HealBell,
      Moves.PsychUp,
      Moves.Stockpile,
      Moves.Refresh,
      Moves.Aromatherapy,
    ],
  ],
  [
    { kind: 'clear' },
    [
      Moves.LeechSeed,
      Moves.SwordsDance,
      Moves.DoubleTeam,
      Moves.Rest,
      Moves.Substitute,
      Moves.Agility,
      Moves.Minimize,
      Moves.Disable,
      Moves.Spore,
      Moves.Amnesia,
      Moves.Recover,
      Moves.Barrier,
      Moves.AcidArmor,
      Moves.SoftBoiled,
      Moves.CottonSpore,
      Moves.Protect,
      Moves.PerishSong,
      Moves.Endure,
      Moves.Swagger,
      Moves.MilkDrink,
      Moves.Attract,
      Moves.BatonPass,
      Moves.MorningSun,
      Moves.Synthesis,
      Moves.Moonlight,
      Moves.Swallow,
      Moves.FollowMe,
      Moves.HelpingHand,
      Moves.TailGlow,
      Moves.SlackOff,
      Moves.IronDefense,
      Moves.CalmMind,
      Moves.DragonDance,
      Moves.Roost,
      Moves.RockPolish,
      Moves.NastyPlot,
      Moves.HealOrder,
      Moves.DarkVoid,
      Moves.Autotomize,
      Moves.RagePowder,
      Moves.QuiverDance,
      Moves.Coil,
      Moves.ShellSmash,
      Moves.HealPulse,
      Moves.ShiftGear,
      Moves.CottonGuard,
      Moves.KingsShield,
      Moves.ShoreUp,
      Moves.FloralHealing,
    ],
  ],
  [
    { kind: 'critical' },
    [Moves.Foresight, Moves.SleepTalk, Moves.Tailwind, Moves.Acupressure, Moves.HeartSwap],
  ],
  [{ kind: 'centre' }, [Moves.DestinyBond, Moves.Grudge]],
  [{ kind: 'curse' }, [Moves.Curse]],
];

/**
 * Each status move's Z-effect. Missing are the ones the mainline gives
 * none, and Memento, Parting Shot, Healing Wish and Lunar Dance, whose
 * Z-effect heals a replacement that never comes in here
 */
export const Z_STATUS_EFFECTS = new Map<Moves, ZStatusEffect>();

for (const [stages, value, moves] of Z_STAGE_EFFECTS) {
  for (const move of moves) {
    Z_STATUS_EFFECTS.set(move, { kind: 'stages', stages, value });
  }
}
for (const [effect, moves] of Z_OTHER_EFFECTS) {
  for (const move of moves) {
    Z_STATUS_EFFECTS.set(move, effect);
  }
}
