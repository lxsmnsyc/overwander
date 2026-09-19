import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveTargets, Moves } from '../../ids/moves';
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
