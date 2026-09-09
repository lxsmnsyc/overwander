import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Worry Seed to Flare Blitz: what a side leaves on the ground
 * for whoever walks in, what a pokemon does to keep itself standing,
 * and the one that burns the user to land
 */
export default function registerWorrySeedToFlareBlitz(): void {
  registerMove(Moves.WorrySeed, {
    name: 'Worry Seed',
    description: "Swaps 1 of the target's abilities for Insomnia, so it cannot be put to sleep.",
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SuckerPunch, {
    name: 'Sucker Punch',
    description: 'Only lands on a target that is casting a damaging move.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 70,
    pp: 5,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.QuickStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.ToxicSpikes, {
    name: 'Toxic Spikes',
    description: 'Poisons anything that walks onto the far side. Two layers badly poison.',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Team,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.HeartSwap, {
    name: 'Heart Swap',
    description: "Trades every one of the user's stages for the target's.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.AquaRing, {
    name: 'Aqua Ring',
    description: 'Puts back 1/16 of the max HP each time the user acts.',
    type: Types.Water,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.MagnetRise, {
    name: 'Magnet Rise',
    description: 'The user is off the ground for 10 seconds, so Ground moves miss it.',
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Hover, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.FlareBlitz, {
    name: 'Flare Blitz',
    description: 'The user takes 1/3 of what it deals. 10% to burn.',
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 120,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
}
