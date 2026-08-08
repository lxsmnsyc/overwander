import type Battle from '../core';
import setupBerries from './berries';

export default function setupItems(battle: Battle): void {
  setupBerries(battle);
}
