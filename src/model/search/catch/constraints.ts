import type { Bounds } from '../../../core/query';
import { alternatives, ranges } from '../../../core/query';
import { stamps } from './dates';

/**
 * The half of a search the store can answer.
 *
 * A search runs in two passes: whatever narrows into a query is asked
 * of the store, and everything else is answered over what came back.
 * The rule the planner keeps is that a constraint may only be pushed
 * when it is **implied** by the predicate — a narrowing that drops a
 * record the runtime would have kept is a wrong answer, not a faster
 * one, so anything ambiguous is left to the second pass.
 */
export type CatchOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'ilike';

/** A column of the catch row itself */
export interface RowConstraint {
  on: 'row';
  column: string;
  op: CatchOp;
  value: string | number | boolean | (string | number)[];
}

/**
 * A column of one of the catch's child tables. The join rides on an
 * **alias** of its own, so the embed the reader unpacks comes back
 * whole: filtering the one it reads would leave a pokemon holding
 * only the move that was searched for
 */
export interface ChildConstraint {
  on: 'child';
  alias: string;
  table: string;
  column: string;
  op: CatchOp;
  value: string | number | (string | number)[];
}

/**
 * A row somewhere else that has to exist: the auction it stands in,
 * the party it is drafted into, the profile it is the buddy of
 */
export interface ExistsConstraint {
  on: 'exists';
  alias: string;
  table: string;
  /** What else must be true of the joined row, column by column */
  equals: Record<string, string | number | boolean>;
}

export type CatchConstraint = RowConstraint | ChildConstraint | ExistsConstraint;

/** The one constraint a plain flag column is, either way round */
export function flag(column: string, wanted: boolean): CatchConstraint[] {
  return [{ on: 'row', column, op: 'eq', value: wanted }];
}

/** A row elsewhere that has to exist for this pokemon */
export function joined(
  alias: string,
  table: string,
  equals: Record<string, string | number | boolean> = {},
): CatchConstraint[] {
  return [{ on: 'exists', alias, table, equals }];
}

/**
 * The one or many values a name-matched column narrows to. Nothing
 * matched is no constraint at all: the runtime will refuse the term
 * anyway, and a query for "none of these" is a query for the whole box
 */
export function oneOf(column: string, values: number[]): CatchConstraint[] {
  if (values.length === 0) {
    return [];
  }
  return values.length === 1
    ? [{ on: 'row', column, op: 'eq', value: values[0] }]
    : [{ on: 'row', column, op: 'in', value: values }];
}

/** The same, for a child table joined under an alias of its own */
export function childIn(
  alias: string,
  table: string,
  column: string,
  values: number[],
): CatchConstraint[] {
  if (values.length === 0) {
    return [];
  }
  return values.length === 1
    ? [{ on: 'child', alias, table, column, op: 'eq', value: values[0] }]
    : [{ on: 'child', alias, table, column, op: 'in', value: values }];
}

/**
 * A band of numbers as comparisons. An exact number is one of them;
 * an end nobody named is left off entirely, since "anything up to 60"
 * is one filter rather than two
 */
function comparisons(bounds: Bounds): { op: CatchOp; value: number }[] {
  if (bounds.low === bounds.high && !bounds.lowOpen && !bounds.highOpen) {
    return [{ op: 'eq', value: bounds.low }];
  }

  const asked: { op: CatchOp; value: number }[] = [];

  if (Number.isFinite(bounds.low)) {
    asked.push({ op: bounds.lowOpen ? 'gt' : 'gte', value: bounds.low });
  }
  if (Number.isFinite(bounds.high)) {
    asked.push({ op: bounds.highOpen ? 'lt' : 'lte', value: bounds.high });
  }
  return asked;
}

/**
 * A numeric term as the store would be asked it, or nothing where it
 * asks for several bands at once: `level:10|50` is two of them, and a
 * pair of comparisons cannot say "either"
 */
export function pushRange(column: string, value: string): CatchConstraint[] {
  const bounds = ranges(value);
  const pushed: CatchConstraint[] = [];

  if (bounds.length === 1) {
    for (const asked of comparisons(bounds[0])) {
      pushed.push({ on: 'row', column, ...asked });
    }
  }
  return pushed;
}

/** The same, for a band over a child table's column */
export function pushChildRange(
  alias: string,
  table: string,
  column: string,
  value: string,
): CatchConstraint[] {
  const bounds = ranges(value);

  const pushed: CatchConstraint[] = [];

  if (bounds.length === 1) {
    for (const asked of comparisons(bounds[0])) {
      pushed.push({ on: 'child', alias, table, column, ...asked });
    }
  }
  return pushed;
}

/** A date term as bounds on the stored stamp */
export function pushSpan(column: string, value: string): CatchConstraint[] {
  const spans = stamps(value);

  if (spans.length !== 1) {
    return [];
  }
  const [span] = spans;
  const pushed: CatchConstraint[] = [];

  if (span.low != null) {
    pushed.push({ on: 'row', column, op: span.lowOpen ? 'gt' : 'gte', value: span.low });
  }
  if (span.high != null) {
    pushed.push({ on: 'row', column, op: span.highOpen ? 'lt' : 'lte', value: span.high });
  }
  return pushed;
}

/**
 * A typed word as a pattern that looks for it.
 *
 * Only the backslash is escaped. The wildcards are left alone on
 * purpose: they can only widen what the store sends back, and the
 * runtime refuses the extras anyway, where a lone trailing backslash
 * is an unfinished escape the store refuses outright, taking the
 * whole box with it
 */
function pattern(word: string): string {
  return `%${word.replace(/\\/g, '\\\\')}%`;
}

/** A substring match on one of the row's own columns */
export function likeRow(column: string, value: string): CatchConstraint[] {
  const words = alternatives(value);

  return words.length === 1 ? [{ on: 'row', column, op: 'ilike', value: pattern(words[0]) }] : [];
}

/** The same, over a child table joined under an alias of its own */
export function likeChild(
  alias: string,
  table: string,
  column: string,
  value: string,
): CatchConstraint[] {
  const words = alternatives(value);

  return words.length === 1
    ? [{ on: 'child', alias, table, column, op: 'ilike', value: pattern(words[0]) }]
    : [];
}

/** What each ball is called, which is what its item is called */
