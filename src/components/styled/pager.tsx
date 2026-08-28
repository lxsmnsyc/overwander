import { type Accessor, type JSX, Show, createEffect, createSignal } from 'solid-js';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons';
import Button from './button';
import { Meta } from './list';
import { Row } from './surface';

/**
 * How many rows a paged list of text shows at once. Grids of squares
 * page at their own size — a box is thirty squares because it is six
 * by five — but a list of lines reads twenty at a time
 */
export const LIST_PAGE = 20;

/**
 * A list read one page at a time: the slice being looked at, and the
 * controls that move between pages
 */
export interface Pager<T> {
  shown: Accessor<T[]>;
  /** Drawn only when there is more than one page */
  controls: () => JSX.Element;
}

/**
 * The paging every long list shares: a slice of the rows and a pair of
 * arrows under it. The page is clamped rather than trusted because the
 * list can shrink under the reader — a search narrowed, a row settled
 * — and a page past the end reads as an empty list
 */
export function createPager<T>(
  items: Accessor<T[]>,
  /**
   * How many fit on a page. An accessor for a size the player can
   * change: a box drawn eight wide holds forty, and the page has to
   * follow or the last row of every box goes missing
   */
  size: number | Accessor<number>,
  unit = 'Page',
): Pager<T> {
  const [page, setPage] = createSignal(0);
  const fits = (): number => (typeof size === 'number' ? size : size());
  const pages = (): number => Math.max(1, Math.ceil(items().length / fits()));

  createEffect(() => {
    setPage((at) => Math.min(at, pages() - 1));
  });

  return {
    shown: () => items().slice(page() * fits(), (page() + 1) * fits()),
    controls: () => (
      <Show when={pages() > 1}>
        <Row class="justify-center">
          <Button
            label="Previous page"
            disabled={page() === 0}
            onClick={() => {
              setPage((at) => Math.max(0, at - 1));
            }}
          >
            <ArrowLeftIcon class="size-4" aria-hidden="true" />
          </Button>
          <Meta>
            {unit} {page() + 1} of {pages()}
          </Meta>
          <Button
            label="Next page"
            disabled={page() >= pages() - 1}
            onClick={() => {
              setPage((at) => Math.min(pages() - 1, at + 1));
            }}
          >
            <ArrowRightIcon class="size-4" aria-hidden="true" />
          </Button>
        </Row>
      </Show>
    ),
  };
}
