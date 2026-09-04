import type Battle from '../core';
import { setupChooseMoveAI } from './choose-move';
import setupIdleAI from './idle';
import setupNatureAI from './nature';
import { setupRatingAI } from './rating';

/**
 * The AI that drives idle units. `byNature` is the Palace's rule: it
 * only adds a scoring listener, so it wires alongside the ordinary
 * chooser rather than in place of it
 */
export default function setupAI(battle: Battle, byNature = false): void {
  setupChooseMoveAI(battle);
  setupRatingAI(battle);

  if (byNature) {
    setupNatureAI(battle);
  }
  setupIdleAI(battle);
}
