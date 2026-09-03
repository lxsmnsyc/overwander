import { Statuses } from '../../data/ids/status';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(3);

/**
 * Encored: the unit is repeating its last move for the crowd. The
 * mark is what the performance looks like from outside, and it is
 * what stops a second encore being called over the first; the repeats
 * themselves belong to the move
 */
export default createTimedStatus(Statuses.Encored, DURATION);
