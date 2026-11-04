import { type JSX, type ParentProps, Suspense, createSignal, onCleanup, onMount } from 'solid-js';
import { TabGroup as HeadlessTabGroup, Tab, TabList, TabPanel } from 'terracotta';
import { m } from '../../i18n/paraglide/messages.js';
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
 * A group of tabs and their panels. It is here rather than imported
 * from terracotta so a bar that can be turned off — which for a screen
 * divided into tabs is a blank screen — is refused in one place
 */
export interface TabGroupProps extends ParentProps {
  /** Which tab is open to begin with, for a group that keeps its own place */
  defaultValue?: number;
  /**
   * Which tab is open, for a caller that holds it. With `onChange` it
   * survives the group being built again, which a `defaultValue` does not
   */
  value?: number;
  onChange?: (value: number) => void;
  horizontal?: boolean;
  class?: string;
}

export function TabGroup(props: TabGroupProps): JSX.Element {
  const change = props.onChange;

  if (change != null) {
    return (
      <HeadlessTabGroup
        horizontal={props.horizontal === true}
        value={props.value}
        onChange={(value?: number) => {
          if (value != null) {
            change(value);
          }
        }}
        toggleable={false}
        class={props.class}
      >
        {props.children}
      </HeadlessTabGroup>
    );
  }
  return (
    <HeadlessTabGroup
      horizontal={props.horizontal === true}
      defaultValue={props.defaultValue}
      toggleable={false}
      class={props.class}
    >
      {props.children}
    </HeadlessTabGroup>
  );
}

/**
 * A tab is a pill on the bar: the one you are on is filled in tide,
 * the rest are quiet words beside it. Its content is centred as a flex
 * row, since a tab with a count badge is taller and the bar stretches
 * the others to match.
 *
 * Once the bar has measured its tabs (`data-sliding`), the fill is the
 * bar's indicator sliding under the tab rather than the tab's own, so
 * the selected tab draws only its words
 */
const TAB =
  'relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full' +
  ' border-2 border-transparent bg-transparent px-3 py-1 text-sm font-extrabold' +
  ' whitespace-nowrap text-muted shadow-none transition-colors duration-(--motion-quick)' +
  ' hover:border-transparent hover:text-ink active:translate-y-0 focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide aria-selected:border-tide-dark' +
  ' aria-selected:bg-tide aria-selected:text-on-accent aria-selected:shadow-pop-sm' +
  ' in-data-sliding:aria-selected:border-transparent!' +
  ' in-data-sliding:aria-selected:bg-transparent! in-data-sliding:aria-selected:shadow-none!';

/** The pill under the selected tab, which springs to the next one */
const INDICATOR =
  'pointer-events-none absolute top-0 left-0 rounded-full border-2 border-tide-dark bg-tide' +
  ' shadow-[0_2px_0_0_var(--blue-shade)]';

/**
 * Moved on a spring once the first place is drawn; the first place is
 * not animated. Under reduce motion it jumps, like every other move
 */
const SLIDING = 'transition-[translate,width,height] duration-(--motion-move) ease-spring';

/** Where the selected tab is inside the bar, in the bar's scrolled coordinates */
interface Spot {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * One row however many tabs there are: it scrolls sideways rather than
 * wrapping. It watches which tab is selected and slides its indicator
 * there
 */
export function TabBar(props: ParentProps & { class?: string }): JSX.Element {
  const [spot, setSpot] = createSignal<Spot | null>(null);
  const [moving, setMoving] = createSignal(false);
  /** The indicator, whose parent is the bar it measures */
  let indicator: HTMLSpanElement | undefined;

  onMount(() => {
    const list = indicator?.parentElement;

    if (list == null) {
      return;
    }

    // Measure the selected tab against the bar, scroll included
    const measure = (): void => {
      const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');

      setSpot(
        tab == null
          ? null
          : {
              x: tab.offsetLeft,
              y: tab.offsetTop,
              width: tab.offsetWidth,
              height: tab.offsetHeight,
            },
      );
    };

    measure();

    // Animate only after the first place has been painted
    const frame = requestAnimationFrame(() => {
      setMoving(true);
    });

    // A new selection, a tab added or relabelled, or the bar resized
    const changes = new MutationObserver(measure);
    changes.observe(list, {
      attributes: true,
      attributeFilter: ['aria-selected'],
      subtree: true,
      childList: true,
      characterData: true,
    });
    const sizes = new ResizeObserver(measure);
    sizes.observe(list);

    onCleanup(() => {
      cancelAnimationFrame(frame);
      changes.disconnect();
      sizes.disconnect();
    });
  });

  return (
    <TabList
      data-sliding={spot() == null ? undefined : ''}
      class={`relative flex flex-nowrap gap-1 overflow-x-auto rounded-full border-2 border-line
        bg-line-soft p-1 ${props.class ?? ''}`}
    >
      <span
        ref={indicator}
        aria-hidden="true"
        class={`${INDICATOR} ${moving() ? SLIDING : ''} ${spot() == null ? 'hidden' : ''}`}
        style={{
          translate: `${spot()?.x ?? 0}px ${spot()?.y ?? 0}px`,
          width: `${spot()?.width ?? 0}px`,
          height: `${spot()?.height ?? 0}px`,
        }}
      />
      {props.children}
    </TabList>
  );
}

/**
 * Every tab in the game is a numbered one — the tab enums are plain
 * numbers — so the value is a number rather than something generic
 */
export function TabButton(props: ParentProps<{ value: number; class?: string }>): JSX.Element {
  return (
    <Tab
      value={props.value}
      class={`${TAB} ${props.class ?? ''}`}
      // Focused on press: terracotta selects a tab again when it loses
      // focus, and a browser that leaves focus on the old tab after a
      // click would hand the selection back to it later
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
      <Suspense fallback={<Note>{m.ui_loading()}</Note>}>{props.children}</Suspense>
    </TabPanel>
  );
}
