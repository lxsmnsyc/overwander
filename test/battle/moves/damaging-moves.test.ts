import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MoveRole, getMoveRoles } from '../../../src/battle/ai/roles';
import { BattleEvents, MoveTargetType } from '../../../src/battle/events';
import { EventPriority } from '../../../src/core/event-emitter';
import { Stats } from '../../../src/data/constants/stats';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { getMoveData, getRegisteredMoves } from '../../../src/data/moves';
import { MAX_MOVES } from '../../../src/data/moves/max-moves';
import { GENERIC_Z_MOVES } from '../../../src/data/moves/z-moves';
import { createBattle, createUnit, pinRandom } from '../harness';

/** Levels each move is tried at, read off a seed so a failure reads the same each run */
const LEVELS_PER_MOVE = 2;

/** What a move does at a level to a typeless target at full health, or why it did nothing */
function tryMove(move: Moves, level: number): string | null {
  const { battle, teamA, teamB } = createBattle(`damaging:${move}:${level}`);

  // Every roll lands: the accuracy check passes and nothing is left to chance
  pinRandom(battle, 0);

  const user = createUnit(battle, teamA);
  const target = createUnit(battle, teamB);
  // An object, so the listener's write is not narrowed away
  const seen = { failed: false };

  user.setLevel(level);
  target.setLevel(level);
  user.setHealth(user.checkStat(Stats.HP, 0));
  target.setHealth(target.checkStat(Stats.HP, 0));
  battle.on(BattleEvents.UnitTriggerMoveEffectFailed, EventPriority.Post, () => {
    seen.failed = true;
  });

  const before = target.health;

  try {
    user.triggerMoveEffect(move, { type: MoveTargetType.Unit, unit: target }, 0);
  } catch (error) {
    return `${getMoveData(move).name} (${move}) at level ${level} threw: ${String(error)}`;
  }
  if (seen.failed || target.health < before) {
    return null;
  }
  return `${getMoveData(move).name} (${move}) at level ${level}`;
}

/**
 * Damaging moves that cannot be tried on their own. A type Z-Move and a
 * Max Move take their power from the move they replaced, so cast bare
 * they have none. Present heals at the low roll the test pins. Frenzy
 * Burst is a noble's, and reads the noble that casts it
 */
const UNTRIED = new Set<Moves>([
  ...GENERIC_Z_MOVES,
  ...MAX_MOVES,
  Moves.Present,
  Moves.FrenzyBurst,
]);

/** Damaging moves whose damage is not a fixed figure or a share of the target's HP */
function listScaledDamagingMoves(): Moves[] {
  const moves: Moves[] = [];

  for (const move of getRegisteredMoves()) {
    const roles = getMoveRoles(move);

    if (
      !UNTRIED.has(move) &&
      getMoveData(move).category !== MoveCategories.Status &&
      !roles.has(MoveRole.FixedDamage) &&
      !roles.has(MoveRole.OneHitKO)
    ) {
      moves.push(move);
    }
  }
  return moves;
}

describe('damaging moves', () => {
  it('lower a neutral target when they land, at any level', () => {
    // Registers the move data the list below reads
    createBattle();

    const missed: string[] = [];

    for (const move of listScaledDamagingMoves()) {
      const levels = fc.sample(fc.integer({ min: 1, max: 100 }), {
        numRuns: LEVELS_PER_MOVE,
        seed: move,
      });

      for (const level of levels) {
        const miss = tryMove(move, level);

        if (miss != null) {
          missed.push(miss);
        }
      }
    }
    expect(missed).toEqual([]);
  });
});
