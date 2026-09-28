import { prepareTestDatabase } from '../test-database.ts';

/** Vitest's setup for the database suite: the development database, started and migrated */
export default async function setup(): Promise<void> {
  await prepareTestDatabase();
}
