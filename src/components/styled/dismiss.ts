import { createEffect, onCleanup } from 'solid-js';

/**
 * Shut something that is hanging open the moment the pointer or the
 * keyboard goes elsewhere on the page.
 *
 * Terracotta closes a listbox when the focus leaves the options
 * themselves, which is the keyboard and only the keyboard: a click on
 * ground that takes no focus moves none, so the list stayed down over
 * a page the player had gone back to reading. `root` is the whole
 * control — the button, the list and anything else inside it — since
 * a press on any of that is not a press away from it
 */
export default function dismissOutside(
  root: () => HTMLElement | undefined,
  open: () => boolean,
  close: () => void,
): void {
  createEffect(() => {
    if (!open()) {
      return;
    }

    const away = (event: Event): void => {
      const inside = root();

      if (inside != null && event.target instanceof Node && !inside.contains(event.target)) {
        close();
      }
    };

    // Captured on the way down, so something that stops the event
    // before it bubbles cannot leave the list open behind it
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('focusin', away, true);

    onCleanup(() => {
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('focusin', away, true);
    });
  });
}
