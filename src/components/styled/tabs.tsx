import { type JSX, type ParentProps, Suspense } from 'solid-js';
import { Tab, TabList, TabPanel } from 'terracotta';
import { Note } from './feedback';

/**
 * The tabs the game is divided into, and the smaller ones inside the
 * profile.
 *
 * Terracotta decides which tab is selected and handles the arrow keys;
 * what a selected tab looks like is decided here. It is read off
 * `aria-selected` rather than passed in, so the thing the screen reader
 * is told and the thing the eye is shown cannot drift apart.
 */

/**
 * A tab is a tab in a menu screen: the one you are on is filled in and
 * stands off the bar, the rest are quiet words beside it
 */
const TAB =
  'cursor-pointer rounded-lg border-2 border-transparent bg-transparent px-3 py-1 text-sm' +
  ' font-bold text-muted shadow-none transition-colors hover:border-transparent hover:text-ink' +
  ' active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-tide aria-selected:border-tide-dark aria-selected:bg-tide' +
  ' aria-selected:text-on-accent aria-selected:shadow-pop-sm';

export function TabBar(props: ParentProps & { class?: string }): JSX.Element {
  return (
    <TabList
      class={`flex flex-wrap gap-1 rounded-panel border-2 border-line bg-parchment p-1 ${
        props.class ?? ''
      }`}
    >
      {props.children}
    </TabList>
  );
}

/**
 * Every tab in the game is a numbered one — the tab enums are plain
 * numbers — so the value is a number rather than something generic
 */
export function TabButton(props: ParentProps<{ value: number }>): JSX.Element {
  return (
    <Tab value={props.value} class={TAB}>
      {props.children}
    </Tab>
  );
}

/**
 * A tab's panel, with a boundary of its own around whatever it is
 * waiting for.
 *
 * The boundary is the whole point of this existing. A panel that
 * fetches something suspends, and a suspending panel hides everything
 * up to the nearest `Suspense` — which, without this, is the one
 * around the entire page in [`app.tsx`](../../app.tsx). Opening a tab
 * therefore tore the page down and built it again, tab bar included,
 * and a player who was in the middle of a click on that bar had the
 * element they pressed taken out from under them: the pointer went
 * down on a tab and came up on nothing, so the browser never raised a
 * click and the tab they asked for never opened. Every other press
 * appeared to do nothing at all.
 *
 * Kept here rather than written out at each panel so the boundary
 * cannot be forgotten at the one panel that later grows a resource
 */
export function TabPane(props: ParentProps<{ value: number }>): JSX.Element {
  return (
    <TabPanel value={props.value}>
      <Suspense fallback={<Note>Loading…</Note>}>{props.children}</Suspense>
    </TabPanel>
  );
}
