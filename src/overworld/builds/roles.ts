import { MoveCategories } from '../../data/ids/moves';
import type { Species } from '../../data/ids/species';
import { Stats } from '../../data/constants/stats';
import { getSpeciesData } from '../../data/species/__create';
import { BuildRole, StatusKind } from '../../data/ids/builds';

/** What a pokemon is on its sheet, and what a status move is for: `src/data/ids/builds.ts` */
export { BuildRole, StatusKind };

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
