import { Types } from '../constants/types';
import {
  MoveCategories,
  MoveFlags,
  Moves,
  MoveTargetFlags,
} from '../ids/moves';
import { registerMove } from './__create';

export function registerGen1Moves() {
  registerMove(Moves.Tackle, {
    name: 'Tackle',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 40,
    pp: 35,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
  });
}
