/**
 * How everything that floats over the game arrives and leaves.
 *
 * A dialog, a tooltip, a hover card and the list a filter drops are
 * all the same event — something appearing on top of what the player
 * was looking at — so they all fade rather than each picking their
 * own way in. Spread one into terracotta's `Transition`:
 *
 * ```tsx
 * <Transition show={isOpen} {...FADE}>…</Transition>
 * ```
 *
 * There are two. `FADE` fades and grows, and belongs to a **panel** —
 * a dialog's, a popover's. `SHEER` is the same fade with nothing else
 * in it, for the veil behind a dialog and for anything placed against
 * the window rather than laid out in it.
 *
 * The element it is spread onto has to be the one the portal already
 * contains, since opacity on an ancestor does not reach through a
 * portal to what was drawn somewhere else.
 *
 * The transition itself rides the `enterTo` and `leaveTo` classes
 * rather than the `enter` and `leave` ones. Terracotta adds those to
 * an element that is already in the page, so a fade written the usual
 * way animates the jump *to* transparent and then turns round — half a
 * second of nothing, and the card is up before the fade begins. Given
 * only at the far end, each side is a single move from where the
 * element already is.
 *
 * Somebody who has asked for less motion gets a fade too short to
 * read rather than none at all: terracotta unmounts on `transitionend`
 * and a transition that never runs never ends, which would leave every
 * dialog on the screen for good.
 */
/**
 * Put on whatever the transition wraps, always.
 *
 * Terracotta ends the fade at the first `transitionend` it hears, and
 * those bubble: a button inside a dialog finishing its own hover was
 * enough to take the whole dialog down a frame after it started to
 * leave. The fade's own event is fired at the element the transition
 * is on, so nothing of it is lost by keeping the children's to
 * themselves
 */
export function holdFade(event: TransitionEvent): void {
  event.stopPropagation();
}

/**
 * The same arrival with the scale taken out: opacity alone.
 *
 * It is for whatever is not a panel. A veil behind a dialog has no
 * edges to grow from, and a hover card or a tooltip is placed against
 * the window — a scale on those is a transform, and a transform makes
 * the element the containing block for anything fixed inside it, which
 * put a card a whole viewport down the page
 */
export const SHEER = {
  enterFrom: 'opacity-0',
  enterTo: 'transition-opacity duration-250 ease-out motion-reduce:duration-75 opacity-100',
  /** Held after the fade in, since `enterTo` is taken off at the end */
  entered: 'opacity-100',
  leaveFrom: 'opacity-100',
  leaveTo: 'transition-opacity duration-250 ease-in motion-reduce:duration-75 opacity-0',
} as const;

/**
 * The arrival for a panel: it fades and grows from half its size.
 * Everything else takes `SHEER`
 */
const FADE = {
  enterFrom: 'opacity-0 scale-50',
  enterTo:
    'transition-opacity transition-transform transform duration-250 ease-out motion-reduce:duration-75 opacity-100 scale-100',
  /** Held after the fade in, since `enterTo` is taken off at the end */
  entered: 'opacity-100 scale-100',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo:
    'transition-opacity transition-transform transform duration-250 ease-in motion-reduce:duration-75 opacity-0 scale-50',
} as const;

export default FADE;
