import { Statuses } from '../../data/ids/status';
import turns from '../turn';
import createTimedStatus from './__create';

const DURATION = turns(3);

/**
 * Encored: the unit's cast in progress, or its next one, is about to
 * be locked into repeats. The mark lapses if no cast lands in time;
 * the repeats themselves belong to the move
 */
export default createTimedStatus(Statuses.Encored, DURATION);
