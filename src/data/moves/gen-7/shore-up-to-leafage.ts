import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/** From Shore Up to Leafage, the first of Alola's own */
export default function registerShoreUpToLeafage(): void {
  registerMove(Moves.ShoreUp, {
    name: 'Shore Up',
    description: 'Heals the user 1/2 its HP, or 2/3 in a sandstorm.',
    type: Types.Ground,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Rumble, SpriteAnim.Charge],
  });
  registerMove(Moves.FirstImpression, {
    name: 'First Impression',
    description:
      'Winds up far faster than an ordinary move. Once a trip onto the field, and no more.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 100,
    priority: 2,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.BanefulBunker, {
    name: 'Baneful Bunker',
    description:
      'Blocks everything aimed at the user for 2 seconds, and poisons anything that touches it. It fails if used twice over.',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 10,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.SpiritShackle, {
    name: 'Spirit Shackle',
    description: 'The target cannot be swapped out for 10 seconds, ghosts aside.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Attack],
  });
  registerMove(Moves.DarkestLariat, {
    name: 'Darkest Lariat',
    description: "Ignores the target's stat stages.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 85,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Rotate, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.SparklingAria, {
    name: 'Sparkling Aria',
    description:
      "Hits everything opposite and the user's teammates, and washes a burn off whatever it hits. It is a sound.",
    type: Types.Water,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.IceHammer, {
    name: 'Ice Hammer',
    description: "Drops the user's Speed a stage after it lands.",
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 100,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.FloralHealing, {
    name: 'Floral Healing',
    description: 'Heals the target 1/2 its HP, or 2/3 on Grassy Terrain.',
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.HighHorsepower, {
    name: 'High Horsepower',
    description: 'Plain contact damage.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 95,
    pp: 10,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Stomp, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.StrengthSap, {
    name: 'Strength Sap',
    description: "Heals the user by the target's Attack, then drops that Attack a stage.",
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.SolarBlade, {
    name: 'Solar Blade',
    description: 'Winds up unless the sun is out. Fog, rain, hail and sandstorm halve it.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 125,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    steps: 1,
    cast: [SpriteAnim.Slice, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Leafage, {
    name: 'Leafage',
    description: 'Plain damage from a distance.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 40,
    pp: 40,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Attack],
  });
}
