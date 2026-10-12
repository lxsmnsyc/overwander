import { Items } from '../ids/items';
import { Species, getBaseFormSpecies } from '../ids/species';
import { getSpeciesData } from '../species/__create';
import { itemText } from './__create';

/**
 * The Mega Stones: held for the Mega a pokemon takes in a fight.
 *
 * Unlike a form item, holding one is not enough on its own. A team
 * Mega Evolves once, so the battle side in
 * [`src/battle/items/megas.ts`](../../battle/items/megas.ts) picks
 * which holder gets to.
 */

interface MegaStone {
  mega: Species;
}

export const MEGA_STONES = new Map<Items, MegaStone>([
  [Items.Venusaurite, { mega: Species.VenusaurMega }],
  [Items.CharizarditeX, { mega: Species.CharizardMegaX }],
  [Items.CharizarditeY, { mega: Species.CharizardMegaY }],
  [Items.Blastoisinite, { mega: Species.BlastoiseMega }],
  [Items.Beedrillite, { mega: Species.BeedrillMega }],
  [Items.Pidgeotite, { mega: Species.PidgeotMega }],
  [Items.Alakazite, { mega: Species.AlakazamMega }],
  [Items.Slowbronite, { mega: Species.SlowbroMega }],
  [Items.Gengarite, { mega: Species.GengarMega }],
  [Items.Kangaskhanite, { mega: Species.KangaskhanMega }],
  [Items.Pinsirite, { mega: Species.PinsirMega }],
  [Items.Gyaradosite, { mega: Species.GyaradosMega }],
  [Items.Aerodactylite, { mega: Species.AerodactylMega }],
  [Items.MewtwoniteX, { mega: Species.MewtwoMegaX }],
  [Items.MewtwoniteY, { mega: Species.MewtwoMegaY }],
  [Items.Ampharosite, { mega: Species.AmpharosMega }],
  [Items.Steelixite, { mega: Species.SteelixMega }],
  [Items.Scizorite, { mega: Species.ScizorMega }],
  [Items.Heracronite, { mega: Species.HeracrossMega }],
  [Items.Houndoominite, { mega: Species.HoundoomMega }],
  [Items.Tyranitarite, { mega: Species.TyranitarMega }],
  [Items.Sceptilite, { mega: Species.SceptileMega }],
  [Items.Blazikenite, { mega: Species.BlazikenMega }],
  [Items.Swampertite, { mega: Species.SwampertMega }],
  [Items.Gardevoirite, { mega: Species.GardevoirMega }],
  [Items.Sablenite, { mega: Species.SableyeMega }],
  [Items.Mawilite, { mega: Species.MawileMega }],
  [Items.Aggronite, { mega: Species.AggronMega }],
  [Items.Medichamite, { mega: Species.MedichamMega }],
  [Items.Manectite, { mega: Species.ManectricMega }],
  [Items.Sharpedonite, { mega: Species.SharpedoMega }],
  [Items.Cameruptite, { mega: Species.CameruptMega }],
  [Items.Altarianite, { mega: Species.AltariaMega }],
  [Items.Banettite, { mega: Species.BanetteMega }],
  [Items.Absolite, { mega: Species.AbsolMega }],
  [Items.Glalitite, { mega: Species.GlalieMega }],
  [Items.Salamencite, { mega: Species.SalamenceMega }],
  [Items.Metagrossite, { mega: Species.MetagrossMega }],
  [Items.Latiasite, { mega: Species.LatiasMega }],
  [Items.Latiosite, { mega: Species.LatiosMega }],
  [Items.Lopunnite, { mega: Species.LopunnyMega }],
  [Items.Garchompite, { mega: Species.GarchompMega }],
  [Items.Lucarionite, { mega: Species.LucarioMega }],
  [Items.Abomasite, { mega: Species.AbomasnowMega }],
  [Items.Galladite, { mega: Species.GalladeMega }],
  [Items.Audinite, { mega: Species.AudinoMega }],
  [Items.Diancite, { mega: Species.DiancieMega }],
]);

/** The Mega this stone puts its holder in, or null for everything else in the bag */
export function getStoneMega(item: Items): Species | null {
  return MEGA_STONES.get(item)?.mega ?? null;
}

/** Every stone this species can hold for a Mega of its own: two for a Charizard, none for most */
export function getSpeciesStones(species: Species): Items[] {
  const stones: Items[] = [];

  for (const [item, stone] of MEGA_STONES) {
    if (getBaseFormSpecies(stone.mega) === species) {
      stones.push(item);
    }
  }
  return stones;
}

/** The stone that puts a pokemon in this Mega, or null for anything that is not one */
export function getMegaStone(mega: Species): Items | null {
  for (const [item, stone] of MEGA_STONES) {
    if (stone.mega === mega) {
      return item;
    }
  }
  return null;
}

/** Every stone's line names the pokemon that holds it */
export function describeMegaStone(item: Items): string {
  const stone = MEGA_STONES.get(item);

  if (stone == null) {
    throw new Error(`${item} is not a Mega Stone`);
  }
  return itemText('mega-stones', 'stone', {
    holder: getSpeciesData(getBaseFormSpecies(stone.mega)).name,
  });
}
