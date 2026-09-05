import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * From Helping Hand to Dive: what a double battle is fought with, and
 * the moves that borrow somebody else's
 */
export default function registerHelpingHandToDive(): void {
  registerMove(Moves.HelpingHand, {
    name: 'Helping Hand',
    description: "The ally's next move hits for 1.5x.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    priority: 5,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Trick, {
    name: 'Trick',
    description: 'Swaps held items with the target.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.RolePlay, {
    name: 'Role Play',
    description: "Takes the target's ability for the user's own.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.Wish, {
    name: 'Wish',
    description: "Heals 1/2 the user's HP 4 seconds later.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.Assist, {
    name: 'Assist',
    description: 'Casts a move drawn at random from the rest of the party.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.Ingrain, {
    name: 'Ingrain',
    description:
      'Roots the user: it recovers 1/16 of its HP every time it acts and cannot be swapped out.',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Superpower, {
    name: 'Superpower',
    description: "Drops the user's Attack and Defense a stage each after it lands.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 120,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Uppercut, SpriteAnim.Attack],
  });
  registerMove(Moves.MagicCoat, {
    name: 'Magic Coat',
    description: 'For 4 seconds status moves aimed at the user are turned back on their caster.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 15,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.Recycle, {
    name: 'Recycle',
    description: 'Takes back the last held item the user used up.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.Revenge, {
    name: 'Revenge',
    description: 'A long wind-up, and 2x power if the user is hit while winding up.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 100,
    priority: -4,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.BrickBreak, {
    name: 'Brick Break',
    description: "Breaks Reflect and Light Screen on the target's side, then hits.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 75,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Chop, SpriteAnim.Slice, SpriteAnim.Attack],
  });
  registerMove(Moves.Yawn, {
    name: 'Yawn',
    description: 'The target falls asleep 4 seconds later.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Yawn, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.KnockOff, {
    name: 'Knock Off',
    description: "Knocks the target's held item off it.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 65,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.Scratch, SpriteAnim.Attack],
  });
  registerMove(Moves.Endeavor, {
    name: 'Endeavor',
    description: "Cuts the target's HP down to the user's own.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.Eruption, {
    name: 'Eruption',
    description: 'The more HP the user has left, the harder it hits, up to 150 power.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.SkillSwap, {
    name: 'Skill Swap',
    description: 'Swaps abilities with the target.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.Imprison, {
    name: 'Imprison',
    description: 'For 10 seconds the target cannot cast any move the user also knows.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.Refresh, {
    name: 'Refresh',
    description: "Clears the user's burn, poison or paralysis.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Shake, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.Grudge, {
    name: 'Grudge',
    description: 'For 10 seconds, whatever knocks the user out loses the move that did it.',
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Snatch, {
    name: 'Snatch',
    description: 'For 4 seconds the next move somebody casts on themselves is taken instead.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 10,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.SecretPower, {
    name: 'Secret Power',
    description: '30% for a status, and the ground underfoot decides which.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Strike, SpriteAnim.Emit, SpriteAnim.Attack],
  });
  registerMove(Moves.Dive, {
    name: 'Dive',
    description: 'Goes under the water, out of reach, and surfaces into the hit.',
    type: Types.Water,
    category: MoveCategories.Physical,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Slam, SpriteAnim.Attack],
  });
}
