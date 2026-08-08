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
  Contact = 0b01,
  /**
   * Sound-based
   */
  Sound = 0b10,
}

export const enum MoveAttackFlags {
  /**
   * Move deals direct damage (with no boost from stages/type effectiveness)
   */
  Pure = 0b0001,
  /**
   * Move can deal a critical
   */
  Critical = 0b0010,
  /**
   * Move is non-lethal
   */
  NonLethal = 0b0100,
  /**
   * Reserved for Confused status
   */
  Confused = 0b1000,
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
}
