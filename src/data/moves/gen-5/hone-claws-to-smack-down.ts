import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Hone Claws to Smack Down: the guards, the splits and the two
 * rooms that bend the whole field
 */
export default function registerHoneClawsToSmackDown(): void {
  registerMove(Moves.HoneClaws, {
    name: 'Hone Claws',
    description: "Raises the user's Attack and accuracy a stage each.",
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Scratch, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.WideGuard, {
    name: 'Wide Guard',
    description:
      "For 2 seconds, moves that hit several pokemon at once are turned away from the user's team.",
    type: Types.Rock,
    category: MoveCategories.Status,
    pp: 10,
    priority: 3,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.GuardSplit, {
    name: 'Guard Split',
    description:
      'The user and the target each take the average of their Defense, and of their Special Defense.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.PowerSplit, {
    name: 'Power Split',
    description:
      'The user and the target each take the average of their Attack, and of their Special Attack.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.WonderRoom, {
    name: 'Wonder Room',
    description:
      "For 10 seconds every pokemon's Defense and Special Defense trade places. A second one ends it.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.Psyshock, {
    name: 'Psyshock',
    description: "Lands against the target's Defense rather than its Special Defense.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.Venoshock, {
    name: 'Venoshock',
    description: '2x power against a poisoned target.',
    type: Types.Poison,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.Autotomize, {
    name: 'Autotomize',
    description: "Raises the user's Speed 2 stages and makes it 100 kg lighter.",
    type: Types.Steel,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Shake, SpriteAnim.Rotate],
  });
  registerMove(Moves.RagePowder, {
    name: 'Rage Powder',
    description:
      "For 4 seconds every single-target move aimed at the user's side comes to it. Grass types and powder-proof pokemon aim past it.",
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 20,
    priority: 2,
    target: MoveTargets.None,
    flags: MoveFlags.Powder,
    cast: [SpriteAnim.Gas, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Telekinesis, {
    name: 'Telekinesis',
    description: 'Holds the target off the ground for 6 seconds, and nothing aimed at it misses.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.MagicRoom, {
    name: 'Magic Room',
    description: 'For 10 seconds no held item does anything. A second one ends it.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.SmackDown, {
    name: 'Smack Down',
    description:
      'Knocks the target out of the air and keeps it on the ground for the rest of the fight.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 50,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Swing],
  });
}
