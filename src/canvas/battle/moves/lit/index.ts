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
import galar from './galar';
import maxMoves from './max-moves';
import gMaxMoves from './g-max-moves';
import gMaxGalar from './g-max-galar';
import hisui from './hisui';
import paldea from './paldea';
import paldeaLate from './paldea-late';
import paldeaLines from './paldea-lines';
import paldeaRoutes from './paldea-routes';
import earlySignatures from './early-signatures';
import kalosSignatures from './kalos-signatures';
import alolaSignatures from './alola-signatures';
import galarSignatures from './galar-signatures';
import galarLines from './galar-lines';
import hisuiSignatures from './hisui-signatures';

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
