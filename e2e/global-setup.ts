import { prepareTestDatabase } from '../test/test-database.ts';

/** The tests' own database, started and migrated before any spec runs */
export default async function globalSetup(): Promise<void> {
  await prepareTestDatabase();
}
