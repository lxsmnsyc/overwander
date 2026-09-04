import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Hoenn brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen3Abilities(): void {
  // Shiftry
  registerAbility(Abilities.WindRider, {
    name: 'Wind Rider',
    description: 'Takes nothing from a move that rides on the wind, and gains 1 Attack stage.',
  });
  // Slakoth
  registerAbility(Abilities.Truant, {
    name: 'Truant',
    description: 'Loafs about for 2 seconds after every move it finishes.',
  });
  // Shedinja
  registerAbility(Abilities.WonderGuard, {
    name: 'Wonder Guard',
    description:
      'Only a move it is weak to lands at all. Status moves, poison and the weather still reach it.',
  });
  // Skitty
  registerAbility(Abilities.Normalize, {
    name: 'Normalize',
    description: 'Everything it uses comes out Normal-type, whatever the move says.',
  });
  // Meditite
  registerAbility(Abilities.PurePower, {
    name: 'Pure Power',
    description: '2x Attack.',
  });
  // Electrike
  registerAbility(Abilities.Minus, {
    name: 'Minus',
    description: '1.5x Special Attack while a teammate carries Plus or Minus.',
  });
  // Sableye
  registerAbility(Abilities.Stall, {
    name: 'Stall',
    description: 'Everything it casts winds up slower than it otherwise would.',
  });
  // Zangoose
  registerAbility(Abilities.ToxicBoost, {
    name: 'Toxic Boost',
    description: '1.5x Attack while it is poisoned.',
  });
  // Plusle
  registerAbility(Abilities.Battery, {
    name: 'Battery',
    description: "Lifts its teammates' special moves to 1.3x power.",
  });
  // Torkoal
  registerAbility(Abilities.WhiteSmoke, {
    name: 'White Smoke',
    description: 'Refuses every stat drop from anybody else.',
  });
  // Kecleon
  registerAbility(Abilities.ColorChange, {
    name: 'Color Change',
    description: 'Turns the type of whatever move just hit it.',
  });
  // Aron
  registerAbility(Abilities.HeavyMetal, {
    name: 'Heavy Metal',
    description: 'Weighs 2x what it looks like.',
  });
  // Shroomish
  registerAbility(Abilities.PoisonHeal, {
    name: 'Poison Heal',
    description: 'Poison restores 1/8 of its HP each time it would take some.',
  });
  // Castform
  registerAbility(Abilities.Forecast, {
    name: 'Forecast',
    description: 'A Castform takes the shape and the type of the sky it stands under.',
  });
  // Metagross
  registerAbility(Abilities.Steelworker, {
    name: 'Steelworker',
    description: 'Steel moves hit 1.5x, whatever its own types are.',
  });
  // Numel
  registerAbility(Abilities.Simple, {
    name: 'Simple',
    description: 'Every stat change it takes counts 2x, its own and anybody else’s.',
  });
  // Rayquaza
  registerAbility(Abilities.AirLock, {
    name: 'Air Lock',
    description: 'Weather does nothing to anybody while it is up.',
  });
}
