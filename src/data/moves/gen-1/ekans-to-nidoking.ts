import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * What is met between Ekans and Nidoking: the snakes, the sparks and
 * the horns
 */
export default function registerEkansToNidokingMoves(): void {
  registerMove(Moves.Wrap, {
    name: 'Wrap',
    description: 'Binds the target: 1/8 of its HP a second for 4 seconds, and no escape.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 15,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Twirl, SpriteAnim.Attack],
  });
  registerMove(Moves.Glare, {
    name: 'Glare',
    description: 'Paralyses the target.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.Screech, {
    name: 'Screech',
    description: "Drops the target's Defense 2 stages. It is a sound.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 85,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.RearUp, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.Acid, {
    name: 'Acid',
    description: "Hits everything opposite, 10% to drop the target's Special Defense a stage.",
    type: Types.Poison,
    category: MoveCategories.Special,
    pp: 30,
    power: 40,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Gas, SpriteAnim.Shoot, SpriteAnim.Attack],
  });
  registerMove(Moves.RockSlide, {
    name: 'Rock Slide',
    description: 'Hits everything opposite, 30% to flinch.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    pp: 10,
    power: 75,
    accuracy: 90,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.ThunderShock, {
    name: 'Thunder Shock',
    description: '10% to paralyse.',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 30,
    power: 40,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Shoot, SpriteAnim.Attack],
  });
  registerMove(Moves.ThunderWave, {
    name: 'Thunder Wave',
    description: 'Paralyses the target.',
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Thunder, {
    name: 'Thunder',
    description: '30% to paralyse. Never misses in rain, 50% accuracy in sun.',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 10,
    power: 110,
    accuracy: 70,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Thunderbolt, {
    name: 'Thunderbolt',
    description: '10% to paralyse.',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 15,
    power: 90,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Attack],
  });
  registerMove(Moves.PayDay, {
    name: 'Pay Day',
    description: "Scatters coins worth 5x the user's level, paid out after the fight.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 40,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Ricochet, SpriteAnim.Attack],
  });
  registerMove(Moves.FurySwipes, {
    name: 'Fury Swipes',
    description: 'Strikes 2 to 5 times.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 18,
    accuracy: 80,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.MultiScratch, SpriteAnim.Scratch, SpriteAnim.MultiStrike, SpriteAnim.Double],
  });
  registerMove(Moves.DoubleKick, {
    name: 'Double Kick',
    description: 'Strikes 2 times.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 30,
    power: 30,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Kick, SpriteAnim.MultiStrike, SpriteAnim.Double],
  });
  registerMove(Moves.HornAttack, {
    name: 'Horn Attack',
    description: 'Plain contact damage.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 25,
    power: 65,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Jab, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.HornDrill, {
    name: 'Horn Drill',
    description: "Takes the target's whole health, at 30% accuracy. Sturdy shrugs it off.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 30,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Jab, SpriteAnim.Twirl, SpriteAnim.Attack],
  });
  // Rampage: every step lands the same attack
  registerMove(Moves.Thrash, {
    name: 'Thrash',
    description: 'Lands the same hit 3 times over, and leaves the user confused.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 120,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 2,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
}
