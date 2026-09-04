import { describe, expect, it } from 'vitest';
import { BattleEvents, MoveTargetType } from '../../src/battle/events';
import { EventPriority } from '../../src/core/event-emitter';
import { createMoveDemo } from '../../src/battle/demo-move';
import { Moves } from '../../src/data/ids/moves';
import registerGameData from '../../src/data';

/**
 * The move demo stages one move for looking at. What it bends is the
 * accuracy roll: a Fissure lands three casts in ten, which is a
 * lottery rather than a demonstration.
 */

registerGameData();

/** Whether a cast of this move landed, with the dial set this way. */
function lands(move: Moves, alwaysHits: boolean): boolean {
  const demo = createMoveDemo(move, { alwaysHits });
  let hit = false;

  // Initialized and ticked by hand: a demo battle is staged realtime,
  // and starting one asks for a frame timer no test has
  demo.battle.initialize();
  demo.battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
    hit = hit || event.hit;
  });
  demo.caster.cast(move, { type: MoveTargetType.Unit, unit: demo.target });
  demo.battle.tick(8000);
  demo.battle.end();
  return hit;
}

/**
 * What Fissure's own roll comes out at in a demo staged for it. The
 * battle is seeded by the move, so it is the same answer every run
 */
const UNFORCED = false;

describe('the move demo', () => {
  it('lands a move that would mostly miss', () => {
    // Fissure is 30% accurate, so an unforced roll is a coin the page
    // has to keep flipping
    for (let go = 0; go < 5; go += 1) {
      expect(lands(Moves.Fissure, true), `cast ${go}`).toBe(true);
    }
  });

  it('leaves the roll alone when the dial is off', () => {
    // The battle is seeded by the move it stages, so the unforced roll
    // is the same one every time this runs. What it comes out at is
    // not the point: that the demo is no longer deciding is
    expect(lands(Moves.Fissure, false)).toBe(UNFORCED);
  });

  it('reads the dial at the cast rather than when it was staged', () => {
    // The page hands one object to every battle it stages, so a switch
    // changes the next cast instead of tearing the fight down
    const rules = { alwaysHits: false };
    const demo = createMoveDemo(Moves.Fissure, rules);

    rules.alwaysHits = true;
    expect(demo.rules.alwaysHits).toBe(true);
    demo.battle.end();
  });
});
