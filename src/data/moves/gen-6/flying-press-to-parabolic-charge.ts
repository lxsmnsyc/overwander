import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/** From Flying Press to Parabolic Charge: the start of Kalos's list */
export default function registerFlyingPressToParabolicCharge(): void {
  registerMove(Moves.PhantomForce, {
    name: 'Phantom Force',
    description:
      'Vanishes, then strikes through Protect and Detect and breaks the guard. A Substitute still blocks it.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.NobleRoar, {
    name: 'Noble Roar',
    description: "Drops the target's Attack and Special Attack a stage each. It is a sound.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.ParabolicCharge, {
    name: 'Parabolic Charge',
    description:
      "Hits everything opposite and the user's teammates, and heals the user for 1/2 the damage dealt.",
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 65,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
