import { isMythicalSpecies } from '../biome';
import { Species } from '../ids/species';
import { getRegisteredSpecies } from '../species';
import { Items } from '../ids/items';

/**
 * Raid items: the relics that call a mythical out to be fought.
 *
 * The world never stages a mythical of its own — a landmark rolls
 * legendaries and rare species, and nothing else — so carrying the
 * relic is the only way to face one. Each item names exactly which
 * species it calls. Opening the lobby costs nothing; the relic is
 * spent when the raid starts, and that raid happens once, won or
 * lost.
 *
 * They cannot be bought. A raid item is found in the special band of
 * the overworld item pool and nowhere else, which is what keeps a
 * mythical rare — see
 * [`src/data/overworld/item-pool.ts`](../overworld/item-pool.ts).
 */
export const RAID_ITEMS = new Map<Items, Species>([
  [Items.OldSeaMap, Species.Mew],
  [Items.GSBall, Species.Celebi],
  [Items.AuroraTicket, Species.Deoxys],
  [Items.WishTag, Species.Jirachi],
  [Items.MemberCard, Species.Darkrai],
  [Items.ManaphyEgg, Species.Manaphy],
  [Items.OaksLetter, Species.Shaymin],
  [Items.AzureFlute, Species.Arceus],
  [Items.ColtsPetal, Species.Keldeo],
  [Items.LibertyPass, Species.Victini],
  [Items.MusicBox, Species.Meloetta],
  [Items.ColressMachine, Species.Genesect],
  [Items.HeartDiamond, Species.Diancie],
  [Items.SealedRing, Species.Hoopa],
  [Items.SteamValve, Species.Volcanion],
  [Items.AncientPokeBall, Species.Magearna],
  [Items.HerosCharm, Species.Marshadow],
  [Items.WindmillCharm, Species.Zeraora],
  [Items.MysteryBox, Species.Meltan],
]);

function isRegisteredSpecies(species: Species): boolean {
  return getRegisteredSpecies().includes(species);
}

/**
 * What the item calls, or null when it calls nothing. Only a mythical
 * answers: a relic naming anything else stages no raid
 */
export function getRaidSpecies(item: Items): Species | null {
  const species = RAID_ITEMS.get(item);

  // A relic whose mythical is not written yet calls nothing
  return species != null && isMythicalSpecies(species) && isRegisteredSpecies(species)
    ? species
    : null;
}
