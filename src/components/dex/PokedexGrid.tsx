import { Index, type JSX, Show } from 'solid-js';
import type { Species } from '../../data/ids/species';
import { unownLetter } from '../../data/ids/forms';
import { getSpeciesData } from '../../data/species';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The dex, drawn as the box of squares it has always been.
 *
 * It is the catch box's twin — same grid, same squares, same press to
 * open one — and it differs in the two ways the thing itself differs. A
 * dex square is a **species** rather than a pokemon, so it carries the
 * number the species is known by; and a dex is mostly things the player
 * has *not* met, so a square is drawn in one of three states.
 *
 * Nothing animates. A box breathes because it is a room with the
 * player's pokemon standing in it; a dex is a reference, and thirty
 * idling sprites say nothing the first frame did not.
 */

/**
 * Six across and five down, the way the box is: the two are read the
 * same way, one of them is opened straight from the other, and a page of
 * thirty is about as many as can be told apart at a glance.
 *
 * The dex is a hundred and fifty-one long and it is **paged** rather
 * than drawn in full for that reason — twenty-six rows is a column to
 * scroll rather than a page to read, and the squares stop being in the
 * same place every time
 */
export const DEX_COLUMNS = 6;
export const DEX_ROWS = 5;
export const DEX_PAGE = DEX_COLUMNS * DEX_ROWS;

/**
 * The squares, as something to iterate. Always the full five rows, even
 * on the last page: a grid that shrank to what was left of the dex would
 * move the paging buttons under the player's finger as they reached the
 * end
 */
const SQUARES: null[] = Array.from<null>({ length: DEX_PAGE }).fill(null);

/**
 * The frame of a square. Every one of them is pressable — a species
 * nobody has met still has a page, and its number is on it
 */
const SQUARE =
  'relative w-full cursor-pointer rounded-button border-2 p-0 shadow-none' +
  ' transition-[translate,border-color,background-color] duration-(--motion-quick) ease-spring' +
  ' hover:-translate-y-0.5 hover:border-tide active:translate-y-0';

/**
 * What a species met but never kept is drawn as: its own outline, filled
 * flat. A shadow says "you know what shape this is and nothing else",
 * which is exactly what having seen one means
 */
export const SILHOUETTE = '[filter:brightness(0)]';

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
  /**
   * What the corner says instead of the dex number. Forms share one
   * number, so a box of unowns marked #201 twenty-eight times says
   * nothing; the letter is what tells them apart
   */
  label?: string;
  /** Whether the species comes in more than one form, marked in its corner */
  forms?: boolean;
}

export interface PokedexGridProps {
  entries: DexEntry[];
  onOpen: (species: Species) => void;
  /**
   * How many squares to draw, whatever the page holds. The dex pages
   * at thirty and keeps all five rows so the buttons under them stay
   * put; a grid that does not page asks for its own length instead
   */
  squares?: number;
  /** What the box is announced as, for a grid that is not the dex. */
  label?: string;
  /** A square to ring, for a dex number searched for */
  highlight?: Species | null;
  /**
   * Whether the grid takes the whole width it is given, its squares
   * wider than tall, for the dex itself rather than a dialog of forms
   */
  fill?: boolean;
}

/** Two cards, one behind the other: a species that comes in forms */
export function FormsMark(props: { class?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
      class={props.class}
    >
      <rect x="2" y="5" width="9" height="9" rx="2" />
      <path d="M5 2.5h6.5A2.5 2.5 0 0 1 14 5v6.5" />
    </svg>
  );
}

/**
 * How the dex says a number: three digits, so the column of them is a
 * column rather than a ragged edge
 */
export function dexLabel(dexNumber: number): string {
  return `#${String(dexNumber).padStart(3, '0')}`;
}

/**
 * What the corner of a form's square says. Forms share a dex number, so
 * the number tells them apart from nothing: an unown is known by the
 * character it is shaped like, and anything else that gains forms falls
 * back to its own name
 */
export function formLabel(species: Species): string {
  return unownLetter(species) ?? getSpeciesData(species).name;
}

/**
 * What one square is announced as. An unmet species says only its number
 * — a dex that read out the names of everything left to find would be
 * doing the finding
 */
export function describeDexEntry(entry: DexEntry): string {
  const marked = entry.label ?? dexLabel(entry.dexNumber);

  let said = m.dex_entry_unmet({ number: marked });

  if (entry.caught) {
    said = m.dex_entry_caught({ number: marked, name: entry.name });
  } else if (entry.seen) {
    said = m.dex_entry_seen({ number: marked, name: entry.name });
  }
  return entry.forms === true ? m.dex_entry_forms({ label: said }) : said;
}

export default function PokedexGrid(props: PokedexGridProps): JSX.Element {
  const entryAt = (index: number): DexEntry | undefined => props.entries.at(index);

  /** A square's shape: wider than tall in a grid that fills the dex's column */
  const shape = (): string =>
    props.fill === true ? 'aspect-square sm:aspect-[10/7]' : 'aspect-square';

  const squares = (): null[] =>
    props.squares == null ? SQUARES : Array.from<null>({ length: props.squares }).fill(null);

  return (
    // Narrower than the catch box, because the dex carries two rows of
    // its own above it — what has been met, and which page this is. At
    // the width the box is drawn at, the last row of squares falls under
    // the bar at the foot of a laptop screen
    <div
      role="group"
      aria-label={props.label ?? m.dex_grid_label({ count: props.entries.length })}
      class={`mx-auto grid w-full grid-cols-6 gap-1.5 rounded-card border-4 border-tide
        bg-parchment p-2 shadow-pop ${props.fill === true ? '' : 'max-w-md'}`}
    >
      <Index each={squares()}>
        {(_, index) => (
          <Show
            when={entryAt(index)}
            fallback={
              <span
                aria-hidden="true"
                class={`w-full rounded-button border-2 border-dashed border-line-soft ${shape()}`}
              />
            }
          >
            {(entry) => (
              <button
                type="button"
                aria-label={describeDexEntry(entry())}
                // A form's name is cut short in its corner, so it is whole here
                title={entry().label}
                // A species nobody has met is a darker square rather
                // than an empty one: the shape of what is left to find is
                // most of what a dex is for
                class={`${SQUARE} ${shape()} ${
                  entry().seen || entry().caught
                    ? 'border-line bg-paper'
                    : 'border-line/70 bg-line-soft'
                } ${entry().species === props.highlight ? '!border-gold ring-3 ring-gold/40' : ''}`}
                onClick={() => {
                  props.onOpen(entry().species);
                }}
              >
                {/* The number in the corner, whether or not there is
                    anything to draw under it: it is the one thing a dex
                    knows about a species nobody has met */}
                <span
                  class={`pointer-events-none absolute max-w-[calc(100%-0.5rem)] truncate font-display
                    leading-tight font-semibold ${
                      props.fill === true
                        ? 'bottom-1 left-1.5 text-[11px]'
                        : 'top-0.5 left-1 text-[9px]'
                    } ${entry().seen || entry().caught ? 'text-muted' : 'text-muted/80'}`}
                >
                  {entry().label ?? dexLabel(entry().dexNumber)}
                </span>
                <Show when={entry().forms === true}>
                  <FormsMark class="pointer-events-none absolute top-1 right-1 size-3.5 text-tide" />
                </Show>

                <Show when={entry().seen || entry().caught}>
                  <span
                    class={`pointer-events-none absolute flex items-center justify-center ${
                      props.fill === true
                        ? 'inset-x-1.5 top-1 bottom-4'
                        : 'inset-x-1.5 top-3 bottom-1'
                    }`}
                  >
                    {/* The sprite fits a square box by its share of it, so a
                        wide square would stretch it: it is drawn in a square
                        as tall as the room */}
                    <span class="flex aspect-square h-full max-w-full items-center justify-center">
                      <AnimatedSprite
                        species={entry().species}
                        direction="DownLeft"
                        still
                        fill
                        class={entry().caught ? '' : SILHOUETTE}
                      />
                    </span>
                  </span>
                </Show>
              </button>
            )}
          </Show>
        )}
      </Index>
    </div>
  );
}
