import type { BaseEvent } from '../../core/event-emitter';
import type { TeamStatuses, Weathers } from '../../data/ids/status';
import type Alliance from '../alliance';
import type Team from '../team';
import type Unit from '../unit';
import type { EffectCause } from './shapes';

/** What happens to a side rather than to one unit */
/**
 * How long a team status holds, in milliseconds. The cause carries
 * the unit that put it up, which is the one a Light Clay is held by
 */
export interface CheckTeamStatusDurationEvent extends TeamStatusEvent {
  duration: number;
  cause: EffectCause;
}

export interface AllianceEvent extends BaseEvent {
  alliance: Alliance;
}

export interface AllianceTeamEvent extends AllianceEvent {
  team: Team;
}

export interface TeamEvent extends BaseEvent {
  team: Team;
}

export interface TeamStatusEvent extends TeamEvent {
  status: TeamStatuses;
}

export interface TeamUpdateStatusEvent extends TeamStatusEvent {
  cause: EffectCause;
}

export interface TeamUnitEvent extends TeamEvent {
  unit: Unit;
}

export interface TeamWeatherEvent extends TeamEvent {
  weather: Weathers;
  duration: number;
}

export interface CheckTeamStatusImmunityEvent extends TeamUpdateStatusEvent {
  immune: boolean;
}
