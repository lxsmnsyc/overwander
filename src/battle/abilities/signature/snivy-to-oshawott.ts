import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { EffectType } from '../../events';
import { createOpeningAbility } from './__create';

/** What the first blow is worth with the fire behind it */
const EMBER_SCALE = 1.5;

/** How much shell goes up in front of the otter */
const SHELL_STAGES = 2;

/**
 * Unova's three starters, each opening the fight its own way on the
 * first move it lands: the snake slows what it hit, the boar puts its
 * weight behind the blow, the otter gets its shell up
 */
const setupAbilities = [
  createOpeningAbility(Abilities.LeafOpening, ({ source, target }) => {
    target.addStage(Stages.Speed, -1, {
      type: EffectType.Ability,
      ability: Abilities.LeafOpening,
      unit: source,
    });
  }),

  createOpeningAbility(Abilities.EmberOpening, ({ event }) => {
    event.value *= EMBER_SCALE;
  }),

  createOpeningAbility(Abilities.ShellOpening, ({ source }) => {
    source.addStage(Stages.Defense, SHELL_STAGES, {
      type: EffectType.Ability,
      ability: Abilities.ShellOpening,
      unit: source,
    });
  }),
];

export default setupAbilities;
