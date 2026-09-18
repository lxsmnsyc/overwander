import { Items } from '../../data/ids/items';
import type Unit from '../unit';

/**
 * What the ground has been laid with, and who feels it.
 *
 * Spikes, toxic spikes and stealth rock each bite as a unit arrives
 * rather than on a clock, and each has its own module. What they share
 * is who is spared: anything that never touches the ground, and
 * anything wearing the boots.
 */

/**
 * Heavy-Duty Boots: its holder walks over whatever was laid at its
 * feet. It is checked where each hazard bites rather than as a veto on
 * the damage, because a toxic spike poisons instead of hurting and
 * there would be no damage to refuse
 */
export default function walksOverHazards(unit: Unit): boolean {
  return unit.hasItem(Items.HeavyDutyBoots);
}
