import { describe, expect, it } from 'vitest';
import { EffectType } from '../../src/battle/events';
import { unitTarget } from '../../src/battle/utils';
import { Stats } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { createBattle, createUnit } from './harness';

describe('Battle Bond', () => {
  it('turns a Greninja into Ash-Greninja once its move knocks an enemy out', () => {
    const { battle, teamA, teamB } = createBattle();
    const ninja = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    ninja.setSpecies(Species.Greninja);
    ninja.addAbility(Abilities.BattleBond);

    ninja.damage({ type: EffectType.Move, move: Moves.Tackle, unit: ninja }, foe, 999, 0);

    expect(foe.alive).toBe(false);
    expect(ninja.species).toBe(Species.GreninjaAsh);
    expect(ninja.stats[0][Stats.SpecialAttack]).toBe(153);
  });

  it('stays a Greninja when the knock-out was not its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const ninja = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    ninja.setSpecies(Species.Greninja);
    ninja.addAbility(Abilities.BattleBond);

    mate.damage({ type: EffectType.Move, move: Moves.Tackle, unit: mate }, foe, 999, 0);

    expect(ninja.species).toBe(Species.Greninja);
  });

  it('throws Water Shuriken as a fixed volley of 3 at 20 power once bonded', () => {
    const { battle, teamA, teamB } = createBattle();
    const ninja = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    ninja.setSpecies(Species.Greninja);
    ninja.addAbility(Abilities.BattleBond);
    const aim = unitTarget(foe);

    expect(ninja.checkMovePower(Moves.WaterShuriken, aim)).toBe(15);

    ninja.setSpecies(Species.GreninjaAsh);

    expect(ninja.checkMovePower(Moves.WaterShuriken, aim)).toBe(20);
    expect(ninja.checkMoveHits(Moves.WaterShuriken, aim, 2, 5)).toBe(3);
  });
});
