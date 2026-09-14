import type { EffectShape } from '../effect/shapes';
import elements from './elements';
import type { LitShapePainter } from './shapes';

export { JOLTS, reachOf } from './shapes';

/** The landings built in the battle scene. The rest are still painted over it */
export const LIT: Partial<Record<EffectShape, LitShapePainter>> = { ...elements };
