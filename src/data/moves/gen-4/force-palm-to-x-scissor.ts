import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Force Palm to X-Scissor: the end of Sinnoh's second stretch,
 * which is mostly the plain hits every type was owed
 */
export default function registerForcePalmToXScissor(): void {
  registerMove(Moves.ForcePalm, {
    name: 'Force Palm',
    description: '30% to paralyse.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.AuraSphere, {
    name: 'Aura Sphere',
    description: 'Never misses.',
    type: Types.Fighting,
    category: MoveCategories.Special,
    power: 80,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.RockPolish, {
    name: 'Rock Polish',
    description: "Raises the user's Speed 2 stages.",
    type: Types.Rock,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.PoisonJab, {
    name: 'Poison Jab',
    description: '30% to poison.',
    type: Types.Poison,
    category: MoveCategories.Physical,
    power: 80,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Jab, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.DarkPulse, {
    name: 'Dark Pulse',
    description: '20% to make the target flinch.',
    type: Types.Dark,
    category: MoveCategories.Special,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.NightSlash, {
    name: 'Night Slash',
    description: 'Lands a critical more often than most.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 70,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.Scratch, SpriteAnim.Attack],
  });
  registerMove(Moves.AquaTail, {
    name: 'Aqua Tail',
    description: 'Plain contact damage.',
    type: Types.Water,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.TailWhip, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.SeedBomb, {
    name: 'Seed Bomb',
    description: 'Plain damage from a distance.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Attack],
  });
  registerMove(Moves.AirSlash, {
    name: 'Air Slash',
    description: '30% to make the target flinch.',
    type: Types.Flying,
    category: MoveCategories.Special,
    power: 75,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Slicing | MoveFlags.Wind,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Slice, SpriteAnim.Shoot, SpriteAnim.Attack],
  });
  registerMove(Moves.XScissor, {
    name: 'X-Scissor',
    description: 'Plain contact damage.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.MultiScratch, SpriteAnim.Attack],
  });
}
