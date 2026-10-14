/**
 * What a search box over a box of pokemon can be asked.
 *
 * A plain word matches the name (the nickname if it has one, the
 * species otherwise) and everything else is a `field:value` pair.
 * Terms narrow, and two of the same field are both, so
 * `type:fire type:flying` finds a Charizard rather than half the box.
 * A leading `!` refuses a term, a `|` accepts any alternative, and a
 * numeric value takes a comparison or a range. `sort:` and `order:`
 * arrange the answers instead of narrowing them.
 *
 * **An egg gives nothing away.** It answers to "egg" and to the marks
 * its owner put on it; every question about what is inside answers no,
 * since the box already refuses to draw it
 */
export { default } from './fields';
export type { CatchContext } from './shared';
export type {
  CatchConstraint,
  CatchOp,
  ChildConstraint,
  ExistsConstraint,
  RowConstraint,
} from './constraints';
export { default as planCatchSearch } from './plan';
export { CATCH_VOCABULARY, orderCatches } from './vocabulary';
