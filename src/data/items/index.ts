import registerBattleBerries from './berries';

export { getItemData, registerItem } from './__create';
export type { ItemData } from './__create';

export default function registerItems(): void {
  registerBattleBerries();
}
