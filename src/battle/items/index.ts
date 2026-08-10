import type Battle from '../core';
import setupBerries from './berries';
import setupGems from './gems';
import setupIncenses from './incenses';
import setupOrbs from './orbs';
import setupStatBoosters from './stat-boosters';
import setupTypeBoosters from './type-boosters';

export default function setupItems(battle: Battle): void {
  setupBerries(battle);
  setupTypeBoosters(battle);
  setupStatBoosters(battle);
  setupIncenses(battle);
  setupGems(battle);
  setupOrbs(battle);
}
