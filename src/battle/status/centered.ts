import type Battle from '../core';
import { Statuses } from '../../data/ids/status';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(2);

const setupTimer = createTimedStatus(Statuses.Centered, DURATION);

/**
 * Centered: the unit is the one everything on its side is aimed at.
 * The turning itself belongs to the move, which does it to the casts
 * in progress; the status is how long the pull lasts
 * https://bulbapedia.bulbagarden.net/wiki/Follow_Me_(move)
 */
export default function setupCenteredStatus(battle: Battle): void {
  setupTimer(battle);
}
