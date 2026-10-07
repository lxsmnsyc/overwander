import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { createForeignBodyAbility } from './__create';

/**
 * The Ultra Beasts, told on one axis: each came from another world, so
 * the type this one would beat it with first lands only as hard as any
 * other. Each shrugs off its own worst weakness
 */
const setupAbilities = [
  createForeignBodyAbility(Abilities.Earthless, Types.Ground),
  createForeignBodyAbility(Abilities.Windbreak, Types.Flying),
  createForeignBodyAbility(Abilities.GaleWard, Types.Flying),
  createForeignBodyAbility(Abilities.Unearthed, Types.Ground),
  createForeignBodyAbility(Abilities.HeatShield, Types.Fire),
  createForeignBodyAbility(Abilities.Fireproof, Types.Fire),
  createForeignBodyAbility(Abilities.Unenchanted, Types.Fairy),
  createForeignBodyAbility(Abilities.ClosedMind, Types.Psychic),
  createForeignBodyAbility(Abilities.DeepFooting, Types.Ground),
  createForeignBodyAbility(Abilities.DryFuse, Types.Water),
];

export default setupAbilities;
