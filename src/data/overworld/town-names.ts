import Biome, { type SettledBiome } from '../ids/biome';

/**
 * What a town is called.
 *
 * Everywhere else in the world is named by what it is and where, the
 * way `namePlace` says "Taiga (12, -3)". A town is the one thing
 * players tell each other about and travel to by name, so it gets a
 * name of its own, and the name has to say something true about the
 * country it stands in: the head is drawn from its own biome's word
 * list, so a glacier town reads cold before anybody looks at the map.
 *
 * A name is worked out from where the town is, never rolled, and it
 * is five parts: an optional mark, a head, a tail welded onto it, a
 * title, and the county. Every region of a county lands on a name of
 * its own, so **two towns can never share one** and nothing has to ask
 * a store whether a name is free.
 *
 *     8 heads x 40 tails x 12 titles          = 3,840 unmarked
 *     ...and 12 marks over those               = 49,920 in all
 *     against a county's                       = 4,096 regions
 *
 * The county is what makes that fit, and what keeps it fitting. A roll
 * without one would be 262,144 regions against 49,920 names, five
 * times more world than words. See `COUNTY_NAMES`.
 */

/**
 * The head of a name, by the biome the town stands on. One entry per
 * country a town can be settled on and no others: the open seas and
 * `Beyond` are out of the type rather than filled with words nothing
 * would ever reach. Total, so a biome added to the world cannot be
 * built on until it has been given words. Public so a test can hold
 * it to that
 */
export const TOWN_HEADS: Record<SettledBiome, string[]> = {
  [Biome.Beach]: ['Shell', 'Dune', 'Surf', 'Drift', 'Pebble', 'Tide', 'Cockle', 'Foam'],
  [Biome.Mangrove]: ['Stilt', 'Tangle', 'Silt', 'Brack', 'Prop', 'Wade', 'Heron', 'Knot'],
  [Biome.Swamp]: ['Mire', 'Reed', 'Murk', 'Peat', 'Sedge', 'Gloam', 'Croak', 'Sump'],
  [Biome.TropicalRainforest]: [
    'Vine',
    'Orchid',
    'Fever',
    'Emerald',
    'Liana',
    'Toucan',
    'Steam',
    'Deep',
  ],
  [Biome.TropicalSeasonalForest]: [
    'Teak',
    'Monsoon',
    'Ebon',
    'Cicada',
    'Bamboo',
    'Sap',
    'Husk',
    'Downpour',
  ],
  [Biome.Savanna]: ['Acacia', 'Amber', 'Tawny', 'Ochre', 'Pride', 'Veldt', 'Baobab', 'Wildfire'],
  [Biome.Desert]: ['Scorch', 'Mirage', 'Quartz', 'Basin', 'Cactus', 'Sirocco', 'Dust', 'Kiln'],
  [Biome.Shrubland]: ['Heath', 'Gorse', 'Broom', 'Sage', 'Bramble', 'Scrub', 'Juniper', 'Myrtle'],
  [Biome.Grassland]: ['Meadow', 'Clover', 'Barley', 'Lark', 'Corn', 'Hay', 'Swallow', 'Sunrise'],
  [Biome.TemperateForest]: ['Oak', 'Beech', 'Acorn', 'Hazel', 'Birch', 'Fawn', 'Elder', 'Maple'],
  [Biome.TemperateRainforest]: [
    'Moss',
    'Lichen',
    'Cedar',
    'Dew',
    'Sorrel',
    'Hush',
    'Laurel',
    'Drizzle',
  ],
  [Biome.ColdDesert]: ['Flint', 'Gypsum', 'Bitter', 'Chalk', 'Grit', 'Alkali', 'Scour', 'Pale'],
  [Biome.Taiga]: ['Pine', 'Spruce', 'Resin', 'Needle', 'Sable', 'Owl', 'Larch', 'Cone'],
  [Biome.Tundra]: ['Frost', 'Thaw', 'Cotton', 'Willow', 'Hare', 'Bleak', 'Snow', 'Permafrost'],
  [Biome.Mountain]: ['Crag', 'Granite', 'Eagle', 'Slate', 'Storm', 'Iron', 'Spur', 'Summit'],
  [Biome.AlpineTundra]: ['Rime', 'Cirque', 'Marmot', 'Alpen', 'Thin', 'Cloud', 'Scree', 'Silver'],
  [Biome.Glacier]: ['Hoar', 'Floe', 'Glass', 'Serac', 'Moraine', 'White', 'Still', 'Calving'],
  [Biome.Woodland]: ['Copse', 'Glade', 'Rowan', 'Thicket', 'Badger', 'Holly', 'Dapple', 'Nut'],
  [Biome.Steppe]: ['Horse', 'Feather', 'Saiga', 'Gale', 'Wide', 'Kite', 'Roam', 'Sweep'],
  [Biome.MontaneForest]: ['Fir', 'Hemlock', 'Bear', 'Talus', 'Fog', 'Lynx', 'Timber', 'Switchback'],
  [Biome.Volcano]: ['Ember', 'Cinder', 'Basalt', 'Sulphur', 'Pumice', 'Fume', 'Magma', 'Ashfall'],
  [Biome.Badlands]: ['Gulch', 'Hoodoo', 'Rust', 'Butte', 'Vulture', 'Bone', 'Wash', 'Redrock'],
  [Biome.RockyCoast]: ['Cliff', 'Kittiwake', 'Spray', 'Stack', 'Beacon', 'Tern', 'Barnacle', 'Lee'],
  [Biome.Bog]: ['Quag', 'Cranberry', 'Tussock', 'Fen', 'Bittern', 'Sink', 'Wisp', 'Blackwater'],
};

/**
 * What is welded onto the head, which is what makes the name one word
 * rather than two. Shared across the world: the ground a town stands
 * on says where it is, and a tail says what shape the place takes
 */
const TAILS: string[] = [
  'fell',
  'mere',
  'ridge',
  'hollow',
  'brook',
  'reach',
  'march',
  'crest',
  'gate',
  'haven',
  'moor',
  'dale',
  'ford',
  'wick',
  'burn',
  'stead',
  'holt',
  'combe',
  'tarn',
  'scar',
  'bourne',
  'glen',
  'cairn',
  'thorpe',
  'barrow',
  'spire',
  'run',
  'shade',
  'wold',
  'rise',
  'strand',
  'gorge',
  'field',
  'watch',
  'hurst',
  'bury',
  'croft',
  'garth',
  'mouth',
  'shaw',
];

/**
 * What the place calls itself. Rolled rather than taken from how many
 * lots the town has: a title that tracked the size would be a fifth
 * of the names gone, and a hamlet with a gym in it is the sort of
 * thing a real map is full of
 */
const TITLES: string[] = [
  'Town',
  'City',
  'Village',
  'Hamlet',
  'Borough',
  'Outpost',
  'Landing',
  'Crossing',
  'Mills',
  'Rest',
  'Quarter',
  'Waypoint',
];

/**
 * The word in front, where there is one. Most towns have none, since
 * a world where every place is an Upper or a New reads as a joke
 */
const MARKS: string[] = [
  'New',
  'Old',
  'Upper',
  'Lower',
  'North',
  'South',
  'East',
  'West',
  'Great',
  'Little',
  'Port',
  'Fort',
];

/**
 * The counties the world is divided into, which is the second half of
 * every town's name.
 *
 * A name has to be unique, and nothing that only looks at one town can
 * promise that on its own: the world has 262,144 regions and one
 * biome's words make 49,920 names, so a roll would run out five times
 * over. Dividing the world settles it. A name only has to be unique
 * inside **one county and one biome**, and a county holds 4,096
 * regions, so the words already have room to spare and always will.
 *
 * The division is what makes this independent of how big the world is.
 * A county is `floor(region / 64)`, which reads a town's own
 * coordinates and nothing else, so a world grown larger leaves every
 * existing town in the county it was already in, under the name it
 * already had. It only wants more counties at the edges
 */
const COUNTY_NAMES: string[] = [
  'Ashmarch',
  'Kelvenmoor',
  'Dunhollow',
  'Brackenshire',
  'Thornwold',
  'Greyfen',
  'Highmarch',
  'Westerling',
  'Stonereach',
  'Elderfen',
  'Mirefold',
  'Cindermarch',
  'Coldharrow',
  'Sablewold',
  'Larkenfen',
  'Orrenmoor',
  'Vesperhold',
  'Marrowfen',
  'Gildenmarch',
  'Hollowshire',
  'Amberfold',
  'Ravenmoor',
  'Silverfen',
  'Winterhold',
  'Duskmarch',
  'Thistlewold',
  'Pelloway',
  'Harrowfen',
  'Brimshire',
  'Calderfold',
  'Nettlemoor',
  'Ironmarch',
  'Wyndhollow',
  'Ferrowshire',
  'Glenmarch',
  'Saltenfen',
  'Oakenwold',
  'Windermarch',
  'Tarnhollow',
  'Bracklemoor',
  'Emberfold',
  'Fallowshire',
  'Grimmarch',
  'Heathenfen',
  'Ivywold',
  'Junipermoor',
  'Kestrelhold',
  'Lowmarch',
  'Mosswold',
  'Northfen',
  'Orchardshire',
  'Peatmarch',
  'Quarryhold',
  'Reedfold',
  'Sedgemoor',
  'Tinderwold',
  'Umberfen',
  'Vaultmarch',
  'Wolfhollow',
  'Yarrowshire',
  'Ashenfold',
  'Bellmarch',
  'Cragmarch',
  'Dalefen',
];

/** How many regions to a county, on each axis */
export const COUNTY_REGIONS = 64;

/** How many counties the world is divided into, on each axis */
export const COUNTY_GRID = 8;

/** The regions of one county, which is what a local name tells apart */
const COUNTY_SPAN = COUNTY_REGIONS * COUNTY_REGIONS;

/** How many words of its own each biome brings */
export const HEADS_PER_BIOME = 8;

/** The names that carry no mark in front, which is most of them */
const PLAIN_NAMES = HEADS_PER_BIOME * TAILS.length * TITLES.length;

/** How many names the parts can make for one biome */
export const NAMES_PER_BIOME = PLAIN_NAMES * (MARKS.length + 1);

/**
 * What a county's regions are stirred by before they are read off as
 * words. Odd, so multiplying by it is a bijection on the county rather
 * than a collision: without it, neighbouring towns would read as a
 * numbered sequence with only the last word changing
 */
const SPIN = 2_731;

/**
 * And what the few marked names are stirred by. Coprime with
 * `PLAIN_NAMES`, so those are spread over the whole list rather than
 * bunched at its front
 */
const STEP = 1_009;

/** Where a region sits inside its own county, on one axis */
function withinCounty(region: number): number {
  return ((region % COUNTY_REGIONS) + COUNTY_REGIONS) % COUNTY_REGIONS;
}

/** Which county a region falls in, on one axis */
function countyOf(region: number): number {
  return Math.floor(region / COUNTY_REGIONS);
}

/**
 * What a town is called: its own name, then the county it stands in.
 *
 * Worked out rather than rolled, which is the whole point. Every
 * region of a county lands on a different name, so two towns can never
 * be called the same thing and nothing has to ask a store whether a
 * name is free. A county holds 4,096 regions and the words make 49,920
 * names, so 3,840 of them are spent before a mark is reached for at
 * all: about 1 town in 16 carries one, which is what keeps a mark a
 * flourish rather than a fixture.
 *
 * The head is the town's own biome's, so the name still says something
 * true about the country before the map is looked at, and no two
 * biomes share a head, so the biome never has to be encoded
 */
export default function nameTown(regionX: number, regionY: number, biome: SettledBiome): string {
  const countyX = countyOf(regionX) + COUNTY_GRID / 2;
  const countyY = countyOf(regionY) + COUNTY_GRID / 2;

  // Each axis on its own. Checking the two of them added together
  // would let a region off the world's west edge fold back onto a
  // county that really exists, and share its names
  if (countyX < 0 || countyX >= COUNTY_GRID || countyY < 0 || countyY >= COUNTY_GRID) {
    throw new Error(`no county name for region ${regionX}, ${regionY}`);
  }

  const county = countyY * COUNTY_GRID + countyX;

  const local = withinCounty(regionY) * COUNTY_REGIONS + withinCounty(regionX);
  // Stirred, so a town's neighbours are not its name plus one
  const spun = (local * SPIN) % COUNTY_SPAN;
  // The unmarked names are spent first, so the county's last few
  // regions are the only ones that reach for a mark
  const marked = spun >= PLAIN_NAMES;
  const over = spun - PLAIN_NAMES;
  const plain = marked ? (Math.floor(over / MARKS.length) * STEP) % PLAIN_NAMES : spun;
  const head = TOWN_HEADS[biome][plain % HEADS_PER_BIOME];
  const tail = TAILS[Math.floor(plain / HEADS_PER_BIOME) % TAILS.length];
  const title = TITLES[Math.floor(plain / (HEADS_PER_BIOME * TAILS.length))];
  const mark = marked ? `${MARKS[over % MARKS.length]} ` : '';

  return `${mark}${head}${tail} ${title}, ${COUNTY_NAMES[county]}`;
}
