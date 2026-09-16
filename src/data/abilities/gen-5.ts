import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Unova brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen5Abilities(): void {
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
