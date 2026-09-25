import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/** From Purify to Aurora Veil */
export default function registerPurifyToAuroraVeil(): void {
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
