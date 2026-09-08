import type Battle from '../../core';
import bulbasaurToPikachu from './bulbasaur-to-pikachu';
import sandshrewToOddish from './sandshrew-to-oddish';
import parasToTentacool from './paras-to-tentacool';
import geodudeToDrowzee from './geodude-to-drowzee';
import krabbyToPinsir from './krabby-to-pinsir';
import eeveeToDragonite from './eevee-to-dragonite';

/**
 * Kanto's abilities, in the order the dex introduces them. They are
 * started in that order, which is the order their listeners answer in
 * where two of them answer the same question
 */
const setupAbilities = [
  ...bulbasaurToPikachu,
  ...sandshrewToOddish,
  ...parasToTentacool,
  ...geodudeToDrowzee,
  ...krabbyToPinsir,
  ...eeveeToDragonite,
];

export default function setupGen1Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
