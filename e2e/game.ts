import { type Locator, type Page, expect } from '@playwright/test';

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
 * And what the shelf of gifts is called, since a new player has to go
 * to it before they have a pokemon at all
 */
export const GIFT = 'Gifts';

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
 * Register and land in the world. Resolves once the menu at the bottom
 * is up, which is the game's own signal that it has a player and a
 * position
 */
export async function signIn(page: Page, player: Player = newPlayer()): Promise<Player> {
  await page.goto('/');

  // Filled and pressed again if the world does not arrive: a fill that
  // lands before the page has hydrated is wiped with the DOM it typed
  // into, and the local auth service answers an occasional signup with
  // a 504. Neither is what any spec is testing
  const register = page.getByRole('button', { name: 'Register', exact: true });

  await expect(async () => {
    if (await register.isVisible()) {
      await page.getByPlaceholder('Email').fill(player.email);
      await page.getByPlaceholder('Password').fill(player.password);
      await register.click();
    }
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible({ timeout: 20_000 });
  }).toPass({ timeout: 60_000 });
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
/**
 * Every dialog that is still open.
 *
 * A dialog that has been answered stays in the page for the length of
 * its fade, `inert` and out of the accessibility tree — which the
 * browser honours and Playwright's own role engine does not. `data-open`
 * is what the dialogs mark themselves with, and it is the only thing
 * that tells the two apart from out here
 */
export function openDialogs(page: Page): Locator {
  return page.locator('[tc-dialog][data-open]');
}

export function dialogNamed(page: Page, name: string | RegExp): Locator {
  // `and` rather than a descendant search: the marked element is the
  // dialog itself, not something inside it
  return page.getByRole('dialog', { name }).and(openDialogs(page));
}

/**
 * The paper a dialog is drawn on.
 *
 * The element that calls itself a dialog is a wrapper of
 * fixed-position children, so it has no height of its own: asking
 * whether *it* can be seen always answers no. The panel is the last
 * of its children **before** the dialog's own portal container, which
 * stands after everything it wraps and is empty until something
 * floats
 */
export function panelOf(dialog: Locator): Locator {
  return dialog.locator('> div:not([data-portals])').last();
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
 * Opening the gifts is a round trip that rolls a pokemon and writes it
 * down before it can list anything, and that has been measured at a
 * little over three seconds — which makes the default five a coin toss
 * rather than a limit
 */
export const CLAIMED = 30_000;

/**
 * How long one attempt at a claim is given to show up on the shelf
 * before it is pressed again. Short next to `CLAIMED`, which is the
 * whole budget for however many attempts that takes
 */
const SETTLED = 5_000;

export async function expectShut(dialog: Locator): Promise<void> {
  await expect(dialog).not.toBeAttached();
}

/**
 * What the dialog behind each key of the menu is called. Most of them
 * say the same word on the key and in the heading; the world is the
 * exception, since the map is a picture of it rather than the thing
 */
const MENU_DIALOGS: Record<string, string> = {
  Profile: 'Profile',
  World: 'World Map',
  Catches: 'Catches',
  Pokedex: 'Pokedex',
  Inventory: 'Inventory',
  Raids: 'Raids',
  Gifts: 'Gifts',
  Quests: 'Quests',
  Battle: 'Battle',
};

/**
 * Pull out the menu at the bottom of the world. Everything that is not
 * the world is behind it, and it is one button rather than a row of
 * them, so every one of these is two presses
 */
/**
 * Wait until nothing on screen is still moving.
 *
 * Dialogs and cards grow into place, so anything measured or hovered
 * the instant it appears is measured mid-animation — a panel half its
 * final width, or a square that slides out from under the pointer
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.getAnimations().every((animation) => animation.playState !== 'running'),
    undefined,
    { timeout: 5_000 },
  );
}

export async function openMenu(page: Page): Promise<Locator> {
  const menu = page.getByRole('navigation', { name: 'Game' });

  await menu.getByRole('button', { name: 'Menu' }).click();
  return menu;
}

/**
 * Open one of the things behind that button
 */
export async function openPanel(page: Page, label: keyof typeof MENU_DIALOGS): Promise<Locator> {
  const menu = await openMenu(page);

  await menu.getByRole('button', { name: label, exact: true }).click();

  const dialog = dialogNamed(page, MENU_DIALOGS[label]);

  await expectOpen(dialog);
  return dialog;
}

/**
 * Open the sheet's Actions menu and press one of its entries.
 *
 * The sheet recentres as its late reads land, and an entry clicked
 * mid-move lands outside the panel — which the menu reads as an
 * outside click and closes. So the pair is retried from scratch:
 * reopen if it shut, then press
 */
export async function chooseAction(page: Page, sheet: Locator, action: string): Promise<void> {
  const trigger = sheet.getByRole('button', { name: /Actions/ });
  const item = page.getByRole('menuitem', { name: action, exact: true });

  await expect(async () => {
    // An entry that opens a dialog can swap the whole sheet away
    // beneath it — the sheet holds itself shut while the smaller
    // question is up — so a vanished trigger is a taken press, not
    // something to retry
    if (!(await trigger.isVisible())) {
      return;
    }
    // Dispatched rather than aimed: the sheet recentres and remounts
    // as its late reads land, and a pointer press aimed at where the
    // menu stood a frame ago lands on the overlay behind it, closing
    // the sheet. A dispatched click reaches the entry wherever it is,
    // and the menu closing on it is the sign it was taken
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
      await trigger.dispatchEvent('click');
    }
    await expect(item).toBeVisible({ timeout: 2000 });
    await item.dispatchEvent('click');
    // Taken means gone: the entry leaves with the closing panel once
    // the fade ends, and with the whole menu when the sheet swaps
    await expect(item).not.toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: CLAIMED });
}

/**
 * Take one gift off the shelf. The square is a picture and the Claim
 * button is in the card over it, so it is taken the way a player takes
 * one: hover, wait for the card, press it
 */
async function claimGift(
  page: Page,
  square: Locator,
  landed?: () => Promise<boolean>,
): Promise<void> {
  const card = page.getByRole('dialog', { name: /^(Gift|Info)$/ });

  // Hovered again from scratch on each attempt. A card that closes
  // while the button in it is being pressed — the shelf redrawing
  // underneath, the pointer crossing a corner — is gone for good
  // otherwise: a retried click never hovers anything again
  await expect(async () => {
    // The press is not the claim. It is a round trip, and one made
    // while the world is still coming up can be swallowed whole,
    // which used to leave the shelf as it was and the caller waiting
    // on a square that was never going to go. So the shelf itself is
    // what says the claim landed, and it is checked inside the retry
    if (landed != null && (await landed())) {
      return;
    }
    // Out of the way first: a hover that moves the pointer nowhere
    // sends no `mouseenter`, and the card never opens
    await page.mouse.move(0, 0);
    await square.hover();
    await expect(card).toBeVisible({ timeout: 2000 });
    await card.getByRole('button', { name: 'Claim', exact: true }).click({ timeout: 2000 });

    if (landed != null) {
      await expect.poll(landed, { timeout: SETTLED }).toBe(true);
    }
  }).toPass({ timeout: CLAIMED });
}

/**
 * Go and get the starter, which is where every account begins.
 *
 * Nothing is handed to anybody any more: a new player owns no pokemon
 * until they open the gifts and take the two waiting there. Most specs
 * want the pokemon and the balls rather than the shelf, and call this
 * before anything else; a spec that is *about* the gifts asserts on
 * them itself
 */
export async function claimStarter(page: Page): Promise<void> {
  const gifts = await openPanel(page, 'Gifts');
  // Waited for rather than looked for: the shelf is empty until the
  // server has written the offers down. Every starter stands on every
  // shelf, so one of them is taken and the rest are left. The squares
  // are buttons now, and the card's press rides on them too
  const pokemon = gifts.getByRole('button', { name: /^Claim Lv\./ });

  await expect(pokemon.first()).toBeVisible({ timeout: CLAIMED });

  // The one being taken, by its own name rather than by its place in
  // the row. A retry has to be able to go back for the *same* starter:
  // aimed at whichever is first, a second attempt made after a slow
  // claim finally landed would take a second pokemon
  const named = await pokemon.first().getAttribute('aria-label');

  expect(named).not.toBeNull();

  const taking = gifts.getByRole('button', { name: named ?? '', exact: true });

  // The shelf is read again after a claim, so the square goes when the
  // server answers rather than when the press lands. That square going
  // is the claim; until it does, the press never reached the shelf
  await claimGift(page, taking, async () => (await taking.count()) === 0);

  const balls = gifts.getByRole('button', { name: /^Claim \d+ × / });

  await expect(balls).toBeVisible();
  await claimGift(page, balls, async () => (await balls.count()) === 0);

  await gifts.getByRole('button', { name: 'Close' }).click();
  await expectShut(gifts);
}

/**
 * Open the player's collection, drawn as a box of squares
 */
export async function openBox(page: Page): Promise<Locator> {
  const catches = await openPanel(page, 'Catches');

  // By its own name rather than "the grid in the panel": the squares are
  // laid out inside it, and a bare lookup matches whatever else the
  // panel draws beside it
  const box = catches.getByRole('group', { name: /^Box of pokemon/ });

  await expect(box).toBeVisible();
  return box;
}

/**
 * Take whatever a square of a box offers.
 *
 * What acts on a square is in the card that comes up when the pointer
 * rests there, so a square is pressed the way a player presses one:
 * hover, wait for the card, press what it says
 */
export async function pressBoxSquare(
  page: Page,
  box: Locator,
  verb: string,
  index = 0,
): Promise<void> {
  // The dialog it sits in grows into place; hovering before that is
  // over puts the pointer where the square is about to stop being
  await settled(page);
  // A square that acts is a button; one whose card holds the only
  // button is a picture, since a keyboard offered thirty stops that
  // lead nowhere would have to walk past all of them. A box is one or
  // the other throughout, so either way this is the squares
  await box.getByRole('button').or(box.getByRole('img')).nth(index).hover();

  // Not one of `openDialogs`: a hover card is our own element rather
  // than a terracotta dialog, and carries no `tc-dialog`
  const card = page.getByRole('dialog', { name: 'Info' });

  await expect(card).toBeVisible();
  await card.getByRole('button', { name: verb, exact: true }).click();
}

/**
 * Open the record behind a square. The squares are newest first, so
 * nothing is the pokemon the account was handed
 */
export async function openCatch(page: Page, index = 0): Promise<Locator> {
  await pressBoxSquare(page, await openBox(page), 'Open', index);

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
  await settled(dialog.page());

  const outer = await panelOf(dialog).boundingBox();
  const inner = await inside.boundingBox();

  expect(outer, 'the panel should be on screen').not.toBeNull();
  expect(inner, 'the thing being measured should be on screen').not.toBeNull();

  const middle = (outer?.x ?? 0) + (outer?.width ?? 0) / 2;

  return Math.abs((inner?.x ?? 0) + (inner?.width ?? 0) / 2 - middle);
}
