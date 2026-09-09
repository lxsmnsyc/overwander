import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Payback to Trump Card: the moves that wait for their moment,
 * and the two that go through what somebody is carrying
 */
export default function registerPaybackToTrumpCard(): void {
  registerMove(Moves.Payback, {
    name: 'Payback',
    description: '2x power if the target has begun a cast in the last 2 seconds.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 50,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Assurance, {
    name: 'Assurance',
    description: '2x power if the target has already been hurt in the last 2 seconds.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Embargo, {
    name: 'Embargo',
    description: 'The target cannot use its held item for 10 seconds.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Fling, {
    name: 'Fling',
    description: "Throws the user's held item. The item decides the power, and it is gone after.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.PsychoShift, {
    name: 'Psycho Shift',
    description: "Passes the user's status to the target, which cures the user.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.TrumpCard, {
    name: 'Trump Card',
    description: 'Every one played this fight makes the next hit harder, from 40 power up to 200.',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
