import Abilities from '../../../data/ids/abilities';
import { Species } from '../../../data/ids/species';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { createCreedAbility } from './__create';

/** Whether a status condition is on this unit */
function ailing(unit: Unit): boolean {
  for (const status of MAJOR_STATUS_CONDITIONS) {
    if (unit.status[status] != null) {
      return true;
    }
  }

  return false;
}

/** Whether this unit stands anywhere above where it started */
function raised(unit: Unit): boolean {
  for (const stage of Object.values(unit.stages)) {
    if (stage > 0) {
      return true;
    }
  }

  return false;
}

/**
 * The dragon that was torn in three, each half keeping the conviction
 * it was torn over: the white one presses what is already marked, the
 * black one presses what has talked itself up, and the husk presses
 * what is still untouched
 */
/**
 * The creed each fused shape brings out of the dragon inside it, worn
 * with the shape by a holder that was granted the husk's own. Kept
 * here rather than asked of the signature registry, which knows a
 * family's creed but nothing about what is folded into a shape
 */
export const FOLDED_CREEDS = new Map<Species, Abilities>([
  [Species.KyuremBlack, Abilities.IdealCreed],
  [Species.KyuremWhite, Abilities.TruthCreed],
]);

/** The creed a fusion has to be keeping before it is handed a second */
export const HUSK_CREED = Abilities.HollowCreed;

const setupAbilities = [
  createCreedAbility(Abilities.TruthCreed, ailing),
  createCreedAbility(Abilities.IdealCreed, raised),
  createCreedAbility(Abilities.HollowCreed, (unit) => !ailing(unit) && !raised(unit)),
];

export default setupAbilities;
