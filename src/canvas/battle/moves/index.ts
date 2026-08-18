export { default as moveDelayVisual, delayShapeFor } from './delay';
export type { DelayShape } from './delay';
export { default as moveEffectVisual, effectShapeFor, moveMissVisual, weightOf } from './effect';
export type { EffectShape } from './effect';

/**
 * A move's two pictures.
 *
 * The engine says two separate things about a move and they used to be
 * answered by one performance built when it fired. They are now two:
 *
 * - **The gap.** `UnitTriggerMove` opens it and the engine holds it for
 *   as long as `checkMoveDelay` says. What fills it is
 *   [`delay.ts`](./delay.ts) — a thing crossing, a charge gathering, a
 *   pokemon gone underground, or nothing at all where the pokemon
 *   itself is what crosses.
 * - **The landing.** `UnitTriggerMoveEffect` fires once per target the
 *   move actually resolved on, which is where
 *   [`effect.ts`](./effect.ts) draws. A move that missed never gets
 *   here, and a spread move gets here once per pokemon it caught.
 *
 * Both are **drawn** rather than played off a sheet. The atlas under
 * `public/sprites/effects` was authored for another game's move list,
 * and dressing a Gen 1 move in the nearest sheet from it is a picture
 * of a different move; a shape in the move's own type colour is at
 * least honestly this one. The sheets are still what a status or an
 * ability shows — those are marks, and the atlas has marks.
 */
