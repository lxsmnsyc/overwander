import type Team from '../team';
import turns from '../turn';

/** How sharply a trainer directs its team */
export interface TrainerSkill {
  /** Milliseconds a unit stands free before its trainer gives it an order */
  think: number;
  /** Milliseconds into a foe's cast before the trainer reacts to it */
  reaction: number;
  /** The longest the trainer holds a unit for a better move to come off cooldown */
  horizon: number;
  /** The chance an order is a random usable move instead of the best one */
  misplay: number;
}

/** Players, the Elite, champions and legends: nothing missed, nothing late */
export const TOP_SKILL: TrainerSkill = {
  think: 0,
  reaction: 0,
  horizon: turns(1),
  misplay: 0,
};

/** Gym leaders and Ace Trainers */
export const GYM_SKILL: TrainerSkill = {
  think: 250,
  reaction: 300,
  horizon: turns(1),
  misplay: 0.05,
};

/** Grunts, ordinary trainers and raid bosses */
export const BASIC_SKILL: TrainerSkill = {
  think: 500,
  reaction: 600,
  horizon: turns(0.5),
  misplay: 0.15,
};

const skills = new WeakMap<Team, TrainerSkill>();

/** Set how sharply a team's trainer directs it, before the fight starts */
export function setTrainerSkill(team: Team, skill: TrainerSkill): void {
  skills.set(team, skill);
}

/** How sharply a team's trainer directs it: the best, unless set otherwise */
export function getTrainerSkill(team: Team): TrainerSkill {
  return skills.get(team) ?? TOP_SKILL;
}
