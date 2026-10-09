import type { Types } from '../constants/types';
import { MoveCategories, Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { getMoveData, getRegisteredMoves } from './__create';
import { G_MAX_MOVES } from './gmax-moves';
import { MAX_MOVES } from './max-moves';
import { isPseudoMove } from './pseudo';
import { Z_MOVES } from './z-moves';

/**
 * The Frenzy bursts a Noble unleashes. Like the G-Max Moves, none of
 * them is learned, copied, called or remembered. The battle side is
 * in `src/battle/abilities/noble.ts`
 */

/** Hisui's five Nobles, each with a burst of its own */
export const CANON_BURSTS = new Map<Species, Moves>([
  [Species.Kleavor, Moves.FrenzyStoneAxe],
  [Species.LilligantHisui, Moves.FrenzyPetalStorm],
  [Species.ArcanineHisui, Moves.FrenzyWildfire],
  [Species.ElectrodeHisui, Moves.FrenzyBlast],
  [Species.AvaluggHisui, Moves.FrenzyIceberg],
]);

/** Every Frenzy burst */
export const FRENZY_MOVES = new Set<Moves>([...CANON_BURSTS.values(), Moves.FrenzyBurst]);

/** The burst a Noble of this species unleashes: its own, or the plain one in its type */
export function getNobleBurst(species: Species): Moves {
  return CANON_BURSTS.get(species) ?? Moves.FrenzyBurst;
}

const standIns = new Map<Types, Moves>();

/**
 * What the plain burst is drawn as when thrown in a type: that type's
 * strongest move a pokemon can carry, the first by id where two tie.
 * Read on the first ask, since the registry is filled at start-up
 */
export function getBurstStandIn(type: Types): Moves {
  const known = standIns.get(type);

  if (known != null) {
    return known;
  }

  let best = Moves.FrenzyBurst;
  let strongest = 0;

  for (const move of getRegisteredMoves()) {
    const data = getMoveData(move);

    if (
      data.type !== type ||
      data.category === MoveCategories.Status ||
      isPseudoMove(move) ||
      Z_MOVES.has(move) ||
      MAX_MOVES.has(move) ||
      G_MAX_MOVES.has(move) ||
      FRENZY_MOVES.has(move)
    ) {
      continue;
    }
    if ((data.power ?? 0) > strongest) {
      best = move;
      strongest = data.power ?? 0;
    }
  }
  standIns.set(type, best);
  return best;
}
