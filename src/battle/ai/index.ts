import type { Battle } from '../core';
import { setupChooseMoveAI } from './choose-move';
import { setupIdleAI } from './idle';
import { setupRatingAI } from './rating';

export function setupAI(battle: Battle) {
  setupChooseMoveAI(battle);
  setupRatingAI(battle);
  setupIdleAI(battle);
}
