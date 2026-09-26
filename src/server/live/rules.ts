/**
 * What the live feed may say to whom. A change reaches a subscriber
 * whole only where the row policies let them read it; otherwise it
 * arrives as its keys alone, and the browser reads again through the
 * server, which applies the rule for real
 */

/** A row as a change carries it */
export type Row = Record<string, unknown>;

/** Who may read a row: everybody signed in, or whoever one of these columns names */
interface TableRule {
  /** The columns naming who may read the row, or none for a public table */
  readers: readonly string[];
  /** The columns a subscriber who may not read the row still gets, so they know to read again */
  keys: readonly string[];
}

const PUBLIC: TableRule = { readers: [], keys: [] };

/** Every table the browser follows, mirroring its select policy */
const TABLES = new Map<string, TableRule>([
  ['announcements', PUBLIC],
  ['auctions', PUBLIC],
  ['battles', PUBLIC],
  ['battle_teams', PUBLIC],
  ['profiles', PUBLIC],
  ['raids', PUBLIC],
  ['raid_watchers', PUBLIC],
  ['snapshots', PUBLIC],
  ['teams', PUBLIC],
  ['bag_items', { readers: ['player'], keys: [] }],
  ['bag_candies', { readers: ['player'], keys: [] }],
  ['positions', { readers: ['player'], keys: [] }],
  ['friends', { readers: ['owner'], keys: [] }],
  ['blocks', { readers: ['blocker'], keys: [] }],
  ['friend_requests', { readers: ['sender', 'recipient'], keys: [] }],
  ['trades', { readers: ['proposer', 'receiver'], keys: [] }],
  ['raid_invites', { readers: ['sender', 'recipient'], keys: [] }],
  ['duel_invites', { readers: ['sender', 'recipient'], keys: [] }],
  // Membership decides these, which a row cannot answer, so others get the lobby's id
  ['duels', { readers: ['host'], keys: ['id'] }],
  ['duel_members', { readers: ['player'], keys: ['duel_id'] }],
  ['duel_catches', { readers: ['player'], keys: ['duel_id'] }],
]);

/** The tables the feed follows, for the migration's triggers and the socket's checks */
export const LIVE_TABLES: readonly string[] = [...TABLES.keys()];

export function isLiveTable(table: string): boolean {
  return TABLES.has(table);
}

/** The row as this reader may see it: whole, or only its keys */
export function visibleRow(table: string, row: Row | null, uid: string): Row {
  const rule = TABLES.get(table);

  if (row == null || rule == null) {
    return {};
  }
  if (rule.readers.length === 0) {
    return row;
  }
  for (const column of rule.readers) {
    if (row[column] === uid) {
      return row;
    }
  }

  const keys: Row = {};

  for (const column of rule.keys) {
    keys[column] = row[column];
  }
  return keys;
}

/** One condition a subscription narrows by, as PostgREST's filter syntax writes it */
export interface Filter {
  column: string;
  values: string[];
}

const FILTER = /^([a-z_]{1,64})=(eq|in)\.(.*)$/s;

/** `column=eq.value` or `column=in.(a,b)`, or null for anything else */
export function parseFilter(text: string): Filter | null {
  const match = FILTER.exec(text);

  if (match == null) {
    return null;
  }

  const [, column, op, rest] = match;

  if (op === 'eq') {
    return { column, values: [rest] };
  }
  if (!rest.startsWith('(') || !rest.endsWith(')')) {
    return null;
  }

  const values: string[] = [];

  for (const value of rest.slice(1, -1).split(',')) {
    if (value !== '') {
      values.push(value);
    }
  }
  return { column, values };
}

/** Whether a row answers a filter. A value is compared as text, the way the filter wrote it */
export function matchesFilter(filter: Filter, row: Row | null): boolean {
  if (row == null) {
    return false;
  }

  const value = row[filter.column];

  return (
    (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') &&
    filter.values.includes(String(value))
  );
}
