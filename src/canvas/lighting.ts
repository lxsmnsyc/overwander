/**
 * What light reaches a point on the board.
 *
 * The dark used to be a veil over the finished picture with a hole
 * burnt through it wherever a lamp stood: what showed through the hole
 * was still drawn at noon, and everything else was drawn at noon and
 * then painted out. This is the other way round. Nothing is lit until
 * something lights it, so a far corner of a cave is black because no
 * light got there and a pokemon beside a torch is warm because one
 * did.
 *
 * Everything here is in **board cells**, the same space a scene spot
 * is written in, so one reading answers for the ground mesh, the
 * sprites standing on it and the tiles the fallback lays by hand.
 */

import type { Colour } from './gl/colour';
import parseColour from './gl/colour';

/** A lamp, a torch, or whatever else is throwing light about */
export interface LightSource {
  /** Where it stands, in board cells */
  x: number;
  z: number;
  /** How far its light carries, in cells */
  reach: number;
  colour: string;
  /** How much light it throws at its middle, where 1 is daylight */
  strength: number;
}

/** The light a frame is drawn under */
export interface Lighting {
  /**
   * What reaches everywhere, whatever else is lit, as the three
   * channels a picture is multiplied by. Daylight is white, which is
   * the same as no lighting at all
   */
  ambient: Colour;
  sources: LightSource[];
}

/** Nothing taken away: what a board drawn without lighting looks like */
export const DAYLIGHT: Colour = [1, 1, 1, 1];

/**
 * What a cave has of its own, with every lamp out: nothing. A cave is
 * underground, and what is not lit down there is not dim, it is
 * unseen
 */
export const CAVE_LIGHT: Colour = [0, 0, 0, 1];

/** And a day the sky has put out, which is as black as the cave is */
export const DARK_DAY_LIGHT: Colour = [0, 0, 0, 1];

/** What a carried lamp throws, and how much of it at the middle */
export const LAMP_COLOUR = '#ffcf96';
export const LAMP_STRENGTH = 1;

/**
 * How fast a lamp falls off. Squared rather than straight, so the
 * middle of a pool is bright and its edge fades out instead of ending
 */
const FALLOFF = 2;

/** Overwritten on every read: this runs four times a tile */
const reached: Colour = [1, 1, 1, 1];

/**
 * The light at one point of the board, as the colour to tint whatever
 * is drawn there.
 *
 * The answer is shared and overwritten by the next call, so a caller
 * keeping it past the quad it is writing must copy it
 */
export function litAt(lighting: Lighting, x: number, z: number): Colour {
  reached[0] = lighting.ambient[0];
  reached[1] = lighting.ambient[1];
  reached[2] = lighting.ambient[2];
  reached[3] = 1;

  for (const source of lighting.sources) {
    if (!(source.reach > 0) || source.strength <= 0) {
      continue;
    }
    const across = (x - source.x) / source.reach;
    const along = (z - source.z) / source.reach;
    const away = Math.sqrt(across * across + along * along);

    if (away >= 1) {
      continue;
    }
    const colour = parseColour(source.colour);

    if (colour == null) {
      continue;
    }
    const lit = (1 - away) ** FALLOFF * source.strength;

    // Added rather than laid over: the ground between two lamps is
    // lit by both of them
    reached[0] = Math.min(1, reached[0] + colour[0] * lit);
    reached[1] = Math.min(1, reached[1] + colour[1] * lit);
    reached[2] = Math.min(1, reached[2] + colour[2] * lit);
  }
  return reached;
}

/**
 * How much brighter the page is than the light that made it, near
 * enough: the curve a colour is stored on
 */
const SCREEN_GAMMA = 2.2;

/**
 * The same light, written for a painter that multiplies a picture in
 * the colours it was drawn in.
 *
 * The scene's country is lit in plain light: three decodes its tiles
 * out of the page's colours, multiplies, and encodes the answer back.
 * Everything else goes through a shader that does neither and
 * multiplies the stored colours directly, where the same number comes
 * out about twice as dark. This is that number bent to match, so a
 * pokemon is as lit as the ground it stands on
 */
export function encoded(light: Colour, into: Colour): Colour {
  for (let channel = 0; channel < 3; channel += 1) {
    into[channel] = light[channel] ** (1 / SCREEN_GAMMA);
  }
  into[3] = 1;
  return into;
}

/** A colour taken down by the light falling on it, as the `#rrggbb` a painter takes */
export function dimmed(colour: string, light: Colour): string {
  const read = parseColour(colour);

  if (read == null) {
    return colour;
  }
  let written = '#';

  for (let channel = 0; channel < 3; channel += 1) {
    // On the page's curve, like every other colour handed to a painter
    // that multiplies what is stored rather than what it stands for
    written += Math.round(read[channel] * light[channel] ** (1 / SCREEN_GAMMA) * 255)
      .toString(16)
      .padStart(2, '0');
  }
  return written;
}

/** Whether the light here would change the picture at all */
export function isLit(lighting: Lighting): boolean {
  return (
    lighting.sources.length > 0 ||
    lighting.ambient[0] < 1 ||
    lighting.ambient[1] < 1 ||
    lighting.ambient[2] < 1
  );
}
