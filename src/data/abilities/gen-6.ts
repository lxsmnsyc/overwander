import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Kalos brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen6Abilities(): void {
  // Chespin
  registerAbility(Abilities.Bulletproof, {
    name: 'Bulletproof',
    description: 'Balls, bombs and anything else thrown at it from a distance do nothing.',
  });
  // Fennekin
  registerAbility(Abilities.Magician, {
    name: 'Magician',
    description: 'Takes the held item of whatever it lands a move on, if its own hands are empty.',
  });
  // Flabebe
  registerAbility(Abilities.FlowerVeil, {
    name: 'Flower Veil',
    description:
      'Grass-type teammates, itself included, cannot be given a status or have a stat lowered by anybody else.',
  });
  registerAbility(Abilities.Symbiosis, {
    name: 'Symbiosis',
    description: 'Hands its own held item to a teammate the moment they use theirs up.',
  });
  // Skiddo
  registerAbility(Abilities.GrassPelt, {
    name: 'Grass Pelt',
    description: 'Its Defense counts 1.5x while it stands on Grassy Terrain.',
  });
  // Florges, which the mainline leaves two abilities short
  registerAbility(Abilities.MistySurge, {
    name: 'Misty Surge',
    description: 'Lays Misty Terrain as it takes the field.',
  });
  // Clauncher
  registerAbility(Abilities.MegaLauncher, {
    name: 'Mega Launcher',
    description: 'Pulses and aura moves hit 1.5x, and a Heal Pulse gives back 1.5x as much.',
  });
  // Amaura
  registerAbility(Abilities.Refrigerate, {
    name: 'Refrigerate',
    description: 'Its Normal moves are Ice moves instead, and hit 1.2x.',
  });
  // Xerneas
  registerAbility(Abilities.FairyAura, {
    name: 'Fairy Aura',
    description: 'Every Fairy move on the field hits 1.33x, whoever throws it.',
  });
  registerAbility(Abilities.Triage, {
    name: 'Triage',
    description: 'Its healing moves cast a step ahead of everything else.',
  });
  // Yveltal
  registerAbility(Abilities.DarkAura, {
    name: 'Dark Aura',
    description: 'Every Dark move on the field hits 1.33x, whoever throws it.',
  });
  // Zygarde
  registerAbility(Abilities.AuraBreak, {
    name: 'Aura Break',
    description: 'An aura on the field weakens its type to 0.75x rather than strengthening it.',
  });
  registerAbility(Abilities.PowerConstruct, {
    name: 'Power Construct',
    description: 'At 1/2 HP the rest of its cells gather and it takes its Complete shape.',
  });
  registerAbility(Abilities.EarthEater, {
    name: 'Earth Eater',
    description: 'Ground moves deal it nothing and heal it 1/4 of its HP instead.',
  });
  // Volcanion
  registerAbility(Abilities.SteamEngine, {
    name: 'Steam Engine',
    description: 'A Fire or Water move landing on it raises its Speed 6 stages.',
  });
  // Swirlix
  registerAbility(Abilities.SweetVeil, {
    name: 'Sweet Veil',
    description: 'Nothing on its team can be put to sleep while it stands.',
  });
  // Sylveon
  registerAbility(Abilities.Pixilate, {
    name: 'Pixilate',
    description: 'Its Normal moves are Fairy moves instead, and hit 1.2x.',
  });
  // Goomy
  registerAbility(Abilities.Gooey, {
    name: 'Gooey',
    description: 'Whatever makes contact with it loses 1 stage of Speed.',
  });
  // Honedge
  registerAbility(Abilities.StanceChange, {
    name: 'Stance Change',
    description: "It draws the blade to attack and sheathes it again on King's Shield.",
  });
  // Mega Pinsir and Mega Salamence
  registerAbility(Abilities.Aerilate, {
    name: 'Aerilate',
    description: 'Its Normal moves are Flying moves instead, and hit 1.2x.',
  });
  // Mega Kangaskhan
  registerAbility(Abilities.ParentalBond, {
    name: 'Parental Bond',
    description: 'A move it casts at one target lands twice, the second hit at 0.25x.',
  });
  // Mega Rayquaza
  registerAbility(Abilities.DeltaStream, {
    name: 'Delta Stream',
    description:
      'Raises strong winds while it stands. Moves super effective on a Flying type hit it at 1x, and no other weather can be set.',
  });
}
