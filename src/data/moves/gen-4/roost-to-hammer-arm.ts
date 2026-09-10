import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * From Roost to Hammer Arm: the opening of Sinnoh's list, where the
 * support moves rewrite what the ground and the sky are worth
 */
export default function registerRoostToHammerArm(): void {
  registerMove(Moves.Roost, {
    name: 'Roost',
    description: 'Heals 1/2 the max HP, and the user is not Flying for 2 seconds.',
    type: Types.Flying,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.CarefulWalk, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.Gravity, {
    name: 'Gravity',
    description: 'For 10 seconds nothing is off the ground: no Flying immunity and no Levitate.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.MiracleEye, {
    name: 'Miracle Eye',
    description: 'Psychic moves hit the target even if it is Dark, and its Evasion stops counting.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.WakeUpSlap, {
    name: 'Wake-Up Slap',
    description: '2x power on a sleeping target, and wakes it.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 70,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.HammerArm, {
    name: 'Hammer Arm',
    description: "Drops the user's Speed 1 stage.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 100,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Chop, SpriteAnim.Slam, SpriteAnim.Attack],
  });
}
