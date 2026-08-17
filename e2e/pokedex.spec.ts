import { type Locator, type Page, expect, test } from '@playwright/test';
import { DEX_COLUMNS } from '../src/components/dex/PokedexCanvas';
import { patchDocument, uidOf } from './emulator';
import {
  type Player,
  SHEET,
  dialogNamed,
  dismissGift,
  expectOpen,
  openPanel,
  pressBoxSquare,
  signIn,
} from './game';

/**
 * The dex: everything there is, and how much of it the player has met.
 *
 * A new account is the one state worth testing here, because it is the
 * state the dex is mostly in for anybody: one species caught, one seen,
 * and a hundred and fifty squares with nothing behind them. What the
 * spec watches is that the grid is drawn at all, that an entry opens
 * out of it, and that the entry says the things a dex entry is for —
 * where the species lives and what it learns.
 */

/**
 * What one species' page is called. It is named apart from the dex it
 * opens out of, since both are on screen at once
 */
const DEX = 'Dex Entry';

/**
 * Press one square of the dex. The grid is one canvas rather than a
 * hundred and fifty elements, so which species is where has to be
 * worked out from the geometry — the same way the canvas works it out
 * from the pointer. Squares are square, so the height of one is the
 * width of one
 */
/**
 * Put a species in the player's dex, as met and kept.
 *
 * Which pokemon a new account is handed is the game's own roll, so a
 * spec that wants a **filled-in** entry cannot rely on having met any
 * particular species. The dex is the server's to write, so this writes
 * it as the emulator's owner and the page is read again
 */
async function stageDex(page: Page, player: Player, species: number): Promise<void> {
  const counted = { mapValue: { fields: { [String(species)]: { integerValue: '2' } } } };

  await patchDocument('pokedex', await uidOf(player), { seen: counted, caught: counted });
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
}

async function pressSquare(dex: Locator, index: number): Promise<void> {
  const grid = dex.getByRole('application', { name: /^Pokedex/ });

  await expect(grid).toBeVisible();

  const bounds = await grid.boundingBox();
  const cell = (bounds?.width ?? 0) / DEX_COLUMNS;

  await grid.click({
    position: {
      x: (index % DEX_COLUMNS) * cell + cell / 2,
      y: Math.floor(index / DEX_COLUMNS) * cell + cell / 2,
    },
  });
}

async function openEntry(page: Page, index: number): Promise<void> {
  await pressSquare(await openPanel(page, 'Pokedex'), index);
}

test.describe('the pokedex', () => {
  /**
   * Whoever registered for the test that is running. The suite runs one
   * spec at a time, so there is only ever one of them
   */
  let player: Player;

  test.beforeEach(async ({ page }) => {
    player = await signIn(page);
    await dismissGift(page);
  });

  test('counts what has been met against everything there is', async ({ page }) => {
    const dex = await openPanel(page, 'Pokedex');

    // A new player has been handed exactly one pokemon, so the dex
    // knows exactly one — and the registry it is counted against is
    // the whole of Gen 1
    await expect(dex.getByText(/\d+ caught/)).toBeVisible();
    await expect(dex.getByText(/of 151/)).toBeVisible();

    const grid = dex.getByRole('application', { name: /^Pokedex/ });

    await expect(grid).toBeVisible();

    // Wide enough to be a grid of squares. A canvas that failed to be
    // measured draws itself a pixel wide and is otherwise visible
    const bounds = await grid.boundingBox();

    expect(bounds?.width ?? 0).toBeGreaterThan(200);
    // Six across and five down, whatever page it is on: the dex is
    // paged rather than drawn in one column twenty-six rows long
    expect(bounds?.height ?? 0).toBeLessThan(bounds?.width ?? 0);
  });

  test('is read thirty at a time, addressed by the numbers on the page', async ({ page }) => {
    const dex = await openPanel(page, 'Pokedex');

    await expect(dex.getByText('#001 – #030')).toBeVisible();
    await expect(dex.getByRole('button', { name: 'Earlier pokemon' })).toBeDisabled();

    await dex.getByRole('button', { name: 'Later pokemon' }).click();
    await expect(dex.getByText('#031 – #060')).toBeVisible();
    await expect(dex.getByRole('button', { name: 'Earlier pokemon' })).toBeEnabled();

    // A hundred and fifty-one is five full pages and a part-full one,
    // and the last of them is where the dex stops
    for (let step = 0; step < 4; step++) {
      await dex.getByRole('button', { name: 'Later pokemon' }).click();
    }
    await expect(dex.getByText('#151 – #151')).toBeVisible();
    await expect(dex.getByRole('button', { name: 'Later pokemon' })).toBeDisabled();
  });

  test('opens an entry that says what the species is and where it lives', async ({ page }) => {
    // Bulbasaur, met and kept. Which pokemon a new account is handed is
    // the game's own roll, so the one species this asserts against is
    // written into the dex rather than hoped for
    await stageDex(page, player, 1);
    await openEntry(page, 0);

    const entry = dialogNamed(page, DEX);

    await expectOpen(entry);
    await expect(entry.getByRole('heading', { name: /#001 Bulbasaur/ })).toBeVisible();
    await expect(entry.getByText('Seed Pokemon')).toBeVisible();

    // How many of it have been met and kept, which is what a dex is
    // counted by
    await expect(entry.getByText('2 seen')).toBeVisible();
    await expect(entry.getByText('2 caught')).toBeVisible();

    // What a dex is actually for: where to go looking, and what it
    // learns on the way up
    await expect(entry.getByRole('heading', { name: 'Where it lives' })).toBeVisible();
    await expect(entry.getByRole('tab', { name: 'Level' })).toBeVisible();
    await expect(entry.getByRole('tab', { name: 'Machines' })).toBeVisible();
    await expect(entry.getByRole('tab', { name: 'Egg' })).toBeVisible();
  });

  test('gives nothing away about a species nobody has met', async ({ page }) => {
    // The last page holds the legendaries, which a new account has
    // certainly not met
    const dex = await openPanel(page, 'Pokedex');

    // Four pages on is #121 – #150, and Articuno is the twenty-fourth
    // square of it
    for (let step = 0; step < 4; step++) {
      await dex.getByRole('button', { name: 'Later pokemon' }).click();
    }
    await pressSquare(dex, 23);

    const entry = dialogNamed(page, DEX);

    await expectOpen(entry);

    // Its number, and two question marks. The number is the dex's own
    // and is known before the pokemon is; the name and the kind of
    // pokemon it is are the answers somebody is out looking for
    await expect(entry.getByRole('heading', { name: /#144 \?\?\?/ })).toBeVisible();
    await expect(entry.getByRole('heading', { name: 'Where it lives' })).toBeHidden();
    await expect(entry.getByRole('heading', { name: 'Base stats' })).toBeHidden();
    await expect(entry.getByRole('tab', { name: 'Level' })).toBeHidden();
  });

  test('walks to the next pokemon from the sprite rather than the list', async ({ page }) => {
    await openEntry(page, 0);

    const entry = dialogNamed(page, DEX);

    await expectOpen(entry);

    // The first entry has nothing before it, so the arrow that would
    // go there is refused rather than hidden — the pokemon would
    // otherwise slide sideways on the first and last entries
    await expect(entry.getByRole('button', { name: 'Previous pokemon' })).toBeDisabled();

    await entry.getByRole('button', { name: 'Next pokemon' }).click();
    // By number rather than by name: what a new account has met is the
    // game's own roll, and an unmet species keeps its name to itself
    await expect(entry.getByRole('heading', { name: /#002/ })).toBeVisible();
  });

  test('steps between the player`s own pokemon from the catch sheet', async ({ page }) => {
    const catches = await openPanel(page, 'Catches');
    const box = catches.getByRole('group', { name: /^Box of pokemon/ });

    await expect(box).toBeVisible();
    await pressBoxSquare(page, box, 'Open');

    const sheet = dialogNamed(page, SHEET);

    await expectOpen(sheet);

    // A new player holds exactly one pokemon, so both ends of the run
    // are this one: the arrows are there and both are refused
    await expect(sheet.getByRole('button', { name: 'Previous pokemon' })).toBeDisabled();
    await expect(sheet.getByRole('button', { name: 'Next pokemon' })).toBeDisabled();
  });
});
