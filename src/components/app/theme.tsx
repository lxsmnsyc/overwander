import type { JSX, ParentProps } from 'solid-js';
import { ColorSchemeProvider, Toggle, useColorScheme, usePreferredColorScheme } from 'terracotta';

/**
 * Day and night.
 *
 * The whole of the switch is a `dark` class on the root element: the
 * colours in [`app.css`](../app.css) are named twice, once under
 * `:root` and once under `.dark`, so nothing in the game asks which
 * theme it is in — `bg-paper` is paper in both, and paper is white by
 * day and navy at night.
 *
 * Terracotta puts the class there and keeps it there. It remembers the
 * choice in `localStorage`, follows the machine's own setting until
 * somebody says otherwise, and hears a change made in another tab —
 * which is the entire reason this is not a signal and a `classList`
 * call written out here.
 */

/**
 * Where the choice is remembered. It is terracotta's key rather than
 * one of ours, and the no-flash script in
 * [`entry-server.tsx`](../entry-server.tsx) reads the same one — the
 * two have to agree or the page paints in the wrong theme and then
 * corrects itself in front of the player
 */
export const THEME_STORAGE_KEY = 'theme-preference';

/**
 * The theme, over the whole game. It starts on `system`; the stored
 * choice replaces that as soon as the page is up
 */
export default function ThemeProvider(props: ParentProps): JSX.Element {
  return <ColorSchemeProvider initialValue="system">{props.children}</ColorSchemeProvider>;
}

/**
 * The switch itself, drawn as one of the game's buttons.
 *
 * It is pressed when the game is dark, and pressing it says `light` or
 * `dark` outright rather than going back to `system`: somebody who has
 * touched the switch has an opinion, and a third state they have to
 * cycle through to get back to where they were is not a switch
 */
export function ThemeToggle(props: { class?: string }): JSX.Element {
  const [, setScheme] = useColorScheme();
  /**
   * What the game is *actually* drawn in — `system` resolved against
   * the machine — since that is what the switch is showing and what it
   * is the opposite of
   */
  const showing = usePreferredColorScheme();

  return (
    <Toggle
      pressed={showing() === 'dark'}
      onChange={(dark: boolean) => {
        setScheme(dark ? 'dark' : 'light');
      }}
      // The label rather than the glyph is what a screen reader gets:
      // a sun is not a word
      title={showing() === 'dark' ? 'Switch to day' : 'Switch to night'}
      aria-label={showing() === 'dark' ? 'Switch to day' : 'Switch to night'}
      class={props.class}
    >
      <span aria-hidden="true">{showing() === 'dark' ? '☾' : '☀'}</span>
    </Toggle>
  );
}
