import { describe, expect, it } from 'vitest';
import type { FieldView } from '../../src/canvas/battle/field';
import { MoveTargetType } from '../../src/battle/events';
import { Moves } from '../../src/data/ids/moves';
import { type Standing, project } from '../../src/components/battle/battle-canvas/field';
import { createBattle, createUnit } from '../battle/harness';
import type Unit from '../../src/battle/unit';

/**
 * Which way a pokemon is turned while it casts.
 *
 * It looks at what it is aiming at, and its own side is the
 * exception: a move aimed there is aimed behind it, and turning round
 * to watch it takes the pokemon's back off the fight for as long as
 * the cast lasts.
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

  it('stays facing the fight while it guards its own side', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    caster.addMove(Moves.Safeguard);
    caster.cast(Moves.Safeguard, { type: MoveTargetType.Team, team: teamA });

    // The ally stands behind it, and this is the turn a Safeguard used
    // to make: away from the fight for as long as the cast lasted
    const staged = [standing(caster, { x: 0, z: 0 }), standing(ally, BEHIND)];

    expect(facing(staged, caster)).toBe('Up');
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
