import { For, Index, type JSX, Show } from 'solid-js';
import type Families from '../../data/ids/families';
import { getFamilyName } from '../../data/species';
import CandySprite from '../sprites/CandySprite';
import { GRID_COLUMNS } from './ItemGrid';
import { HoverCard, Meta, Note } from '../styled';

/**
 * The candy piles as a tray of pictures, the way the bag draws items.
 *
 * They were a column of "Bulbasaur Candy × 12" lines, which is a
 * spreadsheet of a sweet jar and reads nothing like the rest of the
 * bag beside it. Each pile is a square with the family's own candy on
 * it and the count in the corner, and the name is what a card over the
 * square says.
 *
 * No search over it: a pile is only there because the player caught
 * something of that family, so the tray is as long as their collection
 * and no longer.
 */

export interface CandyPile {
  family: Families;
  count: number;
}

export interface CandyGridProps {
  piles: CandyPile[];
}

export default function CandyGrid(props: CandyGridProps): JSX.Element {
  /**
   * The tray keeps whole rows, so a jar of seven does not draw one
   * square hanging off the end of the second row
   */
  const empties = (): number[] =>
    Array.from(
      {
        length:
          Math.max(GRID_COLUMNS, Math.ceil(props.piles.length / GRID_COLUMNS) * GRID_COLUMNS) -
          props.piles.length,
      },
      (_, at) => at,
    );

  return (
    <div class="mx-auto flex w-full max-w-lg flex-col gap-2">
      <div
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-gold bg-parchment p-1.5
          shadow-pop"
      >
        {/* `Index` rather than `For`, as the bag's tray does: the piles
            are rebuilt whenever one is spent, and a reference-keyed
            loop would tear every square down under the pointer */}
        <Index each={props.piles}>
          {(pile) => (
            <HoverCard
              class="block w-full"
              title="Candy"
              trigger={
                <span
                  role="img"
                  aria-label={`${getFamilyName(pile().family)} candy, ${pile().count} held`}
                  class="relative flex aspect-square w-full items-center justify-center rounded-lg
                    border-2 border-line bg-paper p-1"
                >
                  {/* Laid over the square rather than in it, so a
                      narrow square is not stretched taller than it is
                      wide */}
                  <span class="pointer-events-none absolute inset-1.5 flex items-center justify-center">
                    <CandySprite family={pile().family} fill label="" />
                  </span>
                  <span
                    class="pointer-events-none absolute right-0.5 bottom-0.5 rounded-full border
                      border-line bg-paper px-1 text-[10px] leading-tight font-bold text-ink"
                  >
                    {pile().count}
                  </span>
                </span>
              }
            >
              <span class="font-medium">{getFamilyName(pile().family)} candy</span>
              <Meta>
                {pile().count} in the jar. It raises anything of that family, and letting one go
                pays more of it.
              </Meta>
            </HoverCard>
          )}
        </Index>
        {/* The rest of the tray, drawn empty rather than left out: a
            half-built grid reads as a broken one */}
        <For each={empties()}>
          {() => (
            <span
              aria-hidden="true"
              class="aspect-square w-full rounded-lg border-2 border-line-soft bg-paper/40"
            />
          )}
        </For>
      </div>
      <Show when={props.piles.length === 0}>
        <Note class="text-center">No candies yet.</Note>
      </Show>
    </div>
  );
}
