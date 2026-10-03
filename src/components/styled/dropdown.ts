import {
  type Placement,
  type UseFloatingReturn,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from 'solid-floating-ui';

/**
 * Where a list hung from a button goes: under it, or over it when the
 * window has no room below, kept on screen sideways, and never taller
 * than the room it was given. Drawn fixed in the portal container, so
 * no dialog panel or dock clips it.
 *
 * The room is handed to the list as `--drop-room`, which the list caps
 * its height at and scrolls past.
 */

/** How far from its button the list hangs */
const DROP_GAP = 6;

/** How close to the window's edge the list may come */
const EDGE = 8;

export interface DropdownOptions {
  open: () => boolean;
  placement: Placement;
  /** At least as wide as its button, for a list of the button's own choices */
  matchWidth?: boolean;
}

export default function useDropdown(options: DropdownOptions): UseFloatingReturn {
  return useFloating({
    get open() {
      return options.open();
    },
    placement: options.placement,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(DROP_GAP),
      flip({ padding: EDGE }),
      shift({ padding: EDGE }),
      size({
        padding: EDGE,
        apply({ availableHeight, rects, elements }) {
          elements.floating.style.setProperty('--drop-room', `${Math.max(0, availableHeight)}px`);
          if (options.matchWidth === true) {
            elements.floating.style.minWidth = `${rects.reference.width}px`;
          }
        },
      }),
    ],
  });
}
