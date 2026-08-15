import type Abilities from '../ids/abilities';

export interface AbilityData {
  name: string;

  /**
   * What it does, in one line, said the way this engine actually does
   * it rather than the way the mainline describes it — Analytic
   * answers a committed target here, not one that moved second.
   *
   * Required, so an ability cannot be added without somebody saying
   * what it is for, and short enough to sit under the name in a list
   */
  description: string;
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
