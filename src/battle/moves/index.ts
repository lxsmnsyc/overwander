import type { Battle } from '../core';
import { setupHitMoves } from './hit';
import { setupLeechSeed } from './leech-seed';
import { setupPowderMoves } from './powder';
import { setupStageMoves } from './stage';
import { setupStatusMoves } from './status';

export function setupMoves(battle: Battle) {
  setupHitMoves(battle);
  setupStageMoves(battle);
  setupStatusMoves(battle);

  setupLeechSeed(battle);
  setupPowderMoves(battle);
}
