import * as v from 'valibot';
import type Biome from '../../ids/biome';
import { BIOME_IDS, WEATHER_IDS } from '../../ids/names';
import { idOf } from '../../yaml';
import biomesFile from './biomes.yaml';
import Weather from './kinds';

/** Which skies a country gets, and which one two readings land on */
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
 * rainforest is a blizzard over the glacier it crosses next
 */
export interface WeatherBands {
  /** Driest and calmest, which is most windows */
  clear: Weather;
  /** Dry, but the air is doing something */
  stirred: Weather;
  /** The edge of a front: on its way */
  damp: Weather;
  /** Inside a front */
  wet: Weather;
  /** The core of a front */
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
 * What the front has to reach for each ring. A front is damp at its
 * edge, wet inside and a storm at its core, so walking into one passes
 * through each in turn. Most of the field is dry, which is what makes
 * the rest worth walking into
 */
const DAMP = 0.15;
const WET = 0.45;
const STORM = 0.8;

/** How wild the air has to be for a dry sky to be stirred rather than clear */
const WILD = 0.4;

/** Both readings this far out, which is a corner of the field */
const RARE = 0.6;

/**
 * Further out again, and the narrowest band there is: one reading per
 * corner of the field.
 *
 * The band rather than the map is what holds these four rare, since
 * the sky above them falls over every country. Each lands on about
 * one window in four hundred, which is half as often as the next
 * rarest sky.
 *
 * The four differ because the corners of the noise are not the same
 * thickness: measured over the whole world, one flat reading leaves
 * the wild corner about a fifth commoner than the wet, calm one. They
 * are worth the same to a player, so each corner carries the reading
 * that evens them out rather than one shared figure
 */
const RAREST: Record<'wildest' | 'stillest' | 'bleakest' | 'thickest', number> = {
  wildest: 0.75,
  stillest: 0.744,
  bleakest: 0.747,
  thickest: 0.745,
};

const NAME = v.string();

const FILE = v.object({
  corners: v.object({ wildest: NAME, stillest: NAME, bleakest: NAME, thickest: NAME }),
  biomes: v.record(
    NAME,
    v.object({
      clear: NAME,
      stirred: NAME,
      damp: NAME,
      wet: NAME,
      storm: NAME,
      rare: v.optional(NAME),
      corners: v.optional(v.literal(false)),
    }),
  ),
});

/**
 * Each country's skies, written in `biomes.yaml`. Nothing lives in
 * `Beyond` and nothing happens over it, which is why it is the one
 * country with no sky
 */
export const BIOME_WEATHER: Record<number, WeatherBands> = {};

{
  const written = v.parse(FILE, biomesFile);
  const sky = (name: string, where: string): Weather => idOf(WEATHER_IDS, name, where);
  const corner = (name: string): Weather => sky(name, 'biomes.yaml: corners');

  for (const [name, bands] of Object.entries(written.biomes)) {
    const where = `biomes.yaml: ${name}`;
    const shared = bands.corners !== false;

    BIOME_WEATHER[idOf(BIOME_IDS, name, where)] = {
      clear: sky(bands.clear, where),
      stirred: sky(bands.stirred, where),
      damp: sky(bands.damp, where),
      wet: sky(bands.wet, where),
      storm: sky(bands.storm, where),
      rare: bands.rare == null ? null : sky(bands.rare, where),
      wildest: shared ? corner(written.corners.wildest) : null,
      stillest: shared ? corner(written.corners.stillest) : null,
      bleakest: shared ? corner(written.corners.bleakest) : null,
      thickest: shared ? corner(written.corners.thickest) : null,
    };
  }
  for (const [name, biome] of Object.entries(BIOME_IDS)) {
    if (!Object.hasOwn(BIOME_WEATHER, biome)) {
      throw new Error(`biomes.yaml: ${name} has no skies`);
    }
  }
}

/**
 * The sky a reading lands on over this ground.
 *
 * `front` is how much is falling and `character` how calm or wild the
 * air is, both from -1 to 1. The front alone sets the rings, clear to
 * damp to wet to a storm at its core; the character only stirs a dry
 * sky. The showpieces sit in the corners where both are extreme, read
 * from the outside in
 */
export function classifyWeather(biome: Biome, front: number, character: number): Weather {
  const bands = BIOME_WEATHER[biome];

  if (bands.wildest != null && front >= RAREST.wildest && character >= RAREST.wildest) {
    return bands.wildest;
  }
  if (bands.stillest != null && front <= -RAREST.stillest && character <= -RAREST.stillest) {
    return bands.stillest;
  }
  if (bands.bleakest != null && front <= -RAREST.bleakest && character >= RAREST.bleakest) {
    return bands.bleakest;
  }
  if (bands.thickest != null && front >= RAREST.thickest && character <= -RAREST.thickest) {
    return bands.thickest;
  }
  if (bands.rare != null && front >= RARE && character >= RARE) {
    return bands.rare;
  }
  if (front >= STORM) {
    return bands.storm;
  }
  if (front >= WET) {
    return bands.wet;
  }
  if (front >= DAMP) {
    return bands.damp;
  }
  return character >= WILD ? bands.stirred : bands.clear;
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
