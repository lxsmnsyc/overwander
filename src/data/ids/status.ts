export const enum Statuses {
  Seeding = 0,
  Poisoned = 1,
  Sleeping = 2,
  BadlyPoisoned = 3,
  Paralyzed = 4,
  Minimized = 5,
  Invulnerable = 6,
  Raging = 7,
  Biding = 8,
  Confused = 9,
  Recharging = 10,
  Substituted = 11,
  Burned = 12,
  Trapped = 13,
  Flinched = 14,
  Frozen = 15,
  FocusEnergy = 16,
  Infatuated = 17,
  /**
   * The unit is forced onto the ground (e.g. by Gravity or Smack
   * Down), overriding any airborne trait
   */
  Grounded = 18,
  /**
   * The unit hovers above the ground (e.g. a held Balloon, Fly's
   * airborne step)
   */
  Floating = 19,
  /**
   * The unit is underwater (e.g. Dive's hidden step)
   */
  Submerged = 20,
  /**
   * The unit is warming up and cannot act (e.g. a Boss entering the
   * field for the first time)
   */
  Dormant = 21,
}

/**
 * The statuses a pokemon carries out of a battle. Everything else —
 * confusion, flinching, a substitute, the field's own effects — is
 * volatile: it belongs to the fight and ends with it.
 *
 * It lives with the ids because it is a property of the statuses
 * themselves: what a catch record keeps, what a Full Heal takes off
 * and what a battle report is allowed to write are all the same list
 */
export const NON_VOLATILE_STATUSES: Statuses[] = [
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Sleeping,
  Statuses.Paralyzed,
  Statuses.Burned,
  Statuses.Frozen,
];

export const enum Weathers {
  None = 0,
  Sunny = 1,
  Rain = 2,
  Sandstorm = 3,
  Hail = 4,
  Snow = 5,
  Fog = 6,
  ExtremeSunny = 7,
  HeavyRain = 8,
  StrongWinds = 9,
}

export const enum Terrains {
  None = 0,
}

export const enum TeamStatuses {
  Reflect = 0,
  /**
   * An enemy Unnerve unit is on the field; the team cannot eat berries
   */
  Unnerved = 1,
  LightScreen = 2,
  /**
   * The team is shrouded in mist; other units cannot lower its
   * members' stages
   */
  Mist = 3,
}
