import { type Accessor, Index, type JSX, Show } from 'solid-js';
import { Species } from '../../data/ids/species';
import { LockIcon, SparklesIcon, StarIcon } from '../icons';
import AnimatedSprite from '../sprites/AnimatedSprite';

/**
 * A box of pokemon, drawn the way the games draw one.
 *
 * A list of names is a list: it says what somebody has and nothing about
 * what they have. A box says it at a glance — thirty of them standing in
 * their squares, the shiny one obvious, the eggs obvious, and the one
 * being looked for found by looking rather than by reading.
 *
 * It is the bag's tray with pokemon in it: a square is a button, the
 * pokemon in it is a picture the browser animates, and everything a
 * square has to carry — a border, a mark, an egg's progress, a card
 * anchored to it — is a box of the document rather than something drawn
 * and then hit-tested.
 *
 * What it knows is what it is given. Which pokemon are in the box, what
 * order they are in and what happens when one is pressed are all the
 * caller's.
 */

/**
 * How big a box is. Six across and five down is thirty, which is the
 * number a mainline box holds and about as many as can be told apart on
 * a screen at once
 */
export const BOX_COLUMNS = 6;
export const BOX_ROWS = 5;
export const BOX_SIZE = BOX_COLUMNS * BOX_ROWS;

/**
 * The widths a player may set the box to. Five and eight are the same
 * five rows drawn narrower or wider, so a box stays one screenful
 * either way
 */
export type BoxWidth = 5 | 6 | 8;

/** How many a box of a given width holds, which is what a page of them is */
export function boxSizeOf(columns: BoxWidth): number {
  return columns * BOX_ROWS;
}

/**
 * How fast an egg's idle plays, by how far along it is. A fresh egg
 * barely stirs and one about to open is shaking: it is the only thing an
 * egg has to say, so it says it with the only thing it has
 */
const EGG_SPEED = [0.6, 2.4] as const;

/**
 * The squares, as something to iterate: what stands in each is read off
 * the entries by index. Kept per width rather than rebuilt, so the
 * `Index` above it is handed the same array every render
 */
const SQUARES = new Map<number, null[]>();

function squaresOf(count: number): null[] {
  const known = SQUARES.get(count);

  if (known != null) {
    return known;
  }

  const made: null[] = Array.from({ length: count }, () => null);

  SQUARES.set(count, made);
  return made;
}

/**
 * One square of the box: what stands in it, and what the caller needs
 * back when it is pressed
 */
export interface BoxEntry {
  id: string;
  species: Species;
  shiny: boolean;
  /**
   * An egg is drawn as an egg — what is inside is not the owner's to see
   * — with how far along its walk is
   */
  egg: boolean;
  progress: number;
  fainted: boolean;
  /**
   * The two marks a player puts on one themselves: put away, and kept.
   * Left out by a caller drawing something that is nobody's yet — a
   * gift on the shelf, a lot on the block
   */
  locked?: boolean;
  favorite?: boolean;
  /**
   * Whether the caller has taken this one, or refuses to. A picked
   * square is lit and carries a tick; a refused one is greyed and
   * carries a cross
   */
  mark?: 'picked' | 'refused';
  /**
   * What a screen reader is told about this square
   */
  label: string;
}

export interface CatchBoxProps {
  entries: BoxEntry[];
  /**
   * What a press on a square does. A card-only box has none — the
   * buttons are in the card that comes up over it
   */
  onOpen?: (id: string) => void;
  /**
   * What stands over an occupied square: a hover card, usually. It is
   * laid over the square rather than beside the sprite, so whatever is
   * anchored to it covers the whole of it
   */
  cell?: (entry: Accessor<BoxEntry>) => JSX.Element;
  /**
   * Whether a square itself does nothing and whatever stands over it is
   * the only way to act. A press on a square is a press on a picture;
   * the card over it has the button that says what it does
   */
  cardOnly?: boolean;
  /**
   * How wide the box is, in squares. Six is the box the game keeps
   * pokemon in and what the player's own setting starts at; three is
   * for a line-up that is three long, where the full width would leave
   * half a box of nothing beside it
   */
  columns?: 3 | BoxWidth;
  /**
   * How many squares the box draws, for a box that is not the box: a
   * team preview is one row of six, not thirty squares five of which
   * mean anything
   */
  capacity?: number;
}

/**
 * How a square reads: taken, refused, hurt, or none of the three
 */
function toneOf(entry: BoxEntry): string {
  if (entry.mark === 'refused') {
    return 'border-line bg-paper opacity-45 grayscale';
  }
  if (entry.mark === 'picked') {
    return 'border-leaf bg-leaf-soft';
  }
  // One that cannot fight is washed rather than left out: it is still in
  // the box, and a player counting their six should see why it is not
  // one of them
  return entry.fainted ? 'border-line bg-ember-soft' : 'border-line bg-paper hover:bg-line-soft';
}

/**
 * The frame of a square, whether or not it is one that can be pressed
 */
const SQUARE = 'relative aspect-square w-full rounded-lg border-2 transition-colors';

/**
 * How wide the grid is laid out, and how wide it is allowed to grow.
 * The two travel together: a square is a share of the box, so the
 * width is what keeps a three-square box drawing squares the size of
 * a six-square one
 */
const SHAPE: Record<3 | BoxWidth, string> = {
  3: 'max-w-64 grid-cols-3',
  5: 'max-w-md grid-cols-5',
  6: 'max-w-lg grid-cols-6',
  8: 'max-w-2xl grid-cols-8',
};

export default function CatchBox(props: CatchBoxProps): JSX.Element {
  /**
   * What is standing in a square, if anything. The last box of a
   * collection is a part-full one, so most of these answers are
   * "nothing"
   */
  const entryAt = (index: number): BoxEntry | undefined => props.entries.at(index);

  /**
   * What is in a square: the pokemon, what its walk has come to, whether
   * the caller has taken it, and whatever the caller stands over it. The
   * square itself is what names the pokemon, so nothing in here is read
   * out
   */
  const inside = (entry: Accessor<BoxEntry>): JSX.Element => (
    <>
      {/* Square and inset by the same margin on every side, so the
          pokemon is fitted to a square whichever way round its cell is
          the longer */}
      <span class="pointer-events-none absolute inset-1.5 flex items-center justify-center">
        <AnimatedSprite
          species={entry().egg ? Species.Egg : entry().species}
          shiny={entry().shiny}
          direction="DownLeft"
          // An egg's clock runs at the speed of its own walk; everything
          // else breathes at the speed it was drawn at
          speed={entry().egg ? EGG_SPEED[0] + (EGG_SPEED[1] - EGG_SPEED[0]) * entry().progress : 1}
          fill
          shadow
        />
      </span>

      {/* What is left of an egg's walk, under it. An egg has no species
          to recognise, so how far along it is is the only thing that
          tells one from another */}
      <Show when={entry().egg}>
        <span
          class="pointer-events-none absolute inset-x-2 bottom-1 h-0.75 overflow-hidden
            rounded-full bg-line-soft"
        >
          <span
            class="block h-full bg-leaf"
            style={{ width: `${Math.min(1, Math.max(0, entry().progress)) * 100}%` }}
          />
        </span>
      </Show>

      {/* What the player has said about it, in the corner away from
          everything the game says. Both are quiet marks: neither
          changes what the square does, and both are worth seeing
          before pressing something irreversible */}
      <span class="pointer-events-none absolute top-0.5 left-0.5 flex flex-col items-start gap-0.5">
        <Show when={entry().locked === true}>
          <LockIcon aria-hidden="true" class="size-3.5 text-tide" />
        </Show>
        <Show when={entry().favorite === true}>
          <StarIcon aria-hidden="true" class="size-3.5 text-gold" />
        </Show>
      </span>

      {/* A shiny says so on the square as well as in the sprite: the
          recolour is the whole of the difference, and two of a species
          a player has never seen side by side are not obviously one
          rare and one not. The line the square is named by already
          carries the mark, so this is for the eye only */}
      <span class="pointer-events-none absolute top-0.5 right-0.5 flex flex-col items-end gap-0.5">
        <Show when={entry().shiny}>
          <SparklesIcon aria-hidden="true" class="size-3.5 text-gold" />
        </Show>
      </span>

      {/* Whether the caller has it, in the corner the bag puts its
          counts in */}
      <Show when={entry().mark} keyed>
        {(mark) => (
          <span
            class={`pointer-events-none absolute right-0.5 bottom-0.5 rounded-full border bg-paper
              px-1 text-[10px] leading-tight font-bold ${
                mark === 'picked' ? 'border-leaf text-leaf-dark' : 'border-ember text-ember-dark'
              }`}
          >
            {mark === 'picked' ? '✓' : '✕'}
          </span>
        )}
      </Show>

      <Show when={props.cell}>
        {(over) => <span class="absolute inset-0 block">{over()(entry)}</span>}
      </Show>
    </>
  );

  /**
   * How wide a full box is here. A three-wide line-up is always given a
   * capacity, so it never falls through to this
   */
  const width = (): BoxWidth =>
    props.columns == null || props.columns === 3 ? BOX_COLUMNS : props.columns;

  const squares = (): null[] => squaresOf(props.capacity ?? boxSizeOf(width()));

  return (
    // Narrower than the panel it sits in, with air around it: a box
    // stretched across a wide dialog is thirty large squares to sweep
    // the eye over rather than one thing to look at
    <div
      role="group"
      aria-label={`Box of pokemon, ${props.entries.length} of ${squares().length} squares filled.`}
      class={`mx-auto my-2 grid w-full gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
        shadow-pop ${SHAPE[props.columns ?? 6]}`}
    >
      <Index each={squares()}>
        {(_, index) => (
          <Show
            when={entryAt(index)}
            fallback={
              // The rest of the box, drawn empty rather than left out: a
              // half-built grid reads as a broken one
              <span
                aria-hidden="true"
                class="aspect-square w-full rounded-lg border-2 border-line-soft bg-paper/40"
              />
            }
          >
            {(entry) => (
              // A square that acts is a button. One whose card holds the
              // only button is not: a press on it would do nothing, and
              // a keyboard offered thirty stops that lead nowhere has to
              // walk past all of them to reach the card
              <Show
                when={props.cardOnly !== true}
                fallback={
                  <span
                    role="img"
                    aria-label={entry().label}
                    class={`${SQUARE} ${toneOf(entry())}`}
                  >
                    {inside(entry)}
                  </span>
                }
              >
                <button
                  type="button"
                  aria-label={entry().label}
                  aria-pressed={entry().mark === 'picked'}
                  class={`${SQUARE} cursor-pointer ${toneOf(entry())}`}
                  onClick={(event) => {
                    // The hover card is portaled out of this button but
                    // its clicks still bubble here through the component
                    // tree; only a press on the square itself counts,
                    // or pressing Add on the card would also toggle the
                    // square straight back off
                    if (!event.currentTarget.contains(event.target)) {
                      return;
                    }
                    props.onOpen?.(entry().id);
                  }}
                >
                  {inside(entry)}
                </button>
              </Show>
            )}
          </Show>
        )}
      </Index>
    </div>
  );
}
