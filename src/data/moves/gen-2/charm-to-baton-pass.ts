import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Charm to Baton Pass: the machines Johto handed out, and the
 * moves that pass what they built along
 */
export default function registerCharmToBatonPass(): void {
  registerMove(Moves.Charm, {
    name: 'Charm',
    description: "Drops the target's Attack 2 stages.",
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Dance, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Rollout, {
    name: 'Rollout',
    description:
      'Rolls 5 times over, each pass twice the power of the last. Defense Curl doubles it again.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 30,
    pp: 20,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 4,
    cast: [SpriteAnim.Rotate, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.FalseSwipe, {
    name: 'False Swipe',
    description: 'Always leaves the target on at least 1 HP.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 40,
    pp: 40,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Swagger, {
    name: 'Swagger',
    description: 'Confuses the target and raises its Attack 2 stages.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 85,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.RearUp, SpriteAnim.Dance, SpriteAnim.Charge],
  });
  registerMove(Moves.MilkDrink, {
    name: 'Milk Drink',
    description: 'Heals the user 1/2 its HP.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Spark, {
    name: 'Spark',
    description: '30% to paralyse.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 65,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Shock, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.FuryCutter, {
    name: 'Fury Cutter',
    description: 'Cuts 4 times over, each one twice the power of the last.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 40,
    pp: 20,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    steps: 3,
    cast: [SpriteAnim.Slice, SpriteAnim.QuickStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.SteelWing, {
    name: 'Steel Wing',
    description: "10% to raise the user's Defense a stage.",
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 70,
    pp: 25,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Swing, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.MeanLook, {
    name: 'Mean Look',
    description: 'The target cannot be swapped out for 10 seconds. It takes no damage from it.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Attract, {
    name: 'Attract',
    description: 'A target of the opposite gender has a 50% chance of not acting at all.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.SleepTalk, {
    name: 'Sleep Talk',
    description: 'Only works while the user is asleep. Casts one of its other moves at random.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Sleep, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.HealBell, {
    name: 'Heal Bell',
    description: "Clears every status from the user's whole party. It is a sound.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Return, {
    name: 'Return',
    description: 'The fonder of you the user is, the harder it hits, up to 102 power.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Present, {
    name: 'Present',
    description:
      'A parcel: usually 40, 80 or 120 power, and 1 time in 5 it heals the target instead.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    accuracy: 90,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.Frustration, {
    name: 'Frustration',
    description: 'The less fond of you the user is, the harder it hits, up to 102 power.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Shake, SpriteAnim.Attack],
  });
  registerMove(Moves.Safeguard, {
    name: 'Safeguard',
    description: "For 10 seconds nothing can put a status on the user's side.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 25,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.PainSplit, {
    name: 'Pain Split',
    description: "Adds up both sides' HP and splits it evenly between them.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.SacredFire, {
    name: 'Sacred Fire',
    description: '50% to burn. The user thaws itself out casting it.',
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.Magnitude, {
    name: 'Magnitude',
    description:
      'Shakes the ground under everything else on the field for 10 to 150 power. Dug-in targets take 2x.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 30,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Rumble, SpriteAnim.Stomp, SpriteAnim.Shake, SpriteAnim.Attack],
  });
  registerMove(Moves.DynamicPunch, {
    name: 'Dynamic Punch',
    description: 'Always confuses what it hits.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    accuracy: 50,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Uppercut, SpriteAnim.Attack],
  });
  registerMove(Moves.Megahorn, {
    name: 'Megahorn',
    description: 'Plain contact damage.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 120,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.DragonBreath, {
    name: 'Dragon Breath',
    description: '30% to paralyse.',
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.BatonPass, {
    name: 'Baton Pass',
    description: 'Swaps the user out and hands its stat stages to whoever comes in.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Hop, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
}
