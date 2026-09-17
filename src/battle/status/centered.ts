import type Battle from '../core';
import { Statuses } from '../../data/ids/status';
import turns from '../turn';
import type Unit from '../unit';
import createTimedStatus from './__create';

const DURATION = turns(2);

const setupTimer = createTimedStatus(Statuses.Centered, DURATION);

/**
 * Centered: the unit is the one everything on its side is aimed at.
 * The turning itself belongs to the move, which does it to the casts
 * in progress; the status is how long the pull lasts
 * https://bulbapedia.bulbagarden.net/wiki/Follow_Me_(move)
 */
/**
 * Whether everything on this unit's side is being aimed at it. What
 * a centre has drawn is the centre's: anything that would pull a move
 * somewhere else asks this first, so the cast Follow Me spent stays
 * spent
 */
export function isCentered(unit: Unit): boolean {
  return unit.status[Statuses.Centered] != null;
}

export default function setupCenteredStatus(battle: Battle): void {
  setupTimer(battle);
}
