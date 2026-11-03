import * as v from 'valibot';
import type { Types } from '../../constants/types';
import { BATTLE_WEATHER_IDS, TYPE_IDS, WEATHER_IDS } from '../../ids/names';
import type { Weathers } from '../../ids/status';
import Weather from '../../ids/weather';
import { idOf, idsOf, localeFieldTable } from '../../yaml';
import kindsFile from './kinds.yaml';

export default Weather;

/**
 * Every sky, read out of `kinds.yaml` and `text/en/weather.yaml`; the
 * numbers are `ids/weather.ts`
 */
const KIND = v.strictObject({
  color: v.string(),
  favours: v.union([v.literal('everything'), v.array(v.string())]),
  battle: v.string(),
});

const WEATHER_TEXT = import.meta.glob('../../text/*/weather.yaml', { eager: true, import: 'default' });

export const WEATHER_NAMES = localeFieldTable<Weather>(
  WEATHER_IDS,
  WEATHER_TEXT,
  'text/<locale>/weather.yaml',
  'name',
);

/** What each sky is drawn as on the world map, where a chunk is one square of colour */
export const WEATHER_COLORS: Record<number, string> = {};

/** One line on each sky, and only what a picture of it cannot say */
export const WEATHER_DESCRIPTIONS = localeFieldTable<Weather>(
  WEATHER_IDS,
  WEATHER_TEXT,
  'text/<locale>/weather.yaml',
  'description',
);

/**
 * The types each sky is kind to. These are the world's own pairings
 * rather than the battle engine's. Empty both for a plain sky and for
 * one in `WEATHER_FAVORS_EVERYTHING`
 */
export const WEATHER_TYPES: Record<number, Types[]> = {};

/** The skies kind to every type, which `isWeatherFavored` answers yes for first */
export const WEATHER_FAVORS_EVERYTHING = new Set<Weather>();

/** The battle sky an overworld one is fought under */
export const BATTLE_WEATHER: Record<number, Weathers> = {};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), KIND), kindsFile))) {
  const where = `weather/kinds.yaml: ${name}`;
  const sky = idOf<Weather>(WEATHER_IDS, name, where);

  WEATHER_COLORS[sky] = written.color;
  BATTLE_WEATHER[sky] = idOf<Weathers>(BATTLE_WEATHER_IDS, written.battle, where);
  if (written.favours === 'everything') {
    WEATHER_FAVORS_EVERYTHING.add(sky);
    WEATHER_TYPES[sky] = [];
  } else {
    WEATHER_TYPES[sky] = idsOf<Types>(TYPE_IDS, written.favours, where);
  }
}

// Every sky the enum has is written down, so none is drawn bare or nameless
for (const [name, sky] of Object.entries(WEATHER_IDS)) {
  if (!Object.hasOwn(WEATHER_COLORS, sky) || !Object.hasOwn(WEATHER_NAMES, sky)) {
    throw new Error(`${name} needs a record in weather/kinds.yaml and a name in text/en`);
  }
}
