import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/** From Spotlight to Smart Strike */
export default function registerSpotlightToSmartStrike(): void {
  registerMove(Moves.Spotlight, {
    name: 'Spotlight',
    description: "For 4 seconds every single-target move aimed at the target's side comes to it.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    priority: 3,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.ToxicThread, {
    name: 'Toxic Thread',
    description: 'Poisons the target and drops its Speed a stage.',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.LaserFocus, {
    name: 'Laser Focus',
    description: "The user's next move within 4 seconds is a critical hit.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Charge],
  });
  registerMove(Moves.GearUp, {
    name: 'Gear Up',
    description:
      "Raises the Attack and Special Attack of the user's side carrying Plus or Minus a stage each.",
    type: Types.Steel,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Charge],
  });
  registerMove(Moves.ThroatChop, {
    name: 'Throat Chop',
    description: 'The target cannot use a sound move for 4 seconds.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Chop, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.PollenPuff, {
    name: 'Pollen Puff',
    description: 'Bursts on an enemy. Aimed at a teammate it heals 1/2 its HP instead.',
    type: Types.Bug,
    category: MoveCategories.Special,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.AnchorShot, {
    name: 'Anchor Shot',
    description: 'The target cannot be swapped out for 10 seconds, ghosts aside.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 80,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Swing, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.PsychicTerrain, {
    name: 'Psychic Terrain',
    description:
      'For 10 seconds, grounded pokemon are safe from moves that wind up faster than an ordinary move, and their Psychic moves hit 1.3x.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.Lunge, {
    name: 'Lunge',
    description: "Always drops the target's Attack a stage.",
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.FireLash, {
    name: 'Fire Lash',
    description: "Always drops the target's Defense a stage.",
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.PowerTrip, {
    name: 'Power Trip',
    description: '20 more power for every stage the user has raised.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 20,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.BurnUp, {
    name: 'Burn Up',
    description: 'Only a Fire type can use it, and the user is not Fire afterwards.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 130,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.SpeedSwap, {
    name: 'Speed Swap',
    description: 'The user and the target trade Speed until they leave the field.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SmartStrike, {
    name: 'Smart Strike',
    description: 'Never misses.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 70,
    pp: 10,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Jab, SpriteAnim.Strike, SpriteAnim.Attack],
  });
}
