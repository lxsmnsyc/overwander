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
  Contact = 0b000001,
  Sound = 0b000010,
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
}

export const enum DamageFlags {
  /**
   * The damage doesn't knock-out the unit
   */
  NonLethal = 0b0001,
}

export const enum StatFlags {
  Attack = 0b0001,
  Critical = 0b0010,
}

export const enum MoveTargetPriorities {
  Strongest,
  Weakest,
  Random,
}

export const enum Moves {
  Tackle,
  Growl,
  LeechSeed,
  VineWhip,
}
