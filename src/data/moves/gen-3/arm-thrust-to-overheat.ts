import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Arm Thrust to Overheat: the signature moves of Hoenn's own,
 * and the weather that comes with them
 */
export default function registerArmThrustToOverheat(): void {
  registerMove(Moves.ArmThrust, {
    name: 'Arm Thrust',
    description: 'Strikes 2 to 5 times.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 15,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.Camouflage, {
    name: 'Camouflage',
    description: 'The user takes the type of the ground underfoot.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.TailGlow, {
    name: 'Tail Glow',
    description: "Raises the user's Special Attack 3 stages.",
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.TailWhip, SpriteAnim.Charge],
  });
  registerMove(Moves.LusterPurge, {
    name: 'Luster Purge',
    description: "50% to drop the target's Special Defense a stage.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 95,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.MistBall, {
    name: 'Mist Ball',
    description: "50% to drop the target's Special Attack a stage.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 95,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.FeatherDance, {
    name: 'Feather Dance',
    description: "Drops the target's Attack 2 stages.",
    type: Types.Flying,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.FlapAround, SpriteAnim.Dance, SpriteAnim.Charge],
  });
  registerMove(Moves.TeeterDance, {
    name: 'Teeter Dance',
    description: 'Confuses everything else on the field, its own side included.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.BlazeKick, {
    name: 'Blaze Kick',
    description: 'Crits more readily. 10% to burn.',
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 85,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Kick, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.MudSport, {
    name: 'Mud Sport',
    description: 'For 10 seconds Electric moves hit for 1/2.',
    type: Types.Ground,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.IceBall, {
    name: 'Ice Ball',
    description:
      'Rolls 5 times over, each pass twice the power of the last. Defense Curl doubles it again.',
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 30,
    pp: 20,
    accuracy: 90,
    steps: 4,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Rotate, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.NeedleArm, {
    name: 'Needle Arm',
    description: '30% to flinch.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 60,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Jab, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.SlackOff, {
    name: 'Slack Off',
    description: 'Heals the user 1/2 its HP.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Sleep, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.HyperVoice, {
    name: 'Hyper Voice',
    description: 'Hits everything opposite. It is a sound.',
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.Sing, SpriteAnim.Charge],
  });
  registerMove(Moves.PoisonFang, {
    name: 'Poison Fang',
    description: '50% to badly poison.',
    type: Types.Poison,
    category: MoveCategories.Physical,
    power: 50,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Bite,
    cast: [SpriteAnim.Bite, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.CrushClaw, {
    name: 'Crush Claw',
    description: "50% to drop the target's Defense a stage.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 75,
    pp: 10,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Scratch, SpriteAnim.MultiScratch, SpriteAnim.Attack],
  });
  registerMove(Moves.BlastBurn, {
    name: 'Blast Burn',
    description: 'The user has to recharge afterwards.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.HydroCannon, {
    name: 'Hydro Cannon',
    description: 'The user has to recharge afterwards.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.MeteorMash, {
    name: 'Meteor Mash',
    description: "20% to raise the user's Attack a stage.",
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.Astonish, {
    name: 'Astonish',
    description: '30% to flinch.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 30,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Appeal, SpriteAnim.QuickStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.WeatherBall, {
    name: 'Weather Ball',
    description: "In any weather it hits for 2x and takes the sky's own type.",
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 50,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Aromatherapy, {
    name: 'Aromatherapy',
    description: "Clears every status from the user's whole party.",
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.FakeTears, {
    name: 'Fake Tears',
    description: "Drops the target's Special Defense 2 stages.",
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.AirCutter, {
    name: 'Air Cutter',
    description: 'Hits everything opposite. Crits more readily.',
    type: Types.Flying,
    category: MoveCategories.Special,
    power: 60,
    pp: 25,
    accuracy: 95,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Slicing | MoveFlags.Wind,
    cast: [SpriteAnim.Slice, SpriteAnim.FlapAround, SpriteAnim.Swing],
  });
  registerMove(Moves.Overheat, {
    name: 'Overheat',
    description: "Drops the user's Special Attack 2 stages after it lands.",
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 130,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
}
