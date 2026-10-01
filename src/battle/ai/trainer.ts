import type { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import type { MoveTarget } from '../events';
import type Team from '../team';
import type Unit from '../unit';
import { chooseMove } from './choose-move';

/** What a trainer tells one of its units to do */
export interface Order {
  move: Moves;
  target: MoveTarget;
}

/**
 * The invisible trainer behind a team. Every unit acts on its trainer's
 * orders rather than choosing for itself, which is what lets a team
 * time and share out what its units do
 */
export class Trainer {
  constructor(
    readonly battle: Battle,
    readonly team: Team,
  ) {}

  /** The order for a unit that is free to act, or nothing to do yet */
  order(unit: Unit): Order | undefined {
    const choice = chooseMove(this.battle, unit);

    return choice == null ? undefined : { move: choice.move, target: choice.target };
  }
}

const trainers = new WeakMap<Team, Trainer>();

/** The trainer behind a team, made the first time the team needs one */
export function getTrainer(battle: Battle, team: Team): Trainer {
  let trainer = trainers.get(team);

  if (trainer == null) {
    trainer = new Trainer(battle, team);
    trainers.set(team, trainer);
  }
  return trainer;
}
