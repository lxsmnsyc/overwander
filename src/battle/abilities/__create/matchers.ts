import type { Types } from '../../../data/constants/types';
import type { MoveFlags, Moves } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type { MoveTarget } from '../../events';
import type Unit from '../../unit';

/** Which moves an ability answers, for the ones that answer some rather than all */
/**
 * Which moves an absorbing ability answers. The type is handed in
 * already resolved rather than asked for again: the immunity check is
 * itself an answer to a type question, and re-opening one from inside
 * it would ask the same listeners the same thing twice
 */
export type AbsorbMatcher = (source: Unit, move: Moves, target: MoveTarget, type: Types) => boolean;

/** Moves of one type: Sap Sipper's grass, Motor Drive's electric. */
export function movesOfType(type: Types): AbsorbMatcher {
  return (_source, _move, _target, moveType) => moveType === type;
}

/** Moves carrying one flag, whatever type they come as. */
export function movesFlagged(flag: MoveFlags): AbsorbMatcher {
  return (_source, move) => (getMoveData(move).flags & flag) !== 0;
}
