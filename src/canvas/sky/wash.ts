import Weather from '../../data/overworld/weather';
import type { QuadBlend } from '../gl/quad-batch';

/**
 * The sky over the board, drawn rather than packed.
 *
 * Weather is a wash of colour and a great many small moving things, and
 * both are cheaper to draw than to store: a sheet of rain would be one
 * download and one loop for every kind of falling thing, where the
 * arithmetic below is a few lines each and scales itself to whatever
 * the window is.
 *
 * It is laid over the finished board, under nothing, so it covers the
 * ground and the people on it the way weather does.
 *
 * Everything below is sized for one reference screen and scaled to the
 * window, so a sky costs what it costs whatever the window is: see
 * `REFERENCE`.
 */

/** The colour a sky is laid over the board in */
/**
 * How a sky's colour is laid over the board.
 *
 * The three are not decoration: a wash multiplied can only ever darken
 * what it is over, so a pale one laid that way does nothing at all,
 * which is what mist did before it was given a mode of its own
 */
export type WashMode =
  /** Rain and cloud, which take light away */
  | 'darken'
  /** Fog and driven snow, which flatten what is behind them */
  | 'veil'
  /** An aurora, which adds light rather than taking any */
  | 'lift';

export const MODES: Record<WashMode, GlobalCompositeOperation> = {
  darken: 'multiply',
  veil: 'source-over',
  lift: 'screen',
};

/** The same three, as the batch names them */
export const BLENDS: Record<WashMode, QuadBlend> = {
  darken: 'multiply',
  veil: 'over',
  lift: 'screen',
};

/** The wash a sky lays over the board, if it lays one. */
interface Wash {
  colour: string;
  /** How much of it, at the sky's strongest */
  depth: number;
  mode: WashMode;
}

export const WASHES: Partial<Record<Weather, Wash>> = {
  [Weather.Cloudy]: { colour: '#8a93a8', depth: 0.16, mode: 'darken' },
  [Weather.Overcast]: { colour: '#6f7789', depth: 0.24, mode: 'darken' },
  [Weather.Drizzle]: { colour: '#6d7d95', depth: 0.2, mode: 'darken' },
  [Weather.Rain]: { colour: '#5d6f8c', depth: 0.28, mode: 'darken' },
  [Weather.Downpour]: { colour: '#485874', depth: 0.4, mode: 'darken' },
  [Weather.Thunderstorm]: { colour: '#3f4a63', depth: 0.44, mode: 'darken' },
  [Weather.Mist]: { colour: '#c3ccd6', depth: 0.26, mode: 'veil' },
  [Weather.Fog]: { colour: '#cdd4dc', depth: 0.34, mode: 'veil' },
  [Weather.Haze]: { colour: '#d8c9a8', depth: 0.24, mode: 'veil' },
  [Weather.Frost]: { colour: '#bcd2e4', depth: 0.16, mode: 'veil' },
  [Weather.Snow]: { colour: '#c9d8e6', depth: 0.2, mode: 'veil' },
  [Weather.Blizzard]: { colour: '#dae5ef', depth: 0.3, mode: 'veil' },
  [Weather.Hail]: { colour: '#9fb3c6', depth: 0.26, mode: 'veil' },
  [Weather.Sandstorm]: { colour: '#c9a86a', depth: 0.28, mode: 'veil' },
  [Weather.DustHaze]: { colour: '#c8ab7c', depth: 0.26, mode: 'veil' },
  [Weather.Heatwave]: { colour: '#ffb15e', depth: 0.16, mode: 'veil' },
  [Weather.FallingAsh]: { colour: '#6b6560', depth: 0.3, mode: 'darken' },
  [Weather.Aurora]: { colour: '#2bff9e', depth: 0.1, mode: 'lift' },
  [Weather.Rainbow]: { colour: '#ffe9a8', depth: 0.12, mode: 'lift' },
  [Weather.PollenDrift]: { colour: '#e8dd8a', depth: 0.14, mode: 'veil' },
  [Weather.MeteorShower]: { colour: '#3b3f6b', depth: 0.22, mode: 'darken' },
  // Dead-still air, flattened: what is seen through a mirage is the
  // same country with the distance taken out of it
  [Weather.FataMorgana]: { colour: '#e9dcc2', depth: 0.18, mode: 'veil' },
  // A rainbow with the colour gone stands in fog, so it stands in
  // fog's own wash
  [Weather.Fogbow]: { colour: '#ccd4dc', depth: 0.3, mode: 'veil' },
};
