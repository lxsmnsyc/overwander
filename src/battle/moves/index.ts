import type { Battle } from '../core';
import { setupHitMoves } from './hit';
import { setupIncreasedCriticalHitRatioMoves } from './increased-critical-hit';
import { setupLeechSeed } from './leech-seed';
import { setupPowderMoves } from './powder';
import { setupSolarBeam } from './solar-beam';
import { setupStageMoves } from './stage';
import { setupStatusMoves } from './status';

export function setupMoves(battle: Battle) {
  // Overarching groups
  setupHitMoves(battle);
  setupStageMoves(battle);
  setupStatusMoves(battle);

  // Small groups
  setupPowderMoves(battle);
  setupIncreasedCriticalHitRatioMoves(battle);

  // Variations
  setupSolarBeam(battle);
  setupLeechSeed(battle);
}
