import Biome from '../ids/biome';
import { Types } from '../constants/types';
import { Weathers } from '../ids/status';

/**
 * The sky over a chunk.
 *
 * Weather is derived from the world seed the way the biomes are, out
 * of two noise channels read against the ground underneath. It is not
 * stored anywhere: everybody standing in the same place in the same
 * hour sees the same sky without asking the server, which is the rule
 * every other feature of a chunk follows.
 *
 * It reaches the game in two ways. A pokemon of a type the sky
 * favours comes with a floor under every one of its values, so a wet
 * afternoon is worth going out in for the things rain is about. A trainer met out on the road is fought under
 * the sky that was over the road, which is the only kind of fight the
 * weather reaches: a raid, a duel and a league seat are all fought
 * under a clear sky whatever the world was doing. That one fight
 * keeps its sky on its own record, because the sky moves on and the
 * fight has to replay as it was fought.
 */

const enum Weather {
  Clear = 0,
  Cloudy = 1,
  Overcast = 2,
  Breezy = 3,
  Drizzle = 4,
  Rain = 5,
  Downpour = 6,
  Thunderstorm = 7,
  Mist = 8,
  Fog = 9,
  Haze = 10,
  Frost = 11,
  Snow = 12,
  Blizzard = 13,
  Hail = 14,
  Sandstorm = 15,
  DustHaze = 16,
  Heatwave = 17,
  FallingAsh = 18,
  Aurora = 19,
  Rainbow = 20,
  PollenDrift = 21,
  MeteorShower = 22,
  FataMorgana = 23,
  DarkDay = 24,
  Fogbow = 25,
}

export default Weather;

export const WEATHER_NAMES: Record<Weather, string> = {
  [Weather.Clear]: 'Clear',
  [Weather.Cloudy]: 'Cloudy',
  [Weather.Overcast]: 'Overcast',
  [Weather.Breezy]: 'Breezy',
  [Weather.Drizzle]: 'Drizzle',
  [Weather.Rain]: 'Rain',
  [Weather.Downpour]: 'Downpour',
  [Weather.Thunderstorm]: 'Thunderstorm',
  [Weather.Mist]: 'Mist',
  [Weather.Fog]: 'Fog',
  [Weather.Haze]: 'Haze',
  [Weather.Frost]: 'Frost',
  [Weather.Snow]: 'Snow',
  [Weather.Blizzard]: 'Blizzard',
  [Weather.Hail]: 'Hail',
  [Weather.Sandstorm]: 'Sandstorm',
  [Weather.DustHaze]: 'Dust Haze',
  [Weather.Heatwave]: 'Heatwave',
  [Weather.FallingAsh]: 'Falling Ash',
  [Weather.Aurora]: 'Aurora',
  [Weather.Rainbow]: 'Rainbow',
  [Weather.PollenDrift]: 'Pollen Drift',
  [Weather.MeteorShower]: 'Meteor Shower',
  [Weather.FataMorgana]: 'Fata Morgana',
  [Weather.DarkDay]: 'Dark Day',
  [Weather.Fogbow]: 'Fogbow',
};

/**
 * One line on each sky, and only what a picture of it cannot say.
 *
 * What the sky favours is drawn as its types rather than written out,
 * and the floor is the same under every boosting sky, so neither is
 * repeated here
 */
export const WEATHER_DESCRIPTIONS: Record<Weather, string> = {
  [Weather.Clear]: 'An ordinary sky, and the one nothing is boosted under.',
  [Weather.Cloudy]: 'Cloud, and an ordinary day under it.',
  [Weather.Overcast]: 'A flat grey lid over the chunk.',
  [Weather.Breezy]: 'A steady wind across the chunk.',
  [Weather.Drizzle]: 'Light rain.',
  [Weather.Rain]: 'Steady rain.',
  [Weather.Downpour]: 'Rain coming down hard.',
  [Weather.Thunderstorm]: 'Rain with thunder in it.',
  [Weather.Mist]: 'Air you cannot see far through.',
  [Weather.Fog]: 'Thick fog off the ground.',
  [Weather.Haze]: 'Hot, hanging air.',
  [Weather.Frost]: 'Cold enough to settle on everything.',
  [Weather.Snow]: 'Snow falling over the chunk.',
  [Weather.Blizzard]: 'Snow driven sideways. It chips at whatever is not built for it.',
  [Weather.Hail]: 'Ice falling hard enough to hurt. It chips at whatever is not built for it.',
  [Weather.Sandstorm]: 'Sand on the wind. It chips at whatever is not built for it.',
  [Weather.DustHaze]: 'Dust hanging on still air.',
  [Weather.Heatwave]: 'Heat with nothing behind it.',
  [Weather.FallingAsh]: 'Ash drifting down from somewhere.',
  [Weather.Aurora]: 'Light over the far north, and one of the rarest skies there is.',
  [Weather.Rainbow]: 'An arc over open water, and one of the rarest skies there is.',
  [Weather.PollenDrift]: 'Pollen carried through the trees.',
  [Weather.MeteorShower]:
    'The rarest sky there is. It favours every type, and doubles the odds of a shiny coat.',
  [Weather.FataMorgana]:
    'A mirage on dead-still air. It favours every type, and doubles hidden ability odds.',
  [Weather.DarkDay]:
    'Noon gone dark. It favours every type, and a third of what it meets is a shadow.',
  [Weather.Fogbow]:
    'A rainbow with the colour gone. Anything met under it knows a move from its line.',
};

/**
 * The types each sky is kind to.
 *
 * Every type in the game is favoured by some sky, so no player is left
 * with weather that never means anything to what they are raising. A
 * plain sky favours nothing, which is what makes it plain.
 *
 * These are the world's own pairings rather than the battle engine's.
 * The engine knows four skies and what they do to Fire and Water; this
 * says which pokemon a sky is worth going out for, which is a question
 * the mainline has no answer to.
 *
 * The pairings are weighted by how often a sky actually turns up, not
 * only by what it looks like. The world is wet and cold, so its damp
 * skies are common and its storms are rare: a type hung on a sandstorm
 * alone is a type nobody is ever boosted for, which is why mist
 * carries the forest types and thunder carries three.
 */
export const WEATHER_TYPES: Record<Weather, Types[]> = {
  [Weather.Clear]: [],
  [Weather.Cloudy]: [Types.Normal],
  [Weather.Breezy]: [Types.Flying],
  [Weather.Overcast]: [Types.Dark, Types.Normal],
  [Weather.Drizzle]: [Types.Water, Types.Grass],
  [Weather.Rain]: [Types.Water, Types.Electric],
  [Weather.Downpour]: [Types.Water, Types.Grass],
  [Weather.Thunderstorm]: [Types.Electric, Types.Dragon],
  [Weather.Mist]: [Types.Bug, Types.Grass, Types.Poison],
  [Weather.Fog]: [Types.Ghost, Types.Dark, Types.Psychic],
  [Weather.Haze]: [Types.Fire, Types.Poison],
  [Weather.Frost]: [Types.Ice, Types.Steel],
  [Weather.Snow]: [Types.Ice, Types.Fairy],
  [Weather.Blizzard]: [Types.Ice, Types.Steel],
  [Weather.Hail]: [Types.Ice, Types.Rock],
  [Weather.Sandstorm]: [Types.Rock, Types.Ground, Types.Steel],
  [Weather.DustHaze]: [Types.Ground, Types.Rock, Types.Normal],
  [Weather.Heatwave]: [Types.Fire, Types.Fighting],
  [Weather.FallingAsh]: [Types.Fire, Types.Dark],
  [Weather.Aurora]: [Types.Psychic, Types.Fairy],
  [Weather.Rainbow]: [Types.Fairy, Types.Flying],
  [Weather.PollenDrift]: [Types.Grass, Types.Bug],
  // Empty because it favours everything: `isWeatherFavored` answers
  // yes for this sky before it reads the table
  [Weather.MeteorShower]: [],
  [Weather.FataMorgana]: [],
  [Weather.DarkDay]: [],
  [Weather.Fogbow]: [],
};

/**
 * The lowest every value comes out at for a pokemon the sky favours.
 *
 * It is worth something only to what the weather is actually about: a
 * rat met in the rain is a rat, and a Water type met in it is the
 * reason to go out. Rain over everything would be a floor under the
 * whole game rather than a reason to walk anywhere
 */
export const WEATHER_MIN_IV = 10;

/**
 * How much more heavily a sky crowds its own types into a chunk's
 * spawns.
 *
 * The same shape as a species day, and deliberately gentler: a day is
 * one family for one day and a sky is a whole type for an hour, so
 * four times the weight would leave a rainy chunk holding nothing but
 * Water. The bands do not move either way, so a favoured rare stays
 * rare and only wins its band more often.
 *
 * The skies that favour *everything* are left out. Lifting every
 * entry by the same factor is the pool it started with, and those
 * four are the rarest in the game: what they are worth is already
 * written into what they hand over
 */
export const WEATHER_SPAWN_BOOST = 2;

/**
 * Whether this sky is kind to a pokemon carrying these types.
 *
 * Every sky picks a type or two. A meteor shower picks none, because it
 * picks all of them: whatever is standing under it is worth catching,
 * which is what makes the rarest sky in the game worth walking into
 * whoever is walking
 */
export function isWeatherFavored(weather: Weather, types: Types[]): boolean {
  if (favorsEverything(weather)) {
    return true;
  }
  const favored = new Set(WEATHER_TYPES[weather]);

  return types.some((type) => favored.has(type));
}

/**
 * The types a sky crowds into a chunk's spawns, or nothing where it
 * crowds none.
 *
 * A sky that is kind to everything favours nothing here: boosting
 * every entry by the same factor hands back the pool it started with,
 * and those four are the rarest skies in the game, whose worth is
 * already in what they hand over rather than in who turns up
 */
export function spawnFavoredTypes(weather: Weather): Types[] {
  return favorsEverything(weather) ? [] : WEATHER_TYPES[weather];
}

/** Whether the sky is kind to everything rather than to a type of it */
export function favorsEverything(weather: Weather): boolean {
  return (
    weather === Weather.MeteorShower ||
    weather === Weather.FataMorgana ||
    weather === Weather.DarkDay ||
    weather === Weather.Fogbow
  );
}

/**
 * What a meteor shower multiplies the shiny odds by.
 *
 * It is the one sky that touches the coat rather than the values, and
 * it is deliberately the smallest boost in the game: the sky is rare
 * enough on its own that anything larger would make the shiny a
 * function of standing still and waiting rather than of looking
 */
export const METEOR_SHOWER_SHINY_BOOST = 2;

/**
 * What a fata morgana multiplies the odds of a hidden ability by.
 *
 * The meteor shower's opposite number, and deliberately its equal: a
 * mirage shows what is not there to be seen, so what it is worth is
 * what the pokemon was hiding rather than what its coat looks like
 */
export const FATA_MORGANA_HIDDEN_BOOST = 2;

/**
 * What this sky multiplies the odds of a shiny coat by.
 *
 * Asked as a question rather than read off a table, because only one
 * sky answers anything but 1 and a table of twenty-three ones would
 * say less than this does
 */
export function shinyBoostOf(weather: Weather): number {
  return weather === Weather.MeteorShower ? METEOR_SHOWER_SHINY_BOOST : 1;
}

/**
 * Whether anything met in the wild under this sky already knows one of
 * its line's egg moves.
 *
 * Breeding is the only other way to come by one, so this is the sky
 * that hands over what a walk with an egg would have cost. A species
 * whose line inherits nothing is handed nothing: about half the
 * families have an egg move at all
 */
export function teachesEggMove(weather: Weather): boolean {
  return weather === Weather.Fogbow;
}

/**
 * Whether anything met in the wild under this sky comes out shadowed.
 *
 * The one sky that closes a heart rather than opening something. It is
 * the meeting that is shadowed and not the pokemon: a raid prize, an
 * egg and a gift arrive under their own rules whatever the sky is
 * doing
 */
export function shadowsWildMeetings(weather: Weather): boolean {
  return weather === Weather.DarkDay;
}

/**
 * How much of what a dark day meets comes out shadowed.
 *
 * Not all of it. A sky that closed every heart under it would make the
 * shadow a property of the window rather than of the meeting, and a
 * player who found one would be collecting rather than deciding. A
 * third leaves the sky worth staying out in and every catch under it
 * still a question
 */
export const DARK_DAY_SHADOW_CHANCE = 1 / 3;

/**
 * How far a player sees under a Dark Day, in cells, walking alone.
 *
 * Wide enough that whatever they are standing on is lit along with
 * the ground around it, and narrow enough that the board still reads
 * as dark. A buddy can widen it: see `ILLUMINATE_LAMP_REACH`
 */
export const DARK_DAY_LAMP_CELLS = 1.7;

/** What this sky multiplies the odds of a hidden ability by */
export function hiddenAbilityBoostOf(weather: Weather): number {
  return weather === Weather.FataMorgana ? FATA_MORGANA_HIDDEN_BOOST : 1;
}

/**
 * The skies a biome can show, one per reading of the two channels.
 *
 * Six slots rather than a list, because the reading is continuous and
 * the slots are what it lands in. A front arriving reads through them
 * in order, clear then damp then wet then a storm, so the sky changes
 * the way weather does rather than jumping between unrelated states.
 *
 * The same reading against different ground is the same weather system
 * over a different country: the front that is a thunderstorm in the
 * rainforest is a sandstorm over the desert it crosses next
 */
export interface WeatherBands {
  /** Driest and calmest, which is most windows */
  clear: Weather;
  /** Dry, but the air is doing something */
  stirred: Weather;
  /** Damp and calm: the front on its way */
  damp: Weather;
  /** Wet and calm */
  wet: Weather;
  /** Wet and wild */
  storm: Weather;
  /**
   * Both channels at an extreme, which smooth noise reaches rarely and
   * in one place at a time. Null where a country has no showpiece of
   * its own
   */
  rare: Weather | null;
  /**
   * Both channels at their far end: the corner of the corner.
   *
   * Every country has the same one, and it is the only sky that is not
   * a country's own. The band rather than the map is what makes it
   * rare: it falls anywhere, and almost nowhere
   */
  wildest: Weather | null;
  /**
   * The opposite corner, both channels as low as they go: air that is
   * doing nothing at all.
   *
   * The field has four corners and this is the second of them worth a
   * sky. It is as rare as `wildest` by measurement rather than by
   * arrangement, the noise being near enough symmetric, and the two
   * cannot both be reached by one reading
   */
  stillest: Weather | null;
  /**
   * Dry as the still corner and as violent as the wild one: air with
   * nothing in it but force.
   *
   * The third corner worth a sky, and the only one that is not a gift.
   * What it hands over is a pokemon whose heart has closed, which is
   * worth having and worth undoing
   */
  bleakest: Weather | null;
  /**
   * Wet as the wild corner and as calm as the still one: air holding
   * all it can and nothing moving it.
   *
   * The last of the four, and the only one that gives a pokemon
   * something it was never going to be born with
   */
  thickest: Weather | null;
}

/**
 * What the reading has to reach for each band. A front is wet before
 * it is a storm, so the thresholds are ordered rather than even: most
 * of the field is dry and calm, which is what makes the rest worth
 * walking into
 */
const DAMP = 0.15;
const WET = 0.45;
const WILD = 0.4;

/** Both channels this far out, which is a corner of the field */
const RARE = 0.6;

/**
 * Further out again, and the narrowest band there is.
 *
 * It is set against the map rather than picked: the sky above it falls
 * over every country, so the band is the only thing holding it rare.
 * At this reading it lands on about one window in thirteen hundred,
 * which is half as often as the next rarest sky
 */
const RAREST = 0.92;

/**
 * Nothing lives in `Beyond` and nothing happens over it, which is why
 * it is the one country with no sky
 */
export const BIOME_WEATHER: Record<Biome, WeatherBands> = {
  [Biome.DeepOcean]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Ocean]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.CoralReef]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Haze,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Beach]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Mangrove]: {
    clear: Weather.Cloudy,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Swamp]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TropicalRainforest]: {
    clear: Weather.Cloudy,
    stirred: Weather.Haze,
    damp: Weather.Drizzle,
    wet: Weather.Downpour,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TropicalSeasonalForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Drizzle,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Savanna]: {
    clear: Weather.Heatwave,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Desert]: {
    clear: Weather.Heatwave,
    stirred: Weather.Sandstorm,
    damp: Weather.DustHaze,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Shrubland]: {
    clear: Weather.Clear,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Grassland]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TemperateForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TemperateRainforest]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Downpour,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.ColdDesert]: {
    clear: Weather.Clear,
    stirred: Weather.Sandstorm,
    damp: Weather.Frost,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Taiga]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Frost,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Tundra]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Snow,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Mountain]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Hail,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.AlpineTundra]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Glacier]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Snow,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Woodland]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Steppe]: {
    clear: Weather.Clear,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.MontaneForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.PolarOcean]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Beyond]: {
    clear: Weather.Clear,
    stirred: Weather.Clear,
    damp: Weather.Clear,
    wet: Weather.Clear,
    storm: Weather.Clear,
    rare: null,
    wildest: null,
    stillest: null,
    bleakest: null,
    thickest: null,
  },
  [Biome.Volcano]: {
    clear: Weather.Haze,
    stirred: Weather.FallingAsh,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Badlands]: {
    clear: Weather.Heatwave,
    stirred: Weather.Sandstorm,
    damp: Weather.Haze,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.RockyCoast]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Bog]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Drizzle,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.KelpForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
};

/**
 * The sky a reading lands on over this ground.
 *
 * `wetness` and `energy` both run from -1 to 1. The bands are read
 * from the outside in, so a showpiece beats a storm and a storm beats
 * the rain it is made of
 */
export function classifyWeather(biome: Biome, wetness: number, energy: number): Weather {
  const bands = BIOME_WEATHER[biome];

  if (bands.wildest != null && wetness >= RAREST && energy >= RAREST) {
    return bands.wildest;
  }
  if (bands.stillest != null && wetness <= -RAREST && energy <= -RAREST) {
    return bands.stillest;
  }
  if (bands.bleakest != null && wetness <= -RAREST && energy >= RAREST) {
    return bands.bleakest;
  }
  if (bands.thickest != null && wetness >= RAREST && energy <= -RAREST) {
    return bands.thickest;
  }
  if (bands.rare != null && wetness >= RARE && energy >= RARE) {
    return bands.rare;
  }
  if (wetness >= WET) {
    return energy >= WILD ? bands.storm : bands.wet;
  }
  if (wetness >= DAMP) {
    return bands.damp;
  }
  return energy >= WILD ? bands.stirred : bands.clear;
}

/**
 * Whether a sky is worth going out in at all, for somebody.
 *
 * It says nothing about any one pokemon: what a sky is worth is worth
 * only to the types it favours. Callers deciding a floor want
 * `isWeatherFavored`
 */
const PLAIN = new Set<Weather>([Weather.Clear]);

export function isBoostingWeather(weather: Weather): boolean {
  return !PLAIN.has(weather);
}

/**
 * The battle sky an overworld one is fought under.
 *
 * Only the fights that happen out in the world read this: a trainer
 * standing on a rainy road is fought in the rain. Most skies have no
 * mainline counterpart and map to `None`, which is the honest answer.
 * Nothing maps to a primal sky either, since those refuse a whole type
 * outright and no walk should hand that to either side
 */
export const BATTLE_WEATHER: Record<Weather, Weathers> = {
  [Weather.Clear]: Weathers.None,
  [Weather.Cloudy]: Weathers.None,
  [Weather.Overcast]: Weathers.None,
  [Weather.Breezy]: Weathers.None,
  [Weather.Drizzle]: Weathers.Rain,
  [Weather.Rain]: Weathers.Rain,
  [Weather.Downpour]: Weathers.Rain,
  [Weather.Thunderstorm]: Weathers.Rain,
  [Weather.Mist]: Weathers.Fog,
  [Weather.Fog]: Weathers.Fog,
  [Weather.Haze]: Weathers.Sunny,
  [Weather.Frost]: Weathers.Snow,
  [Weather.Snow]: Weathers.Snow,
  [Weather.Blizzard]: Weathers.Hail,
  [Weather.Hail]: Weathers.Hail,
  [Weather.Sandstorm]: Weathers.Sandstorm,
  [Weather.DustHaze]: Weathers.Sandstorm,
  [Weather.Heatwave]: Weathers.Sunny,
  [Weather.FallingAsh]: Weathers.Sandstorm,
  // The showpieces are worth what they are met under, not what they
  // are fought under: none of the four has a sky the engine knows
  [Weather.Aurora]: Weathers.None,
  [Weather.Rainbow]: Weathers.None,
  [Weather.PollenDrift]: Weathers.None,
  [Weather.MeteorShower]: Weathers.None,
  [Weather.FataMorgana]: Weathers.None,
  [Weather.DarkDay]: Weathers.None,
  [Weather.Fogbow]: Weathers.None,
};

export function toBattleWeather(weather: Weather): Weathers {
  return BATTLE_WEATHER[weather];
}
