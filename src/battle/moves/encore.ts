import { MAX_MOVES } from '../../data/moves/max-moves';
import { Z_MOVES } from '../../data/moves/z-moves';
import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveCategories, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { Statuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, type MoveTarget, MoveTargetType } from '../events';
import type Unit from '../unit';
import { unitTarget } from '../utils';
import { effectIn, landsIn } from '../ai/context';

/**
 * Casts an encore never locks: the fallbacks repeat nothing worth
 * hearing, and Encore itself cannot call for another one
 */
const NOT_A_MOVE = new Set<Moves>([
  Moves.Struggle,
  Moves.Attack,
  Moves.Encore,
  ...Z_MOVES,
  ...MAX_MOVES,
]);

/** How many more times the locked move plays after its own cast */
const REPEATS = 2;

/** What landing it on a cast worth locking is worth to the AI */
const ENCORE_BONUS = 6;

interface Performance {
  move: Moves;
  target: MoveTarget;
  left: number;
  /** Set while one of the repeats is finishing, so a break can be told from an ending */
  finishing: boolean;
}

/**
 * Encore, as a leash. The target's cast in progress, or its next one
 * when it is idle, plays 2 more times as channelled repeats: it is
 * locked into that move for 3 steps, and pays its PP and cooldown once.
 * A move that already spends steps is left alone and the mark is spent.
 *
 * https://bulbapedia.bulbagarden.net/wiki/Encore_(move)
 */
export default function setupEncore(battle: Battle): void {
  const finishing = new Map<Unit, { move: Moves; target: MoveTarget }>();
  const performing = new Map<Unit, Performance>();

  function end(unit: Unit): void {
    performing.delete(unit);
    if (unit.status[Statuses.Encored] != null) {
      unit.removeStatus(Statuses.Encored, { type: EffectType.None });
    }
  }

  /**
   * Where a repeat is pointed. The original aim stands while it is
   * still standing; once it is gone the move goes to the other side
   * instead, so a repeat is not wasted on a corpse
   */
  function repeatTarget(source: Unit, aim: MoveTarget): MoveTarget | undefined {
    if (aim.type !== MoveTargetType.Unit || aim.unit.alive) {
      return aim;
    }
    for (const unit of battle.units(source.team.alliance)) {
      if (unit.alive) {
        return unitTarget(unit);
      }
    }
    return undefined;
  }

  function repeat(unit: Unit, show: Performance): void {
    const aim = repeatTarget(unit, show.target);

    if (aim === undefined || show.left <= 0) {
      end(unit);
      return;
    }
    show.left -= 1;
    show.target = aim;
    unit.channel(show.move, aim, 0);
    if (unit.channeling == null) {
      end(unit);
    }
  }

  // The cast is read before it is cleared, so its move and aim are known once it lands
  battle.on(BattleEvents.UnitFinishCast, EventPriority.Pre, (event) => {
    const casting = event.source.casting;

    if (casting != null && event.source.status[Statuses.Encored] != null) {
      finishing.set(event.source, { move: casting.move, target: casting.target });
    }
  });

  battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
    const cast = finishing.get(event.source);

    finishing.delete(event.source);
    if (cast == null || NOT_A_MOVE.has(cast.move) || performing.has(event.source)) {
      return;
    }
    // A move that opened its own channel already spends steps
    if (event.source.channeling != null) {
      end(event.source);
      return;
    }
    const show = { move: cast.move, target: cast.target, left: REPEATS, finishing: false };

    performing.set(event.source, show);
    repeat(event.source, show);
  });

  battle.on(BattleEvents.UnitFinishChannel, EventPriority.Pre, (event) => {
    const show = performing.get(event.source);

    if (show != null && event.source.channeling?.move === show.move) {
      show.finishing = true;
    }
  });

  // A channel stopped without finishing was broken, which ends the performance
  battle.on(BattleEvents.UnitStopChannel, EventPriority.Post, (event) => {
    const show = performing.get(event.source);

    if (show != null && !show.finishing) {
      end(event.source);
    }
  });

  battle.on(BattleEvents.UnitFinishChannel, EventPriority.Post, (event) => {
    const show = performing.get(event.source);

    if (show?.finishing === true) {
      show.finishing = false;
      repeat(event.source, show);
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      finishing.delete(event.source);
      performing.delete(event.source);
    });
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Encore) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.status[Statuses.Encored] == null &&
        !performing.has(event.target.unit);
    }
  });

  // Scored on what the target is visibly casting: an ally is handed
  // repeats of whatever it throws, and an enemy is only worth locking
  // into a move that does no damage
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Encore || event.target.type !== MoveTargetType.Unit) {
      return;
    }
    const target = event.target.unit;
    const cast = target.casting?.move;
    const friendly = target.team.alliance === event.source.team.alliance;
    // It locks the cast only if it lands while that cast is still going
    const worth =
      cast != null &&
      !NOT_A_MOVE.has(cast) &&
      (friendly || getMoveData(cast).category === MoveCategories.Status) &&
      landsIn(target) >= effectIn(event.source, event.move, event.target);

    event.score += worth ? ENCORE_BONUS : -USELESS_PENALTY;
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Encore || event.target.type !== MoveTargetType.Unit) {
      return;
    }
    const target = event.target.unit;

    if (target.status[Statuses.Encored] != null || performing.has(target)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }
    target.addStatus(Statuses.Encored, {
      type: EffectType.Move,
      move: Moves.Encore,
      unit: event.source,
    });
  });
}
