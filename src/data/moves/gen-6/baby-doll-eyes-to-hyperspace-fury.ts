import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/** From Baby-Doll Eyes to Hyperspace Fury: the end of Kalos's list, where its legendaries keep their own moves */
export default function registerBabyDollEyesToHyperspaceFury(): void {
  registerMove(Moves.BabyDollEyes, {
    name: 'Baby-Doll Eyes',
    description: "Drops the target's Attack a stage, with a shorter wind-up than most.",
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Hop],
  });
  registerMove(Moves.Nuzzle, {
    name: 'Nuzzle',
    description: 'Always paralyses.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 20,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Shock, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.HoldBack, {
    name: 'Hold Back',
    description: 'Always leaves the target on at least 1 HP.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 40,
    pp: 40,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Infestation, {
    name: 'Infestation',
    description: 'Binds the target: 1/8 of its HP every 2 seconds for 8 seconds, and no escape.',
    type: Types.Bug,
    category: MoveCategories.Special,
    power: 20,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.PowerUpPunch, {
    name: 'Power-Up Punch',
    description: "Always raises the user's Attack a stage.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 40,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.OblivionWing, {
    name: 'Oblivion Wing',
    description: 'Heals the user for 3/4 the damage dealt.',
    type: Types.Flying,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.ThousandArrows, {
    name: 'Thousand Arrows',
    description:
      'Hits everything opposite, reaches anything in the air, and brings it down to the ground.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Rumble, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.ThousandWaves, {
    name: 'Thousand Waves',
    description: 'Hits everything opposite, and none of them can be swapped out for 10 seconds.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Rumble, SpriteAnim.Stomp, SpriteAnim.Charge],
  });
  registerMove(Moves.LandsWrath, {
    name: "Land's Wrath",
    description: 'Hits everything opposite.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Rumble, SpriteAnim.Stomp, SpriteAnim.Charge],
  });
  registerMove(Moves.LightOfRuin, {
    name: 'Light of Ruin',
    description: 'The user takes 1/2 of the damage it deals.',
    type: Types.Fairy,
    category: MoveCategories.Special,
    power: 140,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.OriginPulse, {
    name: 'Origin Pulse',
    description: 'Hits everything opposite.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 110,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.PrecipiceBlades, {
    name: 'Precipice Blades',
    description: 'Hits everything opposite.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 120,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Rumble, SpriteAnim.Stomp, SpriteAnim.Charge],
  });
  registerMove(Moves.DragonAscent, {
    name: 'Dragon Ascent',
    description: "Drops the user's Defense and Special Defense 1 stage each.",
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 120,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.HyperspaceFury, {
    name: 'Hyperspace Fury',
    description:
      "Hits through Protect and Detect, breaks the guard, and never misses. Drops the user's Defense a stage.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
}
