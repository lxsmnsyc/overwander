import { type Accessor, type JSX, Show, createEffect, createMemo, createSignal } from 'solid-js';
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
  /**
   * Drawn only when there is more than one page. With `range`, it also
   * says which rows are showing out of how many, and stays up for one page
   */
  controls: (options?: PagerOptions) => JSX.Element;
}

/** Where a page stands, for a caller that words it itself */
export interface PageSpot {
  page: number;
  pages: number;
  /** The first and last rows showing, counted from 1 */
  from: number;
  to: number;
  total: number;
}

export interface PagerOptions {
  range?: boolean;
  /**
   * Where the page is said on the left and both arrows stand together
   * on the right, for a grid whose page is read before it is turned
   */
  split?: boolean;
  /** What the page is called, in place of the pager's own words */
  say?: (spot: PageSpot) => string;
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
  const pages = createMemo(() => Math.max(1, Math.ceil(items().length / fits())));
  /**
   * Held rather than sliced on demand. A grid reads the page it is
   * given once per square, and each of those reads used to run
   * whatever built the list again
   */
  const shown = createMemo<T[]>(() => items().slice(page() * fits(), (page() + 1) * fits()));

  createEffect(() => {
    setPage((at) => Math.min(at, pages() - 1));
  });

  return {
    shown,
    controls: (options) => {
      const spot = (): PageSpot => ({
        page: page() + 1,
        pages: pages(),
        from: Math.min(items().length, page() * fits() + 1),
        to: Math.min(items().length, (page() + 1) * fits()),
        total: items().length,
      });
      const back = (): JSX.Element => (
        <Button
          label="Previous page"
          disabled={page() === 0}
          onClick={() => {
            setPage((at) => Math.max(0, at - 1));
          }}
        >
          <ArrowLeftIcon class="size-4" aria-hidden="true" />
        </Button>
      );
      const on = (): JSX.Element => (
        <Button
          label="Next page"
          disabled={page() >= pages() - 1}
          onClick={() => {
            setPage((at) => Math.min(pages() - 1, at + 1));
          }}
        >
          <ArrowRightIcon class="size-4" aria-hidden="true" />
        </Button>
      );

      if (options?.split === true) {
        return (
          <div class="flex items-center justify-between gap-2">
            <Meta class="font-extrabold tabular-nums">
              {options.say?.(spot()) ?? `Page ${spot().page} of ${spot().pages}`}
            </Meta>
            <div class="flex shrink-0 gap-2">
              {back()}
              {on()}
            </div>
          </div>
        );
      }
      return pagedRow(options, back, on);
    },
  };

  function pagedRow(
    options: PagerOptions | undefined,
    back: () => JSX.Element,
    on: () => JSX.Element,
  ): JSX.Element {
    return (
      <Show when={pages() > 1 || (options?.range === true && items().length > 0)}>
        <Row class="justify-center">
          {back()}
          <Meta class="tabular-nums">
            {options?.range === true
              ? `${unit} ${page() + 1} · ${Math.min(items().length, page() * fits() + 1)}–${Math.min(
                  items().length,
                  (page() + 1) * fits(),
                )} of ${items().length}`
              : `${unit} ${page() + 1} of ${pages()}`}
          </Meta>
          {on()}
        </Row>
      </Show>
    );
  }
}
