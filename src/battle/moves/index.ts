import { Battle } from '../core';
import { setupHitMoves } from './hit';
import { setupLeechSeed } from './leech-seed';
import { setupStageMoves } from './stage';

export function setupMoves(battle: Battle) {
  setupHitMoves(battle);
  setupStageMoves(battle);

  setupLeechSeed(battle);
}
