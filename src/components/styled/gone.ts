import { createEffect, onCleanup } from 'solid-js';

/**
 * Shut something that hangs off a host once the host has nothing left
 * of it.
 *
 * A card is closed by the pointer leaving, which is no help when what
 * it is about is emptied or taken out of the page instead. A host that
 * goes with its own component needs none of this — Solid takes the
 * card down with it — so what this answers is a host removed or
 * collapsed without that: a detached element measures nothing, which
 * is the one thing both look like
 */
export default function closeWhenGone(
  host: () => HTMLElement | undefined,
  open: () => boolean,
  close: () => void,
): void {
  createEffect(() => {
    const anchor = host();

    if (!open() || anchor == null) {
      return;
    }

    const watch = new ResizeObserver(() => {
      if (anchor.getClientRects().length === 0) {
        close();
      }
    });

    watch.observe(anchor);
    onCleanup(() => {
      watch.disconnect();
    });
  });
}
