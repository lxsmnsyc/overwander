import type Battle from '../../core';
import arceus from './arceus';
import bulbasaurToPikachu from './bulbasaur-to-pikachu';
import chikoritaToCelebi from './chikorita-to-celebi';
import eeveeToDragonite from './eevee-to-dragonite';
import geodudeToDrowzee from './geodude-to-drowzee';
import heatranRegigigas from './heatran-regigigas';
import krabbyToPinsir from './krabby-to-pinsir';
import lakeTrio from './lake-trio';
import manaphy from './manaphy';
import moonDuo from './moon-duo';
import pachirisuToCarnivine from './pachirisu-to-carnivine';
import parasToTentacool from './paras-to-tentacool';
import rotom from './rotom';
import sandshrewToOddish from './sandshrew-to-oddish';
import shaymin from './shaymin';
import spoinkToDeoxys from './spoink-to-deoxys';
import treeckoToTorkoal from './treecko-to-torkoal';
import burmyToShellos from './burmy-to-shellos';
import combeeToCherubi from './combee-to-cherubi';
import creationTrio from './creation-trio';
import deerling from './deerling';
import croagunkToSnover from './croagunk-to-snover';
import drifloonToGlameow from './drifloon-to-glameow';
import rioluToSkorupi from './riolu-to-skorupi';
import shinxToShieldon from './shinx-to-shieldon';
import starlyToKricketot from './starly-to-kricketot';
import stunkyToGible from './stunky-to-gible';
import turtwigToPiplup from './turtwig-to-piplup';
import audinoToSawk from './audino-to-sawk';
import munnaToBlitzle from './munna-to-blitzle';
import pansearToPanpour from './pansear-to-panpour';
import sandileToDwebble from './sandile-to-dwebble';
import scraggyToTrubbish from './scraggy-to-trubbish';
import basculinToAlomomola from './basculin-to-alomomola';
import joltikToKlink from './joltik-to-klink';
import zoruaToSolosis from './zorua-to-solosis';
import axewToDeino from './axew-to-deino';
import tynamoToMienfoo from './tynamo-to-mienfoo';
import elgyemToGolett from './elgyem-to-golett';
import forcesOfNature from './forces-of-nature';
import heatmorToLarvesta from './heatmor-to-larvesta';
import patratToPurrloin from './patrat-to-purrloin';
import pawniardToVullaby from './pawniard-to-vullaby';
import roggenrolaToDrilbur from './roggenrola-to-drilbur';
import sewaddleToPetilil from './sewaddle-to-petilil';
import snivyToOshawott from './snivy-to-oshawott';
import swordsOfJustice from './swords-of-justice';
import taoTrio from './tao-trio';
import unovaMythicals from './unova-mythicals';

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
  ...burmyToShellos,
  ...combeeToCherubi,
  ...drifloonToGlameow,
  ...stunkyToGible,
  ...rioluToSkorupi,
  ...croagunkToSnover,
  ...pachirisuToCarnivine,
  ...rotom,
  ...lakeTrio,
  ...heatranRegigigas,
  ...creationTrio,
  ...moonDuo,
  ...manaphy,
  ...shaymin,
  ...arceus,
  ...snivyToOshawott,
  ...patratToPurrloin,
  ...pansearToPanpour,
  ...munnaToBlitzle,
  ...roggenrolaToDrilbur,
  ...audinoToSawk,
  ...sewaddleToPetilil,
  ...sandileToDwebble,
  ...scraggyToTrubbish,
  ...zoruaToSolosis,
  ...joltikToKlink,
  ...basculinToAlomomola,
  ...elgyemToGolett,
  ...axewToDeino,
  ...pawniardToVullaby,
  ...heatmorToLarvesta,
  ...tynamoToMienfoo,
  ...swordsOfJustice,
  ...taoTrio,
  ...unovaMythicals,
  ...deerling,
  ...forcesOfNature,
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
