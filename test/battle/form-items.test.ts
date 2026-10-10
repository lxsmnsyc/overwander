import { describe, expect, it } from 'vitest';
import { UNLIMITED_BATTLE_LIMITS } from '../../src/data/constants/battle-limits';
import { packSlots } from '../../src/data/constants/slots';
import { Stages, Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { createBattle, createUnit } from './harness';

describe('Form items', () => {
  it('puts a Giratina holding the Griseous Orb in Origin Forme, Levitate on top', () => {
    const { battle, teamA } = createBattle();
    const dragon = createUnit(battle, teamA);
    dragon.setSpecies(Species.Giratina);
    dragon.addAbility(Abilities.Pressure);
    dragon.addItem(Items.GriseousOrb);

    dragon.enter();

    expect(dragon.species).toBe(Species.GiratinaOrigin);
    expect(dragon.stats[0][Stats.Attack]).toBe(120);
    expect([...dragon.types]).toEqual([Types.Ghost, Types.Dragon]);
    expect(dragon.hasAbility(Abilities.Levitate)).toBe(true);
    expect(dragon.hasAbility(Abilities.Pressure)).toBe(true);
  });

  it('paints an Arceus with its Plate only through Multitype', () => {
    const { battle, teamA } = createBattle();
    const god = createUnit(battle, teamA);
    const filler = createUnit(battle, teamA);

    for (const unit of [god, filler]) {
      unit.setSpecies(Species.Arceus);
      unit.addItem(Items.FlamePlate);
    }
    god.addAbility(Abilities.Multitype);
    filler.addAbility(Abilities.Adaptability);
    god.enter();
    filler.enter();

    expect(god.species).toBe(Species.ArceusFire);
    expect([...god.types]).toEqual([Types.Fire]);
    expect(filler.species).toBe(Species.Arceus);
    expect([...filler.types]).toEqual([Types.Normal]);
  });

  it('gives Origin Dialga Unaware and Origin Palkia Shadow Tag', () => {
    const { battle, teamA } = createBattle();
    const time = createUnit(battle, teamA);
    const space = createUnit(battle, teamA);
    time.setSpecies(Species.Dialga);
    time.addItem(Items.AdamantOrb);
    space.setSpecies(Species.Palkia);
    space.addItem(Items.LustrousOrb);

    time.enter();
    space.enter();

    expect(time.species).toBe(Species.DialgaOrigin);
    expect(time.hasAbility(Abilities.Unaware)).toBe(true);
    expect(space.species).toBe(Species.PalkiaOrigin);
    expect(space.hasAbility(Abilities.ShadowTag)).toBe(true);
  });

  it('gives Sky Shaymin Serene Grace without spending a slot on it', () => {
    const { battle, teamA } = createBattle();
    const flower = createUnit(battle, teamA);
    flower.setSpecies(Species.Shaymin);
    flower.addAbility(Abilities.NaturalCure);
    flower.addItem(Items.Gracidea);

    flower.enter();

    expect(flower.species).toBe(Species.ShayminSky);
    expect(flower.hasAbility(Abilities.SereneGrace)).toBe(true);
    expect(flower.hasAbility(Abilities.NaturalCure)).toBe(true);

    // The one slot is still Natural Cure's: freed, another fits in it
    flower.removeAbility(Abilities.NaturalCure);
    flower.addAbility(Abilities.Guts);

    expect(flower.hasAbility(Abilities.Guts)).toBe(true);
    expect(flower.hasAbility(Abilities.SereneGrace)).toBe(true);
  });
  it('shows each genie holding the Reveal Glass its own Therian shape', () => {
    const { battle, teamA, teamB } = createBattle();
    const wind = createUnit(battle, teamA);
    const bolt = createUnit(battle, teamA);
    const land = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    wind.setSpecies(Species.Tornadus);
    bolt.setSpecies(Species.Thundurus);
    land.setSpecies(Species.Landorus);
    for (const unit of [wind, bolt, land]) {
      unit.addAbility(Abilities.Prankster);
      unit.addItem(Items.RevealGlass);
    }
    foe.enter();

    wind.enter();
    bolt.enter();
    land.enter();

    expect(wind.species).toBe(Species.TornadusTherian);
    expect(wind.hasAbility(Abilities.Regenerator)).toBe(true);
    expect(bolt.species).toBe(Species.ThundurusTherian);
    expect(bolt.hasAbility(Abilities.VoltAbsorb)).toBe(true);
    expect(land.species).toBe(Species.LandorusTherian);
    expect(land.hasAbility(Abilities.Intimidate)).toBe(true);
    // What the genie was born with is still its own
    expect(land.hasAbility(Abilities.Prankster)).toBe(true);
    // Worn on the way in, the scowl still lands
    expect(foe.stages[Stages.Attack]).toBe(-1);
  });

  it('leaves anybody but a genie holding the Reveal Glass as it is', () => {
    const { battle, teamA } = createBattle();
    const bird = createUnit(battle, teamA);
    bird.setSpecies(Species.Pidgeot);
    bird.addItem(Items.RevealGlass);

    bird.enter();

    expect(bird.species).toBe(Species.Pidgeot);
  });
});

describe('Fused shapes', () => {
  it('lets the dragon inside a Black Kyurem fight with Teravolt', () => {
    const { battle, teamA } = createBattle();
    const fusion = createUnit(battle, teamA);

    fusion.setSpecies(Species.KyuremBlack);
    fusion.addAbility(Abilities.Pressure);
    fusion.enter();

    expect(fusion.hasAbility(Abilities.Teravolt)).toBe(true);
    // What the Kyurem itself rolled is still its own
    expect(fusion.hasAbility(Abilities.Pressure)).toBe(true);
  });

  it('gives White Kyurem Turboblaze, and a plain Kyurem neither', () => {
    const { battle, teamA } = createBattle();
    const fusion = createUnit(battle, teamA);
    const husk = createUnit(battle, teamA);

    fusion.setSpecies(Species.KyuremWhite);
    husk.setSpecies(Species.Kyurem);
    fusion.enter();
    husk.enter();

    expect(fusion.hasAbility(Abilities.Turboblaze)).toBe(true);
    expect(husk.hasAbility(Abilities.Turboblaze)).toBe(false);
    expect(husk.hasAbility(Abilities.Teravolt)).toBe(false);
  });

  it('hands the folded dragon creed only to a holder keeping its own', () => {
    const { battle, teamA } = createBattle();
    const granted = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);

    granted.setSpecies(Species.KyuremBlack);
    granted.addAbility(Abilities.HollowCreed);
    plain.setSpecies(Species.KyuremBlack);
    granted.enter();
    plain.enter();

    expect(granted.hasAbility(Abilities.IdealCreed)).toBe(true);
    expect(plain.hasAbility(Abilities.IdealCreed)).toBe(false);
  });
});

describe('Worn abilities and slots', () => {
  it('rides free of a Kyurem that has filled all four of its slots', () => {
    const { battle, teamA } = createBattle('test-seed', undefined, UNLIMITED_BATTLE_LIMITS);
    const fusion = createUnit(battle, teamA);

    fusion.setSpecies(Species.KyuremBlack);
    fusion.setSlots(packSlots(4, 1, 4));
    for (const ability of [
      Abilities.Pressure,
      Abilities.SnowWarning,
      Abilities.IceBody,
      Abilities.Intimidate,
    ]) {
      fusion.addAbility(ability);
    }
    fusion.enter();

    // The four it rolled, and the dragon's on top of them: a worn
    // ability is the shape's rather than the pokemon's
    for (const ability of [
      Abilities.Pressure,
      Abilities.SnowWarning,
      Abilities.IceBody,
      Abilities.Intimidate,
      Abilities.Teravolt,
    ]) {
      expect(fusion.hasAbility(ability)).toBe(true);
    }
    expect(fusion.worn[Abilities.Teravolt]).toBe(true);
  });

  it('returns every Kyogre and Groudon holding an orb to its Primal shape, with no limit', () => {
    const { battle, teamA } = createBattle();
    const sea = createUnit(battle, teamA);
    const land = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    sea.setSpecies(Species.Kyogre);
    sea.addItem(Items.BlueOrb);
    land.setSpecies(Species.Groudon);
    land.addItem(Items.RedOrb);
    second.setSpecies(Species.Kyogre);
    second.addItem(Items.BlueOrb);

    sea.enter();
    land.enter();
    second.enter();

    // Not a Mega, so a team takes as many as it holds orbs for
    expect(sea.species).toBe(Species.KyogrePrimal);
    expect(second.species).toBe(Species.KyogrePrimal);
    expect(sea.hasAbility(Abilities.PrimordialSea)).toBe(true);
    expect(land.species).toBe(Species.GroudonPrimal);
    expect([...land.types]).toEqual([Types.Ground, Types.Fire]);
    expect(land.hasAbility(Abilities.DesolateLand)).toBe(true);
  });

  it('leaves a Primal beside a Mega on the same team', () => {
    const { battle, teamA } = createBattle();
    const sea = createUnit(battle, teamA);
    const ghost = createUnit(battle, teamA);
    sea.setSpecies(Species.Kyogre);
    sea.addItem(Items.BlueOrb);
    sea.setLevel(90);
    ghost.setSpecies(Species.Gengar);
    ghost.addItem(Items.Gengarite);

    sea.enter();
    ghost.enter();

    expect(sea.species).toBe(Species.KyogrePrimal);
    expect(ghost.species).toBe(Species.GengarMega);
  });

  it('crowns Zacian with the Rusted Sword and turns its Iron Head to Behemoth Blade', () => {
    const { battle, teamA } = createBattle();
    const hero = createUnit(battle, teamA);
    hero.setSpecies(Species.Zacian);
    hero.addMove(Moves.IronHead);
    hero.addMove(Moves.PlayRough);
    hero.setMovePoints(Moves.IronHead, 2);
    hero.addItem(Items.RustedSword);

    hero.enter();

    expect(hero.species).toBe(Species.ZacianCrowned);
    expect([...hero.types]).toEqual([Types.Fairy, Types.Steel]);
    expect(hero.moves[Moves.IronHead]).toBeUndefined();
    expect(hero.moves[Moves.BehemothBlade]?.points).toBe(2);
    expect(hero.moves[Moves.PlayRough]).toBeDefined();
  });

  it('crowns Zamazenta with the Rusted Shield and turns its Iron Head to Behemoth Bash', () => {
    const { battle, teamA } = createBattle();
    const hero = createUnit(battle, teamA);
    const other = createUnit(battle, teamA);
    hero.setSpecies(Species.Zamazenta);
    hero.addMove(Moves.IronHead);
    hero.addItem(Items.RustedShield);
    // The shield is Zamazenta's own: a Zacian holding it stays as it is
    other.setSpecies(Species.Zacian);
    other.addMove(Moves.IronHead);
    other.addItem(Items.RustedShield);

    hero.enter();
    other.enter();

    expect(hero.species).toBe(Species.ZamazentaCrowned);
    expect(hero.moves[Moves.IronHead]).toBeUndefined();
    expect(hero.moves[Moves.BehemothBash]).toBeDefined();
    expect(other.species).toBe(Species.Zacian);
    expect(other.moves[Moves.IronHead]).toBeDefined();
  });
});
