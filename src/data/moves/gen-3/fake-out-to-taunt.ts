import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Fake Out to Taunt: the openers, the stockpile trio and the
 * moves that talk a fight out of somebody
 */
export default function registerFakeOutToTaunt(): void {
  registerMove(Moves.FakeOut, {
    name: 'Fake Out',
    description: 'Always flinches. Once a trip onto the field, and no more.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 40,
    pp: 10,
    accuracy: 100,
    priority: 3,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.QuickStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.Uproar, {
    name: 'Uproar',
    description: 'Lands the same hit 3 times over. Nothing sleeps through it. It is a sound.',
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    steps: 2,
    cast: [SpriteAnim.Sound, SpriteAnim.Sing, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Stockpile, {
    name: 'Stockpile',
    description:
      "Stores 3 charges over 3 steps, raising the user's Defense and Special Defense a stage each.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    steps: 2,
    cast: [SpriteAnim.Swell, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.SpitUp, {
    name: 'Spit Up',
    description: 'Spends what Stockpile stored: 100 power a charge, and nothing without one.',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Attack],
  });
  registerMove(Moves.Swallow, {
    name: 'Swallow',
    description: "Spends what Stockpile stored: 1/4, 1/2 or all of the user's HP.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.HeatWave, {
    name: 'Heat Wave',
    description: 'Hits everything opposite. 10% to burn.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 95,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.Torment, {
    name: 'Torment',
    description: 'For 10 seconds the target cannot cast the same move twice over.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Sound, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.Flatter, {
    name: 'Flatter',
    description: 'Confuses the target and raises its Special Attack 1 stage.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.WillOWisp, {
    name: 'Will-O-Wisp',
    description: 'Always burns what it reaches.',
    type: Types.Fire,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.Memento, {
    name: 'Memento',
    description: "Drops the target's Attack and Special Attack 2 stages each. The user faints.",
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Facade, {
    name: 'Facade',
    description: '2x power while the user is burned, poisoned or paralysed.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.FocusPunch, {
    name: 'Focus Punch',
    description: 'A long wind-up, and the punch is lost if the user is hit before it lands.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 150,
    pp: 20,
    accuracy: 100,
    priority: -3,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Uppercut, SpriteAnim.Attack],
  });
  registerMove(Moves.SmellingSalts, {
    name: 'Smelling Salts',
    description: '2x power on a paralysed target, and it cures the paralysis.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 70,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.FollowMe, {
    name: 'Follow Me',
    description: "For 4 seconds every single-target move aimed at the user's side comes to it.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    priority: 2,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.NaturePower, {
    name: 'Nature Power',
    description: 'Casts the move the ground underfoot calls for.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.Charge, {
    name: 'Charge',
    description:
      "Raises the user's Special Defense 1 stage, and its next Electric move hits for 2x.",
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Taunt, {
    name: 'Taunt',
    description: 'For 10 seconds the target can only cast moves that do damage.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Sound, SpriteAnim.Charge],
  });
}
