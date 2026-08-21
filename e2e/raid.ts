import { type Page, expect } from '@playwright/test';
import { getLocalOffset } from '../src/auth/local-time';
import Biome from '../src/data/ids/biome';
import { Species } from '../src/data/ids/species';
import { RaidKind } from '../src/auth/raid-record';
import { RAID_INTERVAL } from '../src/overworld/chunk-snapshot';
import { clearIdleRaids, insertRow, uidOf } from './admin';
import { type Player, pressBoxSquare } from './game';

/**
 * Staging a raid, so the fight can be tested at all.
 *
 * Every raid the game itself stages is one somebody walked to: a lair
 * has to be under the player's feet, in the right window, in a chunk
 * the world happened to put one in. None of that can be arranged from
 * a browser test, which is why the raid the player *leaves* — the one
 * bug that keeps coming back — had never been exercised end to end.
 *
 * So the lobby is written straight into the emulator. Everything after
 * that is the real game: the raids panel lists it because it is a live
 * raid, joining it goes through the server, starting it writes a real
 * battle from the real teams, and leaving it is the button under test.
 * The only thing skipped is the walk.
 *
 * The writes go in as the emulator's owner — see
 * [`emulator.ts`](./emulator.ts) — which is what lets a test put a
 * document somewhere the security rules would not let a player put one.
 */

/**
 * Which chunk the staged lobby claims to stand in. Nothing reads it
 * back — the lobby is reached from the raids panel rather than by
 * walking to it — so it only has to be a chunk-shaped thing
 */
const CHUNK = { seed: 'e2e-lair', x: 0, y: 0 };

/**
 * Where in the chunk it stands. Only the id is derived from it
 */
const CELL = 42;

/**
 * The window the panel is listing. It is the player's own local one:
 * the raids query matches the window *and* the zone it was read in,
 * and Node and the browser share this machine's clock
 */
function currentWindow(): { timestamp: number; offset: number } {
  const offset = getLocalOffset();
  const local = Date.now() + offset * 60 * 1000;

  return { timestamp: Math.floor(local / RAID_INTERVAL) * RAID_INTERVAL, offset };
}

/**
 * A raid document, in the shape Firestore's REST API wants it
 */
function raidFields(
  host: string,
  window: { timestamp: number; offset: number },
): Record<string, unknown> {
  return {
    kind: RaidKind.Legendary,
    lair: null,
    species: Species.Articuno,
    trait_value: 1234,
    host,
    battle_id: null,
    window_at: window.timestamp,
    utc_offset: window.offset,
    chunk_seed: CHUNK.seed,
    chunk_x: CHUNK.x,
    chunk_y: CHUNK.y,
    biome: Biome.Tundra,
    cell: CELL,
    cleared: false,
  };
}

/**
 * Put a lobby in the world with this player hosting it, and answer
 * what it is called. The name is how the spec finds its row among any
 * other raids the emulator happens to be holding
 */
export async function stageRaid(player: Player): Promise<string> {
  const host = await uidOf(player);
  const window = currentWindow();
  const id = `e2e-${host}-${window.timestamp}`;

  // The listing is window-wide and the specs click its first row, so
  // the board is swept of idle lobbies before this one goes up
  await clearIdleRaids();
  await insertRow('raids', { id, ...raidFields(host, window) });
  return id;
}

/**
 * Walk the staged lobby all the way to a running battle: open the
 * raids panel, go into the lobby, bring the starter, and start it.
 *
 * Every step is the game's own. The only thing this knows that a
 * player does not is that the lobby is there to be found
 */
export async function enterRaid(page: Page): Promise<void> {
  const menu = page.getByRole('navigation', { name: 'Game' });

  // Two presses: the menu is one button at the bottom of the world,
  // and the raids are a key inside it
  await menu.getByRole('button', { name: 'Menu' }).click();
  await menu.getByRole('button', { name: 'Raids', exact: true }).click();

  const panel = page.getByRole('dialog', { name: 'Raids' });
  const lobby = panel.getByRole('listitem').getByRole('button').first();

  // The listing is opened on a window that comes from the server's
  // clock, so the row lands a round trip after the panel does
  await expect(lobby).toBeVisible({ timeout: 20_000 });
  await lobby.click();

  // Bring the starter. The picker is the ordinary catch picker, drawn as
  // a box of squares, so the pokemon is added from the card its square
  // puts up
  await page.getByRole('button', { name: 'Form a team' }).click();

  const team = page.getByRole('dialog', { name: 'Form a team' });
  const box = team.getByRole('group', { name: /^Box of pokemon/ });

  await expect(box).toBeVisible();
  await pressBoxSquare(page, box, 'Add');
  await team.getByRole('button', { name: /^Join with 1/ }).click();

  // The host's own button. It is refused until a party has joined, so
  // its becoming pressable is the lobby confirming the team landed
  const start = page.getByRole('button', { name: 'Start', exact: true });

  await expect(start).toBeEnabled({ timeout: 20_000 });
  await start.click();
}
