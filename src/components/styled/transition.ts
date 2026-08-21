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
 * There are two. `FADE` fades and grows, and belongs to a **dialog's
 * panel**. `SHEER` is the same fade with nothing else in it, and is
 * what everything else takes: the veil behind a dialog, a tooltip or
 * card placed against the window, and anything dropped from a control
 * it is attached to — a popover, a listbox, a combobox.
 *
 * The element it is spread onto has to be the one the portal already
 * contains, since opacity on an ancestor does not reach through a
 * portal to what was drawn somewhere else.
 *
 * Somebody who has asked for less motion gets a fade too short to
 * read rather than none at all, so that what is on screen still
 * arrives and leaves the way the rest of the game does.
 */

/**
 * The same arrival with the scale taken out: opacity alone.
 *
 * A veil behind a dialog has no edges to grow from, and a list
 * dropped from a button grows from the button rather than from
 * itself. It also keeps a transform off anything placed against the
 * window: a transform makes the element the containing block for
 * whatever is fixed inside it, which put a hover card a whole
 * viewport down the page
 */
export const SHEER = {
  enter: 'transition-opacity duration-250 ease-out motion-reduce:duration-75',
  enterFrom: 'opacity-0',
  enterTo: 'opacity-100',
  /** The resting state, once the fade in is over */
  entered: 'opacity-100',
  leave: 'transition-opacity duration-250 ease-in motion-reduce:duration-75',
  leaveFrom: 'opacity-100',
  leaveTo: 'opacity-0',
} as const;

/**
 * The arrival for a dialog's panel: it fades and grows from half its
 * size. Everything else takes `SHEER`.
 *
 * The property is `scale` rather than `transform`, because that is
 * what Tailwind's `scale-*` sets; a transition naming `transform`
 * animates nothing and the panel appears at full size. Both are named
 * in one `transition-[…]`, since two utilities each naming one are
 * settled by the order Tailwind emits them in
 */
const FADE = {
  enter: 'transition-[opacity,scale] duration-250 ease-out motion-reduce:duration-75',
  enterFrom: 'opacity-0 scale-50',
  enterTo: 'opacity-100 scale-100',
  entered: 'opacity-100 scale-100',
  leave: 'transition-[opacity,scale] duration-250 ease-in motion-reduce:duration-75',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo: 'opacity-0 scale-50',
} as const;

export default FADE;
