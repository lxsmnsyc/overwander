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
  const creating = page.getByRole('tab', { name: 'Create account' });
  const register = page.getByRole('button', { name: 'Create account', exact: true });
  const menu = page.getByRole('navigation', { name: 'Game' });

  await expect(async () => {
    // A cold dev server can leave the page on "Loading session" for as
    // long as it takes to compile, and a page that never hydrated stays
    // there. Neither the form nor the world by then means reload
    try {
      await expect(creating.or(menu)).toBeVisible({ timeout: 30_000 });
    } catch (error) {
      await page.reload();
      throw error;
    }
    if (await creating.isVisible()) {
      await creating.click();
      await page.getByLabel('Email').fill(player.email);
      await page.getByLabel('New password').fill(player.password);
      await register.click();
    }
    await expect(menu).toBeVisible({ timeout: 20_000 });
  }).toPass({ timeout: 150_000 });

  // A dialog the start opens (a portal beside the player's first step)
  // covers the world, and a spec that presses a key or opens a panel
  // would wait out its timeout behind it
  if ((await openDialogs(page).count()) > 0) {
    await page.keyboard.press('Escape');
    await expect(openDialogs(page)).toHaveCount(0);
  }
  return player;
}

/**
 * Reload the page and wait for the world to come back. A reload that
 * lands while the session is still being read can stay on "Loading
 * session", so it is pressed again rather than waited on
 */
export async function reloadGame(page: Page): Promise<void> {
  await expect(async () => {
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible({ timeout: 15_000 });
  }).toPass({ timeout: 60_000 });
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
  Boxes: 'Boxes',
  Pokedex: 'Pokedex',
  Bag: 'Bag',
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

  const key = menu.getByRole('button', { name: 'Menu' });

  // Left open by an earlier panel: pressing it again would shut it
  if ((await key.getAttribute('aria-expanded')) !== 'true') {
    await key.click();
  }
  return menu;
}

/**
 * Open one of the things behind that button
 */
export async function openPanel(page: Page, label: keyof typeof MENU_DIALOGS): Promise<Locator> {
  const menu = await openMenu(page);

  // A key with something waiting wears a count after its name ("Gifts 16")
  await menu.getByRole('button', { name: new RegExp(`^${label}( \\d+)?$`) }).click();

  const dialog = dialogNamed(page, MENU_DIALOGS[label]);

  await expectOpen(dialog);
  return dialog;
}

/**
 * Take one gift off the shelf. The square is the button: claiming is
 * the only thing a shelf square does, and a pokemon's card carries the
 * same button, so the square is pressed the way a player presses it.
 *
 * The press is not the claim. It is a round trip, and one made while
 * the world is still coming up can be swallowed whole, so the shelf is
 * what says the claim landed and it is checked inside the retry
 */
async function claimSquare(
  page: Page,
  square: Locator,
  landed: () => Promise<boolean>,
): Promise<void> {
  await expect(async () => {
    if (await landed()) {
      return;
    }
    // Out of the way first, and the press dispatched rather than aimed:
    // the card a pointer opens over a square can land on top of it
    // between the check and the press, and a click aimed at the square
    // then reaches the card
    await page.mouse.move(0, 0);
    await square.dispatchEvent('click', undefined, { timeout: 2000 });
    await expect.poll(landed, { timeout: SETTLED }).toBe(true);
  }).toPass({ timeout: CLAIMED });
}

/**
 * Switch the shelf to one of its tabs. The pointer is taken away from
 * the squares first: a card that is still open over a square sits on
 * top of the tab bar and swallows the press
 */
export async function openShelfTab(
  page: Page,
  gifts: Locator,
  tab: 'Catches' | 'Items' | 'Encounters',
): Promise<void> {
  await page.mouse.move(0, 0);
  // Dispatched rather than aimed, like a square: a card still open over
  // the tab bar would take a pointer press
  await gifts.getByRole('tab', { name: new RegExp(`^${tab}`) }).dispatchEvent('click');
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

  await claimStarterFrom(page, gifts);
  await gifts.getByRole('button', { name: 'Close' }).click();
  await expectShut(gifts);
}

/**
 * Open the gifts shelf on its own page (`/demo/gifts`): the same shelf
 * for the signed-in player with no world behind it, so a spec that is
 * about gifts does not load the game to reach it
 */
export async function openGifts(page: Page): Promise<Locator> {
  await page.goto('/demo/gifts');

  const gifts = dialogNamed(page, GIFT);

  await expectOpen(gifts, 60_000);
  return gifts;
}

/** Take one starter and the balls off an open shelf */
export async function claimStarterFrom(page: Page, gifts: Locator): Promise<void> {
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
  await claimSquare(page, taking, async () => (await taking.count()) === 0);

  await openShelfTab(page, gifts, 'Items');

  const balls = gifts.getByRole('button', { name: /^Claim \d+ × / });

  await expect(balls).toBeVisible();
  await claimSquare(page, balls, async () => (await balls.count()) === 0);
}

/**
 * Open the player's collection, drawn as a box of squares
 */
export async function openBox(page: Page): Promise<Locator> {
  const catches = await openPanel(page, 'Boxes');

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
  const card = page.locator('[role="dialog"]:not([tc-dialog])');

  await expect(card).toBeVisible();
  await card.getByRole('button', { name: verb, exact: true }).click();
}
