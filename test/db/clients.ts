import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { createProfile } from '../../src/server/profile';
import registerGameData from '../../src/data';

// The server functions under test read the registries: a trade asks
// what the handover opens, and nothing is queryable until this has
// run. Here rather than per file, since every case reaches a server
// function through this one
registerGameData();

/**
 * The actors of the database suite: a few players, and the owner
 * connection the server modules and the seeding both use. Accounts are
 * written straight into Better Auth's tables, since nothing under test
 * signs in.
 */

export const DB_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/overwander';

export const sql = postgres(DB_URL, { prepare: false, max: 4, onnotice: () => undefined });

/** One player, by uid */
export interface Actor {
  uid: string;
}

/** A fresh account with its profile, the way a first sign-in makes one */
export async function actor(name: string): Promise<Actor> {
  const uid = randomUUID();
  const email = `${name}-${Date.now().toString(36)}@example.com`;

  await sql`insert into users (id, name, email, email_verified) values (${uid}, ${name}, ${email}, true)`;
  await createProfile(uid, name);
  return { uid };
}

/** Every account gone; their rows cascade with them */
export async function clearAll(): Promise<void> {
  // Auctions first: a seller cannot be deleted while their lot rows
  // stand, and the browser suite leaves staged sellers behind
  await sql`
    truncate snapshots, snapshot_spawns, gifts, battles, team_snapshots, raids,
      auctions, trades, duels cascade
  `;
  await sql`delete from users`;
}

/** The minimal caught row the suite plants under a player */
export function caughtRow(id: string, owner: string | null): Record<string, unknown> {
  return {
    id,
    owner,
    type: 0,
    species: 25,
    level: 5,
    individual_value: 1,
    trait_value: 2,
    ivs: 0,
    gender: 1,
    nature: 0,
    slots: 0,
    health: 20,
    ball: 15,
    caught_at_local: new Date('2026-08-20T12:00:00Z'),
    caught_at_offset: 480,
    friendship: 70,
    origin_timestamp: 0,
    origin_x: 0,
    origin_y: 0,
    origin_biome: 0,
  };
}
