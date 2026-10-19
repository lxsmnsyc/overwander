import { describe, expect, it } from 'vitest';
import {
  COIN_SCATTER_REST,
  FULL_THROTTLE_SCALE,
  STUNTED_DURATION,
} from '../../../../src/battle/abilities/signature/gen-9/paldea-legends';
import { MoveTargetType } from '../../../../src/battle/events';
import { MOVE_DELAY } from '../../../../src/battle/mechanics/move/timing';
import { PAY_DAY_COINS_PER_LEVEL } from '../../../../src/battle/moves/pay-day';
import { unitTarget } from '../../../../src/battle/unit-checks';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Terrains, Weathers } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const GROWL: Blow = [Moves.Growl, 0, Types.Normal, MoveCategories.Status];

describe('Coin Scatter', () => {
  it("scatters Pay Day's coins from a landed blow, once per shortest cast", () => {
    const { battle, teamA, teamB } = createBattle();
    const coin = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const scatter = PAY_DAY_COINS_PER_LEVEL * coin.level;

    pinRandom(battle, 0.5);
    coin.addAbility(Abilities.CoinScatter);
    coin.attack(foe, ...TACKLE, 0);
    expect(coin.coins).toBe(scatter);

    coin.attack(foe, ...TACKLE, 0);
    expect(coin.coins).toBe(scatter);

    battle.tick(COIN_SCATTER_REST);
    coin.attack(foe, ...TACKLE, 0);
    expect(coin.coins).toBe(scatter * 2);
  });

  it('scatters nothing from a status move', () => {
    const { battle, teamA, teamB } = createBattle();
    const coin = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    coin.addAbility(Abilities.CoinScatter);
    coin.attack(foe, ...GROWL, 0);

    expect(coin.coins).toBe(0);
  });
});

describe('the Treasures of Ruin', () => {
  const RELICS = [
    [Abilities.WitheredTablets, Stages.Attack, Stages.Defense],
    [Abilities.ShatteredSword, Stages.Defense, Stages.Attack],
    [Abilities.CrackedVessel, Stages.SpecialAttack, Stages.SpecialDefense],
    [Abilities.ScatteredBeads, Stages.SpecialDefense, Stages.SpecialAttack],
  ] as const;

  for (const [ability, stage, other] of RELICS) {
    it(`keeps its stat from rising for 6 seconds after a hit (${ability})`, () => {
      const { battle, teamA, teamB } = createBattle();
      const relic = createUnit(battle, teamA);
      const foe = createUnit(battle, teamB);

      pinRandom(battle, 0.5);
      relic.addAbility(ability);
      relic.attack(foe, ...TACKLE, 0);

      foe.addStage(stage, 1, NONE_CAUSE);
      foe.addStage(other, 1, NONE_CAUSE);
      expect(foe.stages[stage]).toBe(0);
      expect(foe.stages[other]).toBe(1);

      foe.addStage(stage, -1, NONE_CAUSE);
      expect(foe.stages[stage]).toBe(-1);

      battle.tick(STUNTED_DURATION);
      foe.addStage(stage, 1, NONE_CAUSE);
      expect(foe.stages[stage]).toBe(0);
    });
  }

  it('refreshes the curse with each hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const relic = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0.5);
    relic.addAbility(Abilities.WitheredTablets);
    relic.attack(foe, ...TACKLE, 0);
    battle.tick(STUNTED_DURATION - 1000);
    relic.attack(foe, ...TACKLE, 0);
    battle.tick(2000);

    foe.addStage(Stages.Attack, 1, NONE_CAUSE);
    expect(foe.stages[Stages.Attack]).toBe(0);
  });
});

describe('Full Throttle', () => {
  it('winds Sun Sprint up 20% faster in sun only', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    const bare = lizard.checkMoveCastTime(Moves.Tackle, target);

    lizard.addAbility(Abilities.SunSprint);
    expect(lizard.checkMoveCastTime(Moves.Tackle, target)).toBe(bare);

    lizard.triggerMove(Moves.SunnyDay, { type: MoveTargetType.None }, 0);
    battle.tick(MOVE_DELAY);
    expect(battle.weather.current).toBe(Weathers.Sunny);
    expect(lizard.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(
      bare * FULL_THROTTLE_SCALE,
      5,
    );
  });

  it('winds Drive Mode up 20% faster on Electric Terrain only', () => {
    const { battle, teamA, teamB } = createBattle();
    const bike = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    const bare = bike.checkMoveCastTime(Moves.Tackle, target);

    bike.addAbility(Abilities.DriveMode);
    bike.triggerMove(Moves.SunnyDay, { type: MoveTargetType.None }, 0);
    battle.tick(MOVE_DELAY);
    expect(bike.checkMoveCastTime(Moves.Tackle, target)).toBe(bare);

    bike.triggerMove(Moves.ElectricTerrain, { type: MoveTargetType.None }, 0);
    battle.tick(MOVE_DELAY);
    expect(bike.checkTerrain()).toBe(Terrains.Electric);
    expect(bike.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(bare * FULL_THROTTLE_SCALE, 5);
  });
});
