/**
 * The keys the game itself answers to, and when it is listening.
 *
 * Every one of them is read at the window rather than on the thing it
 * acts on: the board is a canvas that may never have been clicked, and
 * a player who has just closed a dialog is focused on nothing at all.
 *
 * The four directions are the **game's** directions rather than the
 * overworld's. Anything that comes to want a direction takes them from
 * here, so a player who has bound the letters once has bound them for
 * whatever asks next, and what each one means is the asker's business:
 * north on the board is up on a list.
 */

/** A way about the world, which is what the arrows are always for */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** What a player can bind a key to. The arrows are not among them */
export type GameAction = Direction | 'interact' | 'menu';

export type KeyBinds = Record<GameAction, string>;

/**
 * The keys an unasked machine plays with: the hand that is already on
 * the board, with Enter for what is in front of the player and M for
 * the bar along the bottom
 */
export const DEFAULT_BINDS: KeyBinds = {
  up: 'w',
  down: 's',
  left: 'a',
  right: 'd',
  interact: 'Enter',
  menu: 'm',
};

/**
 * What each bind is called where a player is asked to set it. Named
 * for the direction rather than for what the overworld does with it,
 * since the overworld is not the only thing that will ask
 */
export const ACTION_NAMES: Record<GameAction, string> = {
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
  interact: 'Interact',
  menu: 'Menu',
};

/** The order they are offered in, which is the shape of the keys */
export const ACTION_ORDER: GameAction[] = ['up', 'left', 'down', 'right', 'interact', 'menu'];

/**
 * The arrows, which are not bindable and always walk.
 *
 * A player who has rebound the letters still has somewhere to walk
 * from, and a keyboard whose arrows are the obvious thing to reach for
 * should not have to be told they are
 */
const ARROWS = new Map<string, Direction>([
  ['ArrowUp', 'up'],
  ['ArrowDown', 'down'],
  ['ArrowLeft', 'left'],
  ['ArrowRight', 'right'],
]);

/**
 * A key as it is written down and compared: a letter in lower case,
 * and everything else as the browser names it
 */
export function keyOf(event: KeyboardEvent): string {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

/**
 * What a key does, or nothing where it does nothing.
 *
 * The binds are handed in rather than read here: this module is what
 * `settings.ts` takes its defaults from, so reading the settings back
 * would be the two of them importing each other
 */
export function actionOf(event: KeyboardEvent, binds: KeyBinds): GameAction | null {
  const arrow = ARROWS.get(event.key);

  if (arrow != null) {
    return arrow;
  }

  const pressed = keyOf(event);

  return ACTION_ORDER.find((action) => binds[action] === pressed) ?? null;
}

/** What owns its own keys because the player is typing into it */
const TYPED_IN = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** What answers Enter and Space itself, so the game must not */
const PRESSABLE = new Set(['BUTTON', 'A', 'SUMMARY']);

/**
 * Whether a press is the game's to act on.
 *
 * The plain answer is yes: the board is a canvas that may never have
 * been clicked, and a player who has just closed a dialog is focused
 * on nothing at all, so the keys cannot be hung off either.
 *
 * Three things say no. A press carrying a modifier is the browser's. A
 * field being typed into owns every key, including the letters the
 * world walks on. And anything inside a dialog, a menu or a dropped
 * list is what the player is answering: walking about behind an open
 * panel is not what a direction means there.
 *
 * A button that merely happens to hold the focus is **not** one of
 * them. A player who pressed something a moment ago is focused on it
 * for as long as they do not click elsewhere, and letters that stop
 * walking until the board is clicked again read as the game ignoring
 * the keyboard. What such a button does own is Enter and Space, since
 * those are how it is pressed
 */
export function forTheGame(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  const focused = document.activeElement;

  if (focused == null || focused === document.body) {
    return true;
  }
  if (focused.hasAttribute('data-game-keys')) {
    return true;
  }
  if (
    TYPED_IN.has(focused.tagName) ||
    (focused instanceof HTMLElement && focused.isContentEditable)
  ) {
    return false;
  }
  if (focused.closest('[role="dialog"], [role="menu"], [role="listbox"]') != null) {
    return false;
  }
  return !(event.key === 'Enter' || event.key === ' ') || !PRESSABLE.has(focused.tagName);
}
