import { describe, expect, it } from 'vitest';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SpawnRarity,
  TIMES_OF_DAY,
  boostFamilyWeights,
  boostTypeWeights,
  getBiomeRoster,
  getEggPool,
  getSpawnPool,
  getSpawnRarity,
  isAwaitingBaby,
} from '../../src/data/biome';
import Families from '../../src/data/ids/families';
import registerAbilities, { getAbilityData, getSignatureAbility } from '../../src/data/abilities';
import Abilities from '../../src/data/ids/abilities';
import { Types } from '../../src/data/constants/types';
import Biome, { TimeOfDay } from '../../src/data/ids/biome';
import { Items } from '../../src/data/ids/items';
import type { Moves } from '../../src/data/ids/moves';
import {
  DEOXYS_FORMS,
  EvolutionMethod,
  Genders,
  ROTOM_FORMS,
  Species,
} from '../../src/data/ids/species';
import { MAX_LEVEL } from '../../src/data/constants/levels';
import {
  CANDY_PER_LEVEL,
  SHADOW_CANDY_MULTIPLIER,
  SPECIES_DAY_CANDY_BOOST,
  getCandyCost,
  getCatchCandy,
  getReleaseCandy,
} from '../../src/auth/candy';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import { BASE_FRIENDSHIP, EVOLUTION_FRIENDSHIP } from '../../src/data/constants/friendship';
import { Stats } from '../../src/data/constants/stats';
import {
  SPECIES_DAY_WEIGHT_BOOST,
  canEverEvolve,
  coversHandover,
  getAvailableEvolutions,
  getBaseSpecies,
  getConsumedItem,
  getDayOfYear,
  getDaysInYear,
  getFamilyName,
  getFeaturedFamily,
  getRegisteredFamilies,
  getRegisteredSpecies,
  getShedEvolutions,
  getSpeciesAbilities,
  getSpeciesByBiome,
  getSpeciesData,
  getSpentHeldItem,
  isFeaturedSpecies,
  meetsEvolutionCriteria,
  registerSpecies,
  settleHandover,
} from '../../src/data/species';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('ability data', () => {
  it('names every ability a species can roll', () => {
    // The UI reads these names, so an unregistered ability would
    // show up as a bare id in the battle field and the catch dialog
    const seen = new Set<Abilities>();

    for (let biome = Biome.DeepOcean; biome <= Biome.PolarOcean; biome++) {
      for (const species of getSpeciesByBiome(biome)) {
        for (const ability of getSpeciesAbilities(species)) {
          seen.add(ability);

          const data = getAbilityData(ability);

          expect(data.name.length).toBeGreaterThan(0);
          // Every one says what it does, and says it as a sentence:
          // the line is what the catch dialog prints under the name
          expect(data.description, `${data.name} says nothing about itself`).not.toBe('');
          expect(data.description.endsWith('.'), `${data.name} does not end its line`).toBe(true);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(50);

    expect(getAbilityData(Abilities.Chlorophyll).name).toBe('Chlorophyll');
    expect(getAbilityData(Abilities.CompoundEyes).name).toBe('Compound Eyes');

    // The raid abilities are registered alongside the rolled ones
    expect(getAbilityData(Abilities.Boss).name).toBe('Boss');
    expect(getAbilityData(Abilities.Shadow).name).toBe('Shadow');
  });

  it('owes every family one signature, and none of them the same one', () => {
    const signatures = new Set<Abilities>();

    for (const family of getRegisteredFamilies()) {
      const signature = getSignatureAbility(family);

      expect(signature, `${getFamilyName(family)} has no signature`).not.toBeNull();

      if (signature == null) {
        continue;
      }
      expect(signatures.has(signature), `${getFamilyName(family)} repeats a signature`).toBe(false);
      signatures.add(signature);
      expect(getAbilityData(signature).name.length).toBeGreaterThan(0);
    }
    expect(signatures.size).toBe(getRegisteredFamilies().length);
  });
});

describe('evolution data', () => {
  it('describes level, stone and trade evolutions', () => {
    expect(getSpeciesData(Species.Bulbasaur).evolvesInto).toEqual([
      { species: Species.Ivysaur, method: EvolutionMethod.Level, level: 16 },
    ]);

    // Seven roads out of one Eevee: five stones and two friendships
    expect(getSpeciesData(Species.Eevee).evolvesInto).toHaveLength(7);
    expect(getSpeciesData(Species.Eevee).evolvesInto?.[0]).toEqual({
      species: Species.Vaporeon,
      method: EvolutionMethod.UsedItem,
      item: Items.WaterStone,
    });

    expect(getSpeciesData(Species.Haunter).evolvesInto).toEqual([
      { species: Species.Gengar, method: EvolutionMethod.Trade },
    ]);

    // Final stages have none
    expect(getSpeciesData(Species.Venusaur).evolvesInto).toBeUndefined();
  });

  // Nothing but Tyrogue reads a stat, and an even pair is the tie it
  // branches on, so every other case is unaffected by what is here
  const EVEN_STATS: Record<Stats, number> = {
    [Stats.HP]: 100,
    [Stats.Attack]: 100,
    [Stats.Defense]: 100,
    [Stats.SpecialAttack]: 100,
    [Stats.SpecialDefense]: 100,
    [Stats.Speed]: 100,
  };

  it('leaves a Shedinja beside a Ninjask rather than offering it instead', () => {
    const context = {
      species: Species.Nincada,
      level: 20,
      carried: new Set([Items.PokeBall]),
      held: new Set<Items>(),
      canEvolve: false,
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
      moves: new Set<Moves>(),
    };
    const named = (roads: { species: Species }[]): Species[] => {
      const species: Species[] = [];

      for (const road of roads) {
        species.push(road.species);
      }
      return species;
    };

    // The only choice is the Ninjask, whatever the bag holds
    expect(named(getAvailableEvolutions(context))).toEqual([Species.Ninjask]);
    expect(named(getShedEvolutions(context))).toEqual([Species.Shedinja]);

    // No ball to leave it in, or not grown yet, and there is no husk
    expect(getShedEvolutions({ ...context, carried: new Set<Items>() })).toEqual([]);
    expect(getShedEvolutions({ ...context, level: 19 })).toEqual([]);
  });

  it('gives a Feebas two roads to the same shape', () => {
    const roads = getSpeciesData(Species.Feebas).evolvesInto ?? [];

    expect(roads.map((road) => road.species)).toEqual([Species.Milotic, Species.Milotic]);

    const context = {
      species: Species.Feebas,
      level: 40,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: EVOLUTION_FRIENDSHIP,
      gender: Genders.Female,
      time: TimeOfDay.Day,
    };

    // Raised fond enough and grown to 40, with nothing in the bag
    expect(getAvailableEvolutions(context).map((road) => road.species)).toEqual([Species.Milotic]);

    // The same fish, unloved: the scale is the other road, and it is
    // the one still open
    const cold = { ...context, friendship: BASE_FRIENDSHIP };

    expect(getAvailableEvolutions(cold)).toEqual([]);
    expect(
      getAvailableEvolutions({ ...cold, held: new Set([Items.PrismScale]), canEvolve: true })
        .length,
    ).toBe(1);

    // And a fond one that has not grown up yet stays a Feebas
    expect(getAvailableEvolutions({ ...context, level: 39 })).toEqual([]);
  });

  it('offers level evolutions once the threshold is reached', () => {
    const context = {
      carried: new Set<Items>(),
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };

    expect(getAvailableEvolutions({ species: Species.Charmander, ...context, level: 15 })).toEqual(
      [],
    );
    expect(getAvailableEvolutions({ species: Species.Charmander, ...context, level: 16 })).toEqual([
      { species: Species.Charmeleon, method: EvolutionMethod.Level, level: 16 },
    ]);
  });

  it('offers stone evolutions only while the stone is carried', () => {
    const context = {
      level: 50,
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };

    expect(
      getAvailableEvolutions({ species: Species.Vulpix, ...context, carried: new Set() }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions({
        species: Species.Vulpix,
        ...context,
        carried: new Set([Items.LeafStone]),
      }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions({
        species: Species.Vulpix,
        ...context,
        carried: new Set([Items.FireStone]),
      }),
    ).toEqual([
      { species: Species.Ninetales, method: EvolutionMethod.UsedItem, item: Items.FireStone },
    ]);
  });

  it('walks a Rotom between its machines on a Catalog, never into itself', () => {
    const context = {
      level: 50,
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Genderless,
      time: TimeOfDay.Day,
    };
    const catalog = new Set([Items.RotomCatalog]);

    // No Catalog, no machine
    expect(
      getAvailableEvolutions({ species: Species.Rotom, ...context, carried: new Set() }),
    ).toEqual([]);

    for (const shape of ROTOM_FORMS) {
      const offered = getAvailableEvolutions({ species: shape, ...context, carried: catalog });

      // Every other shape, its own left out, and each spends a Catalog
      expect(offered.map((entry) => entry.species).sort()).toEqual(
        ROTOM_FORMS.filter((other) => other !== shape).sort(),
      );
      for (const entry of offered) {
        expect(getConsumedItem(entry)).toBe(Items.RotomCatalog);
      }
    }

    // A machine is a shape rather than a stage, so the line stays one
    // stage long and every shape reads the same band
    for (const shape of ROTOM_FORMS) {
      expect(getSpawnRarity(shape)).toBe(SpawnRarity.Elusive);
    }
  });

  it('rearranges a Deoxys on a Meteorite, never into the shape it is in', () => {
    const context = {
      level: 50,
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Genderless,
      time: TimeOfDay.Day,
    };
    const rock = new Set([Items.Meteorite]);

    // No rock, no rearranging
    expect(
      getAvailableEvolutions({ species: Species.Deoxys, ...context, carried: new Set() }),
    ).toEqual([]);

    for (const shape of DEOXYS_FORMS) {
      const offered = getAvailableEvolutions({ species: shape, ...context, carried: rock });

      // Every other arrangement, its own left out, and each spends the
      // rock it was rearranged with
      expect(offered.map((entry) => entry.species).sort()).toEqual(
        DEOXYS_FORMS.filter((other) => other !== shape).sort(),
      );
      for (const entry of offered) {
        expect(getConsumedItem(entry)).toBe(Items.Meteorite);
      }
    }

    // An arrangement is a shape rather than a stage, so the line stays
    // one stage long and every shape reads the same band
    for (const shape of DEOXYS_FORMS) {
      expect(getSpawnRarity(shape)).toBe(SpawnRarity.Mythical);
    }
  });

  it('offers nothing at all to a pokemon holding an Everstone', () => {
    // Traded as a Machoke, so the trade door below is genuinely open
    const context = {
      level: 100,
      carried: new Set([Items.FireStone]),
      canEvolve: true,
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };

    // Every door at once: the level one, the stone one and the trade
    // one, all of them open, and the stone shuts all three
    expect(
      getAvailableEvolutions({
        species: Species.Charmander,
        ...context,
        held: new Set([Items.Everstone]),
        moves: new Set<Moves>(),
      }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions({
        species: Species.Vulpix,
        ...context,
        held: new Set([Items.Everstone]),
        moves: new Set<Moves>(),
      }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions({
        species: Species.Machoke,
        ...context,
        held: new Set([Items.Everstone]),
        moves: new Set<Moves>(),
      }),
    ).toEqual([]);

    // And holding something else changes nothing
    expect(
      getAvailableEvolutions({
        species: Species.Machoke,
        ...context,
        held: new Set([Items.Leftovers]),
        moves: new Set<Moves>(),
      }),
    ).toEqual([{ species: Species.Machamp, method: EvolutionMethod.Trade }]);
  });

  it('settles what a handover opens at the handover itself', () => {
    // The question the flag answers, asked where it is asked: it has
    // to have changed hands as what it is now. Four Gen 1 lines evolve
    // by trade and every one sits a level evolution above the stage
    // that is usually traded
    const nothingHeld = new Set<Items>();

    for (const [below, at] of [
      [Species.Machop, Species.Machoke],
      [Species.Abra, Species.Kadabra],
      [Species.Geodude, Species.Graveler],
      [Species.Gastly, Species.Haunter],
    ] as const) {
      expect(settleHandover(at, null, nothingHeld)).toEqual({ opens: true, spends: null });
      expect(settleHandover(below, null, nothingHeld)).toEqual({ opens: false, spends: null });
    }

    // A species with no trade evolution never earns it, whatever it
    // was swapped for
    expect(settleHandover(Species.Pidgey, Species.Machoke, nothingHeld)).toEqual({
      opens: false,
      spends: null,
    });
  });

  it('spends the item a trade evolution asks to be held, at the handover', () => {
    // An Onix traded in a Metal Coat arrives a coat lighter and ready,
    // which is where the mainline spends it too
    expect(settleHandover(Species.Onix, null, new Set([Items.MetalCoat]))).toEqual({
      opens: true,
      spends: Items.MetalCoat,
    });

    // Traded holding nothing, the swap covers nothing: what the
    // evolution asks for was not part of it
    expect(settleHandover(Species.Onix, null, new Set())).toEqual({
      opens: false,
      spends: null,
    });
    expect(settleHandover(Species.Onix, null, new Set([Items.Leftovers]))).toEqual({
      opens: false,
      spends: null,
    });
  });

  it('does not ask twice for an item the handover already took', () => {
    const context = {
      species: Species.Onix,
      level: 50,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };

    // The coat is gone, spent by the swap that opened this
    expect(getAvailableEvolutions({ ...context, canEvolve: true })).toEqual([
      {
        species: Species.Steelix,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.MetalCoat,
      },
    ]);

    // And an Onix nobody traded still has to hold one, cord or no cord
    expect(
      getAvailableEvolutions({
        ...context,
        canEvolve: false,
        carried: new Set([Items.LinkingCord]),
      }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions({
        ...context,
        canEvolve: false,
        carried: new Set([Items.LinkingCord]),
        held: new Set([Items.MetalCoat]),
        moves: new Set<Moves>(),
      }),
    ).toEqual([
      {
        species: Species.Steelix,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.MetalCoat,
      },
    ]);
  });

  it('offers a trade evolution only for the handover it was made at', () => {
    const context = {
      level: 100,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };

    // A Machoke nobody has traded stays a Machoke however high its
    // level runs — the level is not what the evolution asks for
    expect(
      getAvailableEvolutions({
        species: Species.Machoke,
        ...context,
        canEvolve: false,
        stats: EVEN_STATS,
        friendship: BASE_FRIENDSHIP,
        gender: Genders.Male,
        time: TimeOfDay.Day,
      }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions({
        species: Species.Machoke,
        ...context,
        canEvolve: true,
        stats: EVEN_STATS,
        friendship: BASE_FRIENDSHIP,
        gender: Genders.Male,
        time: TimeOfDay.Day,
      }),
    ).toEqual([{ species: Species.Machamp, method: EvolutionMethod.Trade }]);

    // And a handover made at a stage below it is no handover at all:
    // this is a Machop that changed hands and then levelled, which is
    // not a Machoke anybody ever traded
    expect(
      getAvailableEvolutions({
        species: Species.Machoke,
        ...context,
        canEvolve: false,
        stats: EVEN_STATS,
        friendship: BASE_FRIENDSHIP,
        gender: Genders.Male,
        time: TimeOfDay.Day,
      }),
    ).toEqual([]);

    // The other three Gen 1 lines have the same shape, and every one
    // of them sits a level evolution above the stage that is traded
    for (const [at, into] of [
      [Species.Kadabra, Species.Alakazam],
      [Species.Graveler, Species.Golem],
      [Species.Haunter, Species.Gengar],
    ] as const) {
      expect(
        getAvailableEvolutions({
          species: at,
          ...context,
          canEvolve: false,
          stats: EVEN_STATS,
          friendship: BASE_FRIENDSHIP,
          gender: Genders.Male,
          time: TimeOfDay.Day,
        }),
      ).toEqual([]);
      expect(
        getAvailableEvolutions({
          species: at,
          ...context,
          canEvolve: true,
          stats: EVEN_STATS,
          friendship: BASE_FRIENDSHIP,
          gender: Genders.Male,
          time: TimeOfDay.Day,
        }),
      ).toEqual([{ species: into, method: EvolutionMethod.Trade }]);
    }
  });

  it('wants the named partner where a line names one', () => {
    // Karrablast and Shelmet, which no generation registered here has
    // yet: the condition is the pokemon coming the other way, and it
    // is the only one in the family that is about somebody else's
    const line = {
      species: Species.Machamp,
      method: EvolutionMethod.Trade,
      partner: Species.Gastly,
    };
    const context = {
      species: Species.Machoke,
      level: 100,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };

    // The partner is read where the swap happens, since it is the one
    // moment both halves are in hand. Machamp is stood in for here
    // because nothing registered names a partner yet
    expect(coversHandover(line, Species.Abra)).toBe(false);
    // Traded for nothing at all, which is what a sale is
    expect(coversHandover(line, null)).toBe(false);
    // And the one handover it asked for
    expect(coversHandover(line, Species.Gastly)).toBe(true);

    // Whatever the swap decided is all the criteria read afterwards
    expect(meetsEvolutionCriteria(line, { ...context, canEvolve: true })).toBe(true);
    expect(meetsEvolutionCriteria(line, { ...context, canEvolve: false })).toBe(false);

    // A cord replaces a handover, and what this is waiting for is not
    // a handover but a particular pokemon. Nothing in a bag is one
    expect(
      meetsEvolutionCriteria(line, {
        ...context,
        carried: new Set([Items.LinkingCord]),
        canEvolve: false,
      }),
    ).toBe(false);
  });

  it('takes a Linking Cord in place of the trade', () => {
    const context = {
      level: 100,
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };
    const cord = new Set([Items.LinkingCord]);

    expect(getAvailableEvolutions({ species: Species.Machoke, ...context, carried: cord })).toEqual(
      [{ species: Species.Machamp, method: EvolutionMethod.Trade }],
    );
    // And it is what gets spent, since the trade is the half it paid
    expect(
      getConsumedItem({ species: Species.Machamp, method: EvolutionMethod.Trade }, false),
    ).toBe(Items.LinkingCord);
    // A pokemon that really was traded owes nothing
    expect(getConsumedItem({ species: Species.Machamp, method: EvolutionMethod.Trade }, true)).toBe(
      null,
    );
  });

  it('refuses the cord where a stone is being spent as well', () => {
    // Two items for one evolution is not something a spend can
    // express, so the trade half stays a real trade
    const line = {
      species: Species.Machamp,
      method: EvolutionMethod.Trade | EvolutionMethod.UsedItem,
      item: Items.FireStone,
    };
    const carried = new Set([Items.LinkingCord, Items.FireStone]);

    expect(
      meetsEvolutionCriteria(line, {
        species: Species.Machoke,
        level: 100,
        carried,
        held: new Set(),
        moves: new Set<Moves>(),
        canEvolve: false,
        stats: EVEN_STATS,
        friendship: BASE_FRIENDSHIP,
        gender: Genders.Male,
        time: TimeOfDay.Day,
      }),
    ).toBe(false);
    expect(getConsumedItem(line, false)).toBe(Items.FireStone);
  });

  it('branches a Tyrogue on its Attack against its Defense', () => {
    const context = {
      species: Species.Tyrogue,
      level: 20,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      moves: new Set<Moves>(),
      canEvolve: false,
      friendship: BASE_FRIENDSHIP,
      gender: Genders.Male,
      time: TimeOfDay.Day,
    };
    const at = (attack: number, defense: number): Record<Stats, number> => ({
      ...EVEN_STATS,
      [Stats.Attack]: attack,
      [Stats.Defense]: defense,
    });
    const into = (stats: Record<Stats, number>): Species[] =>
      getAvailableEvolutions({ ...context, stats }).map((entry) => entry.species);

    // Exactly one of the three answers, whichever way the pair falls
    expect(into(at(60, 50))).toEqual([Species.Hitmonlee]);
    expect(into(at(50, 60))).toEqual([Species.Hitmonchan]);
    expect(into(at(55, 55))).toEqual([Species.Hitmontop]);

    // And the level still gates it
    expect(into({ ...at(60, 50) })).toEqual([Species.Hitmonlee]);
    expect(getAvailableEvolutions({ ...context, level: 19, stats: at(60, 50) })).toEqual([]);
  });

  it('holds a friendship evolution back until the pokemon is inseparable', () => {
    const context = {
      species: Species.Pichu,
      level: 100,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      time: TimeOfDay.Day,
      gender: Genders.Male,
    };

    expect(getAvailableEvolutions({ ...context, friendship: EVOLUTION_FRIENDSHIP - 1 })).toEqual(
      [],
    );
    expect(getAvailableEvolutions({ ...context, friendship: EVOLUTION_FRIENDSHIP })).toEqual([
      { species: Species.Pikachu, method: EvolutionMethod.Friendship },
    ]);
  });

  it('splits an Eevee by the hour it is asked in', () => {
    const context = {
      species: Species.Eevee,
      level: 100,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: EVOLUTION_FRIENDSHIP,
      gender: Genders.Male,
    };
    const into = (time: TimeOfDay): Species[] =>
      getAvailableEvolutions({ ...context, time })
        .map((entry) => entry.species)
        .filter((species) => species === Species.Espeon || species === Species.Umbreon);

    expect(into(TimeOfDay.Morning)).toEqual([Species.Espeon]);
    expect(into(TimeOfDay.Day)).toEqual([Species.Espeon]);
    expect(into(TimeOfDay.Evening)).toEqual([Species.Umbreon]);
    expect(into(TimeOfDay.Night)).toEqual([Species.Umbreon]);

    // The friendship still gates both halves
    expect(
      getAvailableEvolutions({
        ...context,
        friendship: EVOLUTION_FRIENDSHIP - 1,
        time: TimeOfDay.Day,
      }).some((entry) => entry.species === Species.Espeon),
    ).toBe(false);
  });

  it('splits a Wurmple by what it was born as', () => {
    const context = {
      species: Species.Wurmple,
      level: 7,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      canEvolve: false,
      moves: new Set<Moves>(),
      stats: EVEN_STATS,
      friendship: BASE_FRIENDSHIP,
      time: TimeOfDay.Day,
    };
    const into = (gender: Genders): Species[] =>
      getAvailableEvolutions({ ...context, gender }).map((entry) => entry.species);

    expect(into(Genders.Male)).toEqual([Species.Silcoon]);
    expect(into(Genders.Female)).toEqual([Species.Cascoon]);

    // Neither half is open before the level either way round
    expect(getAvailableEvolutions({ ...context, level: 6, gender: Genders.Female })).toEqual([]);

    // And the branch it was never going to take is not something to
    // work towards, so the sheet leaves it out rather than refusing it
    const rows = (gender: Genders): Species[] =>
      (getSpeciesData(Species.Wurmple).evolvesInto ?? [])
        .filter((evolution) => canEverEvolve(evolution, gender))
        .map((evolution) => evolution.species);

    expect(rows(Genders.Male)).toEqual([Species.Silcoon]);
    expect(rows(Genders.Female)).toEqual([Species.Cascoon]);

    // A line that asks nothing about gender is shown to both
    expect(
      (getSpeciesData(Species.Charmander).evolvesInto ?? []).every((evolution) =>
        canEverEvolve(evolution, Genders.Female),
      ),
    ).toBe(true);
  });

  it('never offers evolutions it cannot verify', () => {
    // Weather and party composition have no stored counterpart, so an
    // evolution asking for one is refused rather than waved through,
    // even with everything else in hand
    expect(
      meetsEvolutionCriteria(
        { species: Species.Machamp, method: EvolutionMethod.Trade | EvolutionMethod.Weather },
        {
          species: Species.Machoke,
          level: 100,
          carried: new Set(),
          held: new Set(),
          moves: new Set<Moves>(),
          canEvolve: true,
          stats: EVEN_STATS,
          friendship: BASE_FRIENDSHIP,
          gender: Genders.Male,
          time: TimeOfDay.Day,
        },
      ),
    ).toBe(false);
  });

  it('spends the held item where a cord stands in for the trade', () => {
    const [scale] = getSpeciesData(Species.Seadra).evolvesInto ?? [];

    // The bag pays the cord, and the pokemon pays the scale: a swap
    // would have taken both halves too
    expect(getConsumedItem(scale, false)).toBe(Items.LinkingCord);
    expect(getSpentHeldItem(scale, false)).toBe(Items.DragonScale);

    // A real handover already took the scale at the swap
    expect(getSpentHeldItem(scale, true)).toBeNull();

    // And a line asking for nothing held has nothing to take
    expect(
      getSpentHeldItem({ species: Species.Machamp, method: EvolutionMethod.Trade }, false),
    ).toBeNull();
  });

  it('spends the held item a levelling evolution asks for', () => {
    for (const [species, item] of [
      [Species.Sneasel, Items.RazorClaw],
      [Species.Gligar, Items.RazorFang],
      [Species.Happiny, Items.OvalStone],
    ] as const) {
      const [evolution] = getSpeciesData(species).evolvesInto ?? [];

      // Nothing in the bag pays for it: the pokemon gives up what it held
      expect(getConsumedItem(evolution), getSpeciesData(species).name).toBeNull();
      expect(getSpentHeldItem(evolution), getSpeciesData(species).name).toBe(item);
    }
  });

  it('spends the used item and leaves a held one alone', () => {
    const [stone] = getSpeciesData(Species.Vulpix).evolvesInto ?? [];
    const [level] = getSpeciesData(Species.Charmander).evolvesInto ?? [];

    expect(getConsumedItem(stone)).toBe(Items.FireStone);
    expect(getConsumedItem(level)).toBeNull();
    expect(
      getConsumedItem({
        species: Species.Ninetales,
        method: EvolutionMethod.HeldItem,
        item: Items.FireStone,
      }),
    ).toBeNull();
  });
});

describe('species day', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const YEAR_START = Date.UTC(2026, 0, 1);

  it('counts the day of the year from the first of January in UTC', () => {
    expect(getDayOfYear(YEAR_START)).toBe(0);
    expect(getDayOfYear(YEAR_START + 40 * DAY)).toBe(40);
    expect(getDayOfYear(YEAR_START + 364 * DAY)).toBe(364);
  });

  it('features a family every day, counting the year around the roster', () => {
    const roster = getRegisteredFamilies();

    // Family 0 is Bulbasaur's, so it opens the year; family 1 is
    // Charmander's, and so on
    expect(getFeaturedFamily(YEAR_START)).toBe(Families.Bulbasaur);
    expect(getFeaturedFamily(YEAR_START + DAY)).toBe(Families.Charmander);
    expect(getFeaturedFamily(YEAR_START + Families.Mewtwo * DAY)).toBe(Families.Mewtwo);

    // The roster runs short of a year, so it comes round again rather
    // than leaving the rest of the year blank
    expect(getFeaturedFamily(YEAR_START + roster.length * DAY)).toBe(Families.Bulbasaur);
    for (let day = 0; day < getDaysInYear(YEAR_START); day++) {
      expect(getFeaturedFamily(YEAR_START + day * DAY)).not.toBeNull();
    }

    // Every family gets its day, the ones past a reserved gap in the
    // numbering included
    const featured = new Set(
      Array.from({ length: roster.length }, (_, day) => getFeaturedFamily(YEAR_START + day * DAY)),
    );

    expect(featured.size).toBe(roster.length);

    // The whole family is featured, not just one stage
    expect(isFeaturedSpecies(Species.Venusaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Bulbasaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Charmander, YEAR_START)).toBe(false);
    expect(isFeaturedSpecies(Species.Bulbasaur, YEAR_START + DAY)).toBe(false);
  });

  it('charges a shadow twice the candy per level', () => {
    // The cost reads one field of the record, so nothing else about
    // the pokemon changes it
    expect(getCandyCost({ shadow: false })).toBe(CANDY_PER_LEVEL);
    expect(getCandyCost({ shadow: true })).toBe(CANDY_PER_LEVEL * SHADOW_CANDY_MULTIPLIER);
    expect(getCandyCost({ shadow: true })).toBe(2);
  });

  it('pays a catch by how hard it was to meet', () => {
    // One for a first stage, one more for every band above it, five
    // for a legendary — the same order the spawn pools sort them in
    expect(getCatchCandy(Species.Bulbasaur)).toBe(1);
    expect(getCatchCandy(Species.Ivysaur)).toBe(3);
    expect(getCatchCandy(Species.Venusaur)).toBe(5);
    expect(getCatchCandy(Species.Mewtwo)).toBe(7);
  });

  it('pays a release by the levels that went into it', () => {
    // One candy per 25 levels, rounded up: four bands, the top of
    // which is anything from 76 to the cap
    expect(getReleaseCandy({ level: 1 })).toBe(1);
    expect(getReleaseCandy({ level: 25 })).toBe(1);
    expect(getReleaseCandy({ level: 26 })).toBe(2);
    expect(getReleaseCandy({ level: 75 })).toBe(3);
    expect(getReleaseCandy({ level: 76 })).toBe(4);
    expect(getReleaseCandy({ level: MAX_LEVEL })).toBe(4);

    // What it took to raise is always more than what letting it go
    // hands back, so releasing is never a way to stock up
    expect(getReleaseCandy({ level: MAX_LEVEL })).toBeLessThan(MAX_LEVEL * CANDY_PER_LEVEL);
  });

  it('pays four times over for a catch on the family day', () => {
    // The catch reward and the spawn weight share the same fourfold
    // bonus, so a family day is worth the same wherever it lands
    expect(SPECIES_DAY_CANDY_BOOST).toBe(SPECIES_DAY_WEIGHT_BOOST);
    expect(getCatchCandy(Species.Bulbasaur) * SPECIES_DAY_CANDY_BOOST).toBe(4);

    // Bulbasaur's family opens the year, so its line pays the bonus
    // that day and nothing else does
    expect(isFeaturedSpecies(Species.Ivysaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Ivysaur, YEAR_START + 200 * DAY)).toBe(false);
  });

  it('weights the featured family four times as heavily', () => {
    const pool = getSpawnPool(Biome.Grassland, TimeOfDay.Morning);
    const boosted = boostFamilyWeights(pool, Families.Pidgey, SPECIES_DAY_WEIGHT_BOOST);

    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      pool[band].forEach((entry, index) => {
        const factor = getSpeciesData(entry.species).family === Families.Pidgey ? 4 : 1;

        expect(boosted[band][index].weight).toBe(entry.weight * factor);
      });
    }

    // The original pool is left alone
    expect(pool).toEqual(getSpawnPool(Biome.Grassland, TimeOfDay.Morning));
  });

  it('reduces a biome to the eggs a nest could be holding', () => {
    // Every surface's pool, so a grassland nest may lay what lives in its ponds
    const pool = getBiomeRoster(Biome.Grassland, TimeOfDay.Morning);
    const eggs = getEggPool(Biome.Grassland, TimeOfDay.Morning);

    // Everything that hatches is a first stage, and nothing appears
    // twice — that is the whole point of reducing the bands once
    expect(eggs.length).toBeGreaterThan(0);
    expect(new Set(eggs.map((entry) => entry.species)).size).toBe(eggs.length);
    for (const entry of eggs) {
      expect(getSpeciesData(entry.species).evolvesFrom).toBeUndefined();
      expect(getSpawnRarity(entry.species)).not.toBe(SpawnRarity.Special);
      // A line whose baby is not registered yet would hatch one stage
      // too late, so no nest holds it
      expect(isAwaitingBaby(entry.species)).toBe(false);
    }

    // The weights are the three ordinary bands added up, species by
    // species: a biome where four stages of one line spawn is a biome
    // where that egg is four times as likely
    const expected = new Map<Species, number>();

    for (const band of [pool.base, pool.uncommon, pool.rare]) {
      for (const entry of band) {
        const egg = getBaseSpecies(entry.species);

        if (isAwaitingBaby(egg)) {
          continue;
        }
        expected.set(egg, (expected.get(egg) ?? 0) + entry.weight);
      }
    }
    expect(new Map(eggs.map((entry) => [entry.species, entry.weight]))).toEqual(expected);

    // Built once and kept: the pool is registered for the life of the
    // process, so reducing it again would be work nobody asked for
    expect(getEggPool(Biome.Grassland, TimeOfDay.Morning)).toBe(eggs);

    // A biome with nothing awake in it has no eggs either
    expect(getEggPool(Biome.Beyond, TimeOfDay.Day)).toEqual([]);
  });

  it('crowds a sky\u2019s own types into a pool without moving the bands', () => {
    const pool = getSpawnPool(Biome.Grassland, TimeOfDay.Morning);
    const crowded = boostTypeWeights(pool, [Types.Water], 2);

    for (const band of ['base', 'uncommon', 'rare'] as const) {
      expect(crowded[band]).toHaveLength(pool[band].length);
      pool[band].forEach((entry, at) => {
        const wet = new Set(getSpeciesData(entry.species).types).has(Types.Water);

        expect(crowded[band][at].species).toBe(entry.species);
        expect(crowded[band][at].weight).toBe(entry.weight * (wet ? 2 : 1));
      });
    }

    // A sky that favours nothing hands the pool back as it found it
    expect(boostTypeWeights(pool, [], 2).base).toEqual(pool.base);
  });

  it('keeps a line whose baby is not registered yet out of every nest', () => {
    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const time of TIMES_OF_DAY) {
        for (const entry of getEggPool(biome, time)) {
          expect(isAwaitingBaby(entry.species), BIOME_NAMES[biome]).toBe(false);
        }
      }
    }
  });

  it('has nothing on the awaiting list that already hatches from something', () => {
    // The tripwire for the day a baby lands: registering one gives the
    // species it evolves into an `evolvesFrom`, and the entry has to
    // come off the list in the same change
    for (const species of getRegisteredSpecies()) {
      if (getSpeciesData(species).evolvesFrom != null) {
        expect(isAwaitingBaby(species), getSpeciesData(species).name).toBe(false);
      }
    }
  });
});
