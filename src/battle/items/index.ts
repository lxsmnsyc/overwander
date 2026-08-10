import type Battle from '../core';
import setupBerries from './berries';
import setupStatBoosters from './stat-boosters';
import setupTypeBoosters from './type-boosters';

export default function setupItems(battle: Battle): void {
  setupBerries(battle);
  setupTypeBoosters(battle);
  setupStatBoosters(battle);
}
