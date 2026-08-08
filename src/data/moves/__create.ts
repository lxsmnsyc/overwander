import type { Types } from '../constants/types';
import type { MoveCategories, Moves } from '../ids/moves';

export interface MoveData {
  name: string;

  type: Types;

  category: MoveCategories;

  power?: number;

  // By 100, undefined means no accuracy check
  accuracy?: number;

  priority?: number;

  pp: number;

  target: number;

  flags: number;

  steps?: number;
}

const MOVE_DATA = new Map<Moves, MoveData>();

export function registerMove(move: Moves, data: MoveData) {
  MOVE_DATA.set(move, data);
}

export function getRegisteredMoves(): Moves[] {
  return [...MOVE_DATA.keys()];
}

export function getMoveData(move: Moves): MoveData {
  const result = MOVE_DATA.get(move);
  if (result) {
    return result;
  }
  throw new Error('Missing move data for ' + move);
}
