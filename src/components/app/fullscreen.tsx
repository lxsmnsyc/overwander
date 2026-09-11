import { type JSX, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { Toggle } from 'terracotta';
import { ExpandIcon, ShrinkIcon } from '../icons';

/**
 * The game with the screen to itself.
 *
 * A browser's own bars cost a phone the better part of a fifth of its
 * height, and the game is one page that never navigates: there is
 * nothing up there a player needs while they are walking around. It is
 * asked of the document rather than of the board, so what fills the
 * screen is the whole game, battles and dialogs included.
 *
 * Nothing about it is remembered. A page may only go fullscreen from a
 * press, so a stored yes could not be acted on when the game opened,
 * and taking the screen at the first press of something else is the
 * game doing what nobody asked for.
 */

/**
 * Whether the browser will do it at all. An iPhone has fullscreen for
 * videos and nothing else, and a button that cannot do anything is
 * worse than no button.
 *
 * Kept for the whole page rather than inside the switch, so whatever
 * is drawn beside it can go when it does: the bar puts a divider in
 * front of it, and a divider with nothing after it is a line hanging
 * off the end of the bar. False until the switch has mounted, which
 * is what keeps it agreeing with the markup the server sent
 */
const [offered, setOffered] = createSignal(false);

export { offered as fullscreenOffered };

/**
 * The switch, drawn as one of the game's buttons. It is pressed while
 * the game has the screen
 */
export default function FullscreenToggle(props: { class?: string }): JSX.Element {
  const [filling, setFilling] = createSignal(false);

  onMount(() => {
    setOffered(document.fullscreenEnabled);
    setFilling(document.fullscreenElement != null);

    // Read off the browser rather than set when it is pressed: a
    // request can be refused, and Escape is as much a way out of
    // fullscreen as this button is
    const changed = (): void => {
      setFilling(document.fullscreenElement != null);
    };

    document.addEventListener('fullscreenchange', changed);
    onCleanup(() => {
      document.removeEventListener('fullscreenchange', changed);
    });
  });

  const fill = (wanted: boolean): void => {
    const asked = wanted ? document.documentElement.requestFullscreen() : document.exitFullscreen();

    asked.catch(() => {
      // A refusal leaves the game where it was, which is the whole of
      // what there is to do about it
    });
  };

  return (
    <Show when={offered()}>
      <Toggle
        pressed={filling()}
        onChange={fill}
        // The words rather than the arrows: a screen reader is not
        // shown which way they point
        title={filling() ? 'Leave fullscreen' : 'Fill the screen'}
        aria-label={filling() ? 'Leave fullscreen' : 'Fill the screen'}
        class={props.class}
      >
        <Show when={filling()} fallback={<ExpandIcon class="size-5" aria-hidden="true" />}>
          <ShrinkIcon class="size-5" aria-hidden="true" />
        </Show>
      </Toggle>
    </Show>
  );
}
