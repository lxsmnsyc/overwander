import { type JSX, createEffect, createSignal, onMount } from 'solid-js';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import loadSpeciesSprite from '../../canvas/species-sprites';
import type { Species } from '../../data/ids/species';

/**
 * The dex, drawn as the box of squares it has always been.
 *
 * It is the catch box's twin — same squares, same sprites, same press
 * to open one — and it differs in the two ways the thing itself
 * differs. A dex square is a **species** rather than a pokemon, so it
 * carries the number the species is known by; and a dex is mostly
 * things the player has *not* met, so a square is drawn in one of
 * three states rather than one.
 *
 * Nothing animates. The box breathes because a box is a room with the
 * player's pokemon standing in it; a dex is a reference, and a hundred
 * and fifty idling sprites is a hundred and fifty playheads updated
 * sixty times a second to say nothing that the first frame did not.
 * They are drawn once, and again whenever another sheet arrives.
 */

/**
 * Six across and five down, the way the box is: the two are read the
 * same way, one of them is opened straight from the other, and a page
 * of thirty is about as many as can be told apart at a glance.
 *
 * The dex is a hundred and fifty-one long and it is **paged** rather
 * than drawn in full for that reason — a canvas twenty-six rows tall
 * is a column to scroll rather than a page to read, and the squares
 * stop being in the same place every time
 */
export const DEX_COLUMNS = 6;
export const DEX_ROWS = 5;
export const DEX_PAGE = DEX_COLUMNS * DEX_ROWS;

/**
 * How big a square is drawn at. The canvas is stretched to its
 * container afterwards, so this is a resolution rather than a size
 */
const CELL = 64;

const SPRITE_ROOM = CELL - 18;
const SPRITE_MAX_SCALE = 1.5;

/**
 * How far above the bottom of the square a pokemon stands. Lower than
 * the catch box's, because the room a box keeps under a sprite for an
 * egg's progress bar is room a dex does not need
 */
const SPRITE_BASE = 7;

const COLORS = {
  cell: 'rgba(255, 255, 255, 0.55)',
  /**
   * A species the player has never laid eyes on. It is a darker square
   * rather than an empty one: the shape of what is left to find is
   * most of what a dex is for
   */
  unknown: 'rgba(0, 0, 0, 0.06)',
  hover: 'rgba(255, 255, 255, 0.9)',
  focus: '#3b82f6',
  /**
   * What a species met but never kept is drawn as: its own outline,
   * filled flat. A shadow says "you know what shape this is and
   * nothing else", which is exactly what having seen one means
   */
  shadow: 'rgba(110, 126, 152, 0.95)',
  number: 'rgba(60, 70, 85, 0.75)',
  /**
   * The number on a square with nothing behind it. It is a grey that
   * reads on both grounds: the square under a met pokemon is drawn
   * pale in either theme, but an unmet one is the canvas showing
   * through, and the canvas is parchment by day and night sky after
   * dark
   */
  numberUnknown: 'rgba(140, 150, 170, 0.65)',
} as const;

/**
 * One square: a species, and how much of it the player has earned the
 * right to see
 */
export interface DexEntry {
  species: Species;
  dexNumber: number;
  name: string;
  /**
   * Met at least once — a wild encounter, a raid boss, a grunt's prize
   */
  seen: boolean;
  /**
   * Owned at least once. A caught species is drawn in full, and owning
   * one counts as having seen it
   */
  caught: boolean;
}

export interface PokedexCanvasProps {
  entries: DexEntry[];
  onOpen: (species: Species) => void;
}

/**
 * How the dex says a number: three digits, so the column of them is a
 * column rather than a ragged edge
 */
export function dexLabel(dexNumber: number): string {
  return `#${String(dexNumber).padStart(3, '0')}`;
}

/**
 * What one square is announced as. An unmet species says only its
 * number — a dex that read out the names of everything left to find
 * would be doing the finding
 */
export function describeDexEntry(entry: DexEntry): string {
  if (entry.caught) {
    return `${dexLabel(entry.dexNumber)} ${entry.name}, caught`;
  }
  if (entry.seen) {
    return `${dexLabel(entry.dexNumber)} ${entry.name}, seen`;
  }
  return `${dexLabel(entry.dexNumber)}, not yet met`;
}

/**
 * Which way each arrow moves the cursor, in squares
 */
const MOVE_KEYS = new Map<string, number>([
  ['ArrowLeft', -1],
  ['ArrowRight', 1],
  ['ArrowUp', -DEX_COLUMNS],
  ['ArrowDown', DEX_COLUMNS],
]);

export default function PokedexCanvas(props: PokedexCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  const [beat, setBeat] = createSignal(0);
  const [hovered, setHovered] = createSignal<number | null>(null);
  const [focused, setFocused] = createSignal(false);
  const [cursor, setCursor] = createSignal(0);

  /**
   * Always the full five rows, even on the last page. A grid that
   * shrinks to what is left of the dex would move the paging buttons
   * under the player's finger as they reached the end
   */
  const height = (): number => DEX_ROWS * CELL;

  /**
   * One sheet per species, kept for as long as the dex is open. A
   * shiny is never drawn here: a dex square is the species, and which
   * coat the player happened to meet belongs on the entry itself
   */
  const sprites = new Map<Species, SpeciesSpriteAnimation | null>();

  const spriteFor = (species: Species): SpeciesSpriteAnimation | null => {
    if (sprites.has(species)) {
      return sprites.get(species) ?? null;
    }
    sprites.set(species, null);
    loadSpeciesSprite(species)
      .then((loaded) => {
        sprites.set(species, loaded);
        loaded?.play('Idle', { direction: 'DownLeft', loop: true });
        // Another square can be drawn now, and nothing else is asking
        // for a repaint: the dex does not animate
        setBeat((count) => count + 1);
      })
      .catch(() => {
        // The square keeps its number and nothing else, which is what
        // it had
      });
    return null;
  };

  const cellAt = (event: MouseEvent): number | null => {
    const element = canvas;

    if (element == null) {
      return null;
    }

    const bounds = element.getBoundingClientRect();
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * DEX_COLUMNS);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * DEX_ROWS);

    if (x < 0 || y < 0 || x >= DEX_COLUMNS || y >= DEX_ROWS) {
      return null;
    }

    const index = y * DEX_COLUMNS + x;

    return index < props.entries.length ? index : null;
  };

  const entryAt = (index: number): DexEntry | undefined => props.entries.at(index);

  const open = (index: number): void => {
    const entry = entryAt(index);

    if (entry != null) {
      props.onOpen(entry.species);
    }
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');

    if (element == null || context == null) {
      return;
    }

    const ratio = window.devicePixelRatio;

    /**
     * Where a silhouette is made.
     *
     * A shadow is the sprite drawn into a canvas of its own and then
     * flooded with one colour through `source-in`, which keeps the
     * drawing's own shape and throws away everything it was coloured
     * with. It cannot be done on the dex itself — the flood would take
     * the squares already drawn with it — so one spare square is kept
     * and reused for every shadow in the dex
     */
    const stencil = document.createElement('canvas');

    stencil.width = CELL;
    stencil.height = CELL;

    const shade = stencil.getContext('2d');

    createEffect(() => {
      // Redrawn when a sheet lands, when the dex is read again, and
      // when the pointer or the keyboard moves — which is every reason
      // this canvas has to change at all
      beat();
      hovered();
      focused();
      cursor();

      const tall = height();

      // The element is resized here rather than at mount: how many rows
      // there are depends on how long the dex is, and the dex arrives
      // after the canvas does
      if (element.height !== tall * ratio) {
        element.width = CELL * DEX_COLUMNS * ratio;
        element.height = tall * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, CELL * DEX_COLUMNS, tall);

      for (const [index, entry] of props.entries.entries()) {
        const x = (index % DEX_COLUMNS) * CELL;
        const y = Math.floor(index / DEX_COLUMNS) * CELL;
        const met = entry.seen || entry.caught;

        const ground = met ? COLORS.cell : COLORS.unknown;

        context.fillStyle = hovered() === index ? COLORS.hover : ground;
        context.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);

        // The number, in the corner, whether or not there is anything
        // to draw under it: it is the one thing a dex knows about a
        // species nobody has met
        context.fillStyle = met ? COLORS.number : COLORS.numberUnknown;
        context.font = '600 9px system-ui, sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(dexLabel(entry.dexNumber), x + 5, y + 5);

        if (!met) {
          continue;
        }

        const sprite = spriteFor(entry.species);

        if (sprite?.ready !== true) {
          continue;
        }
        sprite.play('Idle', { direction: 'DownLeft', loop: true });

        const { width, height: frameHeight } = sprite.frameSize;
        const fit = Math.min(
          SPRITE_ROOM / Math.max(1, width),
          SPRITE_ROOM / Math.max(1, frameHeight),
        );
        const placement = {
          scale: Math.min(SPRITE_MAX_SCALE, fit),
          anchor: 'shadow',
        } as const;

        if (entry.caught) {
          sprite.draw(context, x + CELL / 2, y + CELL - SPRITE_BASE, placement);
          continue;
        }

        // Seen and not kept: the same drawing, flooded flat
        if (shade == null) {
          continue;
        }
        shade.setTransform(1, 0, 0, 1, 0, 0);
        shade.clearRect(0, 0, CELL, CELL);
        sprite.draw(shade, CELL / 2, CELL - SPRITE_BASE, placement);
        shade.globalCompositeOperation = 'source-in';
        shade.fillStyle = COLORS.shadow;
        shade.fillRect(0, 0, CELL, CELL);
        shade.globalCompositeOperation = 'source-over';
        context.drawImage(stencil, x, y);
      }

      if (focused()) {
        const x = (cursor() % DEX_COLUMNS) * CELL;
        const y = Math.floor(cursor() / DEX_COLUMNS) * CELL;

        context.strokeStyle = COLORS.focus;
        context.lineWidth = 3;
        context.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6);
        context.lineWidth = 1;
      }
    });
  });

  const named = (index: number): string => {
    const entry = entryAt(index);

    return entry == null ? 'Empty square' : describeDexEntry(entry);
  };

  return (
    <canvas
      ref={canvas}
      tabindex={0}
      role="application"
      aria-label={`Pokedex, ${props.entries.length} species on this page. ${named(
        cursor(),
      )} under the cursor.`}
      title={hovered() == null ? '' : named(hovered() ?? 0)}
      // Narrower than the catch box, because the dex carries two rows
      // of its own above it — what has been met, and which page this
      // is. At the width the box is drawn at, the last row of squares
      // falls under the bar at the foot of a laptop screen.
      //
      // It lands at the size the squares are actually drawn, which for
      // pixel art is the one scale that is not a resampling
      class={`mx-auto block h-auto w-full max-w-sm rounded-xl border-4 border-tide
        bg-parchment shadow-pop focus-visible:outline-none ${
          hovered() == null ? 'cursor-default' : 'cursor-pointer'
        }`}
      onMouseMove={(event) => {
        setHovered(cellAt(event));
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
        const step = MOVE_KEYS.get(event.key);

        if (step != null) {
          event.preventDefault();
          setCursor((at) => Math.min(DEX_PAGE - 1, Math.max(0, at + step)));
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(cursor());
        }
      }}
      onClick={(event) => {
        const index = cellAt(event);

        if (index != null) {
          setCursor(index);
          open(index);
        }
      }}
    />
  );
}
