import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { createAudienceAbility } from './__create';

/**
 * Alola's three starters, each playing to a crowd: the archer and the
 * heel read the far side, the singer reads her own team
 */
const setupAbilities = [
  createAudienceAbility(Abilities.QuillAudience, Stats.Speed, 'enemies'),
  createAudienceAbility(Abilities.HeelAudience, Stats.Attack, 'enemies'),
  createAudienceAbility(Abilities.AriaAudience, Stats.SpecialAttack, 'team'),
];

export default setupAbilities;
