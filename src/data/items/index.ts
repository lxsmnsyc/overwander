import registerBalls from './balls';
import registerBattleBerries from './berries';
import registerBottleCaps from './bottle-caps';
import registerCandyItems from './candy-items';
import registerGems from './gems';
import registerHeartScale from './heart-scale';
import registerIncenses from './incenses';
import registerKeyItems from './key-items';
import registerMachines from './machines';
import registerMedicines from './medicine';
import registerOrbs from './orbs';
import registerPlates from './plates';
import registerPortalKey from './portal-key';
import registerPurifyingGem from './purifying-gem';
import registerRaidItems from './raid-items';
import registerStatBoosters from './stat-boosters';
import registerEvolutionStones from './stones';
import registerTypeBoosters from './type-boosters';
import registerValuables from './valuables';
import registerWings from './wings';

export { getItemData, listItemsByType, registerItem } from './__create';
export type { ItemData } from './__create';
export { getTeachableMoves } from './machines';
export { ITEM_TYPE_NAMES, ITEM_TYPE_ORDER } from './names';
export { WING_EFFORT, WING_STATS, isWing } from './wings';

/**
 * The machines are generated from the species learn sets, so the
 * species and their moves have to be registered before this runs
 */
export default function registerItems(): void {
  registerBalls();
  registerBattleBerries();
  registerMedicines();
  registerEvolutionStones();
  registerTypeBoosters();
  registerStatBoosters();
  registerIncenses();
  registerGems();
  registerOrbs();
  registerPlates();
  registerCandyItems();
  registerBottleCaps();
  registerPurifyingGem();
  registerPortalKey();
  registerKeyItems();
  registerRaidItems();
  registerValuables();
  registerHeartScale();
  registerWings();
  registerMachines();
}
