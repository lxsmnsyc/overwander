import { describe, expect, it } from 'vitest';
import { BattleModes } from '../../src/battle/core';
import { MoveTargetType } from '../../src/battle/events';
import { skyOverTeam } from '../../src/battle/utils';
import { type Slot, skiesOver } from '../../src/components/battle/battle-canvas/field';
import { Weathers } from '../../src/data/ids/status';
import { Moves } from '../../src/data/ids/moves';
import { createBattle, createUnit } from '../battle/harness';
import type Unit from '../../src/battle/unit';

/**
 * Which sky is drawn where.
 *
 * In a raid a team's own weather is that team's and nobody else's, so
 * the picture cannot hold one sky: it holds a patch per team, and the
 * whole picture only when the weather is the field's.
 */

const PICTURE = { width: 400, height: 300 };

/** A slot standing at a point, which is all the patches read off one */
function slot(unit: Unit, x: number, y: number): Slot {
  return {
    unit,
    x,
    y,
    radius: 10,
    color: '#fff',
    sprite: null,
    facing: 'Down',
    depth: 1,
    offset: [0, 0],
    spin: 0,
    visible: true,
  };
}

describe('the sky over a raid', () => {
  it('covers the picture when the weather belongs to the field', () => {
    const { battle, teamA, teamB } = createBattle('sky', BattleModes.Raid);
    const mine = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    battle.setWeather(Weathers.Rain);

    const patches = skiesOver([slot(mine, 100, 200), slot(boss, 300, 120)], battle, PICTURE);

    expect(patches).toHaveLength(1);
    expect(patches[0]).toEqual({ weather: Weathers.Rain, x: 0, y: 0, ...PICTURE });
  });

  it('keeps a team weather over that team alone', () => {
    const { battle, teamA, teamB } = createBattle('sky', BattleModes.Raid);
    const mine = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    teamA.setWeather(Weathers.Sunny);

    const patches = skiesOver([slot(mine, 100, 200), slot(boss, 300, 120)], battle, PICTURE);

    expect(patches).toHaveLength(1);
    expect(patches[0].weather).toBe(Weathers.Sunny);
    // Around the one standing in it, and nowhere near the other side
    expect(patches[0].x).toBeLessThan(100);
    expect(patches[0].x + patches[0].width).toBeLessThan(300);
    // Weather comes out of the sky, so the patch starts at the top
    expect(patches[0].y).toBe(0);
    expect(patches[0].height).toBeGreaterThan(200);
  });

  it('gives each side its own sky at once', () => {
    const { battle, teamA, teamB } = createBattle('sky', BattleModes.Raid);
    const mine = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    teamA.setWeather(Weathers.Sunny);
    teamB.setWeather(Weathers.Sandstorm);

    const patches = skiesOver([slot(mine, 100, 200), slot(boss, 300, 120)], battle, PICTURE);

    expect(patches).toHaveLength(2);
    expect(new Set(patches.map((patch) => patch.weather))).toEqual(
      new Set([Weathers.Sunny, Weathers.Sandstorm]),
    );
  });

  it('draws nothing at all under a clear sky', () => {
    const { battle, teamA } = createBattle('sky', BattleModes.Raid);
    const mine = createUnit(battle, teamA);

    expect(skiesOver([slot(mine, 100, 200)], battle, PICTURE)).toEqual([]);
  });

  it('stays clipped to the picture however far out a team stands', () => {
    const { battle, teamA } = createBattle('sky', BattleModes.Raid);
    const mine = createUnit(battle, teamA);

    teamA.setWeather(Weathers.Hail);

    const [patch] = skiesOver([slot(mine, -5, 400)], battle, PICTURE);

    expect(patch.x).toBe(0);
    expect(patch.height).toBe(PICTURE.height);
    // And a side the camera has turned right off the picture has no
    // sky to draw at all
    expect(skiesOver([slot(mine, -500, 200)], battle, PICTURE)).toEqual([]);
  });
});

describe('the sky a team stands under', () => {
  it('takes the field weather ahead of its own', () => {
    const { battle, teamA } = createBattle('sky', BattleModes.Raid);

    teamA.setWeather(Weathers.Sunny);
    expect(skyOverTeam(teamA)).toBe(Weathers.Sunny);

    battle.setWeather(Weathers.Rain);
    expect(skyOverTeam(teamA)).toBe(Weathers.Rain);
  });

  it('reaches one side in a raid and everybody in a fight between players', () => {
    const raid = createBattle('raid', BattleModes.Raid);
    const caster = createUnit(raid.battle, raid.teamA);

    createUnit(raid.battle, raid.teamB);
    caster.addMove(Moves.SunnyDay);
    caster.cast(Moves.SunnyDay, { type: MoveTargetType.None });
    raid.battle.tick(4000);

    expect(skyOverTeam(raid.teamA)).toBe(Weathers.Sunny);
    expect(skyOverTeam(raid.teamB)).toBe(Weathers.None);

    const pvp = createBattle('pvp', BattleModes.PvP);
    const other = createUnit(pvp.battle, pvp.teamA);

    createUnit(pvp.battle, pvp.teamB);
    other.addMove(Moves.SunnyDay);
    other.cast(Moves.SunnyDay, { type: MoveTargetType.None });
    pvp.battle.tick(4000);

    expect(skyOverTeam(pvp.teamB)).toBe(Weathers.Sunny);
  });
});
