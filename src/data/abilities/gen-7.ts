import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * What Alola brought, described in this engine's terms rather than
 * the mainline's
 */
export default function registerGen7Abilities(): void {
  // Rowlet
  registerAbility(Abilities.LongReach, {
    name: 'Long Reach',
    description: 'None of its moves make contact, so nothing that answers a touch answers it.',
  });
  // Popplio
  registerAbility(Abilities.LiquidVoice, {
    name: 'Liquid Voice',
    description: 'Its sound moves are Water moves instead.',
  });
  // Yungoos
  registerAbility(Abilities.Stakeout, {
    name: 'Stakeout',
    description:
      'Its moves hit 2x against an enemy that has not acted since it came onto the field.',
  });
  // Wishiwashi
  registerAbility(Abilities.Schooling, {
    name: 'Schooling',
    description:
      'From level 20 it fights as a school while above 1/4 HP, with far higher stats, and alone below it.',
  });
  // Dewpider
  registerAbility(Abilities.WaterBubble, {
    name: 'Water Bubble',
    description: 'Fire moves hit it at 0.5x, it cannot be burned, and its Water moves hit 2x.',
  });
  // Salandit
  registerAbility(Abilities.Corrosion, {
    name: 'Corrosion',
    description: 'It can poison Poison and Steel types.',
  });
  // Stufful
  registerAbility(Abilities.Fluffy, {
    name: 'Fluffy',
    description: 'Contact moves hit it at 0.5x, but Fire moves hit it 2x.',
  });
  // Passimian
  registerAbility(Abilities.Receiver, {
    name: 'Receiver',
    description: 'When a teammate faints, it takes that teammate’s ability in place of this one.',
  });
  // Wimpod
  registerAbility(Abilities.WimpOut, {
    name: 'Wimp Out',
    description:
      'When damage drops it below 1/2 HP, it leaves the field and its strongest teammate comes in.',
  });
  // Golisopod
  registerAbility(Abilities.EmergencyExit, {
    name: 'Emergency Exit',
    description:
      'When damage drops it below 1/2 HP, it leaves the field and its strongest teammate comes in.',
  });
  // Sandygast
  registerAbility(Abilities.WaterCompaction, {
    name: 'Water Compaction',
    description: 'Each Water move that lands on it raises its Defense 2 stages.',
  });
  // Palossand
  registerAbility(Abilities.SandSpit, {
    name: 'Sand Spit',
    description: 'It casts Sandstorm whenever a damaging move lands on it.',
  });
  // Pyukumuku
  registerAbility(Abilities.InnardsOut, {
    name: 'Innards Out',
    description: 'Whoever knocks it out with a move takes as much damage as it had HP left.',
  });
  // Minior
  registerAbility(Abilities.ShieldsDown, {
    name: 'Shields Down',
    description:
      'Above 1/2 HP it fights in its shell, which no major status gets through. At or below 1/2 HP it fights as its faster, frailer core.',
  });
  // Alolan Raichu
  registerAbility(Abilities.SurgeSurfer, {
    name: 'Surge Surfer',
    description: 'Its Speed is 2x on Electric Terrain.',
  });
  // Alolan Diglett
  registerAbility(Abilities.TanglingHair, {
    name: 'Tangling Hair',
    description: 'Whoever lands a contact move on it loses 1 stage of Speed.',
  });
  // Alolan Raticate
  registerAbility(Abilities.Ripen, {
    name: 'Ripen',
    description: 'Berries it eats heal it 2x as much and raise its stats 2x as many stages.',
  });
  // Alolan Geodude
  registerAbility(Abilities.Galvanize, {
    name: 'Galvanize',
    description: 'Its Normal moves are Electric moves instead, and hit 1.2x.',
  });
  // Alolan Grimer
  registerAbility(Abilities.PowerOfAlchemy, {
    name: 'Power of Alchemy',
    description: 'When a teammate faints, it takes that teammate’s ability in place of this one.',
  });
  // Mimikyu
  registerAbility(Abilities.Disguise, {
    name: 'Disguise',
    description:
      'The first move to hit it deals no damage and breaks its disguise, which costs it 1/8 of its HP.',
  });
}
