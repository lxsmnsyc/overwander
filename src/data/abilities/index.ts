import registerGen1Abilities from './gen-1';
import registerGen2Abilities from './gen-2';

export { getAbilityData, getRegisteredAbilities, registerAbility } from './__create';
export type { AbilityData } from './__create';

export default function registerAbilities(): void {
  registerGen1Abilities();
  registerGen2Abilities();
}
