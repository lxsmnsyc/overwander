import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Searing Shot to Fusion Bolt: the end of Unova's list, where its
 * legendaries and mythicals keep their own moves
 */
export default function registerSearingShotToFusionBolt(): void {
  registerMove(Moves.SearingShot, {
    name: 'Searing Shot',
    description: "Hits the user's own team and everything opposite. 30% to burn.",
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.TechnoBlast, {
    name: 'Techno Blast',
    description: 'Takes the type of the Drive the user holds, and is Normal without one.',
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 120,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  // TODO Meloetta's change of form, once Meloetta is registered
  registerMove(Moves.RelicSong, {
    name: 'Relic Song',
    description: 'Hits everything opposite. 10% to put each to sleep. It is a sound.',
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 75,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.SecretSword, {
    name: 'Secret Sword',
    description: "Lands against the target's Defense rather than its Special Defense.",
    type: Types.Fighting,
    category: MoveCategories.Special,
    power: 85,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.Swing],
  });
  registerMove(Moves.Glaciate, {
    name: 'Glaciate',
    description: "Hits everything opposite, and drops each one's Speed a stage.",
    type: Types.Ice,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 95,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.BoltStrike, {
    name: 'Bolt Strike',
    description: '20% to paralyse.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 130,
    pp: 5,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Shock, SpriteAnim.Attack],
  });
  registerMove(Moves.BlueFlare, {
    name: 'Blue Flare',
    description: '20% to burn.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 130,
    pp: 5,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.FieryDance, {
    name: 'Fiery Dance',
    description: "50% to raise the user's Special Attack a stage.",
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Rotate],
  });
  registerMove(Moves.FreezeShock, {
    name: 'Freeze Shock',
    description: 'Winds up, then strikes. 30% to paralyse.',
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 140,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    steps: 1,
    cast: [SpriteAnim.Swell, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.IceBurn, {
    name: 'Ice Burn',
    description: 'Winds up, then strikes. 30% to burn.',
    type: Types.Ice,
    category: MoveCategories.Special,
    power: 140,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    steps: 1,
    cast: [SpriteAnim.Swell, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Snarl, {
    name: 'Snarl',
    description:
      "Hits everything opposite, and drops each one's Special Attack a stage. It is a sound.",
    type: Types.Dark,
    category: MoveCategories.Special,
    power: 55,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.Bite, SpriteAnim.Charge],
  });
  registerMove(Moves.IcicleCrash, {
    name: 'Icicle Crash',
    description: '30% to flinch.',
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 85,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Swing],
  });
  registerMove(Moves.VCreate, {
    name: 'V-create',
    description: "Drops the user's Defense, Special Defense and Speed a stage each.",
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 180,
    pp: 5,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.FusionFlare, {
    name: 'Fusion Flare',
    description: '2x power if a Fusion Bolt landed anywhere in the last 2 seconds. Thaws the user.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.FusionBolt, {
    name: 'Fusion Bolt',
    description: '2x power if a Fusion Flare landed anywhere in the last 2 seconds.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Slam, SpriteAnim.Attack],
  });
}
