/**
 * How everything that floats over the game arrives and leaves, in the
 * Field Kit's motion: a thing comes out of what opened it on a spring,
 * and leaves on the exit curve in 70% of the time it took to arrive.
 * Spread one into terracotta's `Transition` or `TransitionChild`:
 *
 * ```tsx
 * <TransitionChild {...FADE}>…</TransitionChild>
 * ```
 *
 * | preset | for                                           |
 * | ------ | --------------------------------------------- |
 * | FADE   | a dialog's panel: it springs in and grows     |
 * | SHEER  | a veil behind a dialog: opacity alone         |
 * | DROP   | a list or a menu hung from its button         |
 * | RISE   | a card placed against the window              |
 * | MORPH  | a control opening into a card in its place    |
 *
 * The resting state (`entered`) never carries a scale or a translate.
 * Either one makes the element the containing block for anything
 * `fixed` inside it, which put a hover card a whole viewport down the
 * page.
 *
 * Every preset is marked `motion-crossfade`, and its distances are CSS
 * variables, so reduce motion (in `src/app.css`) turns each of them
 * into a 120ms fade.
 */

/** Opacity alone, for the veil behind a dialog */
export const SHEER = {
  enter: 'motion-crossfade transition-opacity duration-(--motion-base) ease-settle',
  enterFrom: 'opacity-0',
  enterTo: 'opacity-100',
  /** The resting state, once the fade in is over */
  entered: 'opacity-100',
  leave: 'motion-crossfade transition-opacity duration-(--motion-base-exit) ease-exit',
  leaveFrom: 'opacity-100',
  leaveTo: 'opacity-0',
} as const;

/**
 * A list or a menu hung from its button: it grows out of the button's
 * side on a spring. Pair it with `dropOrigin(placement)` on the same
 * element, so it grows from the button rather than from its own middle
 */
export const DROP = {
  enter: 'motion-crossfade transition-[opacity,scale] duration-(--motion-base) ease-spring',
  enterFrom: 'opacity-0 scale-(--motion-drop)',
  enterTo: 'opacity-100 scale-100',
  entered: 'opacity-100',
  leave: 'motion-crossfade transition-[opacity,scale] duration-(--motion-base-exit) ease-exit',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo: 'opacity-0 scale-(--motion-drop)',
} as const;

/** A card placed against the window: it rises a few pixels as it fades in */
export const RISE = {
  enter: 'motion-crossfade transition-[opacity,translate] duration-(--motion-quick) ease-settle',
  enterFrom: 'opacity-0 translate-y-(--motion-rise)',
  enterTo: 'opacity-100 translate-y-0',
  entered: 'opacity-100',
  leave: 'motion-crossfade transition-[opacity,translate] duration-(--motion-quick-exit) ease-exit',
  leaveFrom: 'opacity-100 translate-y-0',
  leaveTo: 'opacity-0 translate-y-(--motion-rise)',
} as const;

/**
 * A control opening into a card in its own place: the card starts as
 * wide as the control and a sliver of its height, and springs to full
 * size. Put the origin on the control's edge (`origin-bottom` for a
 * capsule at the foot of the screen)
 */
export const MORPH = {
  enter: 'motion-crossfade transition-[opacity,scale] duration-(--motion-move) ease-spring',
  enterFrom: 'opacity-0 scale-x-(--motion-drop) scale-y-(--motion-grow-origin)',
  enterTo: 'opacity-100 scale-100',
  entered: 'opacity-100',
  leave: 'motion-crossfade transition-[opacity,scale] duration-(--motion-move-exit) ease-exit',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo: 'opacity-0 scale-x-(--motion-drop) scale-y-(--motion-grow-origin)',
} as const;

/**
 * Where a dropped list grows from, by Floating UI's placement: the
 * corner or the edge that touches its button. Written out whole so
 * Tailwind sees each class
 */
const ORIGINS: Record<string, string> = {
  bottom: 'origin-top',
  'bottom-start': 'origin-top-left',
  'bottom-end': 'origin-top-right',
  top: 'origin-bottom',
  'top-start': 'origin-bottom-left',
  'top-end': 'origin-bottom-right',
  left: 'origin-right',
  'left-start': 'origin-top-right',
  'left-end': 'origin-bottom-right',
  right: 'origin-left',
  'right-start': 'origin-top-left',
  'right-end': 'origin-bottom-left',
};

export function dropOrigin(placement: string): string {
  return ORIGINS[placement] ?? 'origin-top';
}

/**
 * A dialog's panel: it springs in from a little under its size and
 * leaves on the exit curve. The scale is the `scale` property, which
 * is what Tailwind's `scale-*` sets; a transition naming `transform`
 * would animate nothing
 */
const FADE = {
  enter: 'motion-crossfade transition-[opacity,scale] duration-(--motion-move) ease-spring',
  enterFrom: 'opacity-0 scale-(--motion-grow)',
  enterTo: 'opacity-100 scale-100',
  entered: 'opacity-100',
  leave: 'motion-crossfade transition-[opacity,scale] duration-(--motion-move-exit) ease-exit',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo: 'opacity-0 scale-(--motion-grow)',
} as const;

/**
 * The same, for a panel that grows out of the control that opened it:
 * it starts as a speck at that control and returns to it on close
 */
export const GROW = {
  ...FADE,
  enterFrom: 'opacity-0 scale-(--motion-grow-origin)',
  leaveTo: 'opacity-0 scale-(--motion-grow-origin)',
} as const;

export default FADE;
