import { type JSX, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import loadSpeciesSprite from '../../canvas/species-sprites';
import { Species } from '../../data/ids/species';

/**
 * A box of pokemon, drawn the way the games draw one.
 *
 * A list of names is a list: it says what somebody has and nothing
 * about what they have. A box says it at a glance — thirty of them
 * standing in their squares, the shiny one obvious, the eggs obvious,
 * and the one being looked for found by looking rather than by
 * reading. It is one canvas for the same reason the chunk is: thirty
 * animating sprites are thirty elements to lay out otherwise.
 *
 * What it knows is what it is given. Which pokemon are in the box,
 * what order they are in and what happens when one is pressed are all
 * the caller's; this draws them and reports the press.
 */

/**
 * How big a box is. Six across and five down is thirty, which is the
 * number a mainline box holds and about as many as can be told apart
 * on a screen at once
 */
export const BOX_COLUMNS = 6;
export const BOX_ROWS = 5;
export const BOX_SIZE = BOX_COLUMNS * BOX_ROWS;

/**
 * How big a cell is drawn. The canvas is stretched to its container
 * afterwards, so this is the resolution it is drawn at
 */
const CELL = 64;

/**
 * How much room inside a square the sprite is allowed, and how far
 * past its own sheet it may be blown up.
 *
 * Sprite sheets are not one size: a Rattata's frame is a fraction of
 * an Onix's, so a single scale that suits one overflows the square
 * with the other and the pokemon spills into its neighbours. Each is
 * fitted to the room instead, and small ones are still enlarged —
 * up to the cap, so a Diglett is not stretched to the size of a Snorlax
 */
const SPRITE_ROOM = CELL - 14;
const SPRITE_MAX_SCALE = 1.6;

/**
 * How far above the bottom of the square a pokemon stands. It is
 * planted on a line rather than centred: a sprite drawn dead centre
 * hangs in the middle of its box, and a row of them at different
 * heights has nothing to line up on. The room underneath is where an
 * egg's progress bar goes
 */
const SPRITE_BASE = 10;

const WIDTH = CELL * BOX_COLUMNS;
const HEIGHT = CELL * BOX_ROWS;

const COLORS = {
  cell: 'rgba(255, 255, 255, 0.55)',
  /**
   * The square under the pointer. A box is for finding one pokemon in
   * thirty, so which one the press would open has to be obvious
   */
  hover: 'rgba(255, 255, 255, 0.9)',
  focus: '#3b82f6',
  /**
   * What is left of an egg's walk, drawn under it. An egg has no
   * species to recognise, so how far along it is is the only thing
   * that tells one from another
   */
  progress: '#7bb661',
  progressTrack: 'rgba(0, 0, 0, 0.12)',
  fainted: 'rgba(120, 30, 30, 0.18)',
  /**
   * A square the caller has taken. The glow is the whole cell rather
   * than a tick alone: picking a party of six out of thirty is a thing
   * done by looking at the shape of what is chosen, and a mark small
   * enough to sit under a sprite is too small to see that way
   */
  picked: 'rgba(123, 182, 97, 0.28)',
  pickedEdge: '#5f9648',
  pickedMark: '#3f6b30',
  /**
   * And one the caller will not take. It is shown rather than left
   * out, because a player looking for a pokemon that is missing wants
   * to be told why rather than left to wonder where it went
   */
  refusedMark: '#a33c3c',
} as const;

/**
 * One square of the box: what stands in it, and what the caller needs
 * back when it is pressed
 */
export interface BoxEntry {
  id: string;
  species: Species;
  shiny: boolean;
  /**
   * An egg is drawn as an egg — what is inside is not the owner's to
   * see — with how far along its walk is
   */
  egg: boolean;
  progress: number;
  fainted: boolean;
  /**
   * Whether the caller has taken this one, or refuses to. A picked
   * square glows and carries a tick; a refused one carries a cross and
   * is not pressable
   */
  mark?: 'picked' | 'refused';
  /**
   * What a screen reader is told about this square
   */
  label: string;
}

export interface CatchBoxCanvasProps {
  entries: BoxEntry[];
  onOpen: (id: string) => void;
}

/**
 * The tick or the cross under a sprite, drawn rather than written: the
 * squares are sixty-odd pixels across and a word does not fit in one
 */
function drawMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'picked' | 'refused',
): void {
  const size = 5;

  context.save();
  context.lineWidth = 2.5;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  // A plate under it, so the mark reads against a sprite as well as
  // against an empty square
  context.fillStyle = 'rgba(255, 255, 255, 0.85)';
  context.beginPath();
  context.arc(x, y, size + 3, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = kind === 'picked' ? COLORS.pickedMark : COLORS.refusedMark;
  context.beginPath();
  if (kind === 'picked') {
    context.moveTo(x - size, y);
    context.lineTo(x - size / 3, y + size * 0.8);
    context.lineTo(x + size, y - size * 0.8);
  } else {
    context.moveTo(x - size, y - size);
    context.lineTo(x + size, y + size);
    context.moveTo(x + size, y - size);
    context.lineTo(x - size, y + size);
  }
  context.stroke();
  context.restore();
}

/**
 * How fast an egg's idle plays, by how far along it is. A fresh egg
 * barely stirs and one about to open is shaking: it is the only thing
 * an egg has to say, so it says it with the only thing it has
 */
const EGG_SPEED = [0.6, 2.4] as const;

/**
 * Which way each arrow moves the cursor, in squares
 */
const MOVE_KEYS = new Map<string, number>([
  ['ArrowLeft', -1],
  ['ArrowRight', 1],
  ['ArrowUp', -BOX_COLUMNS],
  ['ArrowDown', BOX_COLUMNS],
]);

export default function CatchBoxCanvas(props: CatchBoxCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  const [beat, setBeat] = createSignal(0);
  const [hovered, setHovered] = createSignal<number | null>(null);
  const [focused, setFocused] = createSignal(false);
  const [cursor, setCursor] = createSignal(0);

  /**
   * One animation per square rather than per species.
   *
   * The chunk shares a playhead between two Rattata standing in a
   * field, because they are scenery. These are not: two eggs at
   * different points of the same walk have to shake at different
   * speeds, and a box of six Pidgey that all breathe in time looks
   * like a bug
   */
  const sprites = new Map<string, SpeciesSpriteAnimation | null>();

  const spriteFor = (entry: BoxEntry): SpeciesSpriteAnimation | null => {
    const key = `${entry.id}:${entry.egg ? 'egg' : entry.species}:${entry.shiny}`;

    if (sprites.has(key)) {
      return sprites.get(key) ?? null;
    }
    sprites.set(key, null);
    loadSpeciesSprite(entry.egg ? Species.Egg : entry.species, { shiny: entry.shiny })
      .then((loaded) => {
        sprites.set(key, loaded);
      })
      .catch(() => {
        // The square stays empty, which is what it was
      });
    return null;
  };

  // Anything no longer in the box stops being animated. A player who
  // pages through three hundred catches would otherwise be holding
  // three hundred playheads by the time they got to the end
  createEffect(() => {
    const showing = new Set(props.entries.map((entry) => entry.id));

    for (const key of [...sprites.keys()]) {
      if (!showing.has(key.slice(0, key.indexOf(':')))) {
        sprites.delete(key);
      }
    }
    // Iterated over a copy on purpose: the keys are being deleted as
    // they are walked
  });

  const cellAt = (event: MouseEvent): number | null => {
    const element = canvas;

    if (element == null) {
      return null;
    }

    const bounds = element.getBoundingClientRect();
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * BOX_COLUMNS);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * BOX_ROWS);

    if (x < 0 || y < 0 || x >= BOX_COLUMNS || y >= BOX_ROWS) {
      return null;
    }
    return y * BOX_COLUMNS + x;
  };

  /**
   * What is standing in a square, if anything. The last box of a
   * collection is a part-full one, so most of these answers are
   * "nothing" — which `at` says and an index does not
   */
  const entryAt = (index: number): BoxEntry | undefined => props.entries.at(index);

  const open = (index: number): void => {
    const entry = entryAt(index);

    if (entry != null) {
      props.onOpen(entry.id);
    }
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');

    if (element == null || context == null) {
      return;
    }

    const ratio = window.devicePixelRatio;

    element.width = WIDTH * ratio;
    element.height = HEIGHT * ratio;
    context.scale(ratio, ratio);

    let last = 0;
    let frame = requestAnimationFrame(function step(now: number): void {
      frame = requestAnimationFrame(step);

      const elapsed = last === 0 ? 0 : now - last;

      last = now;

      for (const entry of props.entries) {
        const sprite = spriteFor(entry);

        // An egg's clock runs at the speed of its own walk; everything
        // else breathes at the one speed it was drawn at
        sprite?.update(
          entry.egg
            ? elapsed * (EGG_SPEED[0] + (EGG_SPEED[1] - EGG_SPEED[0]) * entry.progress)
            : elapsed,
        );
      }
      setBeat((count) => count + 1);
    });

    onCleanup(() => {
      cancelAnimationFrame(frame);
    });

    createEffect(() => {
      beat();

      context.clearRect(0, 0, WIDTH, HEIGHT);

      for (let index = 0; index < BOX_SIZE; index++) {
        const x = (index % BOX_COLUMNS) * CELL;
        const y = Math.floor(index / BOX_COLUMNS) * CELL;
        const entry = entryAt(index);

        context.fillStyle = hovered() === index && entry != null ? COLORS.hover : COLORS.cell;
        context.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);

        // Taken: the square itself says so, before anything drawn on
        // it. Nothing else is outlined — the squares are told apart by
        // the gap between them, and thirty boxes ruled in grey is a
        // spreadsheet with pokemon in it
        if (entry?.mark === 'picked') {
          context.fillStyle = COLORS.picked;
          context.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
          context.strokeStyle = COLORS.pickedEdge;
          context.lineWidth = 2;
          context.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6);
          context.lineWidth = 1;
        }

        if (entry == null) {
          continue;
        }

        // One that cannot fight is washed over rather than left out:
        // it is still in the box, and a player counting their six
        // should see why it is not one of them
        if (entry.fainted) {
          context.fillStyle = COLORS.fainted;
          context.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
        }

        const sprite = spriteFor(entry);

        if (sprite?.ready === true) {
          sprite.play('Idle', { direction: 'DownLeft', loop: true });

          const { width, height } = sprite.frameSize;
          // Whichever side is longer decides the scale, so the whole
          // frame lands inside the room the square gives it
          const fit = Math.min(SPRITE_ROOM / Math.max(1, width), SPRITE_ROOM / Math.max(1, height));
          // Standing on the line the marks are drawn on, rather than
          // hanging over it: the sheet says which point of the frame
          // sits on the ground, and this box has a floor for it — the
          // caught mark goes just under the same line
          const placement = {
            scale: Math.min(SPRITE_MAX_SCALE, fit),
            anchor: 'shadow',
          } as const;

          sprite.drawShadow(context, x + CELL / 2, y + CELL - SPRITE_BASE, placement);
          sprite.draw(context, x + CELL / 2, y + CELL - SPRITE_BASE, placement);
        }

        if (entry.egg) {
          const width = (CELL - 20) * Math.min(1, Math.max(0, entry.progress));

          context.fillStyle = COLORS.progressTrack;
          context.fillRect(x + 10, y + CELL - 8, CELL - 20, 3);
          context.fillStyle = COLORS.progress;
          context.fillRect(x + 10, y + CELL - 8, width, 3);
        }

        // Whether the caller has it, at the pokemon's feet
        if (entry.mark != null) {
          drawMark(context, x + CELL / 2, y + CELL - SPRITE_BASE + 2, entry.mark);
        }
      }

      // Where the keyboard is pointing, drawn only while it is in here
      if (focused()) {
        const x = (cursor() % BOX_COLUMNS) * CELL;
        const y = Math.floor(cursor() / BOX_COLUMNS) * CELL;

        context.strokeStyle = COLORS.focus;
        context.lineWidth = 3;
        context.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6);
        context.lineWidth = 1;
      }
    });
  });

  const named = (index: number): string => entryAt(index)?.label ?? 'Empty square';

  return (
    <canvas
      ref={canvas}
      tabindex={0}
      role="application"
      aria-label={`Box of pokemon, ${props.entries.length} of ${BOX_SIZE} squares filled. ${named(
        cursor(),
      )} under the cursor.`}
      title={hovered() == null ? '' : named(hovered() ?? 0)}
      // Narrower than the panel it sits in, with air around it: a box
      // stretched to the full width of a wide dialog is thirty large
      // squares to sweep the eye across rather than one thing to look
      // at
      class={`mx-auto my-2 block h-auto w-full max-w-lg rounded-xl border-4 border-tide
        bg-parchment shadow-pop focus-visible:outline-none ${
          hovered() != null && entryAt(hovered() ?? 0) != null ? 'cursor-pointer' : 'cursor-default'
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
          setCursor((at) => Math.min(BOX_SIZE - 1, Math.max(0, at + step)));
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
