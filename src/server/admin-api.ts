import 'server-only';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';

/**
 * The auth admin API, and nothing else. Game data travels over the
 * direct Postgres connection in [`db.ts`](./db.ts); this client
 * exists because accounts and their emails live in Supabase Auth,
 * which only the service role may ask.
 */

let client: SupabaseClient | null = null;

export default function getAdminApi(): SupabaseClient {
  if (client == null) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url == null || url === '' || key == null || key === '') {
      throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for auth admin calls.');
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
