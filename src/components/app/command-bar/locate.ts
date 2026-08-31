import type { CommandArguments } from '../../../core/command';
import { type Arguments, refuse } from './arguments';
import {
  BIOME_NAMES,
  SPAWN_RARITY_NAMES,
  TIME_OF_DAY_NAMES,
  listSpeciesHabitats,
} from '../../../data/biome';
import { WEATHER_INTERVAL } from '../../../overworld/chunk-snapshot';
import { WEATHER_NAMES } from '../../../data/overworld/weather';
import { biomeEntries, findNamed, speciesEntries, weatherEntries } from './names';
import type Biome from '../../../data/ids/biome';
import type Weather from '../../../data/overworld/weather';
import type { Species } from '../../../data/ids/species';
import getWorld from '../../../overworld/current';
import { given } from '../../../core/command';
import { isInWorld } from '../../../overworld/world';

/**
 * Finding the nearest chunk that answers to something.
 *
 * The map is derived rather than stored, so this asks nobody: the
 * same seed that draws a chunk under a player's feet answers what the
 * ground and the sky are anywhere else. It is a walk outwards in
 * rings, which is what makes the first hit the nearest one
 */

/**
 * How far out the walk goes before it gives up, in chunks. A quarter
 * of a million samples is a few map views' worth of the same work, and
 * a biome nobody has within it is one nobody was going to walk to
 */
export const LOCATE_RADIUS = 256;

export const enum LocateKind {
  Species = 0,
  Biome = 1,
  Weather = 2,
}

export type LocateAsk =
  | { kind: LocateKind.Species; species: Species }
  | { kind: LocateKind.Biome; biome: Biome }
  | { kind: LocateKind.Weather; weather: Weather };

/** Where the walk is starting from */
export interface Origin {
  chunkX: number;
  chunkY: number;
}

/** What `/locate` was asking for */
export function readLocate(parameters: CommandArguments): Arguments<LocateAsk> {
  const species = given(parameters, 'species');
  const biome = given(parameters, 'biome');
  const weather = given(parameters, 'weather');
  const asked = [species, biome, weather].filter((one) => one != null);

  if (asked.length !== 1) {
    return refuse('Ask for one of species:, biome: or weather:.');
  }
  if (species != null) {
    const found = findNamed(speciesEntries(), species);

    return found == null
      ? refuse(`${species} is not one species.`)
      : { ok: true, value: { kind: LocateKind.Species, species: found } };
  }
  if (biome != null) {
    const found = findNamed(biomeEntries(), biome);

    return found == null
      ? refuse(`${biome} is not one biome.`)
      : { ok: true, value: { kind: LocateKind.Biome, biome: found } };
  }
  const found = findNamed(weatherEntries(), weather ?? '');

  return found == null
    ? refuse(`${weather ?? ''} is not one sky.`)
    : { ok: true, value: { kind: LocateKind.Weather, weather: found } };
}

/**
 * Every chunk within reach, nearest ring first. Square rings rather
 * than circles: the corners of a ring are a little further out than
 * its sides, which is close enough for "go that way"
 */
function* rings(origin: Origin, limit: number): Generator<Origin> {
  yield origin;

  for (let radius = 1; radius <= limit; radius++) {
    for (let across = -radius; across <= radius; across++) {
      yield { chunkX: origin.chunkX + across, chunkY: origin.chunkY - radius };
      yield { chunkX: origin.chunkX + across, chunkY: origin.chunkY + radius };
    }
    for (let down = -radius + 1; down <= radius - 1; down++) {
      yield { chunkX: origin.chunkX - radius, chunkY: origin.chunkY + down };
      yield { chunkX: origin.chunkX + radius, chunkY: origin.chunkY + down };
    }
  }
}

/** The biomes a species is ever met in */
function habitatBiomes(species: Species): Set<Biome> {
  return new Set(listSpeciesHabitats(species).map((one) => one.biome));
}

/** The nearest chunk the test accepts, or null for none within reach */
function nearest(origin: Origin, accepts: (at: Origin) => boolean): Origin | null {
  for (const at of rings(origin, LOCATE_RADIUS)) {
    if (isInWorld(at.chunkX, at.chunkY) && accepts(at)) {
      return at;
    }
  }
  return null;
}

/** How far away it is, as a player would say it */
function stepsAway(origin: Origin, found: Origin): string {
  const across = found.chunkX - origin.chunkX;
  const down = found.chunkY - origin.chunkY;
  const chunks = Math.round(Math.hypot(across, down));

  return chunks === 0 ? 'where you are standing' : `${chunks} chunks away`;
}

/** Where a chunk is, in the words every other screen uses */
function placed(found: Origin): string {
  const biome = getWorld().getChunkBiome(found.chunkX, found.chunkY);

  return `${BIOME_NAMES[biome]} (${found.chunkX}, ${found.chunkY})`;
}

/** When a species can be met in a biome, and how lucky a walk has to be */
function metThere(species: Species, biome: Biome): string {
  const here = listSpeciesHabitats(species).filter((one) => one.biome === biome);
  const times = [...new Set(here.map((one) => TIME_OF_DAY_NAMES[one.time]))].join(', ');
  const rarity = [...new Set(here.map((one) => SPAWN_RARITY_NAMES[one.rarity]))].join(', ');

  return `${times === '' ? 'any hour' : times} (${rarity})`;
}

/**
 * The one line `/locate` prints, or null where nothing within reach
 * answers. It is derived from the world alone, so it costs a walk
 * outwards rather than a round trip
 */
export default function locate(ask: LocateAsk, origin: Origin, now: number): string | null {
  const world = getWorld();

  if (ask.kind === LocateKind.Biome) {
    const found = nearest(origin, (at) => world.getChunkBiome(at.chunkX, at.chunkY) === ask.biome);

    return found == null ? null : `${placed(found)}, ${stepsAway(origin, found)}.`;
  }
  if (ask.kind === LocateKind.Weather) {
    const window = Math.floor(now / WEATHER_INTERVAL);
    const found = nearest(
      origin,
      (at) => world.getWeather(at.chunkX, at.chunkY, window) === ask.weather,
    );

    return found == null
      ? null
      : `${WEATHER_NAMES[ask.weather]} over ${placed(found)}, ${stepsAway(origin, found)}.`;
  }

  const lives = habitatBiomes(ask.species);

  if (lives.size === 0) {
    return null;
  }
  const found = nearest(origin, (at) => lives.has(world.getChunkBiome(at.chunkX, at.chunkY)));

  if (found == null) {
    return null;
  }
  const biome = world.getChunkBiome(found.chunkX, found.chunkY);

  return `${placed(found)}, ${stepsAway(origin, found)}, at ${metThere(ask.species, biome)}.`;
}
