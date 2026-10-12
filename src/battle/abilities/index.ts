import type Battle from '../core';
import setupGen1Abilities from './gen-1';
import setupGen2Abilities from './gen-2';
import setupGen3Abilities from './gen-3';
import setupGen4Abilities from './gen-4';
import setupGen5Abilities from './gen-5';
import setupGen6Abilities from './gen-6';
import setupGen7Abilities from './gen-7';
import setupGen8Abilities from './gen-8';
import setupSignatureAbilities from './signature';
import setupSpecialAbilities from './special';

export default function setupAbilities(battle: Battle): void {
  setupGen1Abilities(battle);
  setupGen2Abilities(battle);
  setupGen3Abilities(battle);
  setupGen4Abilities(battle);
  setupGen5Abilities(battle);
  setupGen6Abilities(battle);
  setupGen7Abilities(battle);
  setupGen8Abilities(battle);
  setupSpecialAbilities(battle);
  setupSignatureAbilities(battle);
}
