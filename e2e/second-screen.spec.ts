import { expect, test } from '@playwright/test';
import { admin, uidOf } from './admin';
import { newPlayer, settled, signIn } from './game';

/**
 * One walk, two screens.
 *
 * A player signed in twice has two boards writing one position row. A
 * second screen is staged by writing the row directly rather than by
 * driving a second browser: what is being tested is what a screen does
 * when the walk turns up somewhere else, and a service-role write is
 * that news with none of the second walk around it.
 */

/** How far away the other screen is, in chunks. Any distance will do */
const AWAY = 5;

test('a screen stands down when the walk moves elsewhere', async ({ page }) => {
  const player = newPlayer();

  await signIn(page, player);
  await settled(page);

  const uid = await uidOf(player);
  const { data } = await admin.from('positions').select('chunk_x').eq('player', uid).maybeSingle();

  expect(data).not.toBeNull();

  const startedAt = Number(data?.chunk_x);

  const takeOver = page.getByRole('button', { name: 'Walk here instead' });

  // Nobody else is walking yet
  await expect(takeOver).toBeHidden();

  // Stamped ahead of anything this screen has written, since a screen
  // that took a foreign write for its own would never stand down
  const { error } = await admin
    .from('positions')
    .update({
      chunk_x: startedAt + AWAY,
      moved_at: Date.now() + 60_000,
    })
    .eq('player', uid);

  expect(error).toBeNull();
  await expect(takeOver).toBeVisible({ timeout: 30_000 });

  // Taking it back stands this screen up where the other one left off,
  // and writes it down, which is what stands that one down in turn
  await takeOver.click();
  await expect(takeOver).toBeHidden();

  await expect
    .poll(async () => {
      const { data: after } = await admin
        .from('positions')
        .select('chunk_x')
        .eq('player', uid)
        .maybeSingle();

      return Number(after?.chunk_x);
    })
    .toBe(startedAt + AWAY);
});
