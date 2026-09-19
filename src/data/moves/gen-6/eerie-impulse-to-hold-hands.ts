import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/** From Eerie Impulse to Hold Hands */
export default function registerEerieImpulseToHoldHands(): void {
  registerMove(Moves.EerieImpulse, {
    name: 'Eerie Impulse',
    description: "Drops the target's Special Attack 2 stages.",
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.VenomDrench, {
    name: 'Venom Drench',
    description:
      'Drops the Attack, Special Attack and Speed of every poisoned pokemon opposite a stage each.',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Powder, {
    name: 'Powder',
    description:
      'If the target casts a Fire move within 2 seconds, the move fails and the target loses 1/4 of its HP. A shorter wind-up than most.',
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Powder,
    cast: [SpriteAnim.Emit, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.Geomancy, {
    name: 'Geomancy',
    description:
      "Winds up, then raises the user's Special Attack, Special Defense and Speed 2 stages each.",
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    steps: 1,
    cast: [SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.MagneticFlux, {
    name: 'Magnetic Flux',
    description:
      "Raises the Defense and Special Defense of everyone on the user's team with Plus or Minus a stage each.",
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.HappyHour, {
    name: 'Happy Hour',
    description: "Doubles the coins the user's team picks up from Pay Day this battle.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Hop],
  });
  registerMove(Moves.DazzlingGleam, {
    name: 'Dazzling Gleam',
    description: 'Hits everything opposite.',
    type: Types.Fairy,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Celebrate, {
    name: 'Celebrate',
    description: 'Does nothing whatsoever.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Hop],
  });
  registerMove(Moves.HoldHands, {
    name: 'Hold Hands',
    description: "Takes a teammate's hand, and does nothing else.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Hop],
  });
}
