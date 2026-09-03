export const enum MoveCategories {
  Physical = 0,
  Special = 1,
  Status = 2,
}

export const MOVE_CATEGORY_NAMES: Record<MoveCategories, string> = {
  [MoveCategories.Physical]: 'Physical',
  [MoveCategories.Special]: 'Special',
  [MoveCategories.Status]: 'Status',
};

/**
 * What each kind of move is marked with. A move sheet is read at a
 * glance — which of these a move is decides whether it reads Attack or
 * Special Attack — so the mark is a colour rather than a word, with
 * the word left to the label a reader can hover or hear
 */
export const MOVE_CATEGORY_COLORS: Record<MoveCategories, string> = {
  [MoveCategories.Physical]: '#c92c2c',
  [MoveCategories.Special]: '#4f5ad7',
  [MoveCategories.Status]: '#8a8a8a',
};

/**
 * How a move is cast: what the caster points at when the cast opens.
 *
 * `Unit` and `Team` name one of each, chosen before the cast starts
 * and carried through to whatever the move does. `None` names
 * nobody: a spread move, a field effect and a move on the user
 * itself are all cast the same way, and who the move reaches is its
 * `affects` mask instead
 */
export const enum MoveTargets {
  None = 0,
  Unit = 1,
  Team = 2,
}

/**
 * Who a move reaches. It answers two things at once: the shape it
 * lands on (`Unit` or `Team`, and neither means the move lands on
 * nothing in particular) and the sides it reaches.
 *
 * For a move cast at one unit or one team the mask is what the
 * caster may point at; for one cast at nobody it is the fan-out
 * itself. A move that names no mask takes the default for the way it
 * is cast, which is the enemy side
 */
export const enum MoveAffects {
  // Reaches the caster itself
  Self = 0b0000001,

  // Lands on units
  Unit = 0b0000010,

  // Lands on whole teams
  Team = 0b0000100,

  // Reaches the caster's own team: this trainer's party
  Own = 0b0001000,

  // Reaches another team under the same alliance: another trainer's
  // party, which only a co-op raid has
  Ally = 0b0010000,

  // Reaches the other side
  Enemy = 0b0100000,

  /**
   * Reaches pokemon that are already down, and teams with nobody left
   * standing.
   *
   * Off by default, which is the whole point of it: a move that goes
   * out to everybody used to go out to the fallen as well — a spread
   * attack spent a hit on every knocked-out pokemon on the far side,
   * and a team wiped out an hour ago still counted as somewhere to
   * aim. Nothing came of it, because the damage refuses a unit that is
   * not alive, but it happened, and anything watching the field saw it
   * happen.
   *
   * A move that genuinely wants them — a revival, something that acts
   * on the fallen — says so here
   */
  Fainted = 0b1000000,
}

/**
 * Every side a mask can name, for asking which of them it names
 */
export const MOVE_AFFECT_SIDES =
  MoveAffects.Self | MoveAffects.Own | MoveAffects.Ally | MoveAffects.Enemy;

/**
 * Whether a mask reaches the other side and nobody else. It is the
 * question two places ask of an attack: whether pointing it at one's
 * own side is something the move itself never had in mind
 */
export function affectsFoesOnly(affects: number): boolean {
  // The comparison is between a masked number and one flag of the
  // enum, which is the whole job of this function
  // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
  return (affects & MOVE_AFFECT_SIDES) === MoveAffects.Enemy;
}

export const enum MoveFlags {
  /**
   * Move makes contact with the target
   */
  Contact = 0b001,
  /**
   * Sound-based
   */
  Sound = 0b010,
  /**
   * Powder- or spore-based (blocked by e.g. Overcoat)
   */
  Powder = 0b100,
  /**
   * Bites, chews or gnaws (boosted by e.g. Strong Jaw)
   */
  Bite = 0b1000,
  /**
   * Cuts with a blade or an edge (boosted by e.g. Sharpness)
   */
  Slicing = 0b10000,
}

export const enum MoveAttackFlags {
  /**
   * Move deals direct damage (with no boost from stages/type effectiveness)
   */
  Pure = 0b00001,
  /**
   * Move can deal a critical
   */
  Critical = 0b00010,
  /**
   * Move is non-lethal
   */
  NonLethal = 0b00100,
  /**
   * Reserved for Confused status
   */
  Confused = 0b01000,
  /**
   * The attack is a simulation (e.g. AI damage estimation), not an
   * actual attack — listeners with side effects (visual cues, state
   * tracking) should ignore it
   */
  Simulated = 0b10000,
  /**
   * The attack pierces damage-absorbing shields (e.g. Substitute)
   */
  Piercing = 0b100000,
  /**
   * The attack's amount derives from the target's health (e.g. OHKO
   * moves, Super Fang)
   */
  HealthScaled = 0b1000000,
}

export const enum DamageFlags {
  /**
   * The damage doesn't knock-out the unit
   */
  NonLethal = 0b0001,
  /**
   * The damage is done indirectly (either by status, recoil, etc.)
   */
  Indirect = 0b0010,
  /**
   * The damage pierces damage-absorbing shields (e.g. Substitute)
   */
  Piercing = 0b0100,
  /**
   * The amount derives from the recipient's health (e.g. OHKO moves,
   * residual max-HP fractions)
   */
  HealthScaled = 0b1000,
  /**
   * Health the unit spends on purpose rather than loses: a
   * Substitute's price, an Explosion's own life. It is indirect like
   * any other cost, but nothing that shrugs off indirect damage gets
   * to skip paying — an effect a unit chose is not something done to
   * it
   */
  Cost = 0b1_0000,

  /**
   * Indirect is negated by abilities, this one is the work-around
   */
  Pure = 0b10_0000,
}

export const enum StatFlags {
  Attack = 0b0001,
  Critical = 0b0010,
}

export const enum MoveTargetPriorities {
  Strongest = 0,
  Weakest = 1,
  Random = 2,
}

export const enum Moves {
  /**
   * The three moves nobody knows.
   *
   * None of them is a move a pokemon carries: Struggle is what is
   * thrown when there is nothing left to throw, `_Confused` is the hit
   * a confused pokemon lands on itself, and Attack is the plain swing
   * a pokemon falls back on while everything it actually knows is
   * cooling. They are numbered a long way past the rest for the same
   * reason the placeholder species are — a move id is a slot in the
   * dex, and these do not have one — and having them out of the range
   * means a record holding a real move can never collide with them
   */
  Struggle = 100000,
  _Confused = 100001,
  Attack = 100002,
  Tackle = 1,
  Growl = 2,
  LeechSeed = 3,
  VineWhip = 4,
  PoisonPowder = 5,
  RazorLeaf = 6,
  Growth = 7,
  SolarBeam = 8,
  SwordsDance = 9,
  Toxic = 10,
  BodySlam = 11,
  TakeDown = 12,
  DoubleEdge = 13,
  Rage = 14,
  MegaDrain = 15,
  Mimic = 16,
  DoubleTeam = 17,
  Bide = 18,
  Reflect = 19,
  Rest = 20,
  HyperBeam = 21,
  SleepPowder = 22,
  Cut = 23,
  Substitute = 24,
  Scratch = 25,
  Ember = 26,
  Leer = 27,
  Slash = 28,
  Flamethrower = 29,
  FireSpin = 30,
  MegaPunch = 31,
  MegaKick = 32,
  Submission = 33,
  SeismicToss = 34,
  DragonRage = 35,
  Dig = 36,
  FireBlast = 37,
  Swift = 38,
  SkullBash = 39,
  Strength = 40,
  Earthquake = 41,
  Fissure = 42,
  Fly = 43,
  TailWhip = 44,
  Bubble = 45,
  WaterGun = 46,
  Bite = 47,
  Withdraw = 48,
  HydroPump = 49,
  BubbleBeam = 50,
  IceBeam = 51,
  Blizzard = 52,
  Counter = 53,
  Surf = 54,
  StringShot = 55,
  Harden = 56,
  Confusion = 57,
  StunSpore = 58,
  Supersonic = 59,
  Whirlwind = 60,
  Psybeam = 61,
  Psychic = 62,
  Psywave = 63,
  Teleport = 64,
  Flash = 65,
  PoisonSting = 66,
  FuryAttack = 67,
  FocusEnergy = 68,
  Twineedle = 69,
  PinMissile = 70,
  Agility = 71,
  Gust = 72,
  SandAttack = 73,
  QuickAttack = 74,
  WingAttack = 75,
  MirrorMove = 76,
  RazorWind = 77,
  SkyAttack = 78,
  HyperFang = 79,
  SuperFang = 80,
  Peck = 81,
  DrillPeck = 82,
  Wrap = 83,
  Glare = 84,
  Screech = 85,
  Acid = 86,
  RockSlide = 87,
  ThunderShock = 88,
  ThunderWave = 89,
  Thunder = 90,
  Thunderbolt = 91,
  PayDay = 92,
  FurySwipes = 93,
  DoubleKick = 94,
  HornAttack = 95,
  HornDrill = 96,
  Thrash = 97,
  Pound = 98,
  Sing = 99,
  DoubleSlap = 100,
  Minimize = 101,
  Metronome = 102,
  DefenseCurl = 103,
  LightScreen = 104,
  Roar = 105,
  ConfuseRay = 106,
  Disable = 107,
  LeechLife = 108,
  Haze = 109,
  Absorb = 110,
  PetalDance = 111,
  Spore = 112,
  KarateChop = 113,
  Hypnosis = 114,
  Amnesia = 115,
  Recover = 116,
  LowKick = 117,
  Slam = 118,
  Constrict = 119,
  Barrier = 120,
  RockThrow = 121,
  SelfDestruct = 122,
  Explosion = 123,
  Stomp = 124,
  Headbutt = 125,
  SonicBoom = 126,
  TriAttack = 127,
  AuroraBeam = 128,
  PoisonGas = 129,
  Sludge = 130,
  Clamp = 131,
  SpikeCannon = 132,
  Lick = 133,
  NightShade = 134,
  DreamEater = 135,
  Bind = 136,
  Meditate = 137,
  ViceGrip = 138,
  Guillotine = 139,
  Crabhammer = 140,
  Barrage = 141,
  EggBomb = 142,
  BoneClub = 143,
  Bonemerang = 144,
  CometPunch = 145,
  FirePunch = 146,
  IcePunch = 147,
  ThunderPunch = 148,
  RollingKick = 149,
  JumpKick = 150,
  HiJumpKick = 151,
  Smog = 152,
  SmokeScreen = 153,
  DizzyPunch = 154,
  Waterfall = 155,
  LovelyKiss = 156,
  Splash = 157,
  Mist = 158,
  Transform = 159,
  AcidArmor = 160,
  Sharpen = 161,
  Conversion = 162,
  Kinesis = 163,
  SoftBoiled = 164,

  /**
   * The weather moves. They are the only way anything without the
   * ability for it can put weather on the field, which is what the
   * whole weather half of the engine — the chip damage, the abilities
   * that read the sky, the items that shelter from it — has been
   * waiting for
   */
  RainDance = 165,
  SunnyDay = 166,
  Sandstorm = 167,
  Hail = 168,

  /**
   * The Johto moves. Two new types arrive with them, Dark and Steel,
   * and with them the first moves that read the sky rather than only
   * making it: Solar Beam had the weather, these have the healing
   * that follows it
   */
  Sketch = 169,
  TripleKick = 170,
  Thief = 171,
  SpiderWeb = 172,
  MindReader = 173,
  Nightmare = 174,
  FlameWheel = 175,
  Snore = 176,
  Curse = 177,
  Flail = 178,
  Conversion2 = 179,
  Aeroblast = 180,
  CottonSpore = 181,
  Reversal = 182,
  Spite = 183,
  PowderSnow = 184,
  Protect = 185,
  MachPunch = 186,
  ScaryFace = 187,
  FeintAttack = 188,
  SweetKiss = 189,
  BellyDrum = 190,
  SludgeBomb = 191,
  MudSlap = 192,
  Octazooka = 193,
  Spikes = 194,
  ZapCannon = 195,
  Foresight = 196,
  DestinyBond = 197,
  PerishSong = 198,
  IcyWind = 199,
  Detect = 200,
  BoneRush = 201,
  LockOn = 202,
  Outrage = 203,
  GigaDrain = 204,
  Endure = 205,
  Charm = 206,
  Rollout = 207,
  FalseSwipe = 208,
  Swagger = 209,
  MilkDrink = 210,
  Spark = 211,
  FuryCutter = 212,
  SteelWing = 213,
  MeanLook = 214,
  Attract = 215,
  SleepTalk = 216,
  HealBell = 217,
  Return = 218,
  Present = 219,
  Frustration = 220,
  Safeguard = 221,
  PainSplit = 222,
  SacredFire = 223,
  Magnitude = 224,
  DynamicPunch = 225,
  Megahorn = 226,
  DragonBreath = 227,
  BatonPass = 228,
  Encore = 229,
  Pursuit = 230,
  RapidSpin = 231,
  SweetScent = 232,
  IronTail = 233,
  MetalClaw = 234,
  VitalThrow = 235,
  MorningSun = 236,
  Synthesis = 237,
  Moonlight = 238,
  HiddenPower = 239,
  CrossChop = 240,
  Twister = 241,
  Crunch = 242,
  MirrorCoat = 243,
  PsychUp = 244,
  ExtremeSpeed = 245,
  AncientPower = 246,
  ShadowBall = 247,
  FutureSight = 248,
  RockSmash = 249,
  Whirlpool = 250,
  BeatUp = 251,
}
