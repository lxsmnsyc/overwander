import { describe, expect, it } from 'vitest';
import { Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { Species } from '../../../src/data/ids/species';
import { createBattle, createUnit } from '../harness';

describe('Zeniths', () => {
  it('puts an Arcanine holding its shard at its Zenith, Strong Jaw worn on top', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    dog.setSpecies(Species.Arcanine);
    dog.addAbility(Abilities.Intimidate);
    dog.addItem(Items.ArcanineZenithShard);

    dog.enter();

    expect(dog.species).toBe(Species.ArcanineZenith);
    expect(dog.stats[0][Stats.Speed]).toBe(135);
    expect([...dog.types]).toEqual([Types.Fire, Types.Dragon]);
    expect(dog.hasAbility(Abilities.StrongJaw)).toBe(true);
    expect(dog.hasAbility(Abilities.Intimidate)).toBe(true);
  });

  it('ignores a shard held by anybody else', () => {
    const { battle, teamA } = createBattle();
    const ninetales = createUnit(battle, teamA);
    ninetales.setSpecies(Species.Ninetales);
    ninetales.addItem(Items.ArcanineZenithShard);

    ninetales.enter();

    expect(ninetales.species).toBe(Species.Ninetales);
  });

  it('lets one pokemon on a team reach its Zenith, the highest level first', () => {
    const { battle, teamA, teamB } = createBattle();
    const low = createUnit(battle, teamA);
    const high = createUnit(battle, teamA);
    const rival = createUnit(battle, teamB);

    for (const unit of [low, high, rival]) {
      unit.setSpecies(Species.Arcanine);
      unit.addItem(Items.ArcanineZenithShard);
    }
    low.setLevel(40);
    high.setLevel(60);

    low.enter();
    high.enter();
    rival.enter();

    expect(low.species).toBe(Species.Arcanine);
    expect(high.species).toBe(Species.ArcanineZenith);
    // The other side has a Zenith of its own
    expect(rival.species).toBe(Species.ArcanineZenith);
  });

  it('keeps a team’s Mega and its Zenith apart', () => {
    const { battle, teamA } = createBattle();
    const ghost = createUnit(battle, teamA);
    const dog = createUnit(battle, teamA);
    ghost.setSpecies(Species.Gengar);
    ghost.addItem(Items.Gengarite);
    dog.setSpecies(Species.Arcanine);
    dog.addItem(Items.ArcanineZenithShard);

    ghost.enter();
    dog.enter();

    expect(ghost.species).toBe(Species.GengarMega);
    expect(dog.species).toBe(Species.ArcanineZenith);
  });

  it('stays at its Zenith when it steps off the field and back', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    dog.setSpecies(Species.Arcanine);
    dog.addItem(Items.ArcanineZenithShard);

    dog.enter();
    dog.leave();
    dog.enter();

    expect(dog.species).toBe(Species.ArcanineZenith);
  });
});
