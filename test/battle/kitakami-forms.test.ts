import { describe, expect, it } from 'vitest';
import type Unit from '../../src/battle/unit';
import { UNLIMITED_BATTLE_LIMITS } from '../../src/data/constants/battle-limits';
import { packSlots } from '../../src/data/constants/slots';
import { Stages } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { createBattle, createUnit } from './harness';

/** An Ogerpon carrying a filler, holding whatever it is handed */
function ogerpon(...items: Items[]): Unit {
  // Room for a mask and a Tera Orb both
  const { battle, teamA } = createBattle('test-seed', undefined, UNLIMITED_BATTLE_LIMITS);
  const ogre = createUnit(battle, teamA);

  ogre.setSpecies(Species.Ogerpon);
  ogre.setSlots(packSlots(1, 2, 4));
  ogre.addAbility(Abilities.GrassPelt);
  for (const item of items) {
    ogre.addItem(item);
  }
  return ogre;
}

describe("Ogerpon's masks", () => {
  it('wears Defiant in the Teal Mask, on top of its filler', () => {
    const ogre = ogerpon();

    ogre.enter();

    expect(ogre.species).toBe(Species.Ogerpon);
    expect(ogre.hasAbility(Abilities.Defiant)).toBe(true);
    expect(ogre.worn[Abilities.Defiant]).toBe(true);
    expect(ogre.hasAbility(Abilities.GrassPelt)).toBe(true);
  });

  it.each([
    [Items.WellspringMask, Species.OgerponWellspring, Abilities.WaterAbsorb],
    [Items.HearthflameMask, Species.OgerponHearthflame, Abilities.MoldBreaker],
    [Items.CornerstoneMask, Species.OgerponCornerstone, Abilities.Sturdy],
  ])('puts on the mask it holds and wears its ability in place of Defiant', (mask, shape, worn) => {
    const ogre = ogerpon(mask);

    ogre.enter();

    expect(ogre.species).toBe(shape);
    expect(ogre.hasAbility(worn)).toBe(true);
    expect(ogre.hasAbility(Abilities.Defiant)).toBe(false);
    expect(ogre.hasAbility(Abilities.GrassPelt)).toBe(true);
  });

  it("Terastallizes into its mask's type and shape, whatever its own Tera type", () => {
    const ogre = ogerpon(Items.WellspringMask, Items.TeraOrb);

    ogre.teraType = Types.Fire;
    ogre.enter();

    expect(ogre.terastallized).toBe(true);
    expect(ogre.teraType).toBe(Types.Water);
    expect([...ogre.types]).toEqual([Types.Water]);
    expect(ogre.species).toBe(Species.OgerponWellspringTera);
    expect(ogre.hasAbility(Abilities.EmbodyAspect)).toBe(true);
    expect(ogre.hasAbility(Abilities.WaterAbsorb)).toBe(false);
    expect(ogre.stages[Stages.SpecialDefense]).toBe(1);
    expect(ogre.stages[Stages.Speed]).toBe(0);
  });

  it('Terastallizes into Grass in the Teal Mask', () => {
    const ogre = ogerpon(Items.TeraOrb);

    ogre.teraType = Types.Dragon;
    ogre.enter();

    expect(ogre.teraType).toBe(Types.Grass);
    expect(ogre.species).toBe(Species.OgerponTealTera);
    expect(ogre.hasAbility(Abilities.Defiant)).toBe(false);
    expect(ogre.stages[Stages.Speed]).toBe(1);
  });

  it('keeps its Terastal shape through switching out', () => {
    const ogre = ogerpon(Items.HearthflameMask, Items.TeraOrb);

    ogre.enter();
    ogre.leave();
    ogre.enter();

    expect(ogre.species).toBe(Species.OgerponHearthflameTera);
    expect(ogre.hasAbility(Abilities.EmbodyAspect)).toBe(true);
    expect(ogre.hasAbility(Abilities.MoldBreaker)).toBe(false);
  });
});

describe("Terapagos's shapes", () => {
  it('Tera Shift takes the Terastal shape, which wears Tera Shell', () => {
    const { battle, teamA } = createBattle();
    const turtle = createUnit(battle, teamA);

    turtle.setSpecies(Species.Terapagos);
    turtle.addAbility(Abilities.TeraShift);
    turtle.enter();

    expect(turtle.species).toBe(Species.TerapagosTerastal);
    expect(turtle.hasAbility(Abilities.TeraShell)).toBe(true);
    expect(turtle.worn[Abilities.TeraShell]).toBe(true);
  });

  it('one born with a filler keeps its base shape', () => {
    const { battle, teamA } = createBattle();
    const turtle = createUnit(battle, teamA);

    turtle.setSpecies(Species.Terapagos);
    turtle.addAbility(Abilities.Analytic);
    turtle.enter();

    expect(turtle.species).toBe(Species.Terapagos);
    expect(turtle.hasAbility(Abilities.TeraShell)).toBe(false);
  });
});
