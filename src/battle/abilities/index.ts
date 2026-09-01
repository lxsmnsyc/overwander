import type Battle from '../core';
import setupGen1Abilities from './gen-1';
import setupGen2Abilities from './gen-2';
import setupSpecialAbilities from './special';

export default function setupAbilities(battle: Battle): void {
  setupGen1Abilities(battle);
  setupGen2Abilities(battle);
  setupSpecialAbilities(battle);
}
