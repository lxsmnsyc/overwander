import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import type { AIMoveChoice, MoveTarget } from '../events';
import { GUARD_MOVES } from '../moves/protect';
import type Team from '../team';
import turns from '../turn';
import type Unit from '../unit';
import { bestCoolingMove, chooseMove, randomMove } from './choose-move';
import { TOP_SKILL, type TrainerSkill, getTrainerSkill } from './skill';
import { BASE_SCORE } from './score';

/** What a trainer tells one of its units to do */
export interface Order {
  move: Moves;
  target: MoveTarget;
  /** What the order is worth, so the most valuable goes out first */
  score?: number;
}

/** What a second of waiting costs, on the scoring scale: a whole chip */
const WAIT_COST = 4;

/** The longest a unit stands on guard before it acts anyway */
const GUARD_LIMIT = turns(0.5);

/** An order worth less than this over the base is one a reactive move would beat */
const GUARD_BAR = 8;

/** The moves that answer a foe's cast, so a unit holding one may stand ready for it */
const REACTIVE = new Set<Moves>([
  ...(Object.keys(GUARD_MOVES).map(Number) as Moves[]),
  Moves.MeFirst,
  Moves.SuckerPunch,
]);

function hasReadyReactive(unit: Unit): boolean {
  for (const state of Object.values(unit.moves)) {
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (state && REACTIVE.has(state.move) && !state.disabled && state.cooldown == null) {
      return true;
    }
  }
  return false;
}

/**
 * The invisible trainer behind a team. Every unit acts on its trainer's
 * orders rather than choosing for itself, which is what lets a team
 * time what its units do: a unit may be held for a better move, or kept
 * on guard to answer a foe
 */
export class Trainer {
  /** When each unit standing ready first came free, for the guard limit */
  private readonly freeSince = new Map<Unit, number>();

  /** When each free unit was first noticed, for the time the trainer takes to think */
  private readonly noticed = new Map<Unit, number>();

  constructor(
    readonly battle: Battle,
    readonly team: Team,
    readonly skill: TrainerSkill = TOP_SKILL,
  ) {}

  /** The order for a unit that is free to act, or nothing to do yet */
  order(unit: Unit, now: number): Order | undefined {
    // A trainer that misplays now and then throws something usable at random
    if (this.skill.misplay > 0 && this.battle.random() < this.skill.misplay) {
      const fumble = randomMove(this.battle, unit);

      if (fumble != null) {
        this.freeSince.delete(unit);
        return { move: fumble.move, target: fumble.target, score: fumble.score };
      }
    }

    const choice = chooseMove(this.battle, unit);

    // A much better move coming off cooldown soon is worth the wait
    const later = bestCoolingMove(this.battle, unit, this.skill.horizon);

    if (
      later != null &&
      (choice == null || later.score - (WAIT_COST * later.ready) / 1000 > choice.score)
    ) {
      return undefined;
    }
    if (choice == null || this.guarding(unit, choice, now)) {
      return undefined;
    }

    this.freeSince.delete(unit);
    return { move: choice.move, target: choice.target, score: choice.score };
  }

  /**
   * Order every free unit at once, the most valuable order first. Each
   * cast is on show the moment it starts, so the units still waiting
   * plan around it: a KO goes out, and the rest stop chasing that foe
   */
  command(units: Unit[], now: number): void {
    const waiting = new Set<Unit>();

    // A unit is ordered once the trainer has had its time to think
    for (const unit of units) {
      const since = this.noticed.get(unit) ?? now;

      this.noticed.set(unit, since);
      if (now - since >= this.skill.think) {
        waiting.add(unit);
      }
    }

    while (waiting.size > 0) {
      let best: { unit: Unit; order: Order } | undefined;

      for (const unit of waiting) {
        const order = this.order(unit, now);

        if (order != null && (best == null || (order.score ?? 0) > (best.order.score ?? 0))) {
          best = { unit, order };
        }
      }
      if (best == null) {
        return;
      }
      waiting.delete(best.unit);
      this.noticed.delete(best.unit);
      best.unit.cast(best.order.move, best.order.target);
    }
  }

  /**
   * Whether to keep a unit standing ready to answer a foe's cast rather
   * than spend itself on something worth little. Only for so long: a
   * foe that never commits is not worth waiting out
   */
  private guarding(unit: Unit, choice: AIMoveChoice, now: number): boolean {
    if (
      REACTIVE.has(choice.move) ||
      choice.score >= BASE_SCORE + GUARD_BAR ||
      !hasReadyReactive(unit)
    ) {
      return false;
    }

    const since = this.freeSince.get(unit);

    if (since == null) {
      this.freeSince.set(unit, now);
      return true;
    }
    return now - since < GUARD_LIMIT;
  }
}

const trainers = new WeakMap<Team, Trainer>();

/** The trainer behind a team, made the first time the team needs one */
export function getTrainer(battle: Battle, team: Team): Trainer {
  let trainer = trainers.get(team);

  if (trainer == null) {
    trainer = new Trainer(battle, team, getTrainerSkill(team));
    trainers.set(team, trainer);
  }
  return trainer;
}
