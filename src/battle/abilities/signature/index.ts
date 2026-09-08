import type Battle from '../../core';
import bulbasaurToPikachu from './bulbasaur-to-pikachu';
import parasToTentacool from './paras-to-tentacool';
import sandshrewToOddish from './sandshrew-to-oddish';

/**
 * The invented abilities, one per evolution family, in the order the
 * dex introduces the families
 */
const setupAbilities = [...bulbasaurToPikachu, ...sandshrewToOddish, ...parasToTentacool];

export default function setupSignatureAbilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
