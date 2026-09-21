import { isMythicalSpecies } from '../biome';
import { Species } from '../ids/species';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

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
]);

const NAMES: { [key in Items]?: string } = {
  [Items.OldSeaMap]: 'Old Sea Map',
  [Items.GSBall]: 'GS Ball',
  [Items.AuroraTicket]: 'Aurora Ticket',
  [Items.WishTag]: 'Wish Tag',
  [Items.MemberCard]: 'Member Card',
  [Items.ManaphyEgg]: 'Manaphy Egg',
  [Items.OaksLetter]: "Oak's Letter",
  [Items.AzureFlute]: 'Azure Flute',
  [Items.ColtsPetal]: "Colt's Petal",
  [Items.LibertyPass]: 'Liberty Pass',
  [Items.MusicBox]: 'Music Box',
  [Items.ColressMachine]: 'Colress Machine',
  [Items.HeartDiamond]: 'Heart Diamond',
  [Items.SealedRing]: 'Sealed Ring',
  [Items.SteamValve]: 'Steam Valve',
};

/**
 * Where each relic leads. The line says the place rather than what
 * lives there: a map is a map, and finding out what it was drawn for
 * is the reason to follow it
 */
const PLACES: { [key in Items]?: string } = {
  [Items.OldSeaMap]: 'the island it charts, far out to sea',
  [Items.GSBall]: 'the shrine in the forest it was left at',
  [Items.AuroraTicket]: 'the island it admits one passenger to',
  [Items.WishTag]: 'the valley the comet passes over',
  [Items.MemberCard]: 'the island the boat behind the inn goes out to',
  [Items.ManaphyEgg]: 'the temple the sea gives back for one day',
  [Items.OaksLetter]: 'the meadow at the far end of the broken path',
  [Items.AzureFlute]: 'the stair that opens above the mountain',
  [Items.ColtsPetal]: 'the marsh the youngest of the swords waits in',
  [Items.LibertyPass]: 'the garden on the island the ferry runs out to',
  [Items.MusicBox]: 'the ruin the old song is still sung in',
  [Items.ColressMachine]: 'the laboratory it was carried out of',
  [Items.HeartDiamond]: 'the cave of diamonds the jewels keep',
  [Items.SealedRing]: 'the desert ruin the rings were shut into',
  [Items.SteamValve]: 'the vent in the mountain the steam comes out of',
};

/**
 * Where the collection filed the picture, for the ones whose file
 * name is not what the item's name makes
 */
const ICONS: { [key in Items]?: string } = {
  [Items.AuroraTicket]: 'key/auroraticket',
  [Items.HeartDiamond]: 'key/heart-diamond',
  [Items.SealedRing]: 'key/sealed-ring',
  [Items.SteamValve]: 'key/steam-valve',
  [Items.OaksLetter]: 'key/oaks-letter',
  [Items.ColtsPetal]: 'key/radiant-petal',
};

/**
 * What the item calls, or null when it calls nothing. Only a mythical
 * answers: a relic naming anything else stages no raid
 */
export function getRaidSpecies(item: Items): Species | null {
  const species = RAID_ITEMS.get(item);

  return species != null && isMythicalSpecies(species) ? species : null;
}

/**
 * Register the raid items. They are key items rather than valuables —
 * nothing sells one — and consumable, since starting the raid spends
 * the relic that called it
 */
export default function registerRaidItems(): void {
  for (const item of RAID_ITEMS.keys()) {
    registerItem(item, {
      name: NAMES[item] ?? `Item #${item}`,
      description: `Opens a raid at ${PLACES[item] ?? 'the place it leads to'}. Spent when the raid starts.`,
      type: ItemTypes.KeyItem,
      icon: ICONS[item] ?? nameToIcon('key', NAMES[item] ?? ''),
      // Used to open a raid, and gone once it has been
      flags: ItemFlags.Usable | ItemFlags.Consumable,
      buy: 0,
      sell: 0,
    });
  }
}
