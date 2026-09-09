import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Gyro Ball to Feint: the moves that read the fight rather than
 * carry a power of their own, and the one that walks through a guard
 */
export default function registerGyroBallToFeint(): void {
  registerMove(Moves.GyroBall, {
    name: 'Gyro Ball',
    description: 'The slower the user is against the target, the harder it hits, up to 150 power.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Rotate, SpriteAnim.Twirl, SpriteAnim.Attack],
  });
  registerMove(Moves.HealingWish, {
    name: 'Healing Wish',
    description: 'The user faints, and a teammate on the field goes back to full HP and is cured.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.Brine, {
    name: 'Brine',
    description: '2x power on a target below 1/2 HP.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.NaturalGift, {
    name: 'Natural Gift',
    description: "Takes the power and the type of the user's berry, and eats it. Nothing without.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Feint, {
    name: 'Feint',
    description: 'Hits through Protect and Detect, and breaks the guard it went through.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 30,
    pp: 10,
    accuracy: 100,
    priority: 2,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Jab, SpriteAnim.Attack],
  });
}
