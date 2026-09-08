import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';

/**
 * Mud Sport and Water Sport: mud and water thrown about the field,
 * which one type has to fight through until it dries out. They cover
 * the whole battle rather than one side, the way the weather does
 * https://bulbapedia.bulbagarden.net/wiki/Mud_Sport_(move)
 */
const DURATION = turns(5);

/** What each dampens, and by how much */
const SPORTS: { move: Moves; against: Types }[] = [
  { move: Moves.MudSport, against: Types.Electric },
  { move: Moves.WaterSport, against: Types.Fire },
];

const HALVED = 0.5;

export default function setupSports(battle: Battle): void {
  /** How long each sport still has to run */
  const remaining = new Map<Moves, number>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (SPORTS.some((sport) => sport.move === event.move)) {
      remaining.set(event.move, DURATION);
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [move, left] of remaining) {
      const next = left - event.duration;

      if (next > 0) {
        remaining.set(move, next);
      } else {
        remaining.delete(move);
      }
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null) {
      return;
    }

    const type = event.source.checkMoveType(event.move, event.target);

    for (const sport of SPORTS) {
      if (sport.against === type && remaining.has(sport.move)) {
        event.power *= HALVED;
      }
    }
  });
}
