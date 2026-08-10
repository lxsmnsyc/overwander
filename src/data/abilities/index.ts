import registerGen1Abilities from './gen-1';

export { getAbilityData, registerAbility } from './__create';
export type { AbilityData } from './__create';

export default function registerAbilities(): void {
  registerGen1Abilities();
}
