import type { JSX, ParentProps } from 'solid-js';
import { Tab, TabList } from 'terracotta';

/**
 * The tabs the game is divided into, and the smaller ones inside the
 * profile.
 *
 * Terracotta decides which tab is selected and handles the arrow keys;
 * what a selected tab looks like is decided here. It is read off
 * `aria-selected` rather than passed in, so the thing the screen reader
 * is told and the thing the eye is shown cannot drift apart.
 */

const TAB =
  'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors' +
  ' hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-leaf aria-selected:bg-paper aria-selected:text-ink' +
  ' aria-selected:shadow-sm';

export function TabBar(props: ParentProps & { class?: string }): JSX.Element {
  return (
    <TabList
      class={`flex flex-wrap gap-1 rounded-panel border border-line bg-parchment p-1 ${
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
