import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { Species, getBaseFormSpecies } from '../ids/species';
import { registerItem } from './__create';

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
  name: string;
  /** Its picture on the `mega-stones` sheet */
  icon: string;
  /** Who it is for, written out since items register apart from species */
  holder: string;
}

export const MEGA_STONES = new Map<Items, MegaStone>([
  [
    Items.Venusaurite,
    { mega: Species.VenusaurMega, name: 'Venusaurite', icon: 'venusaurite', holder: 'Venusaur' },
  ],
  [
    Items.CharizarditeX,
    {
      mega: Species.CharizardMegaX,
      name: 'Charizardite X',
      icon: 'charizardite-x',
      holder: 'Charizard',
    },
  ],
  [
    Items.CharizarditeY,
    {
      mega: Species.CharizardMegaY,
      name: 'Charizardite Y',
      icon: 'charizardite-y',
      holder: 'Charizard',
    },
  ],
  [
    Items.Blastoisinite,
    {
      mega: Species.BlastoiseMega,
      name: 'Blastoisinite',
      icon: 'blastoisinite',
      holder: 'Blastoise',
    },
  ],
  [
    Items.Beedrillite,
    { mega: Species.BeedrillMega, name: 'Beedrillite', icon: 'beedrillite', holder: 'Beedrill' },
  ],
  [
    Items.Pidgeotite,
    { mega: Species.PidgeotMega, name: 'Pidgeotite', icon: 'pidgeotite', holder: 'Pidgeot' },
  ],
  [
    Items.Alakazite,
    { mega: Species.AlakazamMega, name: 'Alakazite', icon: 'alakazite', holder: 'Alakazam' },
  ],
  [
    Items.Slowbronite,
    { mega: Species.SlowbroMega, name: 'Slowbronite', icon: 'slowbronite', holder: 'Slowbro' },
  ],
  [
    Items.Gengarite,
    { mega: Species.GengarMega, name: 'Gengarite', icon: 'gengarite', holder: 'Gengar' },
  ],
  [
    Items.Kangaskhanite,
    {
      mega: Species.KangaskhanMega,
      name: 'Kangaskhanite',
      icon: 'kangaskhanite',
      holder: 'Kangaskhan',
    },
  ],
  [
    Items.Pinsirite,
    { mega: Species.PinsirMega, name: 'Pinsirite', icon: 'pinsirite', holder: 'Pinsir' },
  ],
  [
    Items.Gyaradosite,
    { mega: Species.GyaradosMega, name: 'Gyaradosite', icon: 'gyaradosite', holder: 'Gyarados' },
  ],
  [
    Items.Aerodactylite,
    {
      mega: Species.AerodactylMega,
      name: 'Aerodactylite',
      icon: 'aerodactylite',
      holder: 'Aerodactyl',
    },
  ],
  [
    Items.MewtwoniteX,
    { mega: Species.MewtwoMegaX, name: 'Mewtwonite X', icon: 'mewtwonite-x', holder: 'Mewtwo' },
  ],
  [
    Items.MewtwoniteY,
    { mega: Species.MewtwoMegaY, name: 'Mewtwonite Y', icon: 'mewtwonite-y', holder: 'Mewtwo' },
  ],
  [
    Items.Ampharosite,
    { mega: Species.AmpharosMega, name: 'Ampharosite', icon: 'ampharosite', holder: 'Ampharos' },
  ],
  [
    Items.Steelixite,
    { mega: Species.SteelixMega, name: 'Steelixite', icon: 'steelixite', holder: 'Steelix' },
  ],
  [
    Items.Scizorite,
    { mega: Species.ScizorMega, name: 'Scizorite', icon: 'scizorite', holder: 'Scizor' },
  ],
  [
    Items.Heracronite,
    { mega: Species.HeracrossMega, name: 'Heracronite', icon: 'heracronite', holder: 'Heracross' },
  ],
  [
    Items.Houndoominite,
    {
      mega: Species.HoundoomMega,
      name: 'Houndoominite',
      icon: 'houndoominite',
      holder: 'Houndoom',
    },
  ],
  [
    Items.Tyranitarite,
    {
      mega: Species.TyranitarMega,
      name: 'Tyranitarite',
      icon: 'tyranitarite',
      holder: 'Tyranitar',
    },
  ],
  [
    Items.Sceptilite,
    { mega: Species.SceptileMega, name: 'Sceptilite', icon: 'sceptilite', holder: 'Sceptile' },
  ],
  [
    Items.Blazikenite,
    { mega: Species.BlazikenMega, name: 'Blazikenite', icon: 'blazikenite', holder: 'Blaziken' },
  ],
  [
    Items.Swampertite,
    { mega: Species.SwampertMega, name: 'Swampertite', icon: 'swampertite', holder: 'Swampert' },
  ],
  [
    Items.Gardevoirite,
    {
      mega: Species.GardevoirMega,
      name: 'Gardevoirite',
      icon: 'gardevoirite',
      holder: 'Gardevoir',
    },
  ],
  [
    Items.Sablenite,
    { mega: Species.SableyeMega, name: 'Sablenite', icon: 'sablenite', holder: 'Sableye' },
  ],
  [
    Items.Mawilite,
    { mega: Species.MawileMega, name: 'Mawilite', icon: 'mawilite', holder: 'Mawile' },
  ],
  [
    Items.Aggronite,
    { mega: Species.AggronMega, name: 'Aggronite', icon: 'aggronite', holder: 'Aggron' },
  ],
  [
    Items.Medichamite,
    { mega: Species.MedichamMega, name: 'Medichamite', icon: 'medichamite', holder: 'Medicham' },
  ],
  [
    Items.Manectite,
    { mega: Species.ManectricMega, name: 'Manectite', icon: 'manectite', holder: 'Manectric' },
  ],
  [
    Items.Sharpedonite,
    { mega: Species.SharpedoMega, name: 'Sharpedonite', icon: 'sharpedonite', holder: 'Sharpedo' },
  ],
  [
    Items.Cameruptite,
    { mega: Species.CameruptMega, name: 'Cameruptite', icon: 'cameruptite', holder: 'Camerupt' },
  ],
  [
    Items.Altarianite,
    { mega: Species.AltariaMega, name: 'Altarianite', icon: 'altarianite', holder: 'Altaria' },
  ],
  [
    Items.Banettite,
    { mega: Species.BanetteMega, name: 'Banettite', icon: 'banettite', holder: 'Banette' },
  ],
  [
    Items.Absolite,
    { mega: Species.AbsolMega, name: 'Absolite', icon: 'absolite', holder: 'Absol' },
  ],
  [
    Items.Glalitite,
    { mega: Species.GlalieMega, name: 'Glalitite', icon: 'glalitite', holder: 'Glalie' },
  ],
  [
    Items.Salamencite,
    { mega: Species.SalamenceMega, name: 'Salamencite', icon: 'salamencite', holder: 'Salamence' },
  ],
  [
    Items.Metagrossite,
    {
      mega: Species.MetagrossMega,
      name: 'Metagrossite',
      icon: 'metagrossite',
      holder: 'Metagross',
    },
  ],
  [
    Items.Latiasite,
    { mega: Species.LatiasMega, name: 'Latiasite', icon: 'latiasite', holder: 'Latias' },
  ],
  [
    Items.Latiosite,
    { mega: Species.LatiosMega, name: 'Latiosite', icon: 'latiosite', holder: 'Latios' },
  ],
  [
    Items.Lopunnite,
    { mega: Species.LopunnyMega, name: 'Lopunnite', icon: 'lopunnite', holder: 'Lopunny' },
  ],
  [
    Items.Garchompite,
    { mega: Species.GarchompMega, name: 'Garchompite', icon: 'garchompite', holder: 'Garchomp' },
  ],
  [
    Items.Lucarionite,
    { mega: Species.LucarioMega, name: 'Lucarionite', icon: 'lucarionite', holder: 'Lucario' },
  ],
  [
    Items.Abomasite,
    { mega: Species.AbomasnowMega, name: 'Abomasite', icon: 'abomasite', holder: 'Abomasnow' },
  ],
  [
    Items.Galladite,
    { mega: Species.GalladeMega, name: 'Galladite', icon: 'galladite', holder: 'Gallade' },
  ],
  [
    Items.Audinite,
    { mega: Species.AudinoMega, name: 'Audinite', icon: 'audinite', holder: 'Audino' },
  ],
  [
    Items.Diancite,
    { mega: Species.DiancieMega, name: 'Diancite', icon: 'diancite', holder: 'Diancie' },
  ],
]);

/** What a stone fetches from a shop that will never stock one, the plates' price */
export const MEGA_STONE_RESALE = 2000;

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

/** Held, never spent, and never listed: a stone is dug up rather than bought */
export default function registerMegaStones(): void {
  for (const [item, stone] of MEGA_STONES) {
    registerItem(item, {
      name: stone.name,
      description: `Lets a ${stone.holder} holding it Mega Evolve. Only one pokemon on a team Mega Evolves in a fight.`,
      type: ItemTypes.Held,
      icon: `mega-stones/${stone.icon}`,
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: MEGA_STONE_RESALE,
    });
  }
}
