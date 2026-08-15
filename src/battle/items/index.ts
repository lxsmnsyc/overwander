import type Battle from '../core';
import setupBattleItems from './battle-items';
import setupBerries from './berries';
import setupGear from './gear';
import setupGems from './gems';
import setupIncenses from './incenses';
import setupOneShots from './one-shots';
import setupOrbs from './orbs';
import setupSacredAsh from './sacred-ash';
import setupStatBoosters from './stat-boosters';
import setupTypeBoosters from './type-boosters';

export default function setupItems(battle: Battle): void {
  setupBerries(battle);
  setupTypeBoosters(battle);
  setupStatBoosters(battle);
  setupIncenses(battle);
  setupGems(battle);
  setupOrbs(battle);
  setupGear(battle);
  setupOneShots(battle);
  setupBattleItems(battle);
  setupSacredAsh(battle);
}
