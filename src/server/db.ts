import 'server-only';
import postgres from 'postgres';
// Imported for its side effect: the server lives in UTC before
// anything reads a clock
import './timezone';

/**
 * The one Postgres connection the privileged writes travel over.
 *
 * It connects as the table owner, which row-level security does not
 * bind: this is the Supabase shape of the admin SDK's rules bypass,
 * and it is why every policy in the schema only describes browsers.
 *
 * `prepare: false` because the hosted pooler runs in transaction mode
 * and cannot track prepared statements; locally it costs nothing.
 */

const DB_URL_VAR = 'SUPABASE_DB_URL';

let connection: postgres.Sql | null = null;

export type Sql = postgres.Sql;

/**
 * A transaction's view of the connection, as postgres.js hands it to
 * the callback
 */
export type Tx = postgres.TransactionSql;

export function getSql(): postgres.Sql {
  if (connection == null) {
    const url = process.env[DB_URL_VAR];

    if (url == null || url === '') {
      throw new Error(
        `${DB_URL_VAR} is not set. Copy .env.example to .env, ` +
          'or run `supabase start` and use the local default.',
      );
    }
    connection = postgres(url, {
      max: 10,
      prepare: false,
      types: {
        // The driver hands int8 back as a string; every stored bigint
        // here is epoch-ms, gold or a 32-bit roll, all far below
        // 2^53, so they read as plain numbers. Writes round: the
        // synced clock lands on half milliseconds, which the text
        // form of a bigint refuses
        bigint: {
          to: 20,
          from: [20],
          serialize: (value: number | string) => String(Math.round(Number(value))),
          parse: Number,
        },
      },
    });
  }
  return connection;
}

/**
 * One transaction, real BEGIN to COMMIT.
 *
 * Nothing retries a failed body, so a body that reads a row it means
 * to write must lock it with `for update` as it reads. That rule is
 * what keeps two settlements of the same fight from both paying
 */
export async function tx<T>(body: (sql: Tx) => Promise<T>): Promise<T> {
  // Collected into a box because begin() types its result through
  // UnwrapPromiseArray, which does not reduce to T for a generic T
  const results: T[] = [];

  await getSql().begin(async (transaction) => {
    results.push(await body(transaction));
  });
  return results[0];
}

/**
 * A jsonb parameter. postgres.js types json() against a structural
 * JSONValue our record interfaces cannot name, so the narrowing is a
 * guard against what actually cannot serialize
 */
export function jsonOf(sql: Sql | Tx, value: unknown): postgres.Parameter {
  if (!isJsonValue(value)) {
    throw new Error('value is not JSON-serializable');
  }
  return sql.json(value);
}

function isJsonValue(value: unknown): value is postgres.JSONValue {
  const kind = typeof value;

  return kind !== 'function' && kind !== 'symbol' && kind !== 'bigint' && kind !== 'undefined';
}

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * A fresh 20-character id, the shape the store has always used.
 * Existing ids seed battles and replays, so the alphabet and length
 * survive the platform
 */
export function newDocId(): string {
  let id = '';

  for (let at = 0; at < 20; at++) {
    id += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return id;
}
