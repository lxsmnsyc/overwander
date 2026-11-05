import { type FullConfig, chromium } from '@playwright/test';
import { prepareTestDatabase } from '../test/test-database.ts';
import { signIn } from './game';

/**
 * The development database, started and migrated before any spec runs,
 * and the dev server's first sign-up taken before any spec's clock
 * starts.
 *
 * The server answers its first request before it has compiled the app.
 * It optimises its dependencies on the first page load and compiles the
 * auth routes, the game page and its server functions on the first
 * sign-up, which together take longer than a spec waits. A throwaway
 * account signs up and lands in the world here, outside any test
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  await prepareTestDatabase();

  const baseURL = config.projects[0]?.use.baseURL;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ baseURL });

    await page.goto('/', { timeout: 170_000 });
    await signIn(page);
  } finally {
    await browser.close();
  }
}
