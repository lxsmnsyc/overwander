import { Moves } from '../../data/ids/moves';
import { Battle } from '../core';
import { setupHitMove } from './__create';

export function setupHitMoves(battle: Battle) {
  setupHitMove(battle, Moves.Tackle);
}
