import registerBalls from './balls';
import registerBattleItems from './battle-items';
import registerBattleBerries from './berries';
import registerBottleCaps from './bottle-caps';
import registerCandyItems from './candy-items';
import registerDrinks from './drinks';
import registerFossils from './fossils';
import registerGear from './gear';
import registerGems from './gems';
import registerHeartScale from './heart-scale';
import registerHoney from './honey';
import registerIncenses from './incenses';
import registerKeyItems from './key-items';
import registerMachines from './machines';
import registerMedicines from './medicine';
import registerOneShots from './one-shots';
import registerOrbs from './orbs';
import registerPlates from './plates';
import registerPortalKey from './portal-key';
import registerPowerItems from './power-items';
import registerPurifyingGem from './purifying-gem';
import registerRareCandy from './rare-candy';
import registerSacredAsh from './sacred-ash';
import registerRaidItems from './raid-items';
import registerStatBoosters from './stat-boosters';
import registerEvolutionStones from './stones';
import registerTradeItems from './trade-items';
import registerTreats from './treats';
import registerTrinkets from './trinkets';
import registerUtilityBelt from './utility-belt';
import registerTypeBoosters from './type-boosters';
import registerValuables from './valuables';
import registerVitamins from './vitamins';
import registerWings from './wings';

export { getItemData, listItemsByType, registerItem } from './__create';
export type { ItemData } from './__create';
export { getTeachableMoves } from './machines';
export { FOSSIL_SPECIES, getSpeciesFossil, isFossil, listFossils } from './fossils';
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
  registerDrinks();
  registerTreats();
  registerEvolutionStones();
  registerTradeItems();
  registerTypeBoosters();
  registerStatBoosters();
  registerGear();
  registerOneShots();
  registerBattleItems();
  registerIncenses();
  registerTrinkets();
  registerPowerItems();
  registerGems();
  registerOrbs();
  registerPlates();
  registerCandyItems();
  registerRareCandy();
  registerBottleCaps();
  registerUtilityBelt();
  registerPurifyingGem();
  registerSacredAsh();
  registerPortalKey();
  registerKeyItems();
  registerRaidItems();
  registerValuables();
  registerHeartScale();
  registerHoney();
  registerFossils();
  registerWings();
  registerVitamins();
  registerMachines();
}
