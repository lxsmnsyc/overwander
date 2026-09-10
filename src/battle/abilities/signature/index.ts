import type Battle from '../../core';
import bulbasaurToPikachu from './bulbasaur-to-pikachu';
import chikoritaToCelebi from './chikorita-to-celebi';
import eeveeToDragonite from './eevee-to-dragonite';
import geodudeToDrowzee from './geodude-to-drowzee';
import krabbyToPinsir from './krabby-to-pinsir';
import parasToTentacool from './paras-to-tentacool';
import sandshrewToOddish from './sandshrew-to-oddish';
import spoinkToDeoxys from './spoink-to-deoxys';
import treeckoToTorkoal from './treecko-to-torkoal';
import shinxToShieldon from './shinx-to-shieldon';
import starlyToKricketot from './starly-to-kricketot';
import turtwigToPiplup from './turtwig-to-piplup';

/**
 * The invented abilities, one per evolution family, in the order the
 * dex introduces the families
 */
const setupAbilities = [
  ...bulbasaurToPikachu,
  ...sandshrewToOddish,
  ...parasToTentacool,
  ...geodudeToDrowzee,
  ...krabbyToPinsir,
  ...eeveeToDragonite,
  ...chikoritaToCelebi,
  ...treeckoToTorkoal,
  ...spoinkToDeoxys,
  ...turtwigToPiplup,
  ...starlyToKricketot,
  ...shinxToShieldon,
];

/**
 * Every ability the signature files implement. A registry entry is a
 * separate file, so the two are checked against each other in a test
 */
export const SIGNATURE_ABILITIES = setupAbilities.map((setup) => setup.ability);

export default function setupSignatureAbilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
