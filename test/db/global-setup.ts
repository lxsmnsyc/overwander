import { prepareTestDatabase } from '../test-database.ts';

/** Vitest's setup for the database suite: the test instance, started and migrated */
export default async function setup(): Promise<void> {
  await prepareTestDatabase();
}
