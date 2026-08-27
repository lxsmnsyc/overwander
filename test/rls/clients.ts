import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

/**
 * What the suite's clients believe about the schema: any table, rows
 * of plain columns, any function. Wide on purpose — the matrix stages
 * whatever table a test needs, and RLS is what is under test
 */
type StageTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type StageDatabase = {
  public: {
    Tables: Record<string, StageTable>;
    Views: Record<string, never>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type StageClient = SupabaseClient<StageDatabase>;

/**
 * The actors of the RLS suite: a couple of signed-in players, a
 * guest, the service role that stands in for the server, and a direct
 * SQL door for seeding and truncation.
 *
 * A player client's PostgREST calls run as that player, which is the
 * same "who can read what" matrix the old rules suite asserted.
 */

export const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
export const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// The local stack's published demo keys; a hosted project would come
// through the environment
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const sql = postgres(DB_URL, { prepare: false, max: 4 });

export const service = createClient<StageDatabase>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const PASSWORD = 'walking-in-the-tall-grass';

/** One signed-in actor and their uid */
export interface Actor {
  uid: string;
  client: StageClient;
}

/**
 * A fresh signed-in player. Accounts are made through the admin API
 * (GoTrue owns auth.users) and signed into through the anon client,
 * so what the suite holds is exactly what a browser would
 */
export async function actor(name: string): Promise<Actor> {
  const email = `${name}-${Date.now().toString(36)}@example.com`;
  const created = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });

  if (created.error != null) {
    throw new Error(`cannot stage ${name}: ${created.error.message}`);
  }

  const client = createClient<StageDatabase>(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const signed = await client.auth.signInWithPassword({ email, password: PASSWORD });

  if (signed.error != null) {
    throw new Error(`cannot sign ${name} in: ${signed.error.message}`);
  }
  return { uid: created.data.user.id, client };
}

/** A client nobody signed into */
export function guest(): StageClient {
  return createClient<StageDatabase>(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

/** Every account gone; their rows cascade with them */
export async function clearAll(): Promise<void> {
  // Auctions first: a seller cannot be deleted while their lot rows
  // stand, and the browser suite leaves staged sellers behind
  await sql`
    truncate snapshots, snapshot_spawns, gifts, battles, team_snapshots, raids,
      auctions, trades, duels cascade
  `;
  await sql`delete from auth.users`;
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
