import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Encore to Beat Up: the last stretch of Johto's list, the
 * weather healers and the heavy hitters at the end of it
 */
export default function registerEncoreToBeatUp(): void {
  registerMove(Moves.Encore, {
    name: 'Encore',
    description:
      'Makes the target repeat its last used move 3 times over. Moves that wind up cannot be repeated.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    steps: 2,
    cast: [SpriteAnim.Dance, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Pursuit, {
    name: 'Pursuit',
    description: 'Hits 2x as hard against a target that is being swapped out.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 40,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.RapidSpin, {
    name: 'Rapid Spin',
    description: "Always raises the user's Speed a stage, and clears the spikes under its side.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 50,
    pp: 40,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Rotate, SpriteAnim.Twirl, SpriteAnim.Attack],
  });
  registerMove(Moves.SweetScent, {
    name: 'Sweet Scent',
    description: 'Drops the evasion of everything opposite 2 stages.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.IronTail, {
    name: 'Iron Tail',
    description: "30% to drop the target's Defense a stage.",
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 100,
    pp: 15,
    accuracy: 75,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.TailWhip, SpriteAnim.Swing, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.MetalClaw, {
    name: 'Metal Claw',
    description: "10% to raise the user's Attack a stage.",
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 50,
    pp: 35,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.MultiScratch, SpriteAnim.Scratch, SpriteAnim.Slice, SpriteAnim.Attack],
  });
  registerMove(Moves.VitalThrow, {
    name: 'Vital Throw',
    description: 'Winds up longer than an ordinary move, and never misses.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 70,
    pp: 10,
    priority: -1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Uppercut, SpriteAnim.Attack],
  });
  registerMove(Moves.MorningSun, {
    name: 'Morning Sun',
    description: 'Heals the user 1/2 its HP, 2/3 in sun and 1/4 in any other weather.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Synthesis, {
    name: 'Synthesis',
    description: 'Heals the user 1/2 its HP, 2/3 in sun and 1/4 in any other weather.',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Moonlight, {
    name: 'Moonlight',
    description: 'Heals the user 1/2 its HP, 2/3 in sun and 1/4 in any other weather.',
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.HiddenPower, {
    name: 'Hidden Power',
    description: "A type of its own, decided by the user's genes.",
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 60,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.CrossChop, {
    name: 'Cross Chop',
    description: 'Crits more readily.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    accuracy: 80,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Chop, SpriteAnim.Uppercut, SpriteAnim.Slice, SpriteAnim.Attack],
  });
  registerMove(Moves.Twister, {
    name: 'Twister',
    description: 'Hits everything opposite, 20% to flinch, and reaches a target in the air at 2x.',
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 40,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.Emit, SpriteAnim.Rotate, SpriteAnim.Charge],
  });
  registerMove(Moves.Crunch, {
    name: 'Crunch',
    description: "20% to drop the target's Defense a stage.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Bite,
    cast: [SpriteAnim.Bite, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.MirrorCoat, {
    name: 'Mirror Coat',
    description:
      'Returns 2x the last special hit taken, at whoever landed it rather than the chosen target.',
    type: Types.Psychic,
    category: MoveCategories.Special,
    pp: 20,
    accuracy: 100,
    priority: -5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.PsychUp, {
    name: 'Psych Up',
    description: "Copies the target's stat stages over the user's own.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.ExtremeSpeed, {
    name: 'Extreme Speed',
    description: 'Winds up far faster than an ordinary move.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 80,
    pp: 5,
    accuracy: 100,
    priority: 2,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.AncientPower, {
    name: 'Ancient Power',
    description: "10% to raise every one of the user's stats a stage.",
    type: Types.Rock,
    category: MoveCategories.Special,
    power: 60,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.ShadowBall, {
    name: 'Shadow Ball',
    description: "20% to drop the target's Special Defense a stage.",
    type: Types.Ghost,
    category: MoveCategories.Special,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.FutureSight, {
    name: 'Future Sight',
    description: 'Lands 4 seconds after it is cast, wherever the target is by then.',
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 120,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.RockSmash, {
    name: 'Rock Smash',
    description: "50% to drop the target's Defense a stage.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 40,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Chop, SpriteAnim.Punch, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Whirlpool, {
    name: 'Whirlpool',
    description: 'Binds the target: 1/8 of its HP a second for 4 seconds, and no escape.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 35,
    pp: 15,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.BeatUp, {
    name: 'Beat Up',
    description: 'Strikes once for every pokemon in the party that is standing and unafflicted.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 10,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
}
