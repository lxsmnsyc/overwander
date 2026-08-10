import type Abilities from '../ids/abilities';

export interface AbilityData {
  name: string;
}

const ABILITY_DATA = new Map<Abilities, AbilityData>();

export function registerAbility(ability: Abilities, data: AbilityData): void {
  ABILITY_DATA.set(ability, data);
}

export function getAbilityData(ability: Abilities): AbilityData {
  const result = ABILITY_DATA.get(ability);
  if (result) {
    return result;
  }
  throw new Error('Missing ability data for ' + ability);
}
