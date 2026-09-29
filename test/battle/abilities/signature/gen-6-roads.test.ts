// Bunnelby through Scatterbug.

import { describe, expect, it } from 'vitest';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { MoveTargetType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import {
  STOOP_SCALE,
  WINGSCALE_FLOOR,
} from '../../../../src/battle/abilities/signature/bunnelby-to-scatterbug';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

describe("Kalos's first roads", () => {
  it('digs under a raised guard with its Ground moves, and leaves the rest of them to it', () => {
    const { battle, teamA, teamB } = createBattle();
    const rabbit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    rabbit.enter();
    foe.enter();
    foe.addStage(Stages.Defense, 2, NONE_CAUSE);

    const guarded = dealDamage(rabbit, foe, Moves.Dig, 80, Types.Ground, MoveCategories.Physical);
    const guardedElsewhere = dealDamage(
      rabbit,
      foe,
      Moves.Tackle,
      80,
      Types.Normal,
      MoveCategories.Physical,
    );

    rabbit.addAbility(Abilities.LoosenedEarth);

    const loosened = dealDamage(rabbit, foe, Moves.Dig, 80, Types.Ground, MoveCategories.Physical);

    expect(loosened).toBeGreaterThan(guarded);
    // Only the ground it digs: everything else meets the wall
    expect(
      dealDamage(rabbit, foe, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(guardedElsewhere, 5);
  });

  it('leaves a lowered guard lowered', () => {
    const { battle, teamA, teamB } = createBattle();
    const rabbit = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    rabbit.enter();
    foe.enter();
    foe.addStage(Stages.Defense, -2, NONE_CAUSE);

    const bare = dealDamage(rabbit, foe, Moves.Dig, 80, Types.Ground, MoveCategories.Physical);

    rabbit.addAbility(Abilities.LoosenedEarth);

    expect(
      dealDamage(rabbit, foe, Moves.Dig, 80, Types.Ground, MoveCategories.Physical),
    ).toBeCloseTo(bare, 5);
  });

  it('stoops on a target part way through a move, and not on one standing idle', () => {
    const { battle, teamA, teamB } = createBattle();
    const robin = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    robin.addAbility(Abilities.Stoop);
    robin.enter();
    foe.enter();

    const idle = dealDamage(robin, foe, Moves.Peck, 80, Types.Flying, MoveCategories.Physical);

    foe.addMove(Moves.SolarBeam);
    foe.cast(Moves.SolarBeam, { type: MoveTargetType.Unit, unit: robin });

    expect(foe.casting).not.toBeUndefined();

    const busy = dealDamage(robin, foe, Moves.Peck, 80, Types.Flying, MoveCategories.Physical);
    // Its own Ground and Normal moves stoop on nothing
    const plain = dealDamage(robin, foe, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);
    const plainIdle = dealDamage(
      robin,
      foe,
      Moves.Tackle,
      80,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(busy).toBeCloseTo(idle * STOOP_SCALE, 5);
    expect(plain).toBeCloseTo(plainIdle, 5);
  });

  it('puts dust in an eye each time it lands, and never more than the floor', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bug.addAbility(Abilities.Wingscale);
    bug.enter();
    foe.enter();

    for (let at = 0; at < 4; at++) {
      dealDamage(bug, foe, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);
      battle.tick(turns(1));
    }

    expect(foe.stages[Stages.Accuracy]).toBe(-WINGSCALE_FLOOR);
  });
});
