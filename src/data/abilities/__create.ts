import type Abilities from '../ids/abilities';
import type Families from '../ids/families';

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

/**
 * Every ability the game has registered. It is what turns a name
 * somebody typed back into an id — a search cannot ask the store for
 * "Blaze" without one
 */
export function getRegisteredAbilities(): Abilities[] {
  return [...ABILITY_DATA.keys()];
}

export function getAbilityData(ability: Abilities): AbilityData {
  const result = ABILITY_DATA.get(ability);
  if (result) {
    return result;
  }
  throw new Error('Missing ability data for ' + ability);
}

/**
 * The signature ability each family was given, remembered under the
 * family rather than the species, since every stage of a line shares
 * one and nothing rolls it at birth
 */
const SIGNATURE_ABILITIES = new Map<Families, Abilities>();

/**
 * Register a family's signature. It is an ability like any other, so
 * it goes in the same store; the family is kept beside it because a
 * signature is granted, and something has to be able to ask which one
 * a line is owed
 */
export function registerSignature(family: Families, ability: Abilities, data: AbilityData): void {
  registerAbility(ability, data);
  SIGNATURE_ABILITIES.set(family, ability);
}

/**
 * The signature a family is owed, or null for a family that has none
 * yet: the band is filled a region at a time
 */
export function getSignatureAbility(family: Families): Abilities | null {
  return SIGNATURE_ABILITIES.get(family) ?? null;
}
