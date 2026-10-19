import type { EffectShape } from '../effect/shapes';
import care from './themes/care';
import contact from './themes/contact';
import elements from './themes/elements';
import kalos from './regions/kalos/legends';
import legends from './regions/early/legends';
import minds from './themes/minds';
import ohko from './themes/ohko';
import type { LitShapePainter } from './shapes';
import stats from './themes/stats';
import unova from './regions/unova';
import zTypes from './z/types';
import zElements from './z/elements';
import zPartners from './z/partners';
import zLegends from './z/legends';
import alola from './regions/alola/legends';
import galar from './regions/galar/legends';
import maxMoves from './max/moves';
import gMaxMoves from './max/g-max';
import gMaxGalar from './max/g-max-galar';
import hisui from './regions/hisui/nobles';
import paldea from './regions/paldea/legends';
import paldeaLate from './regions/paldea/late';
import paldeaLines from './regions/paldea/lines';
import paldeaRoutes from './regions/paldea/routes';
import earlySignatures from './regions/early/signatures';
import kalosSignatures from './regions/kalos/signatures';
import alolaSignatures from './regions/alola/signatures';
import galarSignatures from './regions/galar/signatures';
import galarLines from './regions/galar/lines';
import hisuiSignatures from './regions/hisui/signatures';

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
  ...galar,
  ...maxMoves,
  ...gMaxMoves,
  ...gMaxGalar,
  ...hisui,
  ...paldea,
  ...paldeaRoutes,
  ...paldeaLines,
  ...paldeaLate,
  ...earlySignatures,
  ...kalosSignatures,
  ...alolaSignatures,
  ...galarSignatures,
  ...galarLines,
  ...hisuiSignatures,
};
