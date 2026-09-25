import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Unova brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen5Abilities(): void {
  // Victini
  registerAbility(Abilities.VictoryStar, {
    name: 'Victory Star',
    description: 'Its whole team, itself included, throws moves at 1.1x accuracy.',
  });
  // Ferroseed
  registerAbility(Abilities.IronBarbs, {
    name: 'Iron Barbs',
    description: 'Whoever lands a contact move on it loses 1/8 of their HP to the spikes.',
  });
  // Zorua
  registerAbility(Abilities.Illusion, {
    name: 'Illusion',
    description: 'It takes the field looking like a teammate, until a move lands on it.',
  });
  // Yamask
  registerAbility(Abilities.Mummy, {
    name: 'Mummy',
    description:
      'Whoever lands a contact move on it loses one of their abilities and catches this one.',
  });
  // Cofagrigus
  registerAbility(Abilities.PerishBody, {
    name: 'Perish Body',
    description:
      'Whoever lands a contact move on it faints in 3 turns, and so does it. Once per battle.',
  });
  // Darmanitan
  registerAbility(Abilities.ZenMode, {
    name: 'Zen Mode',
    description: 'Below 1/2 HP it sits down into its Zen shape, and it stands back up above that.',
  });
  // Meloetta
  registerAbility(Abilities.Dancer, {
    name: 'Dancer',
    description: 'Whenever anybody uses a dance move, it casts the same one straight after, free.',
  });
  // Reshiram
  registerAbility(Abilities.Turboblaze, {
    name: 'Turboblaze',
    description: "The target's abilities cannot hinder its moves.",
  });
  // Zekrom
  registerAbility(Abilities.Teravolt, {
    name: 'Teravolt',
    description: "The target's abilities cannot hinder its moves.",
  });
}
