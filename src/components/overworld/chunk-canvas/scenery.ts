import { SPRITE_FACINGS } from '../../../canvas/board';
import type { Species } from '../../../data/ids/species';
import Decoration from '../../../data/overworld/decoration';
import Landmark from '../../../data/overworld/landmark';
import Phenomenon from '../../../data/overworld/phenomenon';
import { CELL, COLORS } from './metrics';

/**
 * What stands on a cell besides a pokemon: scenery, weather, and the
 * letter a landmark is marked with. Each is drawn in code — there are
 * no sheets for any of it — so the board says what a chunk is made of
 * at a glance.
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
 * One letter per landmark, the same ones the list used before the
 * chunk was a picture — they are short enough to read at this size and
 * a player already knows them
 */
/**
 * How each piece of scenery is drawn: a colour and a shape.
 *
 * Shapes rather than pictures, because there are no sheets for any of
 * this yet — a green cone is a tree in the way a letter in a circle is
 * a landmark, and it says what a chunk is made of at a glance. What is
 * standing there is named to a screen reader instead
 */
export const DECORATION_LOOKS: Record<
  Decoration,
  { color: string; shape: 'tall' | 'round' | 'tuft' }
> = {
  [Decoration.Tree]: { color: '#3f7a3f', shape: 'tall' },
  [Decoration.Pine]: { color: '#2f5f4a', shape: 'tall' },
  [Decoration.Palm]: { color: '#4f8f5f', shape: 'tall' },
  [Decoration.Cactus]: { color: '#5f8f4f', shape: 'tall' },
  [Decoration.Shrub]: { color: '#5f8a4a', shape: 'round' },
  [Decoration.Grass]: { color: '#6faa55', shape: 'tuft' },
  [Decoration.Flower]: { color: '#c9739f', shape: 'tuft' },
  [Decoration.Rock]: { color: '#8a8a8a', shape: 'round' },
  [Decoration.Boulder]: { color: '#6f6f6f', shape: 'round' },
  [Decoration.Reed]: { color: '#7a8f4a', shape: 'tuft' },
  [Decoration.Coral]: { color: '#d1707f', shape: 'tall' },
  [Decoration.Ice]: { color: '#a9d8e8', shape: 'round' },
  [Decoration.Mushroom]: { color: '#b0603f', shape: 'round' },
  [Decoration.Stump]: { color: '#7a5a3a', shape: 'round' },
};

/**
 * One piece of scenery, drawn on the ground it stands on. A cone for
 * anything that grows upward, a mound for anything that lies about,
 * and three strokes for anything low enough to walk through
 */
export function drawDecoration(
  context: CanvasRenderingContext2D,
  spot: { x: number; y: number; scale: number },
  decoration: Decoration,
  magnify: number,
): void {
  const look = DECORATION_LOOKS[decoration];
  const size = CELL * 0.32 * spot.scale * magnify;

  context.save();
  context.fillStyle = look.color;
  context.strokeStyle = look.color;
  context.lineWidth = Math.max(1, size * 0.22);
  context.lineCap = 'round';
  context.beginPath();

  if (look.shape === 'tall') {
    context.moveTo(spot.x, spot.y - size * 1.4);
    context.lineTo(spot.x + size * 0.8, spot.y + size * 0.6);
    context.lineTo(spot.x - size * 0.8, spot.y + size * 0.6);
    context.closePath();
    context.fill();
  } else if (look.shape === 'round') {
    context.ellipse(spot.x, spot.y, size * 0.9, size * 0.65, 0, 0, Math.PI * 2);
    context.fill();
  } else {
    for (const lean of [-0.7, 0, 0.7]) {
      context.moveTo(spot.x + size * lean * 0.9, spot.y + size * 0.5);
      context.lineTo(spot.x + size * lean * 1.3, spot.y - size * 0.7);
    }
    context.stroke();
  }
  context.restore();
}

/**
 * What a phenomenon looks like from above, drawn in code the way the
 * scenery is. Each is the thing itself rather than a marker: rings
 * spreading on water, dust hanging over dry ground, the shadow of
 * something passing overhead. The grotto is the exception — hidden is
 * what it is, so it keeps the plain landmark mark
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
 * The plain mark a cell wears when there is nothing better to draw:
 * a disc with a letter on it. Everything a player can walk up to gets
 * one, except the phenomena that draw themselves
 */
export function drawLandmarkMark(
  context: CanvasRenderingContext2D,
  spot: { x: number; y: number; scale: number },
  glyph: string,
  magnify: number,
): void {
  context.fillStyle = COLORS.landmark;
  context.beginPath();
  context.arc(spot.x, spot.y, CELL * 0.36 * spot.scale * magnify, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = COLORS.glyph;
  context.font = `bold ${Math.round(CELL * 0.6 * spot.scale * magnify)}px monospace`;
  context.fillText(glyph, spot.x, spot.y + 1);
}

export const LANDMARK_GLYPHS: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'C',
  [Landmark.LegendaryLair]: 'R',
  [Landmark.ShadowLair]: 'S',
  [Landmark.BerryPatch]: 'B',
  [Landmark.Nest]: 'N',
  [Landmark.WanderingNpc]: 'P',
  [Landmark.Portal]: 'O',
  [Landmark.TeamRocket]: 'G',
  [Landmark.Trainer]: 'T',
  [Landmark.GymLeader]: 'L',
  [Landmark.EliteFour]: 'E',
  [Landmark.Champion]: 'V',
  [Landmark.Market]: 'M',
  [Landmark.GymSeat]: 'A',
  [Landmark.AuctionBoard]: '$',
};
