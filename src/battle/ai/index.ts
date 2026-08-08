import type Battle from '../core';
import { setupChooseMoveAI } from './choose-move';
import setupIdleAI from './idle';
import { setupRatingAI } from './rating';

export default function setupAI(battle: Battle): void {
  setupChooseMoveAI(battle);
  setupRatingAI(battle);
  setupIdleAI(battle);
}
