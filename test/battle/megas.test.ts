import { describe, expect, it } from 'vitest';
import { Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { Weathers } from '../../src/data/ids/status';
import { createBattle, createUnit } from './harness';

describe('Mega Evolution', () => {
  it('puts a Gengar holding its stone in its Mega, Shadow Tag worn on top', () => {
    const { battle, teamA } = createBattle();
    const ghost = createUnit(battle, teamA);
    ghost.setSpecies(Species.Gengar);
    ghost.addAbility(Abilities.CursedBody);
    ghost.addItem(Items.Gengarite);

    ghost.enter();

    expect(ghost.species).toBe(Species.GengarMega);
    expect(ghost.stats[0][Stats.SpecialAttack]).toBe(170);
    expect([...ghost.types]).toEqual([Types.Ghost, Types.Poison]);
    expect(ghost.hasAbility(Abilities.ShadowTag)).toBe(true);
    expect(ghost.hasAbility(Abilities.CursedBody)).toBe(true);
  });

  it('wears the filler where the line already has the Mega’s own ability', () => {
    const { battle, teamA } = createBattle();
    const bug = createUnit(battle, teamA);
    bug.setSpecies(Species.Scizor);
    bug.addAbility(Abilities.Technician);
    bug.addItem(Items.Scizorite);

    bug.enter();

    expect(bug.species).toBe(Species.ScizorMega);
    expect(bug.hasAbility(Abilities.ToughClaws)).toBe(true);
    expect(bug.hasAbility(Abilities.Technician)).toBe(true);
  });

  it('ignores a stone that names another pokemon', () => {
    const { battle, teamA } = createBattle();
    const ghost = createUnit(battle, teamA);
    ghost.setSpecies(Species.Gengar);
    ghost.addItem(Items.Alakazite);

    ghost.enter();

    expect(ghost.species).toBe(Species.Gengar);
  });

  it('lets one pokemon on a team Mega Evolve, the highest level first', () => {
    const { battle, teamA, teamB } = createBattle();
    const low = createUnit(battle, teamA);
    const high = createUnit(battle, teamA);
    const rival = createUnit(battle, teamB);

    low.setSpecies(Species.Gengar);
    low.addItem(Items.Gengarite);
    high.setSpecies(Species.Absol);
    high.addItem(Items.Absolite);
    high.setLevel(60);
    rival.setSpecies(Species.Lucario);
    rival.addItem(Items.Lucarionite);

    // The weaker holder takes the field first, and still waits
    low.enter();
    high.enter();
    rival.enter();

    expect(low.species).toBe(Species.Gengar);
    expect(high.species).toBe(Species.AbsolMega);
    // The other side has a Mega of its own
    expect(rival.species).toBe(Species.LucarioMega);
  });

  it('breaks a tie on level with the bigger Mega', () => {
    const { battle, teamA } = createBattle();
    const small = createUnit(battle, teamA);
    const big = createUnit(battle, teamA);

    small.setSpecies(Species.Mawile);
    small.addItem(Items.Mawilite);
    big.setSpecies(Species.Garchomp);
    big.addItem(Items.Garchompite);

    small.enter();
    big.enter();

    expect(small.species).toBe(Species.Mawile);
    expect(big.species).toBe(Species.GarchompMega);
  });

  it('breaks a full tie with the earlier party slot', () => {
    const { battle, teamA } = createBattle();
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);

    first.setSpecies(Species.Latias);
    first.addItem(Items.Latiasite);
    second.setSpecies(Species.Latios);
    second.addItem(Items.Latiosite);

    second.enter();
    first.enter();

    expect(first.species).toBe(Species.LatiasMega);
    expect(second.species).toBe(Species.Latios);
  });

  it('Mega Evolves a Rayquaza that knows Dragon Ascent, stone or no stone', () => {
    const { battle, teamA } = createBattle();
    const dragon = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);

    dragon.setSpecies(Species.Rayquaza);
    dragon.addMove(Moves.DragonAscent);
    plain.setSpecies(Species.Rayquaza);

    dragon.enter();
    plain.enter();

    expect(dragon.species).toBe(Species.RayquazaMega);
    expect(dragon.hasAbility(Abilities.DeltaStream)).toBe(true);
    // Worn after it was already standing, and the winds still rise
    expect(dragon.checkWeather()).toBe(Weathers.StrongWinds);
    expect(plain.species).toBe(Species.Rayquaza);
  });

  it('stays Mega when it steps off the field and back', () => {
    const { battle, teamA } = createBattle();
    const ghost = createUnit(battle, teamA);
    ghost.setSpecies(Species.Gengar);
    ghost.addItem(Items.Gengarite);

    ghost.enter();
    ghost.leave();
    ghost.enter();

    expect(ghost.species).toBe(Species.GengarMega);
  });
});
