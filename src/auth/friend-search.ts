import type { QueryVocabulary } from '../core/query';
import { askedTerms, holds, parseControls, within } from '../core/query';

/**
 * What a search box over a friends list can be asked.
 *
 * A hundred friends is the limit, so the list is worth typing at, and
 * the grammar is the same one the rest of the game takes. There is
 * little to ask of a tie: who it is with, and how long it has stood.
 */

/** One row of a friends list, as the list already has it */
export interface FriendRow {
  uid: string;
  /** What their profile calls them, empty until it has loaded */
  name: string;
  /** When the tie was made, in milliseconds; zero for none */
  since: number;
}

/** How many days ago the tie was made, for `since:` */
function daysSince(row: FriendRow, now: number): number {
  return row.since === 0 ? 0 : Math.floor((now - row.since) / (24 * 60 * 60 * 1000));
}

/** What one field asks of one row */
type FriendField = (row: FriendRow, value: string, now: number) => boolean;

const FIELDS = new Map<string, FriendField>(
  Object.entries<FriendField>({
    // The id as well, since a trainer whose profile has not loaded is
    // named by it
    name: (row, value) => holds(row.name, value) || holds(row.uid, value),
    since: (row, value, now) => within(value, daysSince(row, now)),
  }),
);

/**
 * Whether one row answers the whole search. A field nobody has heard
 * of matches nothing, as everywhere else
 */
export default function matchesFriend(
  row: FriendRow,
  query: string,
  now: number = Date.now(),
): boolean {
  return askedTerms(query).every((term) => {
    const answered =
      term.field === ''
        ? holds(row.name, term.value) || holds(row.uid, term.value)
        : FIELDS.get(term.field)?.(row, term.value, now) === true;

    return term.negated ? !answered : answered;
  });
}

/** What each `sort:` word reads off a row */
const SORTS = new Map<string, (row: FriendRow) => number | string>(
  Object.entries<(row: FriendRow) => number | string>({
    name: (row) => (row.name === '' ? row.uid : row.name).toLowerCase(),
    since: (row) => row.since,
  }),
);

/** One short line per field, and the values it is known to take */
const HINTS: Record<string, string> = {
  name: 'What they are called',
  since: 'Days since the friendship was made',
  sort: 'Arrange by',
  order: 'Which way round',
};

const VALUES: Record<string, () => string[]> = {
  sort: () => [...SORTS.keys()],
  order: () => ['asc', 'desc'],
};

/** What the list's box can be asked, with the arranging terms on the end */
export const FRIEND_VOCABULARY: QueryVocabulary = {
  fields: [...FIELDS.keys(), 'sort', 'order'].map((name) => ({
    name,
    hint: HINTS[name] ?? '',
    values: VALUES[name],
  })),
};

/** The rows a search asked for, in the order it asked for them */
export function orderFriends<T>(rows: T[], query: string, of: (row: T) => FriendRow): T[] {
  const controls = parseControls(query);
  const read = SORTS.get(controls.sort);

  if (read == null) {
    return rows;
  }
  return [...rows].sort((left, right) => {
    const first = read(of(left));
    const second = read(of(right));
    const order =
      typeof first === 'string' && typeof second === 'string'
        ? first.localeCompare(second)
        : Number(first) - Number(second);

    return controls.descending ? -order : order;
  });
}
