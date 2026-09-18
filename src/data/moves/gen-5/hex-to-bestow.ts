import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * From Hex to Bestow: the moves that move pokemon, items and wind-ups
 * about rather than only hitting
 */
export default function registerHexToBestow(): void {
  registerMove(Moves.Hex, {
    name: 'Hex',
    description: '2x power against a target with a status condition.',
    type: Types.Ghost,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.SkyDrop, {
    name: 'Sky Drop',
    description:
      'Carries the target up, where it cannot act, then drops it. Fails on 200 kg or more, and a Flying type lands unhurt.',
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: [SpriteAnim.FlapAround, SpriteAnim.Hover, SpriteAnim.Hop],
  });
  registerMove(Moves.ShiftGear, {
    name: 'Shift Gear',
    description: "Raises the user's Speed 2 stages and its Attack a stage.",
    type: Types.Steel,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Charge],
  });
  registerMove(Moves.CircleThrow, {
    name: 'Circle Throw',
    description: 'Throws the target off the field and drags its weakest teammate in. Slow to cast.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 90,
    priority: -6,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Swing],
  });
  registerMove(Moves.Incinerate, {
    name: 'Incinerate',
    description: 'Hits everything opposite, burning up any berry or gem each one holds.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 60,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.Quash, {
    name: 'Quash',
    description: 'A target winding up a move has to start its wind-up over.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Acrobatics, {
    name: 'Acrobatics',
    description: '2x power while the user holds no item.',
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 55,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Hop],
  });
  registerMove(Moves.ReflectType, {
    name: 'Reflect Type',
    description: "The user takes on the target's types.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Retaliate, {
    name: 'Retaliate',
    description: '2x power if a teammate fainted in the last 2 seconds.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 70,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.FinalGambit, {
    name: 'Final Gambit',
    description: "Deals damage equal to the user's HP, and the user faints if it lands.",
    type: Types.Fighting,
    category: MoveCategories.Special,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.Bestow, {
    name: 'Bestow',
    description: "Hands the user's held item to a teammate with room for it.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
}
