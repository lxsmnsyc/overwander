import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Dual Chop to Gear Grind: mostly plain blows with one rider each
 */
export default function registerDualChopToGearGrind(): void {
  registerMove(Moves.DualChop, {
    name: 'Dual Chop',
    description: 'Strikes 2 times.',
    type: Types.Dragon,
    category: MoveCategories.Physical,
    power: 40,
    pp: 15,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Chop, SpriteAnim.MultiStrike, SpriteAnim.Double],
  });
  registerMove(Moves.HeartStamp, {
    name: 'Heart Stamp',
    description: '30% to flinch.',
    type: Types.Psychic,
    category: MoveCategories.Physical,
    power: 60,
    pp: 25,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.HornLeech, {
    name: 'Horn Leech',
    description: 'Heals the user for 1/2 of what it deals.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 75,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.SacredSword, {
    name: 'Sacred Sword',
    description: "Ignores the target's stat stages.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.Strike, SpriteAnim.Swing],
  });
  registerMove(Moves.RazorShell, {
    name: 'Razor Shell',
    description: "50% to drop the target's Defense a stage.",
    type: Types.Water,
    category: MoveCategories.Physical,
    power: 75,
    pp: 10,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.Swing],
  });
  registerMove(Moves.HeatCrash, {
    name: 'Heat Crash',
    description:
      'Hits harder the heavier the user is than the target: 40 power, up to 120 at 5x its weight. Never misses a minimized target, and hits 2x on it.',
    type: Types.Fire,
    category: MoveCategories.Physical,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Stomp, SpriteAnim.Hop],
  });
  registerMove(Moves.LeafTornado, {
    name: 'Leaf Tornado',
    description: "50% to drop the target's accuracy a stage.",
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.Twirl, SpriteAnim.Emit, SpriteAnim.Rotate],
  });
  registerMove(Moves.Steamroller, {
    name: 'Steamroller',
    description: '30% to flinch. Never misses a minimized target, and hits 2x on it.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 65,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Rotate],
  });
  registerMove(Moves.CottonGuard, {
    name: 'Cotton Guard',
    description: "Raises the user's Defense 3 stages.",
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.NightDaze, {
    name: 'Night Daze',
    description: "40% to drop the target's accuracy a stage.",
    type: Types.Dark,
    category: MoveCategories.Special,
    power: 85,
    pp: 10,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Psystrike, {
    name: 'Psystrike',
    description: "Lands against the target's Defense rather than its Special Defense.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 100,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.TailSlap, {
    name: 'Tail Slap',
    description: 'Strikes 2 to 5 times.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 25,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.TailWhip, SpriteAnim.Slap, SpriteAnim.Double],
  });
  registerMove(Moves.Hurricane, {
    name: 'Hurricane',
    description:
      '30% to confuse. Never misses in rain, drops to 50% in sun, and reaches anything in the air.',
    type: Types.Flying,
    category: MoveCategories.Special,
    power: 110,
    pp: 10,
    accuracy: 70,
    target: MoveTargets.Unit,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.FlapAround, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.HeadCharge, {
    name: 'Head Charge',
    description: 'The user takes 1/4 of the damage it deals.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 120,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.GearGrind, {
    name: 'Gear Grind',
    description: 'Strikes 2 times.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 50,
    pp: 15,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Rotate],
  });
}
