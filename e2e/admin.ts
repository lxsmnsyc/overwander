import { createClient } from '@supabase/supabase-js';

/**
 * What the staging client believes about the schema: any table, rows
 * of plain columns. Wide on purpose — the specs stage whatever table
 * a test needs, and the real shape check is the database's own
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

/**
 * The service-role door into the local stack, for staging what a spec
 * cannot click into being: accounts, gold, bag rows, lots. It is the
 * successor of the emulator's Bearer-owner REST backdoor; RLS does
 * not bind the service role, the way the rules did not bind the owner
 * token.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const admin = createClient<StageDatabase>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

/**
 * A real confirmed account, so the app can sign in as it and a friend
 * can find it by address. Resolves the uid
 */
export async function stageAccount(email: string, password: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error != null) {
    throw new Error(`cannot stage ${email}: ${error.message}`);
  }
  return data.user.id;
}

/**
 * The uid behind an address the spec signed up moments ago. Takes the
 * player object the game helpers hand around, or a bare address
 */
export async function uidOf(player: string | { email: string }): Promise<string> {
  const email = typeof player === 'string' ? player : player.email;
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = data.users.find((user) => user.email === email);

  if (found == null) {
    throw new Error(`no account at ${email}`);
  }
  return found.id;
}

/** Set a player's purse outright */
export async function setGold(uid: string, gold: number): Promise<void> {
  const { error } = await admin.from('profiles').update({ gold }).eq('id', uid);

  if (error != null) {
    throw new Error(error.message);
  }
}

/** Put a stack in the bag, replacing whatever count stood there */
export async function setBagItem(uid: string, item: number, count: number): Promise<void> {
  const { error } = await admin
    .from('bag_items')
    .upsert({ player: uid, item, count }, { onConflict: 'player,item' });

  if (error != null) {
    throw new Error(error.message);
  }
}

/**
 * Write dex tallies for a species list, seen and caught alike. Two of
 * each, the figure the specs have always staged and asserted against
 */
export async function setDexCounts(uid: string, species: number[]): Promise<void> {
  const rows = species.map((one) => ({ player: uid, species: one, seen: 2, caught: 2 }));
  const { error } = await admin
    .from('pokedex_entries')
    .upsert(rows, { onConflict: 'player,species' });

  if (error != null) {
    throw new Error(error.message);
  }
}

/**
 * Clear every lobby still gathering. Raids share one window-wide
 * listing, so a spec that stages its own must sweep the idle ones
 * earlier specs left, or the first row it clicks is somebody else's
 */
export async function clearIdleRaids(): Promise<void> {
  const { error } = await admin.from('raids').delete().is('battle_id', null);

  if (error != null) {
    throw new Error(`raids: ${error.message}`);
  }
}

/** One row into any table, service-role, plain columns */
export async function insertRow(table: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from(table).insert(row);

  if (error != null) {
    throw new Error(`${table}: ${error.message}`);
  }
}

/** Patch one row by id column */
export async function patchRow(
  table: string,
  key: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from(table).update(fields).eq(key, id);

  if (error != null) {
    throw new Error(`${table}: ${error.message}`);
  }
}

/** The rows of a table matching one column, whole */
export async function findRows(
  table: string,
  column: string,
  value: string | number,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await admin.from(table).select('*').eq(column, value);

  if (error != null) {
    throw new Error(`${table}: ${error.message}`);
  }
  return data;
}
