import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/** From Play Rough to Aromatic Mist, the heart of the Fairy type */
export default function registerPlayRoughToAromaticMist(): void {
  registerMove(Moves.PlayRough, {
    name: 'Play Rough',
    description: "10% to drop the target's Attack a stage.",
    type: Types.Fairy,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.FairyWind, {
    name: 'Fairy Wind',
    description: 'Plain damage from a distance.',
    type: Types.Fairy,
    category: MoveCategories.Special,
    power: 40,
    pp: 30,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.Moonblast, {
    name: 'Moonblast',
    description: "30% to drop the target's Special Attack a stage.",
    type: Types.Fairy,
    category: MoveCategories.Special,
    power: 95,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.Boomburst, {
    name: 'Boomburst',
    description: "Hits everything opposite and the user's teammates. It is a sound.",
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 140,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.FairyLock, {
    name: 'Fairy Lock',
    description: 'Nobody on the field can be swapped out for 2 seconds, ghosts aside.',
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.KingsShield, {
    name: "King's Shield",
    description:
      'Blocks every damaging move aimed at the user for 2 seconds, and drops the Attack of anything that touches it a stage. Status moves pass. It fails if used twice over.',
    type: Types.Steel,
    category: MoveCategories.Status,
    pp: 10,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.PlayNice, {
    name: 'Play Nice',
    description: "Drops the target's Attack a stage, and never misses.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Hop],
  });
  registerMove(Moves.Confide, {
    name: 'Confide',
    description: "Drops the target's Special Attack a stage, and never misses. It is a sound.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Appeal, SpriteAnim.Sound, SpriteAnim.Hop],
  });
  registerMove(Moves.DiamondStorm, {
    name: 'Diamond Storm',
    description: "Hits everything opposite. 50% to raise the user's Defense 2 stages.",
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    accuracy: 95,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.SteamEruption, {
    name: 'Steam Eruption',
    description: '30% to burn.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 110,
    pp: 5,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.HyperspaceHole, {
    name: 'Hyperspace Hole',
    description:
      'Hits through Protect and Detect, breaks the guard it went through, and never misses.',
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 80,
    pp: 5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.WaterShuriken, {
    name: 'Water Shuriken',
    description: 'Strikes 2 to 5 times, with a shorter wind-up than most.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 15,
    pp: 20,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.QuickStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.MysticalFire, {
    name: 'Mystical Fire',
    description: "Always drops the target's Special Attack a stage.",
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 75,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SpikyShield, {
    name: 'Spiky Shield',
    description:
      'Blocks everything aimed at the user for 2 seconds, and anything that touches it loses 1/8 of its HP. It fails if used twice over.',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 10,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.AromaticMist, {
    name: 'Aromatic Mist',
    description: "Raises a teammate's Special Defense a stage.",
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
