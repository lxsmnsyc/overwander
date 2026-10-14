import { Items } from '../ids/items';
import { Species, getBaseFormSpecies } from '../ids/species';
import { getSpeciesData } from '../species/__create';
import { getMegaBase } from '../species/megas';
import { itemText } from './__create';

/**
 * The Mega Stones: held for the Mega a pokemon takes in a fight.
 *
 * Unlike a form item, holding one is not enough on its own. A team
 * Mega Evolves once, so the battle side in
 * [`src/battle/gimmicks/mega.ts`](../../battle/gimmicks/mega.ts) picks
 * which holder gets to.
 */

interface MegaStone {
  mega: Species;
  /**
   * The Megas the stone opens for the species' other forms: a female
   * Meowstic and each Tatsugiri wear their own
   */
  forms?: Species[];
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
  [Items.RaichuniteX, { mega: Species.RaichuMegaX }],
  [Items.RaichuniteY, { mega: Species.RaichuMegaY }],
  [Items.Clefablite, { mega: Species.ClefableMega }],
  [Items.Victreebelite, { mega: Species.VictreebelMega }],
  [Items.Starminite, { mega: Species.StarmieMega }],
  [Items.Dragoninite, { mega: Species.DragoniteMega }],
  [Items.Meganiumite, { mega: Species.MeganiumMega }],
  [Items.Feraligite, { mega: Species.FeraligatrMega }],
  [Items.Skarmorite, { mega: Species.SkarmoryMega }],
  [Items.Chimechite, { mega: Species.ChimechoMega }],
  [Items.AbsoliteZ, { mega: Species.AbsolMegaZ }],
  [Items.Staraptite, { mega: Species.StaraptorMega }],
  [Items.GarchompiteZ, { mega: Species.GarchompMegaZ }],
  [Items.LucarioniteZ, { mega: Species.LucarioMegaZ }],
  [Items.Froslassite, { mega: Species.FroslassMega }],
  [Items.Heatranite, { mega: Species.HeatranMega }],
  [Items.Darkranite, { mega: Species.DarkraiMega }],
  [Items.Emboarite, { mega: Species.EmboarMega }],
  [Items.Excadrite, { mega: Species.ExcadrillMega }],
  [Items.Scolipite, { mega: Species.ScolipedeMega }],
  [Items.Scraftinite, { mega: Species.ScraftyMega }],
  [Items.Eelektrossite, { mega: Species.EelektrossMega }],
  [Items.Chandelurite, { mega: Species.ChandelureMega }],
  [Items.Golurkite, { mega: Species.GolurkMega }],
  [Items.Chesnaughtite, { mega: Species.ChesnaughtMega }],
  [Items.Delphoxite, { mega: Species.DelphoxMega }],
  [Items.Greninjite, { mega: Species.GreninjaMega }],
  [Items.Pyroarite, { mega: Species.PyroarMega }],
  [Items.Floettite, { mega: Species.FloetteMega }],
  [Items.Meowsticite, { mega: Species.MeowsticMega, forms: [Species.MeowsticFemaleMega] }],
  [Items.Malamarite, { mega: Species.MalamarMega }],
  [Items.Barbaracite, { mega: Species.BarbaracleMega }],
  [Items.Dragalgite, { mega: Species.DragalgeMega }],
  [Items.Hawluchanite, { mega: Species.HawluchaMega }],
  [Items.Zygardite, { mega: Species.ZygardeMega }],
  [Items.Crabominite, { mega: Species.CrabominableMega }],
  [Items.Golisopite, { mega: Species.GolisopodMega }],
  [Items.Drampanite, { mega: Species.DrampaMega }],
  [Items.Magearnite, { mega: Species.MagearnaMega, forms: [Species.MagearnaOriginalMega] }],
  [Items.Zeraorite, { mega: Species.ZeraoraMega }],
  [Items.Falinksite, { mega: Species.FalinksMega }],
  [Items.Scovillainite, { mega: Species.ScovillainMega }],
  [Items.Glimmoranite, { mega: Species.GlimmoraMega }],
  [
    Items.Tatsugirinite,
    {
      mega: Species.TatsugiriMega,
      forms: [Species.TatsugiriStretchyMega, Species.TatsugiriDroopyMega],
    },
  ],
  [Items.Baxcalibrite, { mega: Species.BaxcaliburMega }],
]);

/** The Mega this stone puts its holder in, or null for everything else in the bag */
export function getStoneMega(item: Items): Species | null {
  return MEGA_STONES.get(item)?.mega ?? null;
}

/** Every Mega one stone opens, one for each form that can hold it */
function stoneMegas(stone: MegaStone): Species[] {
  return [stone.mega, ...(stone.forms ?? [])];
}

/** Every Mega this stone opens, or none for anything that is not one */
export function getStoneMegas(item: Items): Species[] {
  const stone = MEGA_STONES.get(item);

  return stone == null ? [] : stoneMegas(stone);
}

/**
 * The Mega this stone puts this holder in, or null where it is not the
 * holder's. A stone names a form, so an Alolan Raichu holding a
 * Raichunite stays as it is, and each Tatsugiri wears its own
 */
export function getHolderMega(item: Items, holder: Species): Species | null {
  const stone = MEGA_STONES.get(item);

  if (stone == null) {
    return null;
  }
  for (const mega of stoneMegas(stone)) {
    if (getMegaBase(mega) === holder) {
      return mega;
    }
  }
  return null;
}

/** Every stone this species can hold for a Mega of its own: two for a Charizard, none for most */
export function getSpeciesStones(species: Species): Items[] {
  const stones: Items[] = [];

  for (const item of MEGA_STONES.keys()) {
    if (getHolderMega(item, species) != null) {
      stones.push(item);
    }
  }
  return stones;
}

/** The stone that puts a pokemon in this Mega, or null for anything that is not one */
export function getMegaStone(mega: Species): Items | null {
  for (const [item, stone] of MEGA_STONES) {
    if (stoneMegas(stone).includes(mega)) {
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
    holder: getSpeciesData(getMegaBase(stone.mega) ?? getBaseFormSpecies(stone.mega)).name,
  });
}
