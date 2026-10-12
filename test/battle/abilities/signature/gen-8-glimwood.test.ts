// Sinistea through Milcery.

import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import Abilities from '../../../../src/data/ids/abilities';
import { DamageFlags, Moves } from '../../../../src/data/ids/moves';
import { EffectType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import {
  DESPAIR_FEAST_FRACTION,
  SILENT_WRATH_FRACTION,
} from '../../../../src/battle/abilities/signature/sinistea-to-milcery';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE } from './helpers';

/** Long enough for a cast move to land, short of any wind-up */
const FLIGHT = 500;

describe('Last Pour', () => {
  it('casts Healing Wish on its worst-hurt teammate as it faints', () => {
    const { battle, teamA, teamB } = createBattle();
    const teacup = createUnit(battle, teamA);
    const scratched = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const max = hurt.checkStat(Stats.HP, 0);

    teacup.addAbility(Abilities.LastPour);
    scratched.setHealth(max * 0.9);
    hurt.setHealth(max * 0.2);

    teacup.damage(NONE_CAUSE, teacup, teacup.health, DamageFlags.Indirect);
    battle.tick(FLIGHT);

    expect(teacup.alive).toBe(false);
    expect(hurt.health).toBe(max);
    expect(scratched.health).toBeCloseTo(max * 0.9, 5);
  });

  it('pours nothing while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    const teacup = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const max = mate.checkStat(Stats.HP, 0);

    teacup.addAbility(Abilities.LastPour);
    mate.setHealth(max * 0.2);

    teacup.damage(NONE_CAUSE, teacup, teacup.health / 2, DamageFlags.Indirect);
    battle.tick(FLIGHT);

    expect(mate.health).toBeCloseTo(max * 0.2, 5);
  });
});

describe('Silent Wrath', () => {
  it('costs an enemy 1/8 of its HP for each stat it raises of its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const hatenna = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const foeMate = createUnit(battle, teamB);
    const max = foe.checkStat(Stats.HP, 0);
    const own = { type: EffectType.Move, move: Moves.SwordsDance, unit: foe } as const;

    hatenna.addAbility(Abilities.SilentWrath);
    hatenna.enter();
    foe.enter();
    foeMate.enter();

    foe.addStage(Stages.Attack, 2, own);

    expect(foe.stages[Stages.Attack]).toBe(2);
    expect(foe.health).toBeCloseTo(max * (1 - SILENT_WRATH_FRACTION), 5);

    // A stat it lost, and one a teammate raised for it, cost nothing
    foe.addStage(Stages.Speed, -1, own);
    foe.addStage(Stages.Defense, 1, {
      type: EffectType.Move,
      move: Moves.Decorate,
      unit: foeMate,
    });

    expect(foe.health).toBeCloseTo(max * (1 - SILENT_WRATH_FRACTION), 5);

    // Its own side raises freely
    const mate = createUnit(battle, teamA);

    mate.enter();
    mate.addStage(Stages.Attack, 1, { type: EffectType.Move, move: Moves.SwordsDance, unit: mate });

    expect(mate.health).toBe(mate.checkStat(Stats.HP, 0));
  });

  it('goes quiet while a Despair Feast holder stands anywhere', () => {
    const { battle, teamA, teamB } = createBattle();
    const hatenna = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const impidimp = createUnit(battle, teamB);
    const own = { type: EffectType.Move, move: Moves.SwordsDance, unit: foe } as const;

    hatenna.addAbility(Abilities.SilentWrath);
    impidimp.addAbility(Abilities.DespairFeast);
    hatenna.enter();
    foe.enter();
    impidimp.enter();

    foe.addStage(Stages.Attack, 1, own);

    expect(foe.health).toBe(foe.checkStat(Stats.HP, 0));

    // With the counterpart gone, the wrath is back
    impidimp.damage(NONE_CAUSE, impidimp, impidimp.health, DamageFlags.Indirect);
    foe.addStage(Stages.Attack, 1, own);

    expect(foe.health).toBeCloseTo(foe.checkStat(Stats.HP, 0) * (1 - SILENT_WRATH_FRACTION), 5);
  });
});

describe('Despair Feast', () => {
  it('heals 1/8 of its HP each time an enemy loses a stat stage', () => {
    const { battle, teamA, teamB } = createBattle();
    const impidimp = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = impidimp.checkStat(Stats.HP, 0);

    impidimp.addAbility(Abilities.DespairFeast);
    impidimp.enter();
    mate.enter();
    foe.enter();
    impidimp.setHealth(max / 2);

    foe.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(impidimp.health).toBeCloseTo(max * (0.5 + DESPAIR_FEAST_FRACTION), 5);

    // A rise, or a drop on its own side, feeds nothing
    foe.addStage(Stages.Speed, 1, NONE_CAUSE);
    mate.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(impidimp.health).toBeCloseTo(max * (0.5 + DESPAIR_FEAST_FRACTION), 5);
  });

  it('goes hungry while a Silent Wrath holder stands anywhere', () => {
    const { battle, teamA, teamB } = createBattle();
    const impidimp = createUnit(battle, teamA);
    const hatenna = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = impidimp.checkStat(Stats.HP, 0);

    impidimp.addAbility(Abilities.DespairFeast);
    hatenna.addAbility(Abilities.SilentWrath);
    impidimp.enter();
    hatenna.enter();
    foe.enter();
    impidimp.setHealth(max / 2);

    foe.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(impidimp.health).toBeCloseTo(max / 2, 5);
  });
});

describe('Sugarcoat', () => {
  it('casts Decorate on a teammate it casts a status move on', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const milcery = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    milcery.addAbility(Abilities.Sugarcoat);

    milcery.triggerMove(Moves.HelpingHand, unitTarget(mate), 0);
    battle.tick(FLIGHT);
    battle.tick(FLIGHT);

    expect(mate.stages[Stages.Attack]).toBe(2);
    expect(mate.stages[Stages.SpecialAttack]).toBe(2);

    // Not on an enemy, and not for an attack on a teammate
    milcery.triggerMove(Moves.Growl, unitTarget(foe), 0);
    milcery.triggerMove(Moves.Tackle, unitTarget(mate), 0);
    battle.tick(FLIGHT);
    battle.tick(FLIGHT);

    expect(foe.stages[Stages.SpecialAttack]).toBe(0);
    expect(mate.stages[Stages.SpecialAttack]).toBe(2);
  });

  it('does not frost its own Decorate a second time', () => {
    const { battle, teamA, teamB } = createBattle();
    const milcery = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    createUnit(battle, teamB);

    milcery.addAbility(Abilities.Sugarcoat);
    milcery.triggerMove(Moves.Decorate, unitTarget(mate), 0);
    battle.tick(FLIGHT);
    battle.tick(FLIGHT);

    expect(mate.stages[Stages.Attack]).toBe(2);
  });
});
