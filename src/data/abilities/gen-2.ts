import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * Abilities the Gen 2 species brought that no Gen 1 species carries.
 * The grouping is by the line that introduces it, as in gen-1.ts.
 */
export default function registerGen2Abilities(): void {
  // Cyndaquil
  registerAbility(Abilities.Berserk, {
    name: 'Berserk',
    description: '+1 Special Attack whenever a hit takes it under half its HP.',
  });
  // Natu
  registerAbility(Abilities.MagicBounce, {
    name: 'Magic Bounce',
    description: 'A status move aimed at it is cast back at whoever used it.',
  });
  // Mareep
  registerAbility(Abilities.Plus, {
    name: 'Plus',
    description: '1.5x Special Attack while a living ally also has Plus.',
  });
  registerAbility(Abilities.MotorDrive, {
    name: 'Motor Drive',
    description: 'Electric moves cannot touch it, and raise its Speed a stage instead.',
  });
  // Sunkern
  registerAbility(Abilities.FlowerGift, {
    name: 'Flower Gift',
    description: '1.5x Attack and Special Defense for its whole team in sunlight.',
  });
  // Slugma
  registerAbility(Abilities.MagmaArmor, {
    name: 'Magma Armor',
    description: 'Cannot be frozen.',
  });
  // Remoraid
  registerAbility(Abilities.SuctionCups, {
    name: 'Suction Cups',
    description: 'Nothing can drag it off the field.',
  });
  registerAbility(Abilities.Moody, {
    name: 'Moody',
    description: 'Each time it acts, one stat rises two stages and another falls one.',
  });
  // Phanpy
  registerAbility(Abilities.Stamina, {
    name: 'Stamina',
    description: '+1 Defense every time a hit lands on it.',
  });
  // Togepi
  registerAbility(Abilities.SuperLuck, {
    name: 'Super Luck',
    description: 'Its moves land critical hits a stage more often.',
  });
  // Shuckle
  registerAbility(Abilities.Contrary, {
    name: 'Contrary',
    description: 'Every stat change it takes lands the other way round.',
  });
  // Corsola
  registerAbility(Abilities.StormDrain, {
    name: 'Storm Drain',
    description: 'Water moves cannot touch it, and raise its Special Attack a stage instead.',
  });
  // Skarmory
  registerAbility(Abilities.MirrorArmor, {
    name: 'Mirror Armor',
    description: 'A stat drop aimed at it lands on whoever aimed it.',
  });
  // Smeargle
  registerAbility(Abilities.Prankster, {
    name: 'Prankster',
    description: 'Its status moves go before anything of ordinary priority.',
  });
  // Larvitar
  registerAbility(Abilities.SandStream, {
    name: 'Sand Stream',
    description: 'Whips up a sandstorm when it reaches the field.',
  });
  // Heracross
  registerAbility(Abilities.SapSipper, {
    name: 'Sap Sipper',
    description: 'Grass moves cannot touch it, and raise its Attack a stage instead.',
  });
  // Teddiursa
  registerAbility(Abilities.HoneyGather, {
    name: 'Honey Gather',
    description: 'Comes up with a Honey the first time it acts, if it has a hand free.',
  });
  // Marill
  registerAbility(Abilities.HugePower, {
    name: 'Huge Power',
    description: 'Doubles its Attack.',
  });
  // Yanma
  registerAbility(Abilities.SpeedBoost, {
    name: 'Speed Boost',
    description: '+1 Speed every time it acts.',
  });
  // Sneasel
  registerAbility(Abilities.Pickpocket, {
    name: 'Pickpocket',
    description: 'Takes the item off whoever touches it, if it has a hand free.',
  });
  // Wobbuffet
  registerAbility(Abilities.ShadowTag, {
    name: 'Shadow Tag',
    description: 'Nothing on the far side can flee, ghosts aside.',
  });
  registerAbility(Abilities.Telepathy, {
    name: 'Telepathy',
    description: "Sees an ally's attack coming and takes nothing from it.",
  });
}
