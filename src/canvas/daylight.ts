/**
 * What the sun is doing, and what the world looks like under it.
 *
 * The overworld already runs on a local clock — the spawn pools are
 * picked by `getTimeOfDay`, and the menu says which part of the day it
 * is — so the light is read from the same number rather than from a
 * clock of its own. A world lit for noon while night pokemon stand
 * about in it would be two games at once.
 *
 * Everything here is **hours**, smoothly: the four named periods are a
 * mechanic and they change on the hour, which is right for what spawns
 * and wrong for light. Dusk that arrived all at once would read as a
 * lamp being switched rather than as the sun going down.
 */

import { WORLD_MAX } from '../overworld/world';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The local hour, as a fraction: 13.5 is half past one */
function hourOf(localTime: number): number {
  return (((localTime % DAY) + DAY) % DAY) / HOUR;
}

/**
 * Where the sun stands.
 *
 * `elevation` is how high it is, from -1 at the dead of night through
 * 0 at the horizon to 1 overhead. `azimuth` is where it is *coming
 * from*, as an angle on the screen — east at dawn, overhead-ish at
 * noon, west at dusk — which is what decides where a shadow falls.
 *
 * The **day** is the same everywhere — sunrise at six, sunset at
 * eighteen, because the spawn pools turn over on those hours and a
 * light that disagreed with them would be two games at once. What
 * changes with the chunk is how **high** the sun gets: overhead at the
 * middle of the world, and never far up at its edges
 */
export interface Sun {
  elevation: number;
  azimuth: number;
}

const SUNRISE = 6;
const SUNSET = 18;

/**
 * How far the sun leans over at the edge of the world, in radians.
 *
 * Not a quarter turn: a pole where the sun never rises is a black
 * screen and a place nobody can play in, so the world's edge is a
 * hard northern winter rather than the arctic circle
 */
const MAX_TILT = (55 * Math.PI) / 180;

/**
 * Where a chunk stands between the middle of the world and its edge,
 * from -1 to 1.
 *
 * Which end is north does not matter: the sun's height falls off with
 * the **distance** from the middle, and the two halves are the same
 */
export function latitudeOf(chunkY: number): number {
  return Math.max(-1, Math.min(1, chunkY / WORLD_MAX));
}

export function getSun(localTime: number, latitude = 0): Sun {
  const hour = hourOf(localTime);
  /**
   * How far through the daylight it is, from 0 at sunrise to 1 at
   * sunset. Outside those hours it runs on past both ends, which is
   * what puts the sun below the horizon rather than stopping it there
   */
  const through = (hour - SUNRISE) / (SUNSET - SUNRISE);

  /**
   * How high it gets at all, here. One at the middle of the world and
   * about half that at the edge, so the far chunks keep the sun near
   * the horizon all day: long shadows, more colour, and a shallower
   * night, since a sun that never got far up never gets far down
   * either
   */
  const peak = Math.cos(latitude * MAX_TILT);

  return {
    // A half turn of a sine over the day: nothing at either horizon,
    // highest at noon, and negative through the night by the same
    // curve, so the small hours are the darkest rather than midnight
    // being a step
    elevation: Math.sin(through * Math.PI) * peak,
    // Swinging from one side to the other as the day goes. The angle
    // is in screen space — the board turns under the camera, and a sun
    // that turned with it would be a sun the player carries
    azimuth: (through - 0.5) * Math.PI,
  };
}

/**
 * The wash over the finished picture: one colour multiplied over
 * everything, and a warmer one laid on top near the horizons.
 *
 * Multiplying alone can only darken, which turns a sunrise into a dim
 * noon; the warm pass is what makes the low sun read as low rather
 * than as weak
 */
export interface Ambient {
  /** The colour everything is multiplied by, and how much of it */
  shade: string;
  depth: number;
  /** The colour laid over that, and how much of it */
  glow: string;
  warmth: number;
}

/** The deepest the night gets. Enough to read as night, little enough
 * that the ground under it is still a place rather than a silhouette */
const NIGHT_DEPTH = 0.62;

/**
 * How much of that is already there with the sun on the horizon.
 *
 * Without it the low sun is only warm, and dawn comes out *brighter*
 * than noon — which is the one thing everybody knows dawn is not
 */
const DUSK_DEPTH = 0.34;

/** How strong the horizon's colour is at its strongest */
const GLOW_STRENGTH = 0.12;

export function getAmbient(localTime: number, latitude = 0): Ambient {
  const { elevation } = getSun(localTime, latitude);
  /**
   * How much of the night is in this hour: none while the sun is up,
   * all of it once it is well down. The curve is the sun's own, so
   * the sky darkens as it sets rather than at a time written down
   */
  const dark = Math.min(1, Math.max(0, DUSK_DEPTH - elevation * 1.1));
  /**
   * And how near the horizon it is, either side of it. This is where
   * the colour is: a sun overhead is white, and a sun on the horizon
   * is the reason sunsets are worth looking at
   */
  const low = Math.max(0, 1 - Math.abs(elevation) * 3);

  return {
    // A cold blue for night rather than grey: the eye reads a drop in
    // blue as dusk and a drop in everything as a dimmed screen
    shade: '#2a3a6b',
    depth: dark * NIGHT_DEPTH,
    // Warm at both horizons and gone by the time the sun is properly
    // up or properly down: this is the colour of a low sun, not a
    // light of its own
    glow: elevation >= 0 ? '#ffb066' : '#ff8a5c',
    warmth: low * GLOW_STRENGTH,
  };
}

/**
 * Where a shadow falls and how far, for anything standing on the
 * ground.
 *
 * `dx` and `dy` are the direction away from the sun, in screen space
 * and already flattened the way the ground is; `length` is how far the
 * shadow reaches as a multiple of the caster's own footprint, and
 * `alpha` how dark it is. A sun near the horizon throws a long faint
 * shadow, one overhead a short hard one, and one below the horizon
 * throws none at all — what is left then is the ambient patch the
 * sprite sits on
 */
export interface Cast {
  dx: number;
  dy: number;
  length: number;
  alpha: number;
}

/** The longest a shadow is drawn, however low the sun is */
const MAX_LENGTH = 3.2;

/**
 * How much of the shadow's own colour reaches the ground, with the sun
 * straight overhead. All of it: how dark a shadow is belongs to
 * whoever is drawing it, and this only says how much the hour takes
 * away
 */
const NOON_ALPHA = 1;

/**
 * The least the hour takes it down to while the sun is still up. A
 * shadow that faded to nothing at dusk popped back to full the moment
 * the sun went under, since what is left then is the ambient patch and
 * that is drawn at its own colour
 */
const DUSK_ALPHA = 0.6;

/**
 * How much of a shadow's length survives the way the ground is drawn.
 * The board is laid back under the camera, so a step north covers less
 * of the picture than a step east
 */
const FLATTEN = 0.45;

/**
 * Where this hour's light throws a shadow, in the picture's own
 * directions.
 *
 * The sun stands in the **world**, and the board turns under it: a
 * player who spins the ground around does not spin the morning with
 * it. So the direction is worked out as a compass bearing and then
 * turned by the same yaw the ground is drawn at — without that, every
 * shadow pointed the same way on screen however the board was facing,
 * which reads as a light bolted to the camera
 */
export function getCast(localTime: number, yaw = 0, latitude = 0): Cast {
  const { elevation, azimuth } = getSun(localTime, latitude);
  const up = Math.max(0, elevation);
  /**
   * Long as the sun drops. It is `1 / tan(height)` in the world and a
   * curve that behaves like it here, since a real cotangent runs to
   * the horizon and off the screen with it
   */
  const length = Math.min(MAX_LENGTH, 0.4 + (1 - up) ** 2 * MAX_LENGTH);

  // A sun on the horizon throws nothing worth drawing: the shadow is
  // as long as the world and too faint to see, and the arithmetic for
  // it runs away to the edge of the screen. Below this it is the
  // ambient patch and nothing else
  const risen = up > 0.02;

  // Away from the sun: it rises in the east, which is the right of a
  // board drawn with north at the top, so a morning shadow lies to the
  // left and an evening one to the right
  const east = Math.sin(azimuth);
  const north = Math.cos(azimuth);
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);

  return {
    // Turned with the ground, then laid back with it
    dx: east * cos - north * sin,
    dy: (east * sin + north * cos) * FLATTEN,
    length: risen ? length : 0,
    // Fading with the sun rather than switching off at the horizon:
    // the last of the light throws the faintest shadow, which is what
    // makes dusk feel like dusk
    alpha: risen ? Math.max(DUSK_ALPHA, NOON_ALPHA * Math.min(1, up * 2.4)) : 0,
  };
}

/**
 * Wash the finished frame in the hour's own light. It goes on after
 * everything that stands in the world and before the player's own
 * instruments — a compass tinted by the evening is a compass that is
 * harder to read at night for no reason
 */
export function paintAmbient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  localTime: number,
  latitude = 0,
): void {
  const ambient = getAmbient(localTime, latitude);

  if (ambient.depth <= 0 && ambient.warmth <= 0) {
    return;
  }
  context.save();
  if (ambient.depth > 0) {
    context.globalCompositeOperation = 'multiply';
    context.globalAlpha = ambient.depth;
    context.fillStyle = ambient.shade;
    context.fillRect(0, 0, width, height);
  }
  if (ambient.warmth > 0) {
    // Screened rather than multiplied: this one is light being added,
    // and the low sun is the only thing in the day that adds any
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = ambient.warmth;
    context.fillStyle = ambient.glow;
    context.fillRect(0, 0, width, height);
  }
  context.restore();
}
