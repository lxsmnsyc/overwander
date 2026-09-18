import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Team from '../team';
import turns from '../turn';
import type Unit from '../unit';

/**
 * The Unova moves that answer a move somebody else just landed.
 *
 * Each reads "this turn" or "last turn" in the mainline, so each reads
 * a window here, the same one Payback does. A window opens once a move
 * has finished landing, and what counts as a teammate is the user's
 * own team
 */
const WINDOW = turns(1);

/** Echoed Voice climbs by this much for each link in the chain */
const ECHO_STEP = 40;
const ECHO_CEILING = 200;

/** The Fusion pair, each read by the other */
const FUSED = new Map<Moves, Moves>([
  [Moves.FusionFlare, Moves.FusionBolt],
  [Moves.FusionBolt, Moves.FusionFlare],
]);

export default function setupEchoingMoves(battle: Battle): void {
  /** The last Round on each team, and who sang it */
  const rounds = new Map<Team, { unit: Unit; left: number }>();
  /** Teams that have just lost somebody */
  const avenging = new Map<Team, number>();
  /** Fusion moves that have just landed anywhere */
  const fused = new Map<Moves, number>();
  /** How long the field's echo has been going, and how long it lasts */
  const echo = { chain: 0, left: 0 };

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, round] of rounds) {
      round.left -= event.duration;
      if (round.left <= 0) {
        rounds.delete(team);
      }
    }
    for (const window of [avenging, fused] as Map<unknown, number>[]) {
      for (const [key, left] of window) {
        if (left <= event.duration) {
          window.delete(key);
        } else {
          window.set(key, left - event.duration);
        }
      }
    }
    echo.left = Math.max(0, echo.left - event.duration);

    if (rounds.size === 0 && avenging.size === 0 && fused.size === 0 && echo.left === 0) {
      timer.stop();
    }
  });

  timer.stop();

  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
    if (event.move === Moves.Round) {
      rounds.set(event.source.team, { unit: event.source, left: WINDOW });
    } else if (FUSED.has(event.move)) {
      fused.set(event.move, WINDOW);
    } else if (event.move === Moves.EchoedVoice) {
      echo.chain = echo.left > 0 ? echo.chain + 1 : 1;
      echo.left = WINDOW;
    } else {
      return;
    }
    timer.start();
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    avenging.set(event.source.team, WINDOW);
    timer.start();
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    if (event.move === Moves.EchoedVoice) {
      event.power =
        echo.left > 0 ? Math.min(ECHO_CEILING, ECHO_STEP * (echo.chain + 1)) : ECHO_STEP;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null) {
      return;
    }

    const round = rounds.get(event.source.team);
    const partner = FUSED.get(event.move);

    if (
      (event.move === Moves.Round && round != null && round.unit !== event.source) ||
      (event.move === Moves.Retaliate && avenging.has(event.source.team)) ||
      (partner != null && fused.has(partner))
    ) {
      event.power *= 2;
    }
  });
}
