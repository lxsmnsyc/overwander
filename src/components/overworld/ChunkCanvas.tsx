import { type JSX, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import {
  ASPECT,
  BORDER_CELLS,
  type BoardCell,
  PICTURE_SPAN,
  PITCH,
  type ProjectedPoint,
  SPRITE_FACINGS,
  angleOf,
  boardCellAtFraction,
  boardCellOf,
  boardCells,
  borderExit,
  chunkCellOf,
  compassMarks,
  facingFrom,
  fitPicture,
  isBoardCell,
  isBorderCell,
  paintOrder,
  projectBoardCellQuad,
  projectCell,
  projectGround,
  radiusOf,
  shortestTurn,
  unprojectGround,
  yawTurns,
} from '../../canvas/board';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import { SPRITE_DIRECTIONS } from '../../canvas/sprite-sheet';
import drawSparkle from '../../canvas/sparkle';
import { type Cast, getCast, paintAmbient } from '../../canvas/daylight';
import { getLocalOffset, toLocalTime } from '../../auth/local-time';
import { serverNow } from '../../auth/clock';
import loadSpeciesSprite from '../../canvas/species-sprites';
import type BiomeTileset from '../../canvas/biome-tileset';
import { variantAt } from '../../canvas/biome-tileset';
import loadBiomeTileset from '../../canvas/biome-tilesets';
import drawTileQuad from '../../canvas/tile-quad';
import { BIOME_COLORS } from '../../data/biome';
import type Biome from '../../data/ids/biome';
import { isWaterBiome } from '../../data/ids/biome';
import type { TerrainRole } from '../../data/overworld/terrain';
import boardTerrain from '../../overworld/terrain';
import { rotateMask } from '../../data/overworld/autotile';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import Decoration from '../../data/overworld/decoration';
import Landmark from '../../data/overworld/landmark';
import Phenomenon from '../../data/overworld/phenomenon';
import type Npc from '../../data/overworld/npc';
import { npcSheet } from '../../data/overworld/npc';
import type { Species } from '../../data/ids/species';
import facingToward from '../../canvas/facing';
import type OWCharSprite from '../../canvas/ow-char-sprite';
import loadOWChar from '../../canvas/ow-char-sprites';
import { CHUNK_CELLS } from '../../overworld/chunk';

/**
 * The chunk the player is standing in, drawn rather than laid out.
 *
 * It was 256 buttons in a CSS grid, which is 256 elements to restyle
 * every time somebody takes a step. This is one element: the whole
 * chunk is repainted on a change, which for a grid this size is a
 * fraction of the work laying it out again would be — and it leaves
 * room for the things a grid of buttons could not do at all, like
 * shading the ring a player can actually reach from where they stand.
 *
 * What it is *not* is a second source of truth. Where the player is,
 * what is on a cell and whether it can be reached are all the tab's to
 * decide; this asks for them per cell and paints the answers.
 */

/**
 * How big a cell is at the size the picture was drawn at.
 *
 * The canvas is the page now, so the picture is however large the
 * screen allows rather than a fixed number of pixels. What this and
 * the sizes beside it describe is one **reference** picture: a radius
 * of `CELL * 0.3` is that on a board of this width and proportionally
 * more on a wider one. Everything measured in pixels is multiplied by
 * how much larger the real picture came out
 */
const CELL = 26;

/**
 * The reference picture's width. It is wider than the chunk: there is
 * an apron of threshold cells around it and the compass letters stand
 * off that again
 */
const WIDTH = CELL * CHUNK_CELLS * PICTURE_SPAN;

/**
 * How far past the chunk the apron of thresholds reaches, in board
 * fractions — the units the ground is measured in, where the chunk
 * itself runs from 0 to 1
 */
const APRON = BORDER_CELLS / CHUNK_CELLS;

/**
 * How much bigger than the sheet a pokemon standing in a cell is
 * drawn, at the board's middle row. The rows in front of it are drawn
 * larger and the rows behind smaller — that factor is the projection's
 * and comes back with every point it is asked about.
 *
 * A little larger than it was, because a sprite is no longer sitting
 * inside its cell: it stands **up** out of it, over the row behind,
 * which is the whole of what makes the board read as a place with
 * things on it rather than a chart with pictures in it
 */
const SPRITE_SCALE = 0.95;

/**
 * How much of that a pokemon gets, by the size the game calls it.
 *
 * Drawn pixels alone are a poor measure of how big something is: a
 * frame is trimmed to the widest pose in the sheet, so a Zubat with
 * its wings out came out taller on the board than most of the pokemon
 * twice its size. `shadowSize` is the game's own answer and the only
 * one a sheet carries, so it corrects what the drawing says rather
 * than replacing it. Gentle on purpose, since the artists already draw
 * a Gyarados larger than a Caterpie and this multiplies that
 */
const SIZE_TIERS = [0.85, 1, 1.1];

/**
 * How many cells tall a charset's own cell is drawn.
 *
 * Not the scale the pokemon are drawn at: a charset is drawn at a
 * bigger pixel size than a PMD sheet, so sharing one number puts a
 * nurse two rows tall beside a Bulbasaur three quarters of a cell high.
 * Measured against the **source** cell rather than the cropped one, so
 * every charset stands the same height whatever its own crop came to
 */
const NPC_CELLS = 1.45;

/**
 * What the board says while the sheets for what is standing on it are
 * still coming, and how large it is drawn in board pixels
 */
const LOADING_LABEL = 'Loading…';
const LOADING_SIZE = 18;

const COLORS = {
  grid: 'rgba(0, 0, 0, 0.12)',
  /**
   * The cell the player is on
   */
  player: '#ffd166',
  /**
   * The line round how far the player can lean: their own square and
   * the eight about it, drawn as one ring rather than as nine lit
   * cells. Whatever is inside it is theirs to press
   */
  highlight: '#ffffff',
  spawn: '#2b2b2b',
  glyph: '#1c1c1c',
  landmark: 'rgba(255, 255, 255, 0.65)',
  /**
   * The keyboard's own pointer, drawn only while the canvas has focus
   */
  cursor: '#3b82f6',
  /**
   * The compass, which is four letters standing on the ground off the
   * edges of the board. They are read against whatever country the
   * chunk is made of, so each one is drawn on a halo of its own rather
   * than trusting a dark letter to show up on dark ground
   */
  compass: '#1c1c1c',
  compassHalo: 'rgba(255, 255, 255, 0.75)',
  /**
   * The word said over the board while its pokemon are still coming,
   * on a halo for the same reason the compass has one
   */
  loading: '#1c1c1c',
  loadingHalo: 'rgba(255, 255, 255, 0.75)',
  /**
   * The ground under something standing on it
   */
  shadow: 'rgba(0, 0, 0, 0.28)',
  /**
   * What lifts the board off the country it lies in. The ground
   * beyond it is the same colour — it is the same country — so the
   * board is the part of it with the light on
   */
  surface: 'rgba(255, 255, 255, 0.10)',
} as const;

/**
 * How near the middle of the board a grab has to be before it is not
 * worth turning by.
 *
 * The board turns about its own middle, so a bit of plane grabbed
 * right at the centre has no angle to speak of: a pixel of movement
 * there would swing it half a turn. A grab inside this holds the
 * board still until the pointer has been dragged out past it, which
 * is what a hand on a turntable does
 */
const TURN_DEAD_ZONE = 0.06;

/**
 * How big the compass letters are on the reference picture. They are
 * the only writing on it, and they are read at a glance rather than
 * studied
 */
const COMPASS_SIZE = 15;

/**
 * How thick the halo under a compass letter is drawn
 */
const COMPASS_HALO = 3;

/**
 * How flat the shadow lies. It is on the ground, and the ground is
 * laid back under the camera, so it is squashed the way the ground is
 */
const GROUND_SQUASH = Math.sin((PITCH * Math.PI) / 180) * 0.55;

/**
 * Crossing a boundary, drawn rather than waited through.
 *
 * The next chunk's window is a round trip, and while it is in the air
 * there is nothing to draw. The world used to be taken off the screen
 * for that moment and a line of text put in its place, which is a
 * flash of the whole page for what is usually a fraction of a second
 * — and it happens every time a player walks off an edge.
 *
 * So the board is carried off instead: the one being left slides away
 * behind the walker and fades, and the one they have walked into comes
 * on from the far side. Nothing waits on the drawing — the caller
 * holds the old board up until the new one has arrived, and says which
 * half of the crossing this is
 */
export interface Crossing {
  /**
   * The step that took them over, in the world's own cells: north is
   * `dy` of -1 whichever way the camera is pointing
   */
  dx: number;
  dy: number;
  /**
   * Whether the board is being carried off or brought on
   */
  phase: 'out' | 'in';
}

/**
 * How long each half of a crossing takes. Short: it is a step, and a
 * player crossing several chunks would otherwise spend the walk
 * watching the boards rather than the world
 */
export const CROSSING_OUT = 180;

export const CROSSING_IN = 220;

/**
 * How far the board travels while it is being carried off, as a
 * fraction of the picture. Far enough to be leaving, near enough that
 * it is the same board the whole way
 */
const CROSSING_SLIDE = 0.3;

/**
 * Which button turns the board. The left one is for pressing cells
 * and the right one has no other business here
 */
const RIGHT_BUTTON = 2;

/**
 * How far a keyboard press turns the board. A quarter is what the
 * halves of it are counted in; a press is half of that, which lands
 * on a sprite facing every time
 */
const QUARTER_TURN = Math.PI / 2;

/**
 * Whether this press is asking to turn the board rather than to press
 * a cell.
 *
 * The right button, or — for the Mac, where a trackpad and a Magic
 * Mouse both ship without one — **control and the left button**, which
 * is what that platform means by a secondary click everywhere else.
 * It costs nothing on the machines that do have a right button, since
 * control-clicking one was never a way of pressing a cell
 */
export function isTurningPress(event: { button: number; ctrlKey: boolean }): boolean {
  return event.button === RIGHT_BUTTON || (event.button === 0 && event.ctrlKey);
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

function facingOf(index: number, species: Species): number {
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
const DECORATION_LOOKS: Record<Decoration, { color: string; shape: 'tall' | 'round' | 'tuft' }> = {
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
function drawDecoration(
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
function drawPhenomenon(
  context: CanvasRenderingContext2D,
  spot: { x: number; y: number; scale: number },
  phenomenon: Phenomenon,
  now: number,
  magnify: number,
): void {
  const size = CELL * spot.scale * magnify;

  context.save();

  if (phenomenon === Phenomenon.RipplingWater) {
    // Two rings a half-beat apart, each spreading out and thinning
    // away, squashed to lie on the ground
    for (const phase of [0, 0.5]) {
      const part = (now / 1600 + phase) % 1;
      const reach = size * (0.12 + part * 0.42);

      context.globalAlpha = (1 - part) * 0.9;
      context.strokeStyle = '#eaf7ff';
      context.lineWidth = Math.max(1, size * 0.06 * (1 - part * 0.6));
      context.beginPath();
      context.ellipse(spot.x, spot.y, reach, reach * 0.55, 0, 0, Math.PI * 2);
      context.stroke();
    }
  } else if (phenomenon === Phenomenon.DustCloud) {
    // Three puffs slowly wheeling about the cell, each breathing on
    // its own beat, with a pair of kicked-up specks running ahead
    const turn = now / 1100;

    // Each puff is a darker roll with a lit crown offset over it, so
    // the cloud reads as dust even on ground the same colour
    for (let puff = 0; puff < 3; puff++) {
      const angle = turn + (puff * Math.PI * 2) / 3;
      const breath = 1 + Math.sin(now / 260 + puff * 2) * 0.15;
      const x = spot.x + Math.cos(angle) * size * 0.16;
      const y = spot.y + Math.sin(angle) * size * 0.1 - size * 0.06;

      context.globalAlpha = 0.75;
      context.fillStyle = '#a37f47';
      context.beginPath();
      context.ellipse(x, y, size * 0.16 * breath, size * 0.12 * breath, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#e5cd9a';
      context.beginPath();
      context.ellipse(
        x - size * 0.04,
        y - size * 0.05,
        size * 0.1 * breath,
        size * 0.07 * breath,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    for (let speck = 0; speck < 2; speck++) {
      const angle = turn * 1.8 + speck * Math.PI;

      context.globalAlpha = 0.8;
      context.fillStyle = '#9a7b45';
      context.beginPath();
      context.arc(
        spot.x + Math.cos(angle) * size * 0.3,
        spot.y + Math.sin(angle) * size * 0.18 - size * 0.1,
        Math.max(1, size * 0.035),
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

const LANDMARK_GLYPHS: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'C',
  [Landmark.Phenomenon]: '!',
  [Landmark.LegendaryLair]: 'R',
  [Landmark.ShadowLair]: 'S',
  [Landmark.BerryPatch]: 'B',
  [Landmark.Nest]: 'N',
  [Landmark.WanderingNpc]: 'P',
  [Landmark.Portal]: 'O',
};

export interface ChunkCanvasProps {
  /**
   * What the ground is made of, which is the whole of the background
   */
  biome: Biome;
  /**
   * Where this is, in a few words.
   *
   * Nothing draws it any more — it is at the top of the menu at the
   * bottom of the screen, where it costs the world nothing — but the
   * picture is still the thing being named, so it is still what a
   * screen reader is told this canvas is
   */
  caption: string;
  /**
   * The cell the player is standing on
   */
  player: number;
  landmarks: Map<number, Landmark>;
  /**
   * What each phenomenon cell is showing this hour. The kind decides
   * the picture: rings, dust or a passing shadow, drawn as the thing
   * itself rather than as a marker
   */
  phenomena: Map<number, Phenomenon>;
  /**
   * The chunk's terrain spots, drawn as the other ground: water
   * pools on a land chunk, ground banks in a wetland
   */
  spots: Set<number>;
  /**
   * An open-sea chunk's shallow patches, drawn with the ground tiles
   * to break up the deep. Empty everywhere else
   */
  shallows: Set<number>;
  /**
   * The chunk's rock outcrops, drawn with the wall tiles
   */
  rocks: Set<number>;
  /**
   * Who is standing on each wandering-NPC cell this window. A landmark
   * says somebody is there; this says who, which is what decides the
   * charset they are drawn in
   */
  wanderers: Map<number, Npc>;
  /**
   * The chunk's scenery by cell. It is drawn and nothing else: a tree
   * cannot be pressed, and standing on one does nothing
   */
  decorations: Map<number, Decoration>;
  /**
   * Which cells hold a pokemon this window, and which pokemon. It is
   * what stands there rather than only that something does: the
   * ground draws the pokemon itself
   */
  spawns: Map<number, SpawnCoat>;
  /**
   * What to call the cell when the pointer rests on it
   */
  label: (index: number) => string;
  /**
   * Which way round the camera has been walked, in radians. It is the
   * caller's so that it survives a chunk change
   */
  yaw: number;
  onTurn: (yaw: number) => void;
  /**
   * Where this chunk stands between the middle of the world and its
   * edge, from -1 to 1. It decides how high the sun gets here: the
   * day is the same length everywhere, and the light is not
   */
  latitude: number;
  /**
   * Whether the board is on its way off the screen or on to it, and
   * which way the player went. Null while they are standing in the
   * chunk that is drawn, which is nearly always
   */
  crossing: Crossing | null;
  /**
   * A cell the player has asked to be at — the chunk's own, or one of
   * the thresholds around it.
   *
   * The canvas has no idea what that costs. Where the player is, what
   * is standing in the way and how long a walk takes are the tab's, and
   * this says only which square was pressed
   */
  onPress: (cell: BoardCell) => void;
}

/**
 * The keys that move the cursor, and which way. They no longer walk
 * anybody: a walk is a press on where you want to be, and this is that
 * press for a player who is using the keyboard for it
 */
/**
 * Which way a step off the board goes, in the world's own words. North
 * is the far edge of the chunk however the camera has been walked
 * round, which is the same north the compass letters are drawn from
 */
const BEARINGS = new Map<string, string>([
  ['0,-1', 'north'],
  ['1,0', 'east'],
  ['0,1', 'south'],
  ['-1,0', 'west'],
]);

const MOVE_KEYS = new Map<string, [number, number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);

export default function ChunkCanvas(props: ChunkCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  /**
   * Bumped once per animation frame. The drawing is one effect over
   * everything that can change, so a sprite moving on is told the same
   * way a landmark appearing is: something changed, draw again
   */
  const [beat, setBeat] = createSignal(0);

  /**
   * How long the board has been on screen, in milliseconds.
   *
   * A clock of the canvas' own rather than the wall's: the sparkle a
   * shiny throws is measured against the frames that actually ran, so
   * a tab left in the background comes back with the sparkle where it
   * was rather than long over
   */
  let clock = 0;

  /**
   * Which cells have already had their shiny announced, and what was
   * standing on them when it happened.
   *
   * A shiny is the one thing on this board worth looking twice at, and
   * it is a **recolour** — some of them are a shade off the ordinary
   * coat, and a player who does not know the palette would walk past
   * one. So the first sight of it throws a handful of stars, once: the
   * species is kept beside the instant so that the next window rolling
   * a different shiny onto the same cell announces itself too
   */
  const sparkles = new Map<number, { species: Species; at: number }>();

  /**
   * One animation per species standing in the chunk, shared by every
   * cell holding that species. Two Rattata in a field are one sheet
   * and one playhead — they are scenery, and scenery need not be out
   * of step to be believed
   */
  // Keyed by the coat rather than by the species: a shiny Rattata is
  // a different sheet from the plain one standing beside it, and the
  // two have to be able to stand in the same chunk
  const sprites = new Map<string, SpeciesSpriteAnimation | null>();

  /**
   * The load behind each coat, so one that is already on its way is
   * waited on rather than asked for again
   */
  const pending = new Map<string, Promise<void>>();

  const coatKey = (coat: SpawnCoat): string => `${coat.species}:${coat.shiny ? 'shiny' : 'plain'}`;

  /**
   * Ask for a coat's sheet, and answer when it has landed one way or
   * the other. A species with no shiny drawing falls back to its
   * ordinary one inside the loader, so a missing sheet costs the
   * sparkle rather than the pokemon
   */
  const loadCoat = async (coat: SpawnCoat): Promise<void> => {
    const key = coatKey(coat);
    const already = pending.get(key);

    if (already != null) {
      return already;
    }

    // Held as null until it lands, so a coat is asked for once rather
    // than once per frame it is drawn in
    sprites.set(key, null);

    const arriving = loadSpeciesSprite(coat.species, { shiny: coat.shiny })
      .then((loaded) => {
        sprites.set(key, loaded);
      })
      .catch(() => {
        // The dot it always was
      });

    pending.set(key, arriving);
    return arriving;
  };

  /**
   * The charsets, by the folder they are in. One entry a sheet rather
   * than a cell: the people who wander are drawn from a handful of
   * charsets, and a chunk holding two of the same trade should not
   * fetch it twice
   */
  const people = new Map<string, OWCharSprite | null>();

  const arriving = new Map<string, Promise<void>>();

  const loadPerson = async (sheet: string): Promise<void> => {
    const already = arriving.get(sheet);

    if (already != null) {
      return already;
    }

    // Held as null until it lands, so a sheet is asked for once rather
    // than once per frame somebody wearing it is drawn in
    people.set(sheet, null);

    const loading = loadOWChar(sheet)
      .then((loaded) => {
        people.set(sheet, loaded);
      })
      .catch(() => {
        // The letter in a circle it always was
      });

    arriving.set(sheet, loading);
    return loading;
  };

  const personFor = (npc: Npc): OWCharSprite | null => {
    const sheet = npcSheet(npc);

    if (!people.has(sheet)) {
      loadPerson(sheet).catch(() => {
        // Already answered inside: nothing else to do with it
      });
      return null;
    }
    return people.get(sheet) ?? null;
  };

  /**
   * The person on a cell, once their sheet is in hand. A wandering
   * landmark with no charset yet is the letter in a circle it was
   * before there were any
   */
  const personOn = (index: number): OWCharSprite | null => {
    const npc = props.wanderers.get(index);

    if (npc == null || props.landmarks.get(index) !== Landmark.WanderingNpc) {
      return null;
    }

    const person = personFor(npc);

    return person?.ready === true ? person : null;
  };

  const drawnAsPerson = (index: number): boolean => personOn(index) != null;

  /**
   * The biome's own ground, once it has landed.
   *
   * Not part of the wait the pokemon are: a chunk with no tileset
   * packed yet is drawn in the flat colour it always was, so the board
   * has nothing to gain by standing still until this arrives
   */
  const [tileset, setTileset] = createSignal<BiomeTileset | null>(null);

  createEffect(() => {
    const biome = props.biome;
    let live = true;

    onCleanup(() => {
      live = false;
    });
    loadBiomeTileset(biome)
      .then((loaded) => {
        if (live) {
          setTileset(loaded);
        }
      })
      .catch(() => {
        // The flat colour it was drawn in before there were tilesets
      });
  });

  const spriteFor = (coat: SpawnCoat): SpeciesSpriteAnimation | null => {
    const key = coatKey(coat);

    if (!sprites.has(key)) {
      loadCoat(coat).catch(() => {
        // Already answered inside: nothing else to do with it
      });
      return null;
    }
    return sprites.get(key) ?? null;
  };

  /**
   * Whether the sheets for what is standing in this chunk are still
   * coming.
   *
   * The board used to draw itself the moment it had a chunk and let
   * the pokemon appear one at a time as their sheets landed, which
   * reads as a field filling up rather than as a field. It waits
   * instead: the ground is drawn, nothing is standing on it yet, and
   * the picture arrives whole.
   *
   * It is only ever the **first** wait that shows. Sheets are cached
   * across chunks, so walking into country whose pokemon have already
   * been met resolves before the next frame
   */
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    const coats = [...props.spawns.values()];
    let live = true;

    onCleanup(() => {
      live = false;
    });

    // The people waiting at a crossroads are part of the picture the
    // same way the pokemon are, so the board waits for their sheets too
    const wearing = [...new Set([...props.wanderers.values()].map((npc) => npcSheet(npc)))];

    // Nothing to wait for is not a wait: an empty chunk is finished
    if (
      coats.every((coat) => sprites.has(coatKey(coat))) &&
      wearing.every((sheet) => people.has(sheet))
    ) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      ...wearing.map(async (sheet) => loadPerson(sheet)),
      ...coats.map(async (coat) => loadCoat(coat)),
    ])
      .then(() => {
        if (live) {
          setLoading(false);
        }
      })
      .catch(() => {
        // A sheet that will not load is drawn as the dot it always
        // was; it is not a reason to hold the whole board back
        if (live) {
          setLoading(false);
        }
      });
  });
  const [hovered, setHovered] = createSignal<BoardCell | null>(null);
  /**
   * How big the canvas is on screen, in CSS pixels. The picture is
   * fitted into it, so this is what decides how large the board is
   * drawn
   */
  const [box, setBox] = createSignal({ width: WIDTH, height: WIDTH * ASPECT });
  const [focused, setFocused] = createSignal(false);
  /**
   * Which way round the board is being looked at. It is the camera's,
   * not the world's: nothing about the chunk changes when it turns,
   * and walking north is still walking north.
   *
   * It belongs to the caller rather than to this canvas. Walking
   * across a chunk boundary takes the board away and brings another
   * one back, and a camera that lives here would be facing front
   * again every time — which is the one moment a player is most
   * likely to have turned it deliberately, to see what they were
   * walking toward
   */
  const yaw = (): number => props.yaw;
  const setYaw = (turn: (angle: number) => number): void => {
    props.onTurn(turn(props.yaw));
  };
  /**
   * The drag turning it, while one is in progress. Not a signal:
   * nothing is drawn from it — the yaw it produces is what the
   * picture reads
   */
  let turning: { pointer: number; angle: number } | null = null;
  /**
   * Whether the last press actually moved the camera. A drag that
   * turned the board is not also a press on the cell it ended over,
   * and on the Mac the two arrive as the same gesture
   */
  let turned = false;
  /**
   * When the half of the crossing being drawn started. It is a plain
   * variable stamped by the effect below rather than a signal: the
   * picture is already redrawn every frame, so nothing needs telling
   * that a clock is running
   */
  let crossedAt = 0;

  createEffect(() => {
    // The caller hands in a fresh crossing for each half, so each half
    // starts its own clock. Standing still stamps nothing worth having
    const half = props.crossing?.phase;

    crossedAt = half == null ? 0 : performance.now();
  });
  /**
   * The cell the keyboard is pointing at. It follows the player until
   * it is moved, and goes back to them whenever they walk — which is
   * what a player looking at their own square expects, and it means
   * the cursor is never left behind in a chunk they have left
   */
  const [cursor, setCursor] = createSignal<BoardCell>(boardCellOf(props.player));

  createEffect(() => {
    setCursor(boardCellOf(props.player));
  });

  /**
   * Point somewhere else. The thresholds count, since leaving is
   * something a player at a keyboard has to be able to ask for too,
   * but the apron's corners do not: nothing pressed there does
   * anything
   */
  const moveCursor = ([dx, dy]: [number, number]): void => {
    setCursor((at) => {
      const next = { x: at.x + dx, y: at.y + dy };

      if (!isBoardCell(next) || (isBorderCell(next) && borderExit(next) == null)) {
        return at;
      }
      return next;
    });
  };

  /**
   * What a cell is called, for the tooltip and for a screen reader. A
   * threshold is named by where it goes rather than by what is on it,
   * because nothing is ever on one
   */
  const nameOf = (cell: BoardCell | null): string => {
    if (cell == null) {
      return '';
    }

    const exit = borderExit(cell);
    const index = chunkCellOf(cell);

    if (exit != null) {
      return `The way ${BEARINGS.get(`${exit.step[0]},${exit.step[1]}`) ?? 'on'}, into the next chunk`;
    }
    return index == null ? '' : props.label(index);
  };

  /**
   * Which cell a pointer at these page coordinates is over.
   *
   * The board is a trapezoid on a stretched canvas, so the reading
   * goes back through both: the element's own box turns the pointer
   * into a fraction of the picture, and the projection turns that
   * fraction back into the cell it was drawn from. A press near the
   * top corners lands on no cell at all now, which is honest — there
   * is no board there
   */
  const fractionAt = (event: MouseEvent): { x: number; y: number } | null => {
    const element = canvas;

    if (element == null) {
      return null;
    }

    const bounds = element.getBoundingClientRect();
    // Through the picture rather than the element. They were the same
    // thing while the canvas was the board; now the canvas is the page
    // and the picture is as much of it as the board's proportions
    // allow, so a press has to be put back through the same fitting
    // the painter drew it with
    const frame = fitPicture(bounds.width, bounds.height);

    if (frame.width === 0 || frame.height === 0) {
      return null;
    }
    return {
      x: (event.clientX - bounds.left - frame.x) / frame.width,
      y: (event.clientY - bounds.top - frame.y) / frame.height,
    };
  };

  const cellAt = (event: MouseEvent): BoardCell | null => {
    const at = fractionAt(event);
    const cell = at == null ? null : boardCellAtFraction(at.x, at.y, yaw());

    // A corner threshold goes nowhere, so the pointer does not
    // offer it
    if (cell != null && isBorderCell(cell) && borderExit(cell) == null) {
      return null;
    }
    return cell;
  };

  /**
   * Take hold of the plane, or let go of it.
   *
   * What is grabbed is a **point on the ground**, not a number of
   * pixels: the board then turns so that point stays under the
   * pointer, the way a hand on a map turns the map. Dragging along one
   * axis and multiplying by a constant is a slider with a board drawn
   * next to it — it turns whichever way the mouse went rather than
   * whichever way the player pushed the ground
   */
  const grab = (event: MouseEvent): number | null => {
    const at = fractionAt(event);

    if (at == null) {
      return null;
    }

    const ground = unprojectGround(at.x, at.y, yaw());

    return radiusOf(ground) < TURN_DEAD_ZONE ? null : angleOf(ground);
  };

  /**
   * Turn the board so the grabbed point comes back under the pointer.
   *
   * The point is held in the world's own angles, and the pointer is
   * read in the camera's; the difference between the two is the yaw,
   * by construction. It is applied as the shortest way round, so
   * dragging past due south carries on rather than snapping back
   */
  const dragTo = (event: MouseEvent, grabbed: number): void => {
    const at = fractionAt(event);

    if (at == null) {
      return;
    }

    const seen = unprojectGround(at.x, at.y, 0);

    if (radiusOf(seen) < TURN_DEAD_ZONE) {
      return;
    }
    setYaw((angle) => angle + shortestTurn(angle, angleOf(seen) - grabbed));
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');

    if (element == null || context == null) {
      return;
    }

    // How big the page is, watched rather than measured once: the
    // canvas *is* the page, so a resized window or a turned phone is a
    // different picture and a board of the wrong size in the middle of
    // it
    setBox({ width: element.clientWidth, height: element.clientHeight });

    const watching = new ResizeObserver(() => {
      setBox({ width: element.clientWidth, height: element.clientHeight });
    });

    watching.observe(element);
    onCleanup(() => {
      watching.disconnect();
    });

    /**
     * Where the picture is on this screen, and how much larger it came
     * out than the one everything here is measured against.
     *
     * Both are worked out once a frame rather than per point: the
     * canvas is the page, so they change when the window does and at
     * no other time
     */
    let placed = fitPicture(WIDTH, WIDTH * ASPECT);
    let magnify = 1;

    /**
     * A projected point in the screen's own pixels. The projection
     * answers in fractions of the picture because three different
     * sizes ask it the same question — the painter, the pointer and
     * the browser test — and this is where the picture is
     */
    const at = (point: ProjectedPoint): ProjectedPoint => ({
      x: placed.x + point.x * placed.width,
      y: placed.y + point.y * placed.height,
      scale: point.scale,
    });

    /**
     * Lay four corners out as a path, ready to be filled or stroked.
     * Nothing here is a rect: a cell is a quad, with its two far
     * corners closer together than its two near ones, and so is the
     * board
     */
    const traceQuad = (corners: ProjectedPoint[]): void => {
      context.beginPath();
      context.moveTo(corners[0].x, corners[0].y);
      for (const corner of corners.slice(1)) {
        context.lineTo(corner.x, corner.y);
      }
      context.closePath();
    };

    /**
     * A square of ground, as a path. `edge` is how far outside the
     * chunk it reaches, in board fractions: none of it for the chunk
     * itself, one cell's worth for the apron around it
     */
    const traceGround = (edge: number): void => {
      traceQuad(
        [
          { u: -edge, v: -edge },
          { u: 1 + edge, v: -edge },
          { u: 1 + edge, v: 1 + edge },
          { u: -edge, v: 1 + edge },
        ].map((corner) => at(projectGround(corner, yaw()))),
      );
    };

    /**
     * The four corners of the ring around the player, in the picture's
     * own pixels — or null while there is nowhere to draw it. It is
     * clipped to the board, so a player standing against an edge is
     * ringed by the ground that is actually there
     */
    const reachOutline = (): ProjectedPoint[] | null => {
      const column = props.player % CHUNK_CELLS;
      const row = Math.floor(props.player / CHUNK_CELLS);
      const left = Math.max(0, column - 1) / CHUNK_CELLS;
      const right = Math.min(CHUNK_CELLS, column + 2) / CHUNK_CELLS;
      const far = Math.max(0, row - 1) / CHUNK_CELLS;
      const near = Math.min(CHUNK_CELLS, row + 2) / CHUNK_CELLS;

      if (right <= left || near <= far) {
        return null;
      }
      return [
        { u: left, v: far },
        { u: right, v: far },
        { u: right, v: near },
        { u: left, v: near },
      ].map((corner) => at(projectGround(corner, yaw())));
    };

    const traceCell = (cell: BoardCell): void => {
      traceQuad(projectBoardCellQuad(cell, yaw()).map(at));
    };

    /**
     * Every square the picture is made of, worked out once: the chunk's
     * own cells and the apron's, which do not change while the player
     * is standing in this chunk
     */
    const squares = boardCells();

    /**
     * Where the board is on its way to or from, in the picture's own
     * pixels, and how much of it is left.
     *
     * The direction is the walked one put through the projection
     * rather than taken as up or across: the camera can be anywhere
     * round the board, so which way north is on the screen is
     * something only the projection knows. The ground moves **against**
     * the walk, the way scenery does — a player walking north watches
     * the field they are leaving go south
     */
    const carrying = (): { x: number; y: number; alpha: number } => {
      const step = props.crossing;

      if (step == null) {
        return { x: 0, y: 0, alpha: 1 };
      }

      const going = step.phase === 'out';
      const span = going ? CROSSING_OUT : CROSSING_IN;
      const part = Math.min(1, Math.max(0, (performance.now() - crossedAt) / span));
      // Eased at both ends, so the board leans into the move and
      // settles rather than starting and stopping at full speed
      const eased = part * part * (3 - 2 * part);
      const middle = at(projectGround({ u: 0.5, v: 0.5 }, yaw()));
      const ahead = at(projectGround({ u: 0.5 + step.dx * 0.25, v: 0.5 + step.dy * 0.25 }, yaw()));
      const away = Math.hypot(ahead.x - middle.x, ahead.y - middle.y);
      const reach = (going ? -eased : 1 - eased) * CROSSING_SLIDE * placed.width;
      // The fade lags the travel on the way out and leads it on the
      // way in, so the board is still there for most of the leaving and
      // is back before it has finished arriving. Fading in step with
      // the slide left an empty field of country in the middle of the
      // crossing, which is the flash again in a nicer colour
      const alpha = going ? 1 - eased * eased : 1 - (1 - eased) * (1 - eased);

      if (away === 0) {
        return { x: 0, y: 0, alpha };
      }
      return {
        x: ((ahead.x - middle.x) / away) * reach,
        y: ((ahead.y - middle.y) / away) * reach,
        alpha,
      };
    };

    /**
     * The hour the world is standing in, on the player's own clock.
     *
     * It is the same number the spawn pools are picked from —
     * `toLocalTime(serverNow(), …)` — so what is out there and how it
     * is lit agree. Read per frame rather than kept in a signal: it is
     * only ever asked for while a frame is being drawn, and a signal
     * ticking every second would redraw the board for the sake of a
     * light that has barely moved
     */
    const worldTime = (): number => toLocalTime(serverNow(), getLocalOffset());

    /** Where this hour's light throws a shadow, if it throws one */
    const cast = (): Cast | undefined => {
      // Turned with the board: the sun is fixed in the world, so a
      // player spinning the ground spins every shadow on it
      const thrown = getCast(worldTime(), yaw(), props.latitude);

      return thrown.length <= 0 ? undefined : thrown;
    };

    /**
     * The pokemon standing about are the only thing here that moves
     * on its own, so the chunk keeps a frame clock of its own — the
     * battle canvas can borrow the fight's, and there is no fight
     * here. It stops with the component
     */
    let last = 0;
    let frame = requestAnimationFrame(function step(now: number): void {
      frame = requestAnimationFrame(step);

      const elapsed = last === 0 ? 0 : now - last;

      last = now;
      clock += elapsed;

      for (const sprite of sprites.values()) {
        sprite?.update(elapsed);
      }
      setBeat((count) => count + 1);
    });

    onCleanup(() => {
      cancelAnimationFrame(frame);
    });

    // Everything the drawing reads is a signal or a closure over one,
    // so reading them here is what subscribes the picture to them
    createEffect(() => {
      // Read so the picture redraws with the animations, not only when
      // something about the chunk changes
      beat();

      /**
       * The screen, as it is this frame.
       *
       * The canvas is the page: it is however large the window is, and
       * the backing store is that in real pixels. Sized here rather
       * than once at the start, because a window that is resized — or
       * a phone that is turned over — is a different page
       */
      const screen = box();
      const ratio = globalThis.devicePixelRatio > 0 ? globalThis.devicePixelRatio : 1;

      if (element.width !== Math.round(screen.width * ratio)) {
        element.width = Math.round(screen.width * ratio);
      }
      if (element.height !== Math.round(screen.height * ratio)) {
        element.height = Math.round(screen.height * ratio);
      }
      // Set rather than multiplied: resizing a canvas throws its
      // transform away, so this is what puts it back — and it is the
      // only transform the drawing below assumes
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      placed = fitPicture(screen.width, screen.height);
      magnify = placed.width / WIDTH;

      // Nothing outside the board. A tilted board leaves corners of
      // the canvas that are not board, and painting them — even a
      // shade of the ground — draws a rectangle around a picture that
      // has no rectangle in it. Cleared, the page's own colour is what
      // shows through, which is this same country carrying on past the
      // edge of what the player can reach
      context.clearRect(0, 0, screen.width, screen.height);

      // Everything below is drawn where the board is rather than where
      // it lives, because while a boundary is being crossed it is on
      // its way somewhere. The clearing above is not: it is the whole
      // canvas whatever the board is doing
      const carried = carrying();

      context.save();
      context.globalAlpha = carried.alpha;
      context.translate(carried.x, carried.y);

      // The country, apron and all: the threshold cells are as much a
      // part of the world as the chunk is, and a player stepping onto
      // one is walking on the same ground
      traceGround(APRON);
      context.fillStyle = BIOME_COLORS[props.biome];
      context.fill();
      // The one thing that tells the chunk from the ground around it: a
      // surface catches a little more light than the country does. It
      // stops at the chunk's own edge, so the apron reads as the way
      // out rather than as more of the same
      traceGround(0);
      context.fillStyle = COLORS.surface;
      context.fill();

      context.textAlign = 'center';
      context.textBaseline = 'middle';

      // What the wait is, where the board is. It is drawn over the
      // ground rather than instead of it: the country is already
      // correct, and only what stands on it is late
      if (loading()) {
        const middle = at(projectGround({ u: 0.5, v: 0.5 }, yaw()));

        context.font = `bold ${Math.round(LOADING_SIZE * magnify)}px monospace`;
        context.fillStyle = COLORS.loadingHalo;
        context.fillText(LOADING_LABEL, middle.x, middle.y + 1);
        context.fillStyle = COLORS.loading;
        context.fillText(LOADING_LABEL, middle.x, middle.y);
      }

      /**
       * The ground first, all of it, and then everything standing on
       * it.
       *
       * Two passes rather than one, because a sprite is taller than
       * the cell it stands in: painted cell by cell, the row in front
       * would lay its ground over the feet of the row behind. Ground
       * is flat and cannot occlude anything, so it is finished before
       * the first pokemon is drawn
       */
      /**
       * The ground as tiles, where the biome has been packed.
       *
       * Which tile a cell gets is decided by what is around it, so the
       * terrain is read once for the whole board rather than per cell:
       * every cell asks about its eight neighbours, and half of those
       * questions are the same question asked from the other side
       */
      const water = isWaterBiome(props.biome);
      const land = boardTerrain({
        water,
        spots: props.spots,
        // A spot is a pool on land, a bank in a wetland
        spotRole: water ? 'ground' : 'water',
        shallows: props.shallows,
        rocks: props.rocks,
      });
      const tiles = tileset();
      // How far round the camera has been walked, in quarters. The
      // ground art is drawn for one point of view and can only be
      // turned in quarters, so it changes over at the halfway point
      const turns = yawTurns(yaw());

      /**
       * One cell of ground, drawn from the biome's own tileset.
       * Answers whether it drew anything, since a cell it could not
       * draw still wants the flat colour it had before
       */
      const paintGround = (square: BoardCell, corners: ProjectedPoint[]): boolean => {
        if (tiles == null) {
          return false;
        }
        const wanted = land.at(square.x, square.y);
        // A rip with no water in it still has to draw an ocean chunk,
        // and its ground is a better answer than a hole
        const role: TerrainRole = tiles.has(wanted) ? wanted : 'ground';
        // Asked per cell rather than once for the board: each terrain
        // runs on its palette's own beat, and a rip that says the
        // water moves faster than the ground means it
        const spot = tiles.tileAt(
          role,
          rotateMask(land.maskAt(square.x, square.y), turns),
          variantAt(square.x, square.y, tiles.data.variants),
          clock,
        );

        if (spot == null) {
          return false;
        }
        drawTileQuad(context, spot.sheet, spot, tiles.tile, corners, turns);

        // Deep water against a shore takes the sea rips' foam overlay
        // on top, which is what actually blends the two
        if (role === 'water') {
          const foam = tiles.shoreAt(
            rotateMask(land.maskAt(square.x, square.y), turns),
            variantAt(square.x, square.y, tiles.data.variants),
            clock,
          );

          if (foam != null) {
            drawTileQuad(context, foam.sheet, foam, tiles.tile, corners, turns);
          }
        }
        return true;
      };

      /**
       * The ground, in one pass of its own before anything is ruled
       * over it.
       *
       * Over a wider square than the board is: the four corners of the
       * apron are not cells and are never pressed, but a wall drawn
       * round the chunk with its corners left out is a frame with four
       * holes in it
       */
      if (tiles != null) {
        // Off for the pass: these are pixel tiles, and smoothed up to
        // the size of a cell they lose the edges they are drawn with
        context.save();
        context.imageSmoothingEnabled = false;
        for (let y = -BORDER_CELLS; y < CHUNK_CELLS + BORDER_CELLS; y++) {
          for (let x = -BORDER_CELLS; x < CHUNK_CELLS + BORDER_CELLS; x++) {
            paintGround({ x, y }, projectBoardCellQuad({ x, y }, yaw()).map(at));
          }
        }
        context.restore();
      }

      for (const square of squares) {
        traceCell(square);

        // The apron keeps the tiles' own look: the grid stopping is
        // what says where the chunk ends, so no shade or rule is
        // drawn out there
        if (isBorderCell(square)) {
          continue;
        }
        context.strokeStyle = COLORS.grid;
        context.stroke();

        const index = square.y * CHUNK_CELLS + square.x;
        const decoration = props.decorations.get(index);

        // Scenery goes down with the ground, under everything else:
        // it is what the chunk is made of rather than something
        // standing on it
        if (decoration != null) {
          drawDecoration(context, at(projectCell(index, yaw())), decoration, magnify);
        }

        const landmark = props.landmarks.get(index);

        // Somebody standing there is drawn with the rest of what
        // stands, in paint order — so a mark on the ground under their
        // feet as well would be the cell saying the same thing twice
        if (landmark != null && !drawnAsPerson(index)) {
          const middle = at(projectCell(index, yaw()));
          const showing = landmark === Landmark.Phenomenon ? props.phenomena.get(index) : undefined;

          // A phenomenon is drawn as the thing going on there; the
          // grotto hides, so it keeps the plain mark like the rest
          if (showing != null && showing !== Phenomenon.HiddenGrotto) {
            drawPhenomenon(context, middle, showing, clock, magnify);
          } else {
            context.fillStyle = COLORS.landmark;
            context.beginPath();
            context.arc(middle.x, middle.y, CELL * 0.36 * middle.scale * magnify, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = COLORS.glyph;
            context.font = `bold ${Math.round(CELL * 0.6 * middle.scale * magnify)}px monospace`;
            context.fillText(LANDMARK_GLYPHS[landmark], middle.x, middle.y + 1);
          }
        }
      }

      /**
       * What the player can put a hand on: the square they are
       * standing in and the eight around it, drawn as **one ring**
       * rather than as nine outlined cells.
       *
       * Shading each of the nine drew a block of bright squares in the
       * middle of the board — a thing on the ground rather than a
       * measure of how far the player can lean, and it buried whatever
       * was standing inside it. One line round the outside says the
       * same and leaves the ground under it alone.
       *
       * The line is straight between the corners because the
       * projection is perspective: it maps straight lines to straight
       * lines, so four corners are the whole of a rectangle however
       * the board is turned
       */
      const reach = reachOutline();

      if (reach != null) {
        context.beginPath();
        context.moveTo(reach[0].x, reach[0].y);
        for (const corner of reach.slice(1)) {
          context.lineTo(corner.x, corner.y);
        }
        context.closePath();
        context.strokeStyle = COLORS.highlight;
        context.lineWidth = 2;
        context.stroke();
        context.lineWidth = 1;
      }

      /**
       * And then whatever is standing on it, from the back of the
       * board forwards — which is the order the cells are numbered in,
       * so a pokemon in front is drawn over the one behind it rather
       * than through it
       */
      for (const index of paintOrder(yaw())) {
        const middle = at(projectCell(index, yaw()));
        // Nothing standing anywhere while the sheets are still coming:
        // a field that fills in one pokemon at a time reads as a page
        // loading rather than as a place
        const standing = loading() ? undefined : props.spawns.get(index);

        // Whatever was announced here has been caught, walked off or
        // rolled over, so the next shiny to stand on this cell gets a
        // sparkle of its own
        if (standing?.shiny !== true) {
          sparkles.delete(index);
        }

        const person = loading() ? null : personOn(index);

        if (person != null) {
          // Looking at the player, seen from wherever the camera has
          // been walked to: somebody waiting at a crossroads watches
          // whoever is coming up to it
          person.facing =
            SPRITE_DIRECTIONS[
              facingFrom(
                SPRITE_DIRECTIONS.indexOf(
                  facingToward(
                    index % CHUNK_CELLS,
                    Math.floor(index / CHUNK_CELLS),
                    props.player % CHUNK_CELLS,
                    Math.floor(props.player / CHUNK_CELLS),
                  ),
                ),
                yaw(),
              )
            ];
          person.draw(context, middle.x, middle.y, {
            scale: (CELL * NPC_CELLS * middle.scale * magnify) / person.sourceFrameHeight,
            // Feet on the cell, and the patch under them drawn by the
            // sheet: a charset has no shadow marker to measure, so the
            // bottom middle of the cell is where the ground is
            anchor: 'foot',
            shadow: true,
          });
        }

        if (standing != null) {
          const sprite = spriteFor(standing);

          if (sprite?.ready === true) {
            // Facing the way it is standing in the world, seen from
            // wherever the camera has been walked to: turn a quarter
            // and something that was facing you is facing across you
            sprite.play(SpriteAnim.Idle, {
              direction: SPRITE_DIRECTIONS[facingFrom(facingOf(index, standing.species), yaw())],
              loop: true,
            });

            const scale =
              SPRITE_SCALE * (SIZE_TIERS[sprite.shadowSize] ?? 1) * middle.scale * magnify;
            // The sheet's own shadow marker is the point that stands on
            // the ground, so putting it on the middle of the cell is
            // the whole of standing a pokemon there — whatever is drawn
            // above it and however much empty frame is under its feet.
            //
            // What is drawn on that spot ties the billboard to the
            // cell. A sprite is a couple of cells tall and stands over
            // the rows behind it, so the eye reads it as belonging to
            // whichever row its *body* covers rather than to the one
            // its feet are on — and no amount of moving it up or down
            // fixes that, because the feet were already in the right
            // place. A patch of ground shading beneath says which cell
            // it is standing on, squashed the way this board squashes
            // everything lying on the ground, and sized by the sheet:
            // the description carries a shadow size per pokemon
            const placement = { scale, anchor: 'shadow' } as const;

            sprite.drawShadow(context, middle.x, middle.y, {
              ...placement,
              color: COLORS.shadow,
              squash: GROUND_SQUASH,
              // Thrown by whatever light there is at this hour: long
              // and faint near the horizons, short and hard at noon,
              // and nothing at all once the sun is down
              cast: cast(),
            });
            // Upright, and at its own size: the ground is tilted and
            // the pokemon on it are not, which is what a billboard is
            // and what makes them look like they are standing up out
            // of the board
            sprite.draw(context, middle.x, middle.y, placement);

            if (standing.shiny) {
              // Announced the first time it is actually drawn rather
              // than the first time it is known about: a sparkle
              // thrown while the sheet was still coming would be over
              // before there was anything to sparkle around
              const shown = sparkles.get(index);

              if (shown == null || shown.species !== standing.species) {
                sparkles.set(index, { species: standing.species, at: clock });
              }
              drawSparkle(
                context,
                index,
                clock - (sparkles.get(index)?.at ?? clock),
                middle.x,
                middle.y,
                sprite.sourceFrameSize,
                scale,
              );
            }
          } else {
            context.fillStyle = COLORS.spawn;
            context.beginPath();
            context.arc(middle.x, middle.y, CELL * 0.18 * middle.scale * magnify, 0, Math.PI * 2);
            context.fill();
          }
        }

        if (index === props.player) {
          context.fillStyle = COLORS.player;
          context.beginPath();
          context.arc(middle.x, middle.y, CELL * 0.3 * middle.scale * magnify, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = COLORS.glyph;
          context.stroke();
        }
      }

      // Over everything, and only while the keyboard is in here: what
      // Enter would walk to. It is drawn last rather than in its own
      // row, because it is a mark on the picture rather than a thing
      // standing on the board — and the apron is as pressable as the
      // chunk, so it has to be able to appear out there
      if (focused()) {
        traceCell(cursor());
        context.strokeStyle = COLORS.cursor;
        context.lineWidth = 3;
        context.stroke();
        context.lineWidth = 1;
      }

      // A border while the keyboard is in here. It is not decoration:
      // the cursor keys only work while this has focus, so whether it
      // does is the difference between the arrows pointing at
      // something and doing nothing at all. It follows the board's own
      // outline — the apron included, since that is as pressable as
      // the rest — which is a trapezoid rather than the canvas
      traceGround(APRON);
      context.strokeStyle = focused() ? COLORS.cursor : COLORS.grid;
      context.lineWidth = focused() ? 3 : 1;
      context.stroke();
      context.lineWidth = 1;

      // The board is finished, so it is put back where it was found:
      // what is drawn from here is the player's own instruments, and
      // they are not the thing being carried off
      context.restore();

      // The hour's own light, over everything standing in the world
      // and under everything the player reads: a compass tinted by the
      // evening is a compass that is harder to read at night for
      // nothing
      paintAmbient(context, screen.width, screen.height, worldTime(), props.latitude);

      /**
       * And the compass: four letters standing off the four edges of
       * the board, on the ground rather than in a corner of the canvas.
       *
       * A dial in the corner was a second picture to read — a needle to
       * compare against a board, when the thing a player actually wants
       * to know is which edge of *this board* is north. Put the letters
       * where the edges are and there is nothing to compare: the letter
       * is beside the edge it names, and walking the camera round
       * carries them with it.
       *
       * They are drawn upright and at one size however far round they
       * have gone. A compass is read by the player, and a letter laid
       * into the ground would be scenery
       */
      context.font = `bold ${Math.round(COMPASS_SIZE * magnify)}px monospace`;
      context.lineJoin = 'round';
      for (const mark of compassMarks(yaw())) {
        const spot = at(mark);

        context.lineWidth = COMPASS_HALO * magnify;
        context.strokeStyle = COLORS.compassHalo;
        context.strokeText(mark.label, spot.x, spot.y);
        context.fillStyle = COLORS.compass;
        context.fillText(mark.label, spot.x, spot.y);
      }
      context.lineWidth = 1;

      // Nothing else is written on the board. The chunk used to caption
      // itself in a corner of the picture, which cost four cells of
      // the world to say something that never changes while the
      // player is standing in it — it is inside the menu now, where
      // the rest of the game's furniture is
    });

    // The overworld is what the tab is for, so it takes the keyboard
    // when it opens rather than waiting to be clicked
    element.focus({ preventScroll: true });
  });

  return (
    <canvas
      ref={canvas}
      // Focusable, so the chunk is still reachable by keyboard now
      // that its cells are paint rather than 256 buttons: tab to it,
      // point with the arrows, and walk there with Enter
      tabindex={0}
      role="application"
      // The caption is painted, so it is said here as well: it is the
      // only place the chunk names itself now
      aria-label={`Chunk map. ${props.caption}. ${
        nameOf(cursor()) || 'Empty ground'
      } under the cursor.`}
      // A canvas has no per-cell elements to hang a tooltip on, so the
      // one tooltip it has says whatever the pointer is over
      title={nameOf(hovered())}
      // The chunk is the page, so it takes the page — all of it. The
      // element is the whole window, and the picture is fitted inside
      // it: as large as the board's own proportions allow, with a
      // little kept back at the edges. A board fitted to the last
      // pixel loses its far corner the moment the camera is walked
      // round, since a square is widest corner-on.
      //
      // Nothing outside the picture is painted, so the country behind
      // shows through — and a press is put back through the same
      // fitting the painter drew with, so what is under the pointer is
      // what gets pressed.
      //
      // Every square is worth pressing now — the far ones are walked
      // to rather than out of reach — so the pointer says so over all
      // of them, and says nothing over the ground beside the board
      class={`absolute inset-0 block h-full w-full focus-visible:outline-none ${
        hovered() == null ? 'cursor-default' : 'cursor-pointer'
      }`}
      // The right button walks the camera round the board rather than
      // opening the browser's own menu over it
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onPointerDown={(event) => {
        if (!isTurningPress(event)) {
          return;
        }
        event.preventDefault();

        const grabbed = grab(event);

        if (grabbed == null) {
          return;
        }
        // Captured, so a drag that leaves the canvas keeps turning it
        // rather than stopping at the edge
        event.currentTarget.setPointerCapture(event.pointerId);
        turning = { pointer: event.pointerId, angle: grabbed };
      }}
      onPointerMove={(event) => {
        const drag = turning;

        if (drag?.pointer === event.pointerId) {
          turned = true;
          dragTo(event, drag.angle);
          // Whatever the pointer was over has moved out from under it
          setHovered(null);
          return;
        }
        setHovered(cellAt(event));
      }}
      onPointerUp={(event) => {
        if (turning?.pointer === event.pointerId) {
          event.currentTarget.releasePointerCapture(event.pointerId);
          turning = null;
        }
      }}
      onPointerCancel={() => {
        turning = null;
      }}
      onMouseLeave={() => {
        setHovered(null);
      }}
      onFocus={() => {
        setFocused(true);
      }}
      onBlur={() => {
        setFocused(false);
      }}
      onKeyDown={(event) => {
        const step = MOVE_KEYS.get(event.key.length === 1 ? event.key.toLowerCase() : event.key);

        if (step != null) {
          event.preventDefault();
          // They point rather than walk. Nothing walks a cell at a
          // time any more: a press says where to be and the walk is
          // worked out, so the arrows are how a keyboard says where
          moveCursor(step);
          return;
        }
        // The same walk round the board, for a keyboard — and for
        // anyone whose pointer can do neither gesture. An eighth of a
        // turn a press, which is one sprite facing
        if (event.key === 'q' || event.key === 'e') {
          event.preventDefault();
          setYaw((angle) => angle + (event.key === 'q' ? -QUARTER_TURN : QUARTER_TURN) / 2);
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();

          if (!loading()) {
            props.onPress(cursor());
          }
        }
      }}
      onClick={(event) => {
        // A control-click is how the Mac turns the board, and unlike a
        // right-click it still comes back round as an ordinary click.
        // Left alone it would press whichever cell the drag finished
        // over — so the board turns, and then the player walks off
        // across it
        if (isTurningPress(event) || turned) {
          turned = false;
          return;
        }
        // And nothing at all while the board is being carried on or
        // off — it is not where it is drawn, so a press would land on
        // whichever cell slid under the pointer — nor while the
        // pokemon standing on it have yet to arrive, since a player
        // cannot see what they would be walking into
        if (props.crossing != null || loading()) {
          return;
        }

        const cell = cellAt(event);

        if (cell != null) {
          setCursor(cell);
          props.onPress(cell);
        }
      }}
    />
  );
}
