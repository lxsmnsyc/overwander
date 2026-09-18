/**
 * The sky over a chunk: what skies there are, what one is worth, which
 * country gets which, and the sky a fight is fought under
 */

export { default } from './kinds';
export { WEATHER_DESCRIPTIONS, WEATHER_NAMES, WEATHER_TYPES } from './kinds';
export {
  DARK_DAY_LAMP_CELLS,
  DARK_DAY_SHADOW_CHANCE,
  FATA_MORGANA_HIDDEN_CHANCE,
  FATA_MORGANA_SIGNATURE_CHANCE,
  FOGBOW_MOVE_CHANCE,
  FOGBOW_MOVE_SLOTS,
  FOGBOW_SECOND_MOVE_CHANCE,
  METEOR_SHOWER_SHINY_BOOST,
  WEATHER_MIN_IV,
  WEATHER_SPAWN_BOOST,
  favorsEverything,
  grantsHiddenAbility,
  grantsSignature,
  isWeatherFavored,
  shadowsMeetings,
  shinyBoostOf,
  spawnFavoredTypes,
  widensMoveSlots,
} from './rules';
export { BIOME_WEATHER, classifyWeather, isBoostingWeather } from './biomes';
export type { WeatherBands } from './biomes';
export { BATTLE_WEATHER, toBattleWeather } from './battle';
