import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/** From Purify to Aurora Veil */
export default function registerPurifyToAuroraVeil(): void {
  registerMove(Moves.Purify, {
    name: 'Purify',
    description:
      "Cures the target's status and heals the user 1/2 its HP. Fails if there is nothing to cure.",
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.RevelationDance, {
    name: 'Revelation Dance',
    description: "Thrown as the user's first type.",
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.CoreEnforcer, {
    name: 'Core Enforcer',
    description:
      'Hits everything opposite, and takes an ability off each one it hits that is not winding up a move.',
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 100,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.TropKick, {
    name: 'Trop Kick',
    description: "Always drops the target's Attack a stage.",
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 70,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Kick, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Instruct, {
    name: 'Instruct',
    description: 'The target throws the move it threw last again, at once.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.BeakBlast, {
    name: 'Beak Blast',
    description: 'A long wind-up, and anything that touches the user during it is burned.',
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 100,
    pp: 15,
    accuracy: 100,
    priority: -3,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Jab, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.ClangingScales, {
    name: 'Clanging Scales',
    description: "Hits everything opposite, then drops the user's Defense a stage. It is a sound.",
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 110,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Shake, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.DragonHammer, {
    name: 'Dragon Hammer',
    description: 'Plain contact damage.',
    type: Types.Dragon,
    category: MoveCategories.Physical,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.BrutalSwing, {
    name: 'Brutal Swing',
    description: "Hits everything opposite and the user's teammates.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Rotate, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.AuroraVeil, {
    name: 'Aurora Veil',
    description:
      "Cuts physical and special damage against the user's side by 1/3 for 10 seconds. It fails outside hail or snow.",
    type: Types.Ice,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
