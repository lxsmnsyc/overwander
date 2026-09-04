import { describe, expect, it } from 'vitest';
import type { FieldView } from '../../src/canvas/battle/field';
import { MoveTargetType } from '../../src/battle/events';
import { Moves } from '../../src/data/ids/moves';
import {
  type Standing,
  aimedAt,
  project,
  unitsOf,
} from '../../src/components/battle/battle-canvas/field';
import { drawAim } from '../../src/components/battle/battle-canvas/draw';
import { createBattle, createUnit } from '../battle/harness';
import type Unit from '../../src/battle/unit';

/**
 * Which way a pokemon is turned while it casts.
 *
 * It looks at what it is aiming at, its own side included: a pokemon
 * helping a teammate is looking at the teammate, and a cast aimed at
 * nobody in particular leaves it resting across the field.
 */

const VIEW: FieldView = { width: 400, height: 300, unit: 20, yaw: 0 };

/** Across the field, which is what everything here rests facing */
const ACROSS = { x: 0, z: 6 };

/** And behind it, where an ally stands and an aim has to turn to reach */
const BEHIND = { x: 0, z: -6 };

function standing(unit: Unit, place: { x: number; z: number }): Standing {
  return { unit, place, look: ACROSS, radius: 10, color: '#fff', sprite: null };
}

/**
 * Which way one of them is drawn. Looked up by unit rather than by
 * place in the list: the slots come back far first, so the order they
 * were staged in is not the order they are drawn in
 */
function facing(standings: Standing[], unit: Unit): string | undefined {
  return project(standings, VIEW, new Map()).find((slot) => slot.unit === unit)?.facing;
}

describe('which way a casting pokemon is turned', () => {
  it('rests facing across the field', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);

    expect(facing([standing(caster, { x: 0, z: 0 })], caster)).toBe('Up');
  });

  it('turns to what it is throwing at', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    caster.addMove(Moves.Tackle);
    caster.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: enemy });

    // Behind it, so a turn toward the aim is a turn right round
    const staged = [standing(caster, { x: 0, z: 0 }), standing(enemy, BEHIND)];

    expect(facing(staged, caster)).toBe('Down');
  });

  it('turns to the teammate it is guarding', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    caster.addMove(Moves.Safeguard);
    caster.cast(Moves.Safeguard, { type: MoveTargetType.Team, team: teamA });

    const staged = [standing(caster, { x: 0, z: 0 }), standing(ally, BEHIND)];

    expect(facing(staged, caster)).toBe('Down');
  });

  it('turns to a teammate still standing rather than to a fallen one', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const fallen = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    fallen.alive = false;
    caster.addMove(Moves.Safeguard);
    caster.cast(Moves.Safeguard, { type: MoveTargetType.Team, team: teamA });

    // The fallen one is first in the team and stands behind; the one
    // still up is off to the side, which is where it should be looking
    const staged = [
      standing(caster, { x: 0, z: 0 }),
      standing(fallen, BEHIND),
      standing(ally, { x: 6, z: 0 }),
    ];

    expect(facing(staged, caster)).toBe('Right');
  });

  it('rests where it stands for a cast aimed at nobody', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);

    caster.addMove(Moves.Harden);
    caster.cast(Moves.Harden, { type: MoveTargetType.None });

    expect(facing([standing(caster, { x: 0, z: 0 })], caster)).toBe('Up');
  });

  it('still turns to a side that is not its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    caster.addMove(Moves.Growl);
    caster.cast(Moves.Growl, { type: MoveTargetType.Team, team: teamB });

    const staged = [standing(caster, { x: 0, z: 0 }), standing(enemy, BEHIND)];

    expect(facing(staged, caster)).toBe('Down');
  });
});

/**
 * The line of marks that runs from a caster to what it has picked.
 * It is what says who is about to be hit while several are winding up.
 */
/** A context that writes down where it was asked to draw. */
function pen(drawn: string[]): CanvasRenderingContext2D {
  const context = {
    lineCap: '',
    lineWidth: 0,
    globalAlpha: 1,
    strokeStyle: '',
    beginPath: () => {},
    moveTo: (x: number, y: number) => drawn.push(`${x},${y}`),
    lineTo: (x: number, y: number) => drawn.push(`${x},${y}`),
    stroke: () => drawn.push('stroke'),
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return context as unknown as CanvasRenderingContext2D;
}

describe('the line from a caster to its aim', () => {
  it('names everybody a target covers', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const one = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    expect(unitsOf({ type: MoveTargetType.Unit, unit: one })).toEqual([one]);
    expect(unitsOf({ type: MoveTargetType.Team, team: teamB })).toEqual([one, other]);
    expect(unitsOf({ type: MoveTargetType.None })).toEqual([]);
    expect(caster.alive).toBe(true);
  });

  it('says what a unit is aiming at only while it is working', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    expect(aimedAt(caster)).toBeNull();

    caster.addMove(Moves.Tackle);
    caster.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: enemy });

    expect(aimedAt(caster)).toEqual({ type: MoveTargetType.Unit, unit: enemy });
  });

  it('draws marks along the gap, and none where there is no gap', () => {
    const drawn: string[] = [];

    drawAim(pen(drawn), [0, 0], [100, 0], '#fff', 0);
    expect(drawn.filter((mark) => mark === 'stroke').length).toBeGreaterThan(1);

    // Aimed at itself: nothing to run along, so nothing is drawn
    drawn.length = 0;
    drawAim(pen(drawn), [40, 40], [40, 40], '#fff', 0);
    expect(drawn).toEqual([]);
  });

  it('moves the marks along as the clock runs', () => {
    const trace = (clock: number): string => {
      const drawn: string[] = [];

      drawAim(pen(drawn), [0, 0], [100, 0], '#fff', clock);
      return drawn.join('|');
    };

    // A line that draws the same picture at every instant is a dashed
    // line rather than one running toward anything
    expect(trace(0)).not.toBe(trace(300));
    // And the same instant twice is the same picture
    expect(trace(300)).toBe(trace(300));
  });
});
