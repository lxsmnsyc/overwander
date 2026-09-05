import { SPRITE_FACINGS } from '../../../canvas/board';
import type { Species } from '../../../data/ids/species';
import Landmark from '../../../data/overworld/landmark';
import Phenomenon from '../../../data/overworld/phenomenon';
import drawSparkle, { SPARKLE_SPREAD, SPARKLE_STAR_SIZE } from '../../../canvas/sparkle';
import type Bakery from '../../../canvas/bakery';
import type { Baked } from '../../../canvas/bakery';
import { CELL, COLORS } from './metrics';

/**
 * What a cell wears besides its scenery: what is going on there, and
 * the ring under whoever is standing on it.
 *
 * Both are drawn in code because neither has a sheet. Everything that
 * does have one is drawn from it, so nothing here stands in for a
 * picture that is on its way.
 */

/**
 * A pokemon standing in the chunk, and which coat it is wearing.
 *
 * Shininess is not the world's — it is a resonance between the trait
 * value and the player reading the screen, so the same spawn sparkles
 * for one trainer and not for the next — which is why it travels with
 * the species rather than being worked out here
 */
export interface SpawnCoat {
  species: Species;
  shiny: boolean;
  /**
   * Whether it belongs to the day's featured family. The board rings
   * the cell to say so: the crowded pool and the eight-fold shininess
   * are the reason to walk over rather than past
   */
  featured: boolean;
}

/**
 * Which way a pokemon standing on a cell happens to be facing.
 *
 * A field of pokemon all facing the camera reads as a shop window.
 * They face whichever way they were standing when the window rolled
 * them, and it is derived rather than stored: the cell and the species
 * are what the world already knows, so every player looking at that
 * chunk sees the same Rattata looking the same way, and it does not
 * change under a camera walking around it
 */
export function facingOf(index: number, species: Species): number {
  const mixed = Math.imul(index + 1, 2_654_435_761) ^ Math.imul(species + 1, 40_503);

  return (Math.abs(mixed) >>> 3) % SPRITE_FACINGS;
}

/**
 * What a phenomenon looks like from above, drawn in code the way the
 * scenery is. Each is the thing itself rather than a marker: rings
 * spreading on water, dust hanging over dry ground, the shadow of
 * something passing overhead. The grotto is the exception: hidden is
 * what it is, so it is left to the scenery to draw as a tree
 */
export function drawPhenomenon(
  context: CanvasRenderingContext2D,
  spot: { x: number; y: number; scale: number },
  phenomenon: Phenomenon,
  now: number,
  magnify: number,
): void {
  const size = CELL * spot.scale * magnify;

  context.save();

  if (phenomenon === Phenomenon.RipplingWater) {
    // The one phenomenon that stands on ground its own colour: pale
    // rings on pale water were all but invisible in a kelp forest. So
    // each ring is laid on a dark halo, the way the compass letters
    // are, and the cell is seated on a shadow of its own
    const seat = context.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, size * 0.55);

    seat.addColorStop(0, 'rgba(4, 30, 48, 0.34)');
    seat.addColorStop(1, 'rgba(4, 30, 48, 0)');
    context.globalAlpha = 1;
    context.fillStyle = seat;
    context.beginPath();
    context.ellipse(spot.x, spot.y, size * 0.55, size * 0.31, 0, 0, Math.PI * 2);
    context.fill();

    // Two rings a half-beat apart, each spreading out and thinning
    // away, squashed to lie on the ground
    for (const phase of [0, 0.5]) {
      const part = (now / 1600 + phase) % 1;
      const reach = size * (0.12 + part * 0.42);
      const fade = 1 - part;
      const width = Math.max(1, size * 0.07 * (1 - part * 0.5));

      context.beginPath();
      context.ellipse(spot.x, spot.y, reach, reach * 0.55, 0, 0, Math.PI * 2);
      // The dark line under the pale one, drawn wider so it shows at
      // both edges: it is what the ring is read against on water too
      // bright for white and too green for blue
      context.globalAlpha = fade * 0.5;
      context.strokeStyle = '#04263a';
      context.lineWidth = width * 2;
      context.stroke();
      context.globalAlpha = fade;
      context.strokeStyle = '#f4fcff';
      context.lineWidth = width;
      context.stroke();
    }

    // The drop itself, beating in the middle, so the cell is never
    // bare in the moment between one ring leaving and the next
    const beat = Math.abs(Math.sin(now / 800));

    context.globalAlpha = 0.55 + beat * 0.45;
    context.fillStyle = '#f4fcff';
    context.beginPath();
    context.ellipse(spot.x, spot.y, size * 0.055, size * 0.032, 0, 0, Math.PI * 2);
    context.fill();
  } else if (phenomenon === Phenomenon.DustCloud) {
    // A rolling heap of billows rather than a flat swirl: a ground
    // shadow, a wheeling ring of rolls with one riding on top, each
    // shaded dark-below and lit-above so the mound has volume
    const turn = now / 1400;

    context.globalAlpha = 0.22;
    context.fillStyle = '#2e2416';
    context.beginPath();
    context.ellipse(spot.x, spot.y + size * 0.12, size * 0.5, size * 0.2, 0, 0, Math.PI * 2);
    context.fill();

    const rolls = Array.from({ length: 5 }, (_, puff) => {
      const angle = turn + (puff * Math.PI * 2) / 5;
      const breath = 1 + Math.sin(now / 300 + puff * 1.7) * 0.12;

      return {
        x: spot.x + Math.cos(angle) * size * 0.34,
        y: spot.y + Math.sin(angle) * size * 0.15 - size * 0.12,
        reach: size * (0.22 + 0.07 * ((puff * 2) % 3)) * breath,
      };
    });

    rolls.push({
      x: spot.x + Math.sin(turn * 0.7) * size * 0.1,
      y: spot.y - size * 0.4,
      reach: size * 0.19 * (1 + Math.sin(now / 340) * 0.1),
    });
    rolls.push({
      x: spot.x + Math.cos(turn * 0.9) * size * 0.16,
      y: spot.y - size * 0.24,
      reach: size * 0.17 * (1 + Math.sin(now / 360 + 2) * 0.1),
    });
    // Far rolls first, so the near ones overlap them: the overlap is
    // what turns a scatter of ellipses into one heap
    rolls.sort((left, right) => left.y - right.y);

    // Each billow is one soft gradient ball, lit from the upper left
    // and fading out at its rim: the soft rims are what let the balls
    // melt into a single cloud instead of a pile of stones
    for (const roll of rolls) {
      const glow = context.createRadialGradient(
        roll.x - roll.reach * 0.3,
        roll.y - roll.reach * 0.35,
        roll.reach * 0.35,
        roll.x,
        roll.y,
        roll.reach * 1.25,
      );

      glow.addColorStop(0, 'rgba(226, 205, 158, 0.9)');
      glow.addColorStop(0.5, 'rgba(163, 130, 82, 0.85)');
      glow.addColorStop(1, 'rgba(110, 87, 50, 0)');
      context.globalAlpha = 1;
      context.fillStyle = glow;
      context.beginPath();
      context.arc(roll.x, roll.y, roll.reach * 1.25, 0, Math.PI * 2);
      context.fill();
    }

    for (let speck = 0; speck < 3; speck++) {
      const angle = turn * 2.2 + (speck * Math.PI * 2) / 3;

      context.globalAlpha = 0.8;
      context.fillStyle = '#9a7b45';
      context.beginPath();
      context.arc(
        spot.x + Math.cos(angle) * size * 0.5,
        spot.y + Math.sin(angle) * size * 0.24,
        Math.max(1, size * 0.04),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  } else if (phenomenon === Phenomenon.FlyingShadow) {
    // The shadow alone: a dark patch gliding to and fro across the
    // cell, swelling a little as whatever casts it banks lower
    const sweep = Math.sin(now / 1400);
    const low = 1 + Math.sin(now / 700) * 0.12;

    context.globalAlpha = 0.4;
    context.fillStyle = '#101820';
    context.beginPath();
    context.ellipse(
      spot.x + sweep * size * 0.22,
      spot.y + Math.cos(now / 900) * size * 0.06,
      size * 0.22 * low,
      size * 0.12 * low,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

/**
 * The colour a landmark's cell is called out in: the game's two
 * colours for an ordinary fight and a counter, and one of its own for
 * each rung of the league. The coat somebody is drawn in does not say
 * what walking up to them does, so the ground says it
 */
export function landmarkCallOut(landmark: Landmark): string {
  if (landmark === Landmark.GymLeader) {
    return COLORS.gym;
  }
  if (landmark === Landmark.EliteFour) {
    return COLORS.elite;
  }
  if (landmark === Landmark.Champion) {
    return COLORS.champion;
  }
  if (landmark === Landmark.TeamRocket) {
    return COLORS.rocket;
  }
  return isFightingLandmark(landmark) ? COLORS.fight : COLORS.serve;
}

/**
 * The colour a plant's cell is called out in: one for a berry patch
 * and one for an apricorn tree, the way a landmark's cell says what
 * kind of person is standing on it. Which berry or which apricorn is
 * the plant drawn on the cell, not a shade of the ring
 */
export function plantCallOut(landmark: Landmark): string {
  return landmark === Landmark.ApricornTree ? COLORS.apricorn : COLORS.berry;
}

/**
 * Whether the person standing at a landmark is somebody to fight.
 *
 * The five who do are the two ambushes and the three seats of the
 * league. Everyone else at a landmark keeps a counter: a nurse, a
 * breeder, a vendor, whoever the wandering cell turned up this window
 */
export function isFightingLandmark(landmark: Landmark): boolean {
  return (
    landmark === Landmark.TeamRocket ||
    landmark === Landmark.Trainer ||
    landmark === Landmark.GymLeader ||
    landmark === Landmark.EliteFour ||
    landmark === Landmark.Champion
  );
}

/**
 * How wide a piece is baked. Baked large and stamped smaller, since a
 * cell near the camera is a good deal bigger than one at the back and
 * one picture serves both
 */
const BAKED = 96;

/**
 * The phenomena, repainted into a picture each frame.
 *
 * These are the one thing on the board that is drawn in code and moves
 * while it is drawn: rings spreading, a mound rolling, a shadow
 * crossing. There is nothing to bake, so each is repainted into a
 * small canvas of its own once a frame and handed over as a picture.
 *
 * A canvas per kind rather than per cell: two cells showing the same
 * thing at the same moment show the same picture, at whatever size
 * each of them is drawn
 */

/** How wide a piece is repainted. Bigger than it needs, and stamped down */
const PAINTED = 128;

/**
 * How far the art reaches from its cell, as a share of one. Measured
 * off the painters rather than guessed: the widest is the dust cloud,
 * at 0.78 either way
 */
const PHENOMENON_SPAN = 1.8;

const painted = new Map<Phenomenon, { canvas: HTMLCanvasElement; at: number }>();

/**
 * The picture of one phenomenon at this moment, painted if it has not
 * been painted for this moment already. Null where there is no context
 * to paint with, and a caller that gets one draws it the old way
 */
export function paintPhenomenon(phenomenon: Phenomenon, now: number): HTMLCanvasElement | null {
  const held = painted.get(phenomenon);

  if (held?.at === now) {
    return held.canvas;
  }

  const canvas = held?.canvas ?? document.createElement('canvas');

  canvas.width = PAINTED;
  canvas.height = PAINTED;

  const context = canvas.getContext('2d');

  if (context == null) {
    return null;
  }
  context.clearRect(0, 0, PAINTED, PAINTED);
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  drawPhenomenon(
    context,
    { x: PAINTED / 2, y: PAINTED / 2, scale: 1 },
    phenomenon,
    now,
    PAINTED / (PHENOMENON_SPAN * CELL),
  );
  context.restore();
  painted.set(phenomenon, { canvas, at: now });
  return canvas;
}

/** How wide on the board that picture is drawn, for one cell */
export function phenomenonSpan(spot: { scale: number }, magnify: number): number {
  return PHENOMENON_SPAN * CELL * spot.scale * magnify;
}

/**
 * The round patch every shadow is stamped from.
 *
 * One white disc, tinted and turned to whatever shape a shadow wants:
 * a shadow is an ellipse and an ellipse is a circle in a box
 */
export function bakeShadowDisc(bakery: Bakery): Baked | null {
  return bakery.take('shadow:disc', BAKED, (context) => {
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(0, 0, BAKED / 2 - 1, 0, Math.PI * 2);
    context.fill();
  });
}

/** How much bigger the stamp is than the patch, for the disc's own edge */
export const SHADOW_STAMP = BAKED / 2 / (BAKED / 2 - 1);

/**
 * How much room is left round a word for the halo it is read against.
 */
const WORD_ROOM = 6;

let ruler: CanvasRenderingContext2D | null = null;

/** Something to measure text with, which is a context and nothing else */
function measuring(): CanvasRenderingContext2D | null {
  ruler ??= document.createElement('canvas').getContext('2d');
  return ruler;
}

/**
 * A word, baked in the font it is drawn in, with the halo it is read
 * against where it has one.
 *
 * Keyed by the font rather than baked once and stretched. A stroked
 * halo scaled down spreads its alpha and comes out heavier than the
 * stroke draws it, which is why the words on this board stayed painted
 * for so long. At its own size it is the same two calls, into a sheet
 * rather than onto the picture, and a board asks for whole pixels so
 * there are only ever a few
 */
export function bakeWord(
  bakery: Bakery,
  word: string,
  font: string,
  ink: string,
  halo?: string,
): Baked | null {
  const rule = measuring();

  if (rule == null || word === '') {
    return null;
  }
  rule.font = font;

  const measured = rule.measureText(word);
  // The box the glyphs actually fill, which a font's own size does not
  // say: a word with no descender wants less room than one with
  const above = measured.actualBoundingBoxAscent;
  const below = measured.actualBoundingBoxDescent;
  const tall = above > 0 || below > 0 ? above + below : Math.ceil(measured.width / word.length) * 2;
  const across = Math.ceil(measured.width) + WORD_ROOM * 2;
  const down = Math.ceil(tall) + WORD_ROOM * 2;

  return bakery.take(
    `word:${word}:${font}:${ink}:${halo ?? ''}`,
    down,
    (context) => {
      context.font = font;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      if (halo != null) {
        context.fillStyle = halo;
        context.fillText(word, 0, 1);
      }
      context.fillStyle = ink;
      context.fillText(word, 0, 0);
    },
    across,
  );
}

/**
 * How far past the sprite the stars fall, either way, as a share of
 * it. `SPARKLE_SPREAD` reaches a quarter of the width to each side and
 * the widest star adds its own radius, so this is what says how much
 * bigger the picture is than the pokemon in it
 */
const SPARKLE_ROOM = SPARKLE_SPREAD / 4 + SPARKLE_STAR_SIZE;

/**
 * How much bigger than the pokemon the sparkle's picture is, so a
 * caller stamps it over the right box
 */
export const SPARKLE_SPAN = 1 + SPARKLE_ROOM * 2;

/** The largest a sparkle's picture is painted, in either direction */
const SPARKLE_LIMIT = 192;

const sparkled = { canvas: null as HTMLCanvasElement | null, key: '' };

/**
 * The picture of one sparkle at this moment, in the sheet's own
 * pixels, painted around the point the pokemon stands on.
 *
 * The stars are a share of the sprite, so this is painted at the
 * sheet's scale and stamped at whatever the pokemon is drawn at. One
 * picture, repainted: two shinies seen in the same frame is not a
 * thing that happens, and a stale one is a glint out of step with the
 * pokemon it belongs to
 */
export function paintSparkle(
  seed: number,
  age: number,
  frame: { width: number; height: number },
): HTMLCanvasElement | null {
  const across = Math.min(SPARKLE_LIMIT, Math.max(1, Math.round(frame.width * SPARKLE_SPAN)));
  const down = Math.min(SPARKLE_LIMIT, Math.max(1, Math.round(frame.height * SPARKLE_SPAN)));
  const key = `${seed}:${Math.round(age)}:${across}:${down}`;

  if (sparkled.canvas != null && sparkled.key === key) {
    return sparkled.canvas;
  }
  const canvas = sparkled.canvas ?? document.createElement('canvas');

  canvas.width = across;
  canvas.height = down;

  const context = canvas.getContext('2d');

  if (context == null) {
    return null;
  }
  context.clearRect(0, 0, across, down);
  context.save();
  context.translate(across / 2, down / 2);
  drawSparkle(
    context,
    seed,
    age,
    0,
    0,
    { width: across / SPARKLE_SPAN, height: down / SPARKLE_SPAN },
    1,
  );
  context.restore();
  sparkled.canvas = canvas;
  sparkled.key = key;
  return canvas;
}
