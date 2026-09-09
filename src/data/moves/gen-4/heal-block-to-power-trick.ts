import { Types } from '../../constants/types';
import { MoveCategories, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * From Heal Block to Power Trick: the last of Sinnoh's first stretch,
 * where a move rewrites what a stat is for
 */
export default function registerHealBlockToPowerTrick(): void {
  registerMove(Moves.HealBlock, {
    name: 'Heal Block',
    description: 'The target cannot be healed for 10 seconds.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.WringOut, {
    name: 'Wring Out',
    description: 'The more HP the target has left, the harder it hits, up to 120 power.',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.PowerTrick, {
    name: 'Power Trick',
    description: "Swaps the user's Attack and Defense.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
}
