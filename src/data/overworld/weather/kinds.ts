import { Types } from '../../constants/types';

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

/** Every sky there is, what each is called and what it favours */
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
