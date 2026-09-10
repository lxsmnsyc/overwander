import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Defend Order to Shadow Force: the end of Sinnoh's list, which
 * is where the legendaries and the hive keep their own moves
 */
export default function registerDefendOrderToShadowForce(): void {
  registerMove(Moves.DefendOrder, {
    name: 'Defend Order',
    description: "Raises the user's Defense and Special Defense a stage each.",
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Sound, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.HealOrder, {
    name: 'Heal Order',
    description: 'Heals the user 1/2 of its HP.',
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Sound, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.HeadSmash, {
    name: 'Head Smash',
    description: 'The user takes 1/2 of the damage it deals.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 150,
    pp: 5,
    accuracy: 80,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.DoubleHit, {
    name: 'Double Hit',
    description: 'Strikes twice.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 35,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.RoarOfTime, {
    name: 'Roar of Time',
    description: 'The user has to recharge afterwards.',
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Sound, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.SpacialRend, {
    name: 'Spacial Rend',
    description: 'Lands a critical more often than most.',
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.LunarDance, {
    name: 'Lunar Dance',
    description:
      'The user faints, and a teammate on the field goes back to full HP, is cured, and has every move ready to cast.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.CrushGrip, {
    name: 'Crush Grip',
    description:
      'Hits hardest against a target at full HP, and for almost nothing against a weak one.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.MagmaStorm, {
    name: 'Magma Storm',
    description: 'Traps the target in a ring of fire.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
    accuracy: 75,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.DarkVoid, {
    name: 'Dark Void',
    description: 'Puts the target to sleep.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 50,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SeedFlare, {
    name: 'Seed Flare',
    description: "40% to drop the target's Special Defense 2 stages.",
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 120,
    pp: 5,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.OminousWind, {
    name: 'Ominous Wind',
    description: "10% to raise every one of the user's stats a stage.",
    type: Types.Ghost,
    category: MoveCategories.Special,
    power: 60,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Wind,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.ShadowForce, {
    name: 'Shadow Force',
    description: 'Vanishes, then strikes through anything the target is hiding behind.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 120,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Slam, SpriteAnim.Attack],
  });
}
