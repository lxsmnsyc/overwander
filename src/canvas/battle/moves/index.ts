import { Moves } from '../../../data/ids/moves';
import type MoveVisual from './__visual';
import supersonic from './supersonic';

/**
 * Which moves have a picture of their own.
 *
 * Almost none of them do. A move with nothing here is drawn the way
 * every move was drawn before this existed — a dot crossing the field
 * if it spends time in the air, and nothing at all if it does not —
 * which is the point of looking the move up rather than asking every
 * move for a visual it has not got.
 *
 * The entries are **builders** rather than performances: a performance
 * carries a playhead and two pokemon using Supersonic in the same
 * frame are two of them. What they share is underneath, in the sheet
 * cache — the second cast of a move is a clone rather than a download
 */
const VISUALS: Partial<Record<Moves, () => Promise<MoveVisual>>> = {
  [Moves.Supersonic]: supersonic,
};

export default function moveVisualFor(move: Moves): (() => Promise<MoveVisual>) | null {
  return VISUALS[move] ?? null;
}
