import { prepareTestDatabase } from '../test/test-database.ts';

/** The development database, started and migrated before any spec runs */
export default async function globalSetup(): Promise<void> {
  await prepareTestDatabase();
}
