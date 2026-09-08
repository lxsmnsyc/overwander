import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Odor Sleuth to Howl: the machines Hoenn handed out, and the
 * multi-hit moves among them
 */
export default function registerOdorSleuthToHowl(): void {
  registerMove(Moves.OdorSleuth, {
    name: 'Odor Sleuth',
    description: 'The target loses its evasion and its immunities to Normal and Fighting.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.CarefulWalk, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.RockTomb, {
    name: 'Rock Tomb',
    description: "Always drops the target's Speed a stage.",
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 60,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.SilverWind, {
    name: 'Silver Wind',
    description: "10% to raise every one of the user's stats a stage.",
    type: Types.Bug,
    category: MoveCategories.Special,
    power: 60,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.Emit, SpriteAnim.FlapAround, SpriteAnim.Charge],
  });
  registerMove(Moves.MetalSound, {
    name: 'Metal Sound',
    description: "Drops the target's Special Defense 2 stages. It is a sound.",
    type: Types.Steel,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 85,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.GrassWhistle, {
    name: 'Grass Whistle',
    description: 'Puts the target to sleep. It is a sound.',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 55,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.Tickle, {
    name: 'Tickle',
    description: "Drops the target's Attack and Defense a stage each.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Lick, SpriteAnim.Slap, SpriteAnim.Charge],
  });
  registerMove(Moves.CosmicPower, {
    name: 'Cosmic Power',
    description: "Raises the user's Defense and Special Defense a stage each.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.WaterSpout, {
    name: 'Water Spout',
    description: 'The more HP the user has left, the harder it hits, up to 150 power.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SignalBeam, {
    name: 'Signal Beam',
    description: '10% to confuse.',
    type: Types.Bug,
    category: MoveCategories.Special,
    power: 75,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.ShadowPunch, {
    name: 'Shadow Punch',
    description: 'Never misses.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.Extrasensory, {
    name: 'Extrasensory',
    description: '10% to flinch.',
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 80,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SkyUppercut, {
    name: 'Sky Uppercut',
    description: 'Reaches a pokemon that is up in the air.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 85,
    pp: 15,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Uppercut, SpriteAnim.Punch, SpriteAnim.Attack],
  });
  registerMove(Moves.SandTomb, {
    name: 'Sand Tomb',
    description: 'Binds the target: 1/8 of its HP a second for 4 seconds, and no escape.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 35,
    pp: 15,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SheerCold, {
    name: 'Sheer Cold',
    description: 'Knocks the target out in one hit, and lands 30% of the time.',
    type: Types.Ice,
    category: MoveCategories.Special,
    pp: 5,
    accuracy: 30,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.MuddyWater, {
    name: 'Muddy Water',
    description: "Hits everything opposite. 30% to drop the target's accuracy a stage.",
    type: Types.Water,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.BulletSeed, {
    name: 'Bullet Seed',
    description: 'Strikes 2 to 5 times.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 25,
    pp: 30,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.AerialAce, {
    name: 'Aerial Ace',
    description: 'Never misses.',
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Slice, SpriteAnim.Attack],
  });
  registerMove(Moves.IcicleSpear, {
    name: 'Icicle Spear',
    description: 'Strikes 2 to 5 times.',
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 25,
    pp: 30,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.IronDefense, {
    name: 'Iron Defense',
    description: "Raises the user's Defense 2 stages.",
    type: Types.Steel,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Block, {
    name: 'Block',
    description: 'The target cannot be swapped out for 10 seconds.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.Howl, {
    name: 'Howl',
    description: "Raises the user's Attack a stage. It is a sound.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.None,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.Sing, SpriteAnim.Charge],
  });
}
