import type Battle from '../core';
import setupGen1Abilities from './gen-1';
import setupSpecialAbilities from './special';

export default function setupAbilities(battle: Battle): void {
  setupGen1Abilities(battle);
  setupSpecialAbilities(battle);
}
