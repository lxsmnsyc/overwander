import registerBalls from './balls';
import registerBattleBerries from './berries';
import registerEvolutionStones from './stones';

export { getItemData, registerItem } from './__create';
export type { ItemData } from './__create';

export default function registerItems(): void {
  registerBalls();
  registerBattleBerries();
  registerEvolutionStones();
}
