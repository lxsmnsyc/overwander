import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Grass Knot to Attack Order: the last of Sinnoh's fourth
 * stretch, where a move reads what the target weighs or what the user
 * is holding
 */
export default function registerGrassKnotToAttackOrder(): void {
  registerMove(Moves.GrassKnot, {
    name: 'Grass Knot',
    description:
      'Hits for what the target weighs: 20 power under 10 kg, rising to 120 at 200 kg and over.',
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 50,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.Chatter, {
    name: 'Chatter',
    description: 'Always confuses.',
    type: Types.Flying,
    category: MoveCategories.Special,
    power: 65,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.Judgment, {
    name: 'Judgment',
    description: 'Thrown as the type of the Plate the user is holding.',
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 100,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.BugBite, {
    name: 'Bug Bite',
    description: "Eats the target's berry, and takes whatever the berry does.",
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Bite,
    cast: [SpriteAnim.Bite, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.ChargeBeam, {
    name: 'Charge Beam',
    description: "70% to raise the user's Special Attack 1 stage.",
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 50,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.WoodHammer, {
    name: 'Wood Hammer',
    description: 'The user takes 1/3 of the damage it deals.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 120,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.AquaJet, {
    name: 'Aqua Jet',
    description: 'A shorter wind-up than most.',
    type: Types.Water,
    category: MoveCategories.Physical,
    power: 40,
    pp: 20,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.AttackOrder, {
    name: 'Attack Order',
    description: 'Lands a critical more often than most.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Sound, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
}
