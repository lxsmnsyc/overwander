import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Storm Throw to Simple Beam: the moves that read weight, Speed
 * and the target's own Attack
 */
export default function registerStormThrowToSimpleBeam(): void {
  registerMove(Moves.StormThrow, {
    name: 'Storm Throw',
    description: 'Always lands a critical.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.FlameBurst, {
    name: 'Flame Burst',
    description: "Its splash burns each of the target's teammates for 1/16 of their HP.",
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 70,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SludgeWave, {
    name: 'Sludge Wave',
    description: "Hits the user's own team and everything opposite. 10% to poison.",
    type: Types.Poison,
    category: MoveCategories.Special,
    power: 95,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.QuiverDance, {
    name: 'Quiver Dance',
    description: "Raises the user's Special Attack, Special Defense and Speed a stage each.",
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Rotate],
  });
  registerMove(Moves.HeavySlam, {
    name: 'Heavy Slam',
    description:
      'Hits harder the heavier the user is than the target: 40 power, up to 120 at 5x its weight. Never misses a minimized target, and hits 2x on it.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Stomp, SpriteAnim.Hop],
  });
  registerMove(Moves.Synchronoise, {
    name: 'Synchronoise',
    description:
      "Hits the user's own team and everything opposite, but only those sharing a type with the user.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 120,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.ElectroBall, {
    name: 'Electro Ball',
    description:
      'Hits harder the faster the user is than the target: 40 power, up to 150 at 4x its Speed.',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Shock, SpriteAnim.Charge],
  });
  registerMove(Moves.Soak, {
    name: 'Soak',
    description: 'Makes the target pure Water-type.',
    type: Types.Water,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.FlameCharge, {
    name: 'Flame Charge',
    description: "Raises the user's Speed a stage.",
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 50,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.Coil, {
    name: 'Coil',
    description: "Raises the user's Attack, Defense and accuracy a stage each.",
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Rotate],
  });
  registerMove(Moves.LowSweep, {
    name: 'Low Sweep',
    description: "Drops the target's Speed a stage.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 65,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Kick, SpriteAnim.Swing],
  });
  registerMove(Moves.AcidSpray, {
    name: 'Acid Spray',
    description: "Drops the target's Special Defense 2 stages.",
    type: Types.Poison,
    category: MoveCategories.Special,
    power: 40,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.FoulPlay, {
    name: 'Foul Play',
    description: "Hits with the target's own Attack and stages rather than the user's.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 95,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.SimpleBeam, {
    name: 'Simple Beam',
    description: "Swaps 1 of the target's abilities for Simple, so its stat stages count 2x.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
}
