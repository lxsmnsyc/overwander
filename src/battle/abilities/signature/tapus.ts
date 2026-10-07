import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { Terrains } from '../../../data/ids/status';
import { createBlessingAbility } from './__create';

/**
 * The four guardians of Alola, told on one axis: each blesses its own
 * team while its island's terrain is down, in a different stat
 */
const setupAbilities = [
  createBlessingAbility(Abilities.StormBlessing, Terrains.Electric, Stats.Speed),
  createBlessingAbility(Abilities.MindBlessing, Terrains.Psychic, Stats.SpecialAttack),
  createBlessingAbility(Abilities.WildBlessing, Terrains.Grassy, Stats.Attack),
  createBlessingAbility(Abilities.MistBlessing, Terrains.Misty, Stats.SpecialDefense),
];

export default setupAbilities;
