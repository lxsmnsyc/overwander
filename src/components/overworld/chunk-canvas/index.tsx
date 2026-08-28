import { type JSX, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import {
  ASPECT,
  BORDER_CELLS,
  type BoardCell,
  type ProjectedPoint,
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
} from '../../../canvas/board';
import type SpeciesSpriteAnimation from '../../../canvas/species-sprite-animation';
import { SPRITE_DIRECTIONS, type SpriteDirection } from '../../../canvas/sprite-sheet';
import drawSparkle from '../../../canvas/sparkle';
import { type Cast, getCast, paintAmbient } from '../../../canvas/daylight';
import { getLocalOffset, toLocalTime } from '../../../auth/local-time';
import { serverNow } from '../../../auth/clock';
import loadSpeciesSprite from '../../../canvas/species-sprites';
import type BiomeTileset from '../../../canvas/biome-tileset';
import { variantAt } from '../../../canvas/biome-tileset';
import loadBiomeTileset from '../../../canvas/biome-tilesets';
import drawTileQuad from '../../../canvas/tile-quad';
import { BIOME_COLORS } from '../../../data/biome';
import type Biome from '../../../data/ids/biome';
import { isWaterBiome } from '../../../data/ids/biome';
import type { TerrainRole } from '../../../data/overworld/terrain';
import boardTerrain from '../../../overworld/terrain';
import { rotateMask } from '../../../data/overworld/autotile';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import type Decoration from '../../../data/overworld/decoration';
import Landmark from '../../../data/overworld/landmark';
import Phenomenon from '../../../data/overworld/phenomenon';
import Npc, { npcSheet } from '../../../data/overworld/npc';
import type { Species } from '../../../data/ids/species';
import { getSpeciesData } from '../../../data/species';
import facingToward from '../../../canvas/facing';
import type OWCharSprite from '../../../canvas/ow-char-sprite';
import loadOWChar, { OW_SPRITE_ROOT } from '../../../canvas/ow-char-sprites';
import type OWPlantSprite from '../../../canvas/ow-plant-sprite';
import loadOWPlant from '../../../canvas/ow-plant-sprites';
import berryPlantSheet from '../../../data/overworld/berry-plant';
import decorationPicture, { grottoPicture } from '../../../data/overworld/decoration-sprite';
import landmarkPicture, { LANDMARK_SHEET } from '../../../data/overworld/landmark-sprite';
import type BasicSprite from '../../../canvas/basic-sprite';
import loadBasicSprite from '../../../canvas/basic-sprites';
import type { ItemStack } from '../../../data/overworld/item-pool';
import { CHUNK_CELLS } from '../../../overworld/chunk';
import {
  APRON,
  BEARINGS,
  CELL,
  CELL_STRIDE,
  COLORS,
  COMPASS_HALO,
  COMPASS_SIZE,
  CROSSING_IN,
  CROSSING_OUT,
  CROSSING_SLIDE,
  type Crossing,
  GROUND_SQUASH,
  LOADING_LABEL,
  LOADING_SIZE,
  MOVE_KEYS,
  NPC_CELLS,
  PICKED_STAGE,
  PLANT_CELLS,
  PLANT_PHASES,
  PLAYER_SHEET,
  QUARTER_TURN,
  SCENERY_CELLS,
  SNAP_CELLS,
  SPRITE_STANDS,
  TURN_DEAD_ZONE,
  WIDTH,
  isTurningPress,
  sizeOf,
  slideGain,
} from './metrics';
import {
  LANDMARK_GLYPHS,
  type SpawnCoat,
  drawDecoration,
  drawLandmarkMark,
  drawPhenomenon,
  facingOf,
} from './scenery';

export { CROSSING_IN, CROSSING_OUT, type Crossing, type SpawnCoat, isTurningPress, slideGain };

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
  /**
   * The charset the player is drawn in, under `sprites/overworld`.
   * Left out, the default red-trainer sheet
   */
  charset?: string;
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
   * The style each wanderer turned up in this window, by cell. A cell
   * with no coat falls back to the role's first style
   */
  coats: Map<number, string>;
  /**
   * What each patch is bearing this window, by cell. A landmark says a
   * patch is there; this says what is on the bush, which is what
   * decides the plant that is drawn
   */
  berries: Map<number, ItemStack>;
  /**
   * The patches this player has already stripped this window. They keep
   * their plant and lose their fruit: the bare stage is on the same
   * sheet, and a bush drawn in fruit that answers nothing is the board
   * lying about the cell
   */
  picked: Set<number>;
  /**
   * The caches this player has already dug up this window. They are
   * still there and still drawn: an empty one open on the ground says
   * what a cell that would answer nothing looks like
   */
  dug: Set<number>;
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

  /**
   * The berry plants, by the folder they are in. Shared rather than
   * cloned: a plant's frame is a function of the clock it is drawn
   * with, so one sheet serves every patch bearing that berry
   */
  const plants = new Map<string, OWPlantSprite | null>();

  /**
   * The scenery atlases, by the folder they are in. Both are stills, so
   * one copy serves every cell that draws off them
   */
  const scenery = new Map<string, BasicSprite | null>();

  /**
   * When a sheet last failed to come, so a miss is retried after a
   * pause rather than either refetched every frame or given up on for
   * the life of the board — a charset the processor is writing this
   * minute is missing now and there in a moment
   */
  const missedAt = new Map<string, number>();

  const RETRY_PACE = 5000;

  const loadPerson = async (sheet: string): Promise<void> => {
    const already = arriving.get(sheet);

    if (already != null) {
      return already;
    }

    const missed = missedAt.get(sheet);

    if (missed != null && performance.now() - missed < RETRY_PACE) {
      return;
    }

    // Held as null until it lands, so a sheet is asked for once rather
    // than once per frame somebody wearing it is drawn in
    people.set(sheet, null);

    const loading = loadOWChar(sheet)
      .then((loaded) => {
        if (loaded == null) {
          // Forgotten rather than kept: the next ask past the pause
          // fetches again
          missedAt.set(sheet, performance.now());
          people.delete(sheet);
          arriving.delete(sheet);
        } else {
          people.set(sheet, loaded);
          missedAt.delete(sheet);
        }
      })
      .catch(() => {
        // The letter in a circle it always was
      });

    arriving.set(sheet, loading);
    return loading;
  };

  const personFor = (sheet: string): OWCharSprite | null => {
    if (!people.has(sheet)) {
      loadPerson(sheet).catch(() => {
        // Already answered inside: nothing else to do with it
      });
      return null;
    }
    return people.get(sheet) ?? null;
  };

  /**
   * The person on a cell, once their sheet is in hand: a wanderer, or
   * whoever stands at one of the fighting landmarks. A cell with no
   * charset yet is the letter in a circle it was before there were any
   */
  const personOn = (index: number): OWCharSprite | null => {
    const landmark = props.landmarks.get(index);
    let fallback: Npc | null = null;

    if (landmark === Landmark.WanderingNpc) {
      fallback = props.wanderers.get(index) ?? null;
    } else if (landmark === Landmark.Market) {
      fallback = Npc.Vendor;
    } else if (landmark === Landmark.TeamRocket) {
      fallback = Npc.RocketGrunt;
    } else if (
      landmark === Landmark.Trainer ||
      landmark === Landmark.GymLeader ||
      landmark === Landmark.EliteFour ||
      landmark === Landmark.Champion
    ) {
      // The experts wear their own coats from the snapshot; the plain
      // trainer's sheet only stands in while a coat is missing
      fallback = Npc.Trainer;
    }
    if (fallback == null) {
      return null;
    }

    const person = personFor(props.coats.get(index) ?? npcSheet(fallback));

    return person?.ready === true ? person : null;
  };

  const drawnAsPerson = (index: number): boolean => personOn(index) != null;

  const loadPlant = async (sheet: string): Promise<void> => {
    const already = arriving.get(sheet);

    if (already != null) {
      return already;
    }

    const missed = missedAt.get(sheet);

    if (missed != null && performance.now() - missed < RETRY_PACE) {
      return;
    }

    plants.set(sheet, null);

    const loading = loadOWPlant(sheet)
      .then((loaded) => {
        if (loaded == null) {
          missedAt.set(sheet, performance.now());
          plants.delete(sheet);
          arriving.delete(sheet);
        } else {
          plants.set(sheet, loaded);
          missedAt.delete(sheet);
        }
      })
      .catch(() => {
        // The letter in a circle it always was
      });

    arriving.set(sheet, loading);
    return loading;
  };

  /**
   * The plant growing on a cell, once its sheet is in hand. A patch
   * whose berry has no drawing yet is the letter in a circle it was
   * before there were any
   */
  const plantOn = (index: number): OWPlantSprite | null => {
    const bearing = props.berries.get(index);

    if (bearing == null || props.landmarks.get(index) !== Landmark.BerryPatch) {
      return null;
    }

    const sheet = berryPlantSheet(bearing.item);

    if (!plants.has(sheet)) {
      loadPlant(sheet).catch(() => {
        // Already answered inside: nothing else to do with it
      });
      return null;
    }

    const plant = plants.get(sheet) ?? null;

    return plant?.ready === true ? plant : null;
  };

  const loadScenery = async (sheet: string): Promise<void> => {
    const already = arriving.get(sheet);

    if (already != null) {
      return already;
    }

    const missed = missedAt.get(sheet);

    if (missed != null && performance.now() - missed < RETRY_PACE) {
      return;
    }

    scenery.set(sheet, null);

    const loading = loadBasicSprite(`${OW_SPRITE_ROOT}/${sheet}`)
      .then((loaded) => {
        if (loaded == null) {
          missedAt.set(sheet, performance.now());
          scenery.delete(sheet);
          arriving.delete(sheet);
        } else {
          scenery.set(sheet, loaded);
          missedAt.delete(sheet);
        }
      })
      .catch(() => {
        // The cone and the mound it always was
      });

    arriving.set(sheet, loading);
    return loading;
  };

  /**
   * The picture a piece of scenery is drawn as, once its atlas is in
   * hand. A kind whose sheet has not landed is the shape it was before
   * there were any
   */
  const sceneryOn = (index: number): { sheet: BasicSprite; name: string } | null => {
    const kind = props.decorations.get(index);

    if (kind == null) {
      return null;
    }

    const picture = decorationPicture(kind, props.biome, index);

    if (!scenery.has(picture.sheet)) {
      loadScenery(picture.sheet).catch(() => {
        // Already answered inside: nothing else to do with it
      });
      return null;
    }

    const sheet = scenery.get(picture.sheet) ?? null;

    return sheet?.ready === true ? { sheet, name: picture.name } : null;
  };

  /**
   * Stand one picture from an atlas on a cell.
   *
   * Everything that stands on the board and is not alive comes through
   * here: a tree, a rock, a cave mouth. The sheet says where the piece
   * meets the ground and how much ground it covers, and this is what
   * puts those two answers on a tile
   */
  const standPiece = (
    context: CanvasRenderingContext2D,
    piece: { sheet: BasicSprite; name: string } | null,
    middle: { x: number; y: number; scale: number },
    magnify: number,
  ): void => {
    const cell = piece?.sheet.frameOf(piece.name);

    if (piece == null || cell == null) {
      return;
    }

    // A sheet that says how much ground its pieces cover is drawn so
    // that much of it is one square: a tree comes out the size of the
    // tree rather than the size of the square the packing needed for
    // the tallest one on the sheet. Anything that does not say is
    // sized off its own cell
    const stands = piece.sheet.data.stands;
    const scale =
      stands == null
        ? (CELL * SCENERY_CELLS * middle.scale * magnify) / cell.sourceHeight
        : (CELL * middle.scale * magnify) / stands;
    // The atlas is pixel art and BasicSprite draws for the interface,
    // where nothing is scaled up far enough to care
    const smoothing = context.imageSmoothingEnabled;

    context.imageSmoothingEnabled = false;
    // Where the piece meets the ground, which the sheet worked out
    // when it was cut: the middle of the patch it stands on, never the
    // shadow the rip lays under it. Standing the cell's floor on the
    // tile instead puts the shadow on the tile and the piece a row
    // behind it
    const base = cell.base ?? [cell.sourceWidth / 2, cell.sourceHeight];

    piece.sheet.draw(context, piece.name, middle.x - base[0] * scale, middle.y - base[1] * scale, {
      scale,
      anchor: 'top-left',
    });
    context.imageSmoothingEnabled = smoothing;
  };

  /**
   * The tree a hidden grotto is hiding under, once the tree sheet has
   * landed. It is drawn as scenery and nothing else: what makes a
   * grotto hidden is that it looks like a tree
   */
  const grottoOn = (index: number): { sheet: BasicSprite; name: string } | null => {
    if (props.phenomena.get(index) !== Phenomenon.HiddenGrotto) {
      return null;
    }

    const picture = grottoPicture(props.biome, index);

    if (!scenery.has(picture.sheet)) {
      loadScenery(picture.sheet).catch(() => {
        // Already answered inside: nothing else to do with it
      });
      return null;
    }

    const sheet = scenery.get(picture.sheet) ?? null;

    return sheet?.ready === true ? { sheet, name: picture.name } : null;
  };

  /**
   * The picture a landmark is drawn as, once its sheet is in hand.
   *
   * Null for the landmarks somebody is standing on and for the berry
   * patches, which grow their own bush: both are drawn already, and a
   * mark under them would be the cell saying the same thing twice
   */
  const landmarkOn = (index: number): { sheet: BasicSprite; name: string } | null => {
    const kind = props.landmarks.get(index);

    if (kind == null || drawnAsPerson(index)) {
      return null;
    }

    const name = landmarkPicture(kind, props.biome, props.dug.has(index), index);

    if (name == null) {
      return null;
    }
    if (!scenery.has(LANDMARK_SHEET)) {
      loadScenery(LANDMARK_SHEET).catch(() => {
        // Already answered inside: nothing else to do with it
      });
      return null;
    }

    const sheet = scenery.get(LANDMARK_SHEET) ?? null;

    return sheet?.ready === true ? { sheet, name } : null;
  };

  /**
   * The player's own walker, and the copy is the point.
   *
   * The charsets are cached one to a sheet, so everybody wearing a
   * sheet was drawn from a single sprite — and a sprite carries the
   * playhead. The player is the only one who walks, so every NPC in
   * that charset was drawn at whatever frame of the player's stride
   * the last step left behind: the Champion wears Red's sheet, and so
   * does the player, so the two moved as one. A clone shares the
   * picture and the grid and keeps a playhead of its own
   */
  let mine: OWCharSprite | null = null;
  let mineSheet: string | null = null;

  const playerPerson = (): OWCharSprite | null => {
    const sheet = props.charset ?? PLAYER_SHEET;
    const shared = personFor(sheet);

    if (shared?.ready !== true) {
      return null;
    }
    if (mine == null || mineSheet !== sheet) {
      mine = shared.clone();
      mineSheet = sheet;
    }
    return mine;
  };

  /**
   * Where the player is drawn, in board-cell coordinates. It chases
   * `props.player` at walking pace, catching up if it has fallen
   * behind, which is what turns a step into a slide; a jump too far to
   * be a step snaps instead
   */
  const slide = { x: props.player % CHUNK_CELLS, y: Math.floor(props.player / CHUNK_CELLS) };

  /** The way the player last walked, which is the way they stand. */
  let heading: SpriteDirection = 'Down';

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

    // The people standing in the chunk are part of the picture the
    // same way the pokemon are, so the board waits for their sheets
    // too. The coats carry everyone — wanderers and the fighting
    // landmarks alike
    const wearing = [
      ...new Set([
        ...props.coats.values(),
        ...[...props.wanderers.values()].map((npc) => npcSheet(npc)),
      ]),
    ];

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

      // The player's slide toward wherever the tab says they are, and
      // the walk cycle fed by how far it actually moved this frame
      const walker = playerPerson();
      const goalX = props.player % CHUNK_CELLS;
      const goalY = Math.floor(props.player / CHUNK_CELLS);
      const dx = goalX - slide.x;
      const dy = goalY - slide.y;
      const span = Math.hypot(dx, dy);

      if (span > SNAP_CELLS) {
        slide.x = goalX;
        slide.y = goalY;
        walker?.stop();
      } else if (span > 0) {
        const gain = slideGain(span, elapsed);

        heading = facingToward(slide.x, slide.y, goalX, goalY);
        slide.x += (dx / span) * gain;
        slide.y += (dy / span) * gain;
        walker?.advanceBy(gain * CELL_STRIDE);
      } else {
        walker?.stop();
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

        // A threshold that goes through keeps the grid, so it reads
        // as ground that can be walked, and breathes a little light
        // on top so the way into the next chunk reads as somewhere
        // to press. The apron's corners go nowhere and get neither:
        // the grid stopping is what says where the walkable ends
        if (isBorderCell(square)) {
          if (borderExit(square) != null) {
            const prior = context.globalAlpha;

            context.globalAlpha = prior * (0.1 + 0.05 * Math.sin(clock / 600));
            context.fillStyle = COLORS.highlight;
            context.fill();
            context.globalAlpha = prior;
            context.strokeStyle = COLORS.grid;
            context.stroke();
          }
          continue;
        }
        context.strokeStyle = COLORS.grid;
        context.stroke();

        const index = square.y * CHUNK_CELLS + square.x;
        const decoration = props.decorations.get(index);

        // A shape only while the atlas is still coming. Drawn scenery
        // is a tree rather than a cone, so it stands with everything
        // else that stands rather than lying under it
        if (decoration != null && sceneryOn(index) == null) {
          drawDecoration(context, at(projectCell(index, yaw())), decoration, magnify);
        }

        const landmark = props.landmarks.get(index);
        // What is going on here, which is no longer a landmark: it is
        // rolled over the chunk by the hour and drawn wherever it fell
        const showing = props.phenomena.get(index);

        // Somebody standing there is drawn with the rest of what
        // stands, in paint order — so a mark on the ground under their
        // feet as well would be the cell saying the same thing twice
        if (drawnAsPerson(index) || plantOn(index) != null) {
          continue;
        }
        if (showing != null) {
          // The grotto is a tree with a hollow in it, so it stands with
          // the scenery rather than lying on the ground with the marks;
          // everything else that is going on is drawn here
          if (showing !== Phenomenon.HiddenGrotto) {
            drawPhenomenon(context, at(projectCell(index, yaw())), showing, clock, magnify);
          }
          continue;
        }
        // A landmark drawn as itself stands with everything else that
        // stands, so a letter on the ground under it would be the cell
        // saying the same thing twice
        if (landmark != null && landmarkOn(index) == null) {
          drawLandmarkMark(
            context,
            at(projectCell(index, yaw())),
            LANDMARK_GLYPHS[landmark],
            magnify,
          );
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
      // The sliding player belongs to the row they are passing
      // through, so occlusion is read off where they are drawn rather
      // than where the walk is headed
      const playerCell = Math.round(slide.y) * CHUNK_CELLS + Math.round(slide.x);

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

        // Scenery first of everything that stands on a cell: a tree is
        // the backdrop a pokemon is standing in front of, and a lair
        // is the backdrop the whole cell is about
        if (!loading()) {
          standPiece(context, sceneryOn(index), middle, magnify);
          standPiece(context, grottoOn(index), middle, magnify);
          standPiece(context, landmarkOn(index), middle, magnify);
        }

        // A bush is drawn before whatever is standing beside it: it is
        // scenery with a berry on it, and a pokemon in front of it
        // should read as being in front of it
        const plant = loading() ? null : plantOn(index);

        if (plant != null) {
          plant.draw(context, middle.x, middle.y, {
            scale: (CELL * PLANT_CELLS * middle.scale * magnify) / plant.sourceFrameHeight,
            // A patch in fruit is the bottom row of the sheet, and one
            // this player has stripped is the top: the same bush
            // without its berries
            stage: props.picked.has(index) ? PICKED_STAGE : plant.ripe,
            at: clock,
            // Out of step with its neighbours, so a chunk with four
            // patches on it is four bushes rather than one drawn four
            // times
            phase: (index % PLANT_PHASES) / PLANT_PHASES,
            // The soil the plant grows out of, which the sheet says
            // where to find
            anchor: 'foot',
          });
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
          // Feet on the cell, and the patch under them drawn first:
          // a charset has no shadow marker to measure, so the bottom
          // middle of the cell is where the ground is
          const standingPerson = {
            scale: (CELL * NPC_CELLS * middle.scale * magnify) / person.sourceFrameHeight,
            anchor: 'foot',
          } as const;

          person.drawShadow(context, middle.x, middle.y, {
            ...standingPerson,
            color: COLORS.shadow,
            // Lying the way the board lies, and thrown the way this
            // hour's light throws every other shadow on it
            squash: GROUND_SQUASH,
            cast: cast(),
          });
          person.draw(context, middle.x, middle.y, standingPerson);
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

            // Sized the way the scenery is: so many source pixels of
            // the sheet stand on one cell, with the dex height saying
            // how far this one is off ordinary
            const scale =
              (CELL * sizeOf(getSpeciesData(standing.species).height) * middle.scale * magnify) /
              SPRITE_STANDS;
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

        if (index === playerCell) {
          const walker = playerPerson();
          const spot = at(
            projectGround(
              { u: (slide.x + 0.5) / CHUNK_CELLS, v: (slide.y + 0.5) / CHUNK_CELLS },
              yaw(),
            ),
          );

          if (walker == null) {
            // The dot it was before the sheet landed
            context.fillStyle = COLORS.player;
            context.beginPath();
            context.arc(spot.x, spot.y, CELL * 0.3 * spot.scale * magnify, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = COLORS.glyph;
            context.stroke();
          } else {
            // Facing the walked way, seen from wherever the camera
            // has been walked to
            walker.facing =
              SPRITE_DIRECTIONS[facingFrom(SPRITE_DIRECTIONS.indexOf(heading), yaw())];
            const walking = {
              scale: (CELL * NPC_CELLS * spot.scale * magnify) / walker.sourceFrameHeight,
              anchor: 'foot',
            } as const;

            walker.drawShadow(context, spot.x, spot.y, {
              ...walking,
              color: COLORS.shadow,
              squash: GROUND_SQUASH,
              cast: cast(),
            });
            walker.draw(context, spot.x, spot.y, walking);
          }
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
