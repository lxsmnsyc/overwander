export const enum MoveCategories {
  Physical = 0,
  Special = 1,
  Status = 2,
}

export const enum MoveTargetFlags {
  // Target includes the source
  Self = 0b0000001,

  // Target is a unit
  Unit = 0b0000010,

  // Target is a team
  Team = 0b0000100,

  // Target is own unit/team
  Own = 0b0001000,

  // Target is an ally unit/team
  Ally = 0b0010000,

  // Target is an enemy unit/team
  Enemy = 0b0100000,

  // Target multiple units/teams
  Multiple = 0b1000000,
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
  _Confused = 0,
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
}
