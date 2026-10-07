import Abilities from '../../data/ids/abilities';

/**
 * Special-tier abilities that can never be disabled (e.g. by
 * Neutralizing Gas or Mold Breaker). Kept in a leaf of its own so the
 * factories may read it without importing the abilities that use it
 */
const PROTECTED_ABILITIES = new Set<Abilities>([Abilities.Boss, Abilities.Shadow, Abilities.Totem]);

/**
 * The ones Mold Breaker and the moves that pierce like it cannot see
 * past, though Neutralizing Gas still quiets them
 */
export const MOLD_PROOF_ABILITIES = new Set<Abilities>([
  Abilities.FullMetalBody,
  Abilities.ShadowShield,
  Abilities.PrismArmor,
]);

export default PROTECTED_ABILITIES;
