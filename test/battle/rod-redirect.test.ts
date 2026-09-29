import { describe, expect, it } from 'vitest';
import { BattleModes } from '../../src/battle/core';
import { EffectType } from '../../src/battle/events';
import { unitTarget } from '../../src/battle/utils';
import { Stages, Stats } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from './harness';

/** Long enough for a triggered move to land */
function settle(battle: ReturnType<typeof createBattle>['battle']): void {
  for (let elapsed = 0; elapsed < 5000; elapsed += 1000 / 60) {
    battle.tick(1000 / 60);
  }
}

function hurt(unit: ReturnType<typeof createUnit>): boolean {
  return unit.health < unit.checkStat(Stats.HP, 0);
}

describe('a raid boss’s widened moves', () => {
  it('go out to the whole side when nothing draws them', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', BattleModes.Raid);
    const boss = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);

    pinRandom(battle, 0);
    boss.addAbility(Abilities.Boss);
    boss.triggerMove(Moves.Thunder, unitTarget(first), 0);
    settle(battle);

    expect(hurt(first)).toBe(true);
    expect(hurt(second)).toBe(true);
  });

  it('are drawn onto a Lightning Rod, which takes the whole of it', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', BattleModes.Raid);
    const boss = createUnit(battle, teamA);
    const aimed = createUnit(battle, teamB);
    const rod = createUnit(battle, teamB);

    pinRandom(battle, 0);
    boss.addAbility(Abilities.Boss);
    rod.addAbility(Abilities.LightningRod);
    boss.triggerMove(Moves.Thunder, unitTarget(aimed), 0);
    settle(battle);

    expect(hurt(aimed)).toBe(false);
    expect(hurt(rod)).toBe(false);
    expect(rod.stages[Stages.SpecialAttack]).toBe(1);
  });

  it('are drawn onto a centre that called for them', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', BattleModes.Raid);
    const boss = createUnit(battle, teamA);
    const centre = createUnit(battle, teamB);
    const spared = createUnit(battle, teamB);

    pinRandom(battle, 0);
    boss.addAbility(Abilities.Boss);
    centre.addStatus(Statuses.Centered, { type: EffectType.None });
    boss.triggerMove(Moves.Thunder, unitTarget(centre), 0);
    settle(battle);

    expect(hurt(centre)).toBe(true);
    expect(hurt(spared)).toBe(false);
  });
});

describe('Storm Drain', () => {
  it('draws a Water move aimed at a teammate onto itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const aimed = createUnit(battle, teamB);
    const drain = createUnit(battle, teamB);

    pinRandom(battle, 0);
    drain.addAbility(Abilities.StormDrain);
    caster.triggerMove(Moves.WaterGun, unitTarget(aimed), 0);
    settle(battle);

    expect(hurt(aimed)).toBe(false);
    expect(hurt(drain)).toBe(false);
    expect(drain.stages[Stages.SpecialAttack]).toBe(1);
  });
});
