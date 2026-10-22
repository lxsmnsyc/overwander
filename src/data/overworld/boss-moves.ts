import * as v from 'valibot';
import { Types } from '../constants/types';
import { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import { getSpeciesData } from '../species';
import { MOVE_IDS } from '../ids/names';
import { idsOf } from '../yaml';
import bannedFile from './boss-banned.yaml';

/**
 * Moves a boss is never staged with, each with why, in
 * `boss-banned.yaml`. It is data rather than engine: the list is
 * filtered out of the boss' learnset as the raid is staged
 */
const BANNED_BOSS_MOVES = new Set<Moves>(
  idsOf<Moves>(MOVE_IDS, v.parse(v.array(v.string()), bannedFile), 'boss-banned.yaml'),
);

/**
 * What a boss is barred from on top of the list, by what it is.
 *
 * Curse is two moves in one entry: a Ghost pays half its health to
 * lay it, and anything else takes the stages instead. Only the first
 * is a problem, so only a Ghost is refused it
 */
export function getBannedBossMoves(species: Species): Set<Moves> {
  if (!getSpeciesData(species).types.includes(Types.Ghost)) {
    return BANNED_BOSS_MOVES;
  }
  return new Set([...BANNED_BOSS_MOVES, Moves.Curse]);
}

export default BANNED_BOSS_MOVES;
