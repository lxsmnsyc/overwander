import type { JSX, ParentProps } from 'solid-js';
import { Tab, TabList } from 'terracotta';

/**
 * A rail: the column of places down the left of a sheet (boxes,
 * pockets, regions), each a row with its colour, its name and a count.
 *
 * On a phone there is no room for a column beside what it switches, so
 * the same rows become a row of chips across the top that scrolls
 * sideways. The switch happens at `md`.
 */

/** The rail itself: a column with a keyline on its right, or a row of chips */
export const RAIL =
  'flex shrink-0 gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:self-stretch' +
  ' md:overflow-x-visible md:border-r-2 md:border-line-soft md:pr-3 md:pb-0';

/** What every row shares, whatever it is */
const ROW =
  'group flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5' +
  ' text-left text-sm font-extrabold text-ink shadow-none transition-colors' +
  ' duration-(--motion-quick) active:translate-y-0 focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide md:min-h-10 md:w-full md:shrink' +
  ' md:rounded-button md:px-2.5';

/** A row at rest: a chip with an edge on a phone, bare in the column */
const AT_REST = 'border-line bg-paper hover:bg-line-soft md:border-transparent md:bg-transparent';

/** The row showing */
const CURRENT = 'border-tide bg-tide-soft text-tide-dark';

/** A rail row's classes, current or not */
export function railRow(current: boolean): string {
  return `${ROW} ${current ? CURRENT : AT_REST}`;
}

/** How many a row holds, in a pill at its right end */
export function RailCount(props: ParentProps<{ lit?: boolean }>): JSX.Element {
  return (
    <span
      class={`ml-auto inline-flex h-[22px] min-w-[26px] shrink-0 items-center justify-center
        rounded-full px-1.5 font-display text-xs font-semibold tabular-nums ${
          props.lit === true ? 'bg-tide text-on-accent' : 'bg-line-soft text-muted'
        }`}
    >
      {props.children}
    </span>
  );
}

/**
 * A rail row that is a tab, for a rail that switches panels (the bag's
 * pockets). It is lit from `aria-selected`, so what a screen reader is
 * told and what is drawn cannot drift apart
 */
export function RailTab(props: ParentProps<{ value: number; class?: string }>): JSX.Element {
  return (
    <Tab
      value={props.value}
      class={`${ROW} ${AT_REST} aria-selected:border-tide aria-selected:bg-tide-soft
        aria-selected:text-tide-dark ${props.class ?? ''}`}
      // Focused on press, as `TabButton` is: terracotta selects a tab
      // again when it loses focus
      onPointerDown={(event: PointerEvent) => {
        if (event.currentTarget instanceof HTMLElement) {
          event.currentTarget.focus();
        }
      }}
    >
      {props.children}
    </Tab>
  );
}

/** The rail as a tab list, for rows that are `RailTab`s */
export function RailTabs(props: ParentProps<{ label: string; class?: string }>): JSX.Element {
  return (
    <TabList aria-label={props.label} class={`${RAIL} ${props.class ?? ''}`}>
      {props.children}
    </TabList>
  );
}
