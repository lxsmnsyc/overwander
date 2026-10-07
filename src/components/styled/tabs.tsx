import {
  type JSX,
  type ParentProps,
  Suspense,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';
import { TabGroup as HeadlessTabGroup, Tab, TabList, TabPanel } from 'terracotta';
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

/** What a closing panel tells its group, so the group can hold its place */
interface TabGuard {
  closing: () => void;
}

const TabGuardContext = createContext<TabGuard>();

export function TabGroup(props: TabGroupProps): JSX.Element {
  // Held here even when the caller does not hold it, so every change
  // goes through the one gate below
  const [own, setOwn] = createSignal(props.defaultValue ?? 0);
  let closing = false;

  /**
   * A panel being closed can hand focus back to a tab. Its listboxes
   * and popovers return focus on cleanup to whatever had it when they
   * were built, which is often the tab that opened the panel, and a
   * tab that gains focus selects itself: pressing another tab would
   * bounce straight back. So the group ignores changes while a panel
   * closes, then puts focus back on the tab that was pressed.
   * Reported as https://github.com/lxsmnsyc/terracotta/issues/47
   */
  const guard: TabGuard = {
    closing() {
      if (closing) {
        return;
      }
      closing = true;

      const pressed = document.activeElement;

      queueMicrotask(() => {
        if (pressed instanceof HTMLElement && pressed.isConnected) {
          pressed.focus();
        }
        closing = false;
      });
    },
  };

  return (
    <TabGuardContext.Provider value={guard}>
      <HeadlessTabGroup
        horizontal={props.horizontal === true}
        value={props.onChange == null ? own() : props.value}
        onChange={(value?: number) => {
          if (value == null || closing) {
            return;
          }
          if (props.onChange == null) {
            setOwn(value);
          } else {
            props.onChange(value);
          }
        }}
        toggleable={false}
        class={props.class}
      >
        {props.children}
      </HeadlessTabGroup>
    </TabGuardContext.Provider>
  );
}

/**
 * Tells the group its panel is closing. It is the panel's last child,
 * so it is cleaned up before anything in the panel can move focus
 */
function ClosingMark(): JSX.Element {
  const guard = useContext(TabGuardContext);

  onCleanup(() => {
    guard?.closing();
  });
  return null;
}

/**
 * A tab is a tab in a menu screen: the one you are on is filled in and
 * stands off the bar, the rest are quiet words beside it. Its content is
 * centred as a flex row, since a tab with a count badge is taller and
 * the bar stretches the others to match
 */
const TAB =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border-2' +
  ' border-transparent bg-transparent px-3 py-1 text-sm font-bold whitespace-nowrap text-muted' +
  ' shadow-none transition-colors hover:border-transparent hover:text-ink active:translate-y-0' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide' +
  ' aria-selected:border-tide-dark aria-selected:bg-tide aria-selected:text-on-accent' +
  ' aria-selected:shadow-pop-sm';

/** One row however many tabs there are: it scrolls sideways rather than wrapping */
export function TabBar(props: ParentProps & { class?: string }): JSX.Element {
  return (
    <TabList
      class={`flex flex-nowrap gap-1 overflow-x-auto rounded-panel border-2 border-line bg-parchment p-1 ${
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
      <Suspense fallback={<Note>Loading…</Note>}>{props.children}</Suspense>
      <ClosingMark />
    </TabPanel>
  );
}
