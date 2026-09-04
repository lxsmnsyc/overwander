import { Index, type JSX, Show } from 'solid-js';
import type { Species } from '../../data/ids/species';
import { unownLetter } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';
import AnimatedSprite from '../sprites/AnimatedSprite';

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
const SQUARES: null[] = Array.from({ length: DEX_PAGE }, () => null);

/**
 * The frame of a square. Every one of them is pressable — a species
 * nobody has met still has a page, and its number is on it
 */
const SQUARE =
  'relative aspect-square w-full cursor-pointer rounded-lg border-2 transition-colors' +
  ' hover:border-tide';

/**
 * What a species met but never kept is drawn as: its own outline, filled
 * flat. A shadow says "you know what shape this is and nothing else",
 * which is exactly what having seen one means
 */
const SILHOUETTE = 'opacity-60 [filter:brightness(0)]';

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

  if (entry.caught) {
    return `${marked} ${entry.name}, caught`;
  }
  if (entry.seen) {
    return `${marked} ${entry.name}, seen`;
  }
  return `${marked}, not yet met`;
}

export default function PokedexGrid(props: PokedexGridProps): JSX.Element {
  const entryAt = (index: number): DexEntry | undefined => props.entries.at(index);

  const squares = (): null[] =>
    props.squares == null ? SQUARES : Array.from({ length: props.squares }, () => null);

  return (
    // Narrower than the catch box, because the dex carries two rows of
    // its own above it — what has been met, and which page this is. At
    // the width the box is drawn at, the last row of squares falls under
    // the bar at the foot of a laptop screen
    <div
      role="group"
      aria-label={props.label ?? `Pokedex, ${props.entries.length} species on this page.`}
      class="mx-auto grid w-full max-w-sm grid-cols-6 gap-1.5 rounded-xl border-4 border-tide
        bg-parchment p-1.5 shadow-pop"
    >
      <Index each={squares()}>
        {(_, index) => (
          <Show
            when={entryAt(index)}
            fallback={
              <span
                aria-hidden="true"
                class="aspect-square w-full rounded-lg border-2 border-line-soft bg-paper/40"
              />
            }
          >
            {(entry) => (
              <button
                type="button"
                aria-label={describeDexEntry(entry())}
                // A species nobody has met is a darker square rather
                // than an empty one: the shape of what is left to find is
                // most of what a dex is for
                class={`${SQUARE} ${
                  entry().seen || entry().caught
                    ? 'border-line bg-paper hover:bg-line-soft'
                    : 'border-line-soft bg-line-soft/70'
                }`}
                onClick={() => {
                  props.onOpen(entry().species);
                }}
              >
                {/* The number in the corner, whether or not there is
                    anything to draw under it: it is the one thing a dex
                    knows about a species nobody has met */}
                <span
                  class={`pointer-events-none absolute top-0.5 left-0.5 text-[9px] leading-tight
                    font-bold ${entry().seen || entry().caught ? 'text-muted' : 'text-muted/70'}`}
                >
                  {entry().label ?? dexLabel(entry().dexNumber)}
                </span>

                <Show when={entry().seen || entry().caught}>
                  <span class="pointer-events-none absolute inset-1.5 flex items-center justify-center">
                    <AnimatedSprite
                      species={entry().species}
                      direction="DownLeft"
                      still
                      fill
                      class={entry().caught ? '' : SILHOUETTE}
                    />
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
