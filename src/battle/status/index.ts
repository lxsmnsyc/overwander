import type { Battle } from '../core';
import { setupPoisonedStatus } from './poisoned';
import { setupSeedingStatus } from './seeding';
import { setupSleepingStatus } from './sleeping';

export function seupStatus(battle: Battle) {
  setupPoisonedStatus(battle);
  setupSeedingStatus(battle);
  setupSleepingStatus(battle);
}
