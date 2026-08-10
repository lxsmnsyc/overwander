import registerBalls from './balls';
import registerBattleBerries from './berries';
import registerCandyItems from './candy-items';
import registerGems from './gems';
import registerIncenses from './incenses';
import registerKeyItems from './key-items';
import registerMachines from './machines';
import registerOrbs from './orbs';
import registerPlates from './plates';
import registerRaidItems from './raid-items';
import registerStatBoosters from './stat-boosters';
import registerEvolutionStones from './stones';
import registerTypeBoosters from './type-boosters';
import registerValuables from './valuables';

export { getItemData, registerItem } from './__create';
export type { ItemData } from './__create';
export { getTeachableMoves } from './machines';

/**
 * The machines are generated from the species learn sets, so the
 * species and their moves have to be registered before this runs
 */
export default function registerItems(): void {
  registerBalls();
  registerBattleBerries();
  registerEvolutionStones();
  registerTypeBoosters();
  registerStatBoosters();
  registerIncenses();
  registerGems();
  registerOrbs();
  registerPlates();
  registerCandyItems();
  registerKeyItems();
  registerRaidItems();
  registerValuables();
  registerMachines();
}
