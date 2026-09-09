import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Cross Poison to Stealth Rock: the heavy physical moves of
 * Sinnoh's fourth stretch, and the stones laid under a side
 */
export default function registerCrossPoisonToStealthRock(): void {
  registerMove(Moves.CrossPoison, {
    name: 'Cross Poison',
    description: 'Lands a critical more often than most. 10% to poison.',
    type: Types.Poison,
    category: MoveCategories.Physical,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.Scratch, SpriteAnim.Attack],
  });
  registerMove(Moves.GunkShot, {
    name: 'Gunk Shot',
    description: '30% to poison.',
    type: Types.Poison,
    category: MoveCategories.Physical,
    power: 120,
    pp: 5,
    accuracy: 80,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Gas, SpriteAnim.Attack],
  });
  registerMove(Moves.IronHead, {
    name: 'Iron Head',
    description: '30% to make the target flinch.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.MagnetBomb, {
    name: 'Magnet Bomb',
    description: 'Never misses.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Attack],
  });
  registerMove(Moves.StoneEdge, {
    name: 'Stone Edge',
    description: 'Lands a critical more often than most.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    accuracy: 80,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Captivate, {
    name: 'Captivate',
    description: "Drops the target's Special Attack 2 stages, but only the opposite gender.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Dance, SpriteAnim.Charge],
  });
  registerMove(Moves.StealthRock, {
    name: 'Stealth Rock',
    description:
      'Hangs stones over the far side: anything swapped in loses 1/8 of its HP, doubled or halved by how it takes a Rock move.',
    type: Types.Rock,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Team,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
