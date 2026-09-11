import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Sketch to Protect: what Johto added at the front of its list,
 * the first of its signature moves among them
 */
export default function registerSketchToProtect(): void {
  registerMove(Moves.Sketch, {
    name: 'Sketch',
    description: 'Copies the last move the target used, over Sketch itself, for good.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 1,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.TripleKick, {
    name: 'Triple Kick',
    description: 'Kicks 3 times, each one harder than the last.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 10,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Kick, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.Thief, {
    name: 'Thief',
    description: "Takes the target's held item if the user is carrying nothing.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 60,
    pp: 25,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.SpiderWeb, {
    name: 'Spider Web',
    description: 'The target cannot be swapped out for 10 seconds. It takes no damage from it.',
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.MindReader, {
    name: 'Mind Reader',
    description: "The user's next move against the target cannot miss.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Nightmare, {
    name: 'Nightmare',
    description: 'A sleeping target loses 1/4 of its HP every time it would act.',
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.FlameWheel, {
    name: 'Flame Wheel',
    description: '10% to burn. The user thaws itself out casting it.',
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 60,
    pp: 25,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Rotate, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Snore, {
    name: 'Snore',
    description: 'Only works while the user is asleep. 30% to flinch. It is a sound.',
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 50,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sleep, SpriteAnim.Sound, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Curse, {
    name: 'Curse',
    description:
      "A Ghost spends 1/2 its HP to take 1/4 of the target's every time it acts. Anything else trades a stage of Speed for a stage of Attack and Defense.",
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Flail, {
    name: 'Flail',
    description: 'The less HP the user has left, the harder it hits, up to 200 power.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Shake, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.Conversion2, {
    name: 'Conversion 2',
    description: "Turns the user into a type that resists the target's last move.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Aeroblast, {
    name: 'Aeroblast',
    description: 'Crits more readily.',
    type: Types.Flying,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.CottonSpore, {
    name: 'Cotton Spore',
    description: 'Drops the Speed of everything opposite 2 stages. A spore, so Grass ignores it.',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Powder,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Reversal, {
    name: 'Reversal',
    description: 'The less HP the user has left, the harder it hits, up to 200 power.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Uppercut, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Spite, {
    name: 'Spite',
    description: "Puts the target's last move on a 4x longer cooldown.",
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.PowderSnow, {
    name: 'Powder Snow',
    description: 'Hits everything opposite. 10% to freeze.',
    type: Types.Ice,
    category: MoveCategories.Special,
    power: 40,
    pp: 25,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.Protect, {
    name: 'Protect',
    description: 'Blocks everything aimed at the user for 2 seconds. It fails if used twice over.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Swell, SpriteAnim.Charge],
  });
}
