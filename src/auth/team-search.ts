import type { TeamRecord } from './teams';
import type { QueryVocabulary } from '../core/query';
import { alternatives, askedTerms, holds, parseControls, within } from '../core/query';

/**
 * What a search box over a raid lobby can be asked.
 *
 * A lobby is twenty rows of strangers, so the grammar is short: who
 * they are, how big a party they brought, and the two facts a player
 * scans for, their own row and the host's. What each pokemon in a
 * party is stays out of it, since the lobby holds their ids and not
 * their records.
 */

/** What the lobby already knows about a row, handed to the search */
export interface TeamContext {
  /** What the lobby calls them: a nickname, or "You" */
  name?: string;
  /** Whether the row is the reader's own */
  mine?: boolean;
  /** Whether they opened the raid */
  host?: boolean;
}

/** One yes-or-no fact about a row, by the word a search calls it */
const MARKS = new Map<string, (team: TeamRecord, context: TeamContext) => boolean>(
  Object.entries<(team: TeamRecord, context: TeamContext) => boolean>({
    mine: (_team, context) => context.mine === true,
    host: (_team, context) => context.host === true,
    // A party of one is somebody who came to watch as much as to fight
    alone: (team) => team.catches.length === 1,
  }),
);

function marked(team: TeamRecord, value: string, wanted: boolean, context: TeamContext): boolean {
  return alternatives(value).some((word) => {
    const mark = MARKS.get(word.trim().toLowerCase());

    return mark?.(team, context) === wanted;
  });
}

/** What one field asks of one row */
type TeamField = (team: TeamRecord, value: string, context: TeamContext) => boolean;

const FIELDS = new Map<string, TeamField>(
  Object.entries<TeamField>({
    // The id as well as the name: an invited player is named by their
    // id until their profile arrives
    player: (team, value, context) =>
      holds(team.player, value) || (context.name != null && holds(context.name, value)),
    size: (team, value) => within(value, team.catches.length),
    is: (team, value, context) => marked(team, value, true, context),
    not: (team, value, context) => marked(team, value, false, context),
  }),
);

/**
 * Whether one row answers the whole search. A plain word is the name,
 * and a field nobody has heard of matches nothing, as everywhere else
 */
export default function matchesTeam(
  team: TeamRecord,
  query: string,
  context: TeamContext = {},
): boolean {
  return askedTerms(query).every((term) => {
    const answered =
      term.field === ''
        ? holds(team.player, term.value) ||
          (context.name != null && holds(context.name, term.value))
        : FIELDS.get(term.field)?.(team, term.value, context) === true;

    return term.negated ? !answered : answered;
  });
}

/** What each `sort:` word reads off a row */
const SORTS = new Map<string, (team: TeamRecord, context: TeamContext) => number | string>(
  Object.entries<(team: TeamRecord, context: TeamContext) => number | string>({
    name: (team, context) => (context.name ?? team.player).toLowerCase(),
    size: (team) => team.catches.length,
  }),
);

/** One short line per field, and the values it is known to take */
const HINTS: Record<string, string> = {
  player: 'Who brought it',
  size: 'How many they brought',
  is: 'A fact about the row',
  not: 'A fact the row lacks',
  sort: 'Arrange by',
  order: 'Which way round',
};

const VALUES: Record<string, () => string[]> = {
  is: () => [...MARKS.keys()],
  not: () => [...MARKS.keys()],
  sort: () => [...SORTS.keys()],
  order: () => ['asc', 'desc'],
};

/** What the lobby's box can be asked, with the arranging terms on the end */
export const TEAM_VOCABULARY: QueryVocabulary = {
  fields: [...FIELDS.keys(), 'sort', 'order'].map((name) => ({
    name,
    hint: HINTS[name] ?? '',
    values: VALUES[name],
  })),
};

/**
 * The rows a search asked for, in the order it asked for them. The
 * reader's own row is stuck to the top of the lobby by the list
 * itself, so nothing here has to keep it anywhere
 */
export function orderTeams<T>(
  rows: T[],
  query: string,
  of: (row: T) => { team: TeamRecord; context?: TeamContext },
): T[] {
  const controls = parseControls(query);
  const read = SORTS.get(controls.sort);

  if (read == null) {
    return rows;
  }
  return [...rows].sort((left, right) => {
    const one = of(left);
    const other = of(right);
    const first = read(one.team, one.context ?? {});
    const second = read(other.team, other.context ?? {});
    const order =
      typeof first === 'string' && typeof second === 'string'
        ? first.localeCompare(second)
        : Number(first) - Number(second);

    return controls.descending ? -order : order;
  });
}
