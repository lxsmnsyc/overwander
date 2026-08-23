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
  /**
   * The unit is mid-switch, walking to its new spot: it cannot act,
   * and nothing reaches it on the way
   */
  Switching = 22,
}

/**
 * The statuses a pokemon carries out of a battle, as a bitfield of
 * their own.
 *
 * They are numbered here rather than shifted out of `Statuses`, and
 * that is the point: a stored record should not have its layout
 * decided by where a status happens to sit in an enum the battle
 * engine owns. Six flags cover everything a fight can leave behind,
 * they start at the first bit whatever the engine renumbers, and a
 * volatile status has no bit at all — so a report that claims one
 * cannot be written by accident.
 *
 * Everything else — confusion, flinching, a substitute, the field's
 * own effects — belongs to the fight and ends with it.
 */
export const enum StatusFlags {
  Poisoned = 0b00_0001,
  BadlyPoisoned = 0b00_0010,
  Sleeping = 0b00_0100,
  Paralyzed = 0b00_1000,
  Burned = 0b01_0000,
  Frozen = 0b10_0000,
}

/**
 * Which flag stands for which status. It is the only place the two
 * numberings meet, so a status the record cannot hold is simply
 * missing from it
 */
const STATUS_FLAGS = new Map<Statuses, StatusFlags>([
  [Statuses.Poisoned, StatusFlags.Poisoned],
  [Statuses.BadlyPoisoned, StatusFlags.BadlyPoisoned],
  [Statuses.Sleeping, StatusFlags.Sleeping],
  [Statuses.Paralyzed, StatusFlags.Paralyzed],
  [Statuses.Burned, StatusFlags.Burned],
  [Statuses.Frozen, StatusFlags.Frozen],
]);

/**
 * The statuses a pokemon carries out of a battle, in the order they
 * are read out. What a catch record keeps, what a Full Heal takes off
 * and what a battle report may write are all this list
 */
export const NON_VOLATILE_STATUSES: Statuses[] = [...STATUS_FLAGS.keys()];

/**
 * One status as its stored bit, or zero for a status no record keeps.
 * A pokemon carries several at once, so what it is carrying is a set
 * — and a set of named things is a bitfield, which is how it is
 * stored and how a cure is applied: a Full Heal is one mask off
 * another rather than a filtered list
 */
export function statusFlag(status: Statuses): number {
  return STATUS_FLAGS.get(status) ?? 0;
}

/**
 * The status a stored bit stands for, or null when the bit is not one
 * of the six
 */
export function flagStatus(flag: number): Statuses | null {
  for (const [status, bit] of STATUS_FLAGS) {
    // The comparison is against a stored bit rather than another
    // member of the enum, which is the whole job of this function
    // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
    if (bit === flag) {
      return status;
    }
  }
  return null;
}

/**
 * Several statuses as one mask. Anything volatile drops out on the
 * way in, since it has no bit to set
 */
export function packStatuses(statuses: Statuses[]): number {
  let mask = 0;

  for (const status of statuses) {
    mask |= statusFlag(status);
  }
  return mask;
}

/**
 * The mask read back out as a list, in the order the flags are
 * numbered
 */
export function unpackStatuses(mask: number): Statuses[] {
  return NON_VOLATILE_STATUSES.filter((status) => (mask & statusFlag(status)) !== 0);
}

/**
 * The mask as it settles onto the record after a fight: bad poison
 * eases into ordinary poison, the way the mainline writes it home
 */
export function settleStatuses(mask: number): number {
  if ((mask & StatusFlags.BadlyPoisoned) !== 0) {
    return (mask & ~StatusFlags.BadlyPoisoned) | StatusFlags.Poisoned;
  }
  return mask;
}

/**
 * Everything a pokemon can carry out of a battle, as one mask: what a
 * report is filtered through, and what a Full Heal takes off
 */
export const NON_VOLATILE_MASK = packStatuses(NON_VOLATILE_STATUSES);

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
