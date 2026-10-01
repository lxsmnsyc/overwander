import 'server-only';
import { definePlugin } from 'nitro';
import migrate from '../../db/migrate.ts';
import { getSql } from './db';

/**
 * Migrates the database as the server starts, so a deploy never serves
 * a build against a schema that is behind it. Requests wait until the
 * migration lands, and a failure stops the server rather than letting
 * it run on a schema it does not match. The files ship beside the
 * build (see the Dockerfile)
 */
export default definePlugin((nitroApp) => {
  const ready = migrate(getSql(), process.env.MIGRATIONS_DIR ?? 'db/migrations').then(
    (applied) => {
      if (applied.length > 0) {
        console.log(`Migrated: ${applied.join(', ')}`);
      }
    },
    (error: unknown) => {
      console.error('Migration failed, so the server is stopping:', error);
      process.exit(1);
    },
  );

  nitroApp.hooks.hook('request', async () => ready);
});
