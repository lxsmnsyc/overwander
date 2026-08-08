import { registerBattleBerries } from './berries';

export type { ItemData } from './__create';
export { getItemData, registerItem } from './__create';

export function registerItems() {
  registerBattleBerries();
}
