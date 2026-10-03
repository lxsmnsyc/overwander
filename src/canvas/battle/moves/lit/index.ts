import type { EffectShape } from '../effect/shapes';
import care from './care';
import contact from './contact';
import elements from './elements';
import kalos from './kalos';
import legends from './legends';
import minds from './minds';
import ohko from './ohko';
import type { LitShapePainter } from './shapes';
import stats from './stats';
import unova from './unova';
import zTypes from './z-types';
import zElements from './z-elements';
import zPartners from './z-partners';
import zLegends from './z-legends';
import alola from './alola';

export { JOLTS, reachOf } from './shapes';

/** Every landing, built in the battle scene */
export const LIT: Partial<Record<EffectShape, LitShapePainter>> = {
  ...contact,
  ...elements,
  ...minds,
  ...care,
  ...legends,
  ...ohko,
  ...stats,
  ...unova,
  ...kalos,
  ...zTypes,
  ...zElements,
  ...zPartners,
  ...zLegends,
  ...alola,
};
