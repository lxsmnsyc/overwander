import { MoveCategories } from '../../data/ids/moves';
import type { Species } from '../../data/ids/species';
import { Stats } from '../../data/constants/stats';
import { getSpeciesData } from '../../data/species/__create';

/**
 * What a pokemon is on the sheet it was built for. Two cores take
 * things off the field, one leaning on each half of the split, and the
 * four behind them each hold one job: keeping the side healed, keeping
 * it protected, drawing the hits, and hampering the far side
 */
export const enum BuildRole {
  /** Hits hardest from Special Attack */
  SpecialCore = 0,
  /** Hits hardest from Attack */
  PhysicalCore = 1,
  /** The frailest able to heal, cure or raise the rest of the side */
  Healer = 2,
  /** Screens, guards and whatever else keeps the whole side standing */
  Protector = 3,
  /** The bulkiest able to draw the other side's moves onto itself */
  Redirector = 4,
  /** Lays statuses and hazards on the other side */
  FieldControl = 5,
}

/** Whether a role is one of the two built to hit */
export function isCoreRole(role: BuildRole): boolean {
  return role === BuildRole.SpecialCore || role === BuildRole.PhysicalCore;
}

/** The core a species makes on its own, by the stronger of its two attacking stats */
export function coreRoleOf(species: Species): BuildRole {
  const stats = getSpeciesData(species).stats;

  return stats[Stats.Attack] > stats[Stats.SpecialAttack]
    ? BuildRole.PhysicalCore
    : BuildRole.SpecialCore;
}

/** The half of the split a core leans on, and nothing for the other roles */
export function coreCategory(role: BuildRole): MoveCategories | null {
  if (role === BuildRole.SpecialCore) {
    return MoveCategories.Special;
  }
  return role === BuildRole.PhysicalCore ? MoveCategories.Physical : null;
}

/** What a status move is for, which is what a role has an opinion about */
export const enum StatusKind {
  /** A stat raised on the user, worth what the stat is worth to it */
  Setup = 0,
  /** Health back for the user */
  Heal = 1,
  /** A status or a drop laid on the other side */
  Cripple = 2,
  /** A screen or a guard laid over the whole side */
  Screen = 3,
  /** A sky, worth nothing unless something is waiting for it */
  Weather = 4,
  /** Something done for a teammate: a raise, a hand, a pass */
  Boost = 5,
  /** Health back for a teammate */
  Mend = 6,
  /** A status cleared off the side */
  Cure = 7,
  /** The user kept standing on its own: a Protect or a Substitute */
  Shield = 8,
  /** The other side's moves drawn onto the user */
  Redirect = 9,
  /** Something laid under the other side's feet */
  Hazard = 10,
  /** The field itself turned over: a room */
  Room = 11,
}
