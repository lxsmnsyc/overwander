import { type Locator, type Page, expect } from '@playwright/test';
import { BOX_COLUMNS, BOX_ROWS } from '../src/components/CatchBoxCanvas';

/**
 * What every browser test needs before it can test anything: an
 * account, a world, and a way to reach the parts of the game that are
 * drawn rather than laid out.
 *
 * These are written against what a player can see — a button with a
 * word on it, a dialog with a name — rather than against class names
 * or component internals. A test that reaches through the markup
 * passes until somebody renames a `div`; a test that presses "Profile"
 * fails when the player can no longer press Profile, which is the only
 * failure worth being told about.
 */

/**
 * What the catch sheet is called. It is the panel's own name rather
 * than the pokemon's, so it is the same for every catch
 */
export const SHEET = 'Pokemon Info';

/**
 * And what the gift is called, since a new player meets it before
 * anything else
 */
export const GIFT = 'Mystery Gift';

/**
 * And what the second half of a giving is called: the pokemon is the
 * congratulation, and what came with it is its own notice
 */
export const ROAD = 'For the road';

export interface Player {
  email: string;
  password: string;
}

/**
 * An account nobody has used before.
 *
 * Each spec registers its own rather than sharing one, because a great
 * deal of what the game does happens once: the starter pokemon, the
 * twenty Poke Balls, the gift dialog that announces them. A suite
 * built on a reused account would test the second visit and never the
 * first — and the first is where a new player's whole experience is
 */
export function newPlayer(): Player {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

  return { email: `player-${stamp}@example.com`, password: 'walking-in-the-tall-grass' };
}

/**
 * Register and land in the world. Resolves once the action bar is up,
 * which is the game's own signal that it has a player and a position
 */
export async function signIn(page: Page, player: Player = newPlayer()): Promise<Player> {
  await page.goto('/');

  await page.getByPlaceholder('Email').fill(player.email);
  await page.getByPlaceholder('Password').fill(player.password);
  await page.getByRole('button', { name: 'Register', exact: true }).click();

  await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
  return player;
}

/**
 * One dialog, by the name it is announced under.
 *
 * Asking for "the dialog on top" is the obvious thing to write and the
 * wrong thing: several are open at once — a catch sheet over the
 * profile it was opened from — so which one "the top" means depends on
 * the order they happen to be mounted in. Every dialog in the game is
 * named, and the name is what a player sees at the top of it, so that
 * is what these ask for
 */
export function dialogNamed(page: Page, name: string | RegExp): Locator {
  return page.getByRole('dialog', { name });
}

/**
 * The paper a dialog is drawn on.
 *
 * The element that calls itself a dialog is a wrapper holding two
 * fixed-position children — the overlay behind and the panel in
 * front — so it has no height of its own. Asking whether *it* can be
 * seen always answers no, and measuring it measures nothing. The panel
 * is the second of those children, and it is the thing on screen
 */
export function panelOf(dialog: Locator): Locator {
  return dialog.locator('> div').last();
}

/**
 * Whether the dialog is up.
 *
 * Open and shut are attached and detached rather than shown and
 * hidden: terracotta takes a closed dialog out of the document
 * altogether, so there is nothing left to be hidden
 */
export async function expectOpen(dialog: Locator, timeout?: number): Promise<void> {
  // Attached **and** drawn. Being in the document is the earlier of
  // the two by a frame or so, and a dialog that is merely attached has
  // not yet trapped the keyboard — a test that pressed Escape on it
  // that early was pressing Escape at nothing
  await expect(dialog).toBeAttached({ timeout });
  await expect(panelOf(dialog)).toBeVisible({ timeout });
}

/**
 * How long to wait for something the server has to build first.
 *
 * The starter gift is the one dialog nobody pressed a button for: it
 * opens when a token has been fetched and a transaction has picked a
 * pokemon and written the record, the balls and the claim marker.
 * That has been measured at a little over three seconds, which makes
 * the default five a coin toss rather than a limit
 */
export const CLAIMED = 30_000;

export async function expectShut(dialog: Locator): Promise<void> {
  await expect(dialog).not.toBeAttached();
}

/**
 * What the dialog behind each button on the bar is called. Three of
 * the four say the same word on the button and in the heading; the
 * map is the exception
 */
const BAR_DIALOGS: Record<string, string> = {
  Profile: 'Profile',
  Map: 'World Map',
  Raids: 'Raids',
  Auctions: 'Auctions',
};

/**
 * Wait for the starter gift and take it.
 *
 * It is waited for rather than checked for. The claim is a round trip
 * — the server picks the pokemon, writes the record and the balls, and
 * only then does the dialog open — so it lands a second or two after
 * the world does. A spec that merely looked for it would usually find
 * nothing, walk on, and have the gift open over whatever it opened
 * next; every new player gets one, so the right thing to do is wait.
 *
 * A spec that is *about* the gift asserts on it first and calls this
 * afterwards
 */
export async function dismissGift(page: Page): Promise<void> {
  const thanks = page.getByRole('button', { name: 'Thanks' });

  await expect(thanks).toBeVisible({ timeout: CLAIMED });

  // A giving is two notices — the pokemon, then what came with it —
  // and a spec that only wanted the world back has to see both off.
  // Bounded rather than looped on the button alone, so a Thanks that
  // stopped closing anything fails here instead of spinning
  for (let step = 0; step < 3 && (await thanks.isVisible()); step++) {
    await thanks.click();
  }
  await expect(thanks).toBeHidden();
}

/**
 * Open one of the four things behind the bar at the bottom
 */
export async function openBar(page: Page, label: keyof typeof BAR_DIALOGS): Promise<Locator> {
  await page.getByRole('navigation', { name: 'Game' }).getByRole('button', { name: label }).click();

  const dialog = dialogNamed(page, BAR_DIALOGS[label]);

  await expectOpen(dialog);
  return dialog;
}

/**
 * Open the player's collection, drawn as a box of squares
 */
export async function openBox(page: Page): Promise<Locator> {
  const profile = await openBar(page, 'Profile');

  // A tab rather than a button: terracotta gives the tab strip the
  // roles a tab strip has, and pressing it by the wrong one waits
  // forever for something that was never there
  await profile.getByRole('tab', { name: 'Catches' }).click();

  // By its own name rather than "the canvas in the profile". The
  // profile draws more than one now — the buddy card has a sprite of
  // its own — and a bare `canvas` lookup matches both
  const box = profile.getByRole('application', { name: /^Box of pokemon/ });

  await expect(box).toBeVisible();
  return box;
}

/**
 * Press a square of the box.
 *
 * The box is one canvas rather than thirty elements, so there is
 * nothing to press by name: which pokemon is where has to be worked
 * out from the geometry, the same way the canvas works it out from the
 * pointer. The grid is imported from the component so the two cannot
 * drift apart
 */
export async function openCatch(page: Page, index = 0): Promise<Locator> {
  const box = await openBox(page);
  const bounds = await box.boundingBox();

  expect(bounds, 'the box should have been drawn').not.toBeNull();

  const cell = {
    width: (bounds?.width ?? 0) / BOX_COLUMNS,
    height: (bounds?.height ?? 0) / BOX_ROWS,
  };

  await box.click({
    position: {
      x: (index % BOX_COLUMNS) * cell.width + cell.width / 2,
      y: Math.floor(index / BOX_COLUMNS) * cell.height + cell.height / 2,
    },
  });

  const sheet = dialogNamed(page, SHEET);

  await expectOpen(sheet);
  return sheet;
}

/**
 * How far a thing sits from the middle of the panel it is in, in
 * pixels. A centred heading is a couple of pixels off at most; one
 * that is laid out from the left is off by half the panel
 */
export async function offCentre(dialog: Locator, inside: Locator): Promise<number> {
  const outer = await panelOf(dialog).boundingBox();
  const inner = await inside.boundingBox();

  expect(outer, 'the panel should be on screen').not.toBeNull();
  expect(inner, 'the thing being measured should be on screen').not.toBeNull();

  const middle = (outer?.x ?? 0) + (outer?.width ?? 0) / 2;

  return Math.abs((inner?.x ?? 0) + (inner?.width ?? 0) / 2 - middle);
}
