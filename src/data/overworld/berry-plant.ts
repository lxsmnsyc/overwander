import type { Items } from '../ids/items';
import { getItemData } from '../items';
import { berryFruit } from '../items/berries';

/**
 * Where a berry's plant is drawn from.
 *
 * A berry patch shows the berry growing in it, and the plants are
 * filed under the berry's own name rather than its number, which is
 * how the icons are filed too. Derived from the item rather than
 * tabled, so a berry that is renamed cannot quietly keep pointing at
 * the old drawing.
 */

/** The folder one berry's plant lives in, under the berry root. */
export function berryPlantName(item: Items): string {
  return berryFruit(getItemData(item).name);
}

/** The charset a berry's plant is loaded as. */
export default function berryPlantSheet(item: Items): string {
  return `landmarks-berry/${berryPlantName(item)}`;
}

/**
 * The colour a berry's cell is called out in, keyed the way its plant
 * is. Each one is the fruit's own colour, read off the berry's icon:
 * the board says which crop is growing there without the player
 * having to walk over and look, and two patches bearing the same
 * berry read as the same patch from across the chunk.
 *
 * Sampled from the art rather than tabled by hand, so a berry whose
 * icon is redrawn is recoloured with it. See
 * [`scripts/berry-colours.ts`](../../../scripts/berry-colours.ts).
 */
export const BERRY_COLORS: Record<string, string> = {
  aguav: '#e6ee6a',
  apicot: '#7289bf',
  aspear: '#f6ea58',
  babiri: '#88b54e',
  belue: '#9070d7',
  bluk: '#7854c2',
  charti: '#d9c627',
  cheri: '#c0543c',
  chesto: '#525098',
  chilan: '#d8b85d',
  chople: '#db4443',
  coba: '#3b7db1',
  colbur: '#e968d9',
  cornn: '#bd8bd5',
  custap: '#df524a',
  durin: '#64a239',
  enigma: '#d8cbb2',
  figy: '#d7ab5d',
  ganlon: '#ada5de',
  'golden-nanab': '#efde51',
  'golden-pinap': '#f6a81c',
  'golden-razz': '#f99f1b',
  grepa: '#ffec47',
  haban: '#e45050',
  hondew: '#e9dc4a',
  iapapa: '#e0b574',
  jaboca: '#bdb546',
  kasib: '#e14eb9',
  kebia: '#38c540',
  kee: '#e9966c',
  kelpsy: '#73acff',
  lansat: '#dd9172',
  leppa: '#f88e31',
  liechi: '#e9e1b2',
  lum: '#96e44a',
  mago: '#efaa8a',
  magost: '#ee9979',
  maranga: '#b6af47',
  micle: '#45b844',
  'nanab-gen7': '#e676a1',
  nanab: '#f0a97b',
  nomel: '#dede47',
  occa: '#e67a3d',
  oran: '#52a0f2',
  pamtre: '#7f6fb1',
  passho: '#3a75d2',
  payapa: '#bf349b',
  pecha: '#f6ae88',
  persim: '#e9a77c',
  petaya: '#bc7d5d',
  pinap: '#f1dd55',
  pomeg: '#fc9031',
  qualot: '#e3de75',
  rabuta: '#979059',
  rawst: '#94dbdb',
  'razz-gen7': '#e44956',
  razz: '#d45f2e',
  rindo: '#3eca4e',
  roseli: '#374f73',
  rowap: '#259aa2',
  salac: '#5a9c54',
  shuca: '#edd83a',
  'silver-nanab': '#b4b7e9',
  'silver-pinap': '#a6a9f0',
  'silver-razz': '#8b83c5',
  sitrus: '#cea945',
  spelon: '#d2635a',
  starf: '#8ac562',
  tamato: '#fb8f31',
  tanga: '#3ca73c',
  wacan: '#e4dc1c',
  watmel: '#f2b098',
  wepear: '#7bc64a',
  wiki: '#525098',
  yache: '#1c95ba',
};

/** What colour one berry is, or null for one nobody has sampled */
export function berryColour(item: Items): string | null {
  return BERRY_COLORS[berryPlantName(item)] ?? null;
}
