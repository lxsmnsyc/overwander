import type { EvolutionData } from '../../src/data/species';
import { getFoldedDragon, getFusedShape, isFusedSpecies } from '../../src/data/species/fusion';
import { describe, expect, it } from 'vitest';
import registerBiomeSpawns, {
  BIOME_NAMES,
  PRIZED_WEIGHT,
  SpawnRarity,
  TIMES_OF_DAY,
  getEggPool,
  getSpawnPool,
  getSpawnRarity,
  spawnBand,
} from '../../src/data/biome';
import EggGroups from '../../src/data/ids/egg-groups';
import Families from '../../src/data/ids/families';
import registerAbilities from '../../src/data/abilities';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import {
  TYPE_EFFECTIVENESS,
  TYPE_NAMES,
  TypeEffectiveness,
  Types,
  getTypeFactor,
  getTypeMatchups,
} from '../../src/data/constants/types';
import Biome, { TimeOfDay, WILD_BIOMES } from '../../src/data/ids/biome';
import { Moves } from '../../src/data/ids/moves';
import {
  ARCEUS_FORMS,
  BASCULIN_FORMS,
  BURMY_FORMS,
  CASTFORM_FORMS,
  CHERRIM_FORMS,
  DARMANITAN_FORMS,
  DEERLING_FORMS,
  DEOXYS_FORMS,
  DIALGA_FORMS,
  EvolutionMethod,
  FLABEBE_FORMS,
  FLOETTE_FORMS,
  FLORGES_FORMS,
  GASTRODON_FORMS,
  GENESECT_FORMS,
  GIRATINA_FORMS,
  KELDEO_FORMS,
  KYUREM_FORMS,
  LANDORUS_FORMS,
  MELOETTA_FORMS,
  PALKIA_FORMS,
  ROTOM_FORMS,
  SAWSBUCK_FORMS,
  SHAYMIN_FORMS,
  SHELLOS_FORMS,
  Species,
  THUNDURUS_FORMS,
  TORNADUS_FORMS,
  UNOWN_FORMS,
  VIVILLON_FORMS,
  WORMADAM_FORMS,
  getBaseFormSpecies,
  speciesDexNumber,
  speciesFormIndex,
  unownLetter,
} from '../../src/data/ids/species';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import { Stats } from '../../src/data/constants/stats';
import {
  getBaseForms,
  getEggMoves,
  getFamilyName,
  getLearnableMoves,
  getRegisteredSpecies,
  getSpeciesAbilities,
  getSpeciesAbilityPools,
  getSpeciesData,
  getSpeciesForms,
  getWornForms,
  isBaseForm,
  listTrueShadows,
  registerSpecies,
} from '../../src/data/species';
import { registerSpecies as registerSpeciesData } from '../../src/data/species/__create';
import Regions from '../../src/data/ids/regions';
import { getSpeciesRegion } from '../../src/data/species/regions';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('the type chart', () => {
  /**
   * The chart as the main games write it: what each attacking type
   * hits for double, what it is halved by, and what it cannot touch.
   *
   * Kept as words rather than as another copy of `TYPE_EFFECTIVENESS`
   * so the two are independent. These lines are the `damage_relations`
   * PokeAPI serves for each type, and a cell that drifts from them is
   * a silent balance change across every fight in the game
   */
  const CANON: Record<string, { double: string; half: string; none: string }> = {
    Normal: { double: '', half: 'Rock,Steel', none: 'Ghost' },
    Fighting: {
      double: 'Normal,Rock,Steel,Ice,Dark',
      half: 'Flying,Poison,Bug,Psychic,Fairy',
      none: 'Ghost',
    },
    Flying: { double: 'Fighting,Bug,Grass', half: 'Rock,Steel,Electric', none: '' },
    Poison: { double: 'Grass,Fairy', half: 'Poison,Ground,Rock,Ghost', none: 'Steel' },
    Ground: { double: 'Poison,Rock,Steel,Fire,Electric', half: 'Bug,Grass', none: 'Flying' },
    Rock: { double: 'Flying,Bug,Fire,Ice', half: 'Fighting,Ground,Steel', none: '' },
    Bug: {
      double: 'Grass,Psychic,Dark',
      half: 'Fighting,Flying,Poison,Ghost,Steel,Fire,Fairy',
      none: '',
    },
    Ghost: { double: 'Ghost,Psychic', half: 'Dark', none: 'Normal' },
    Steel: { double: 'Rock,Ice,Fairy', half: 'Steel,Fire,Water,Electric', none: '' },
    Fire: { double: 'Bug,Steel,Grass,Ice', half: 'Rock,Fire,Water,Dragon', none: '' },
    Water: { double: 'Ground,Rock,Fire', half: 'Water,Grass,Dragon', none: '' },
    Grass: {
      double: 'Ground,Rock,Water',
      half: 'Flying,Poison,Bug,Steel,Fire,Grass,Dragon',
      none: '',
    },
    Electric: { double: 'Flying,Water', half: 'Grass,Electric,Dragon', none: 'Ground' },
    Psychic: { double: 'Fighting,Poison', half: 'Steel,Psychic', none: 'Dark' },
    Ice: { double: 'Flying,Ground,Grass,Dragon', half: 'Steel,Fire,Water,Ice', none: '' },
    Dragon: { double: 'Dragon', half: 'Steel', none: 'Fairy' },
    Dark: { double: 'Ghost,Psychic', half: 'Fighting,Dark,Fairy', none: '' },
    Fairy: { double: 'Fighting,Dragon,Dark', half: 'Poison,Steel,Fire', none: '' },
  };

  const BY_NAME = new Map<string, Types>();

  for (const [id, name] of Object.entries(TYPE_NAMES)) {
    const type: Types = Number(id);

    BY_NAME.set(name, type);
  }

  function typeNamed(name: string): Types {
    const found = BY_NAME.get(name);

    if (found == null) {
      throw new Error(`No type called ${name}`);
    }
    return found;
  }

  /** The eighteen a pokemon can actually be, in the order the chart names them */
  const FOUGHT_WITH = Object.keys(CANON).map(typeNamed);

  /** The words on one side of one row, as the ids they name */
  function idsIn(list: string): Types[] {
    return list === '' ? [] : list.split(',').map(typeNamed);
  }

  it('lands every attack the way the main games do', () => {
    for (const [name, relations] of Object.entries(CANON)) {
      const attacking = typeNamed(name);
      const wanted = new Map<Types, TypeEffectiveness>();

      for (const type of idsIn(relations.double)) {
        wanted.set(type, TypeEffectiveness.Effective);
      }
      for (const type of idsIn(relations.half)) {
        wanted.set(type, TypeEffectiveness.Resistant);
      }
      for (const type of idsIn(relations.none)) {
        wanted.set(type, TypeEffectiveness.Immune);
      }

      // Every cell, not only the ones the chart bothered to write: a
      // cell that says nothing has to mean neutral rather than missing
      for (const defending of FOUGHT_WITH) {
        expect(
          TYPE_EFFECTIVENESS[attacking][defending],
          `${name} against ${TYPE_NAMES[defending]}`,
        ).toBe(wanted.get(defending));
      }
    }
  });

  it('says nothing about the two types no move is', () => {
    // Unknown is what a move has before it has decided, and Stellar
    // has no chart of its own; neither may quietly halve a hit
    expect(TYPE_EFFECTIVENESS[Types.Unknown]).toEqual({});
    expect(TYPE_EFFECTIVENESS[Types.Stellar]).toEqual({});

    for (const chart of Object.values(TYPE_EFFECTIVENESS)) {
      expect(chart[Types.Unknown]).toBeUndefined();
      expect(chart[Types.Stellar]).toBeUndefined();
    }
  });

  it('reads the chart both ways round for a badge', () => {
    // Attacking is the row; the other three are a scan down the column
    const fire = getTypeMatchups(Types.Fire);

    expect(new Set(fire.strong)).toEqual(new Set(idsIn('Bug,Steel,Grass,Ice')));
    expect(new Set(fire.weak)).toEqual(new Set(idsIn('Ground,Rock,Water')));
    expect(new Set(fire.resists)).toEqual(new Set(idsIn('Bug,Steel,Fire,Grass,Ice,Fairy')));
    expect(fire.immune).toEqual([]);

    // The one type nothing is merely resisted by, which is the pair
    // most easily lost by folding immunities in with resistances
    const ghost = getTypeMatchups(Types.Ghost);

    expect(new Set(ghost.immune)).toEqual(new Set(idsIn('Normal,Fighting')));
    expect(new Set(ghost.resists)).toEqual(new Set(idsIn('Poison,Bug')));
  });

  it('multiplies the chart across a dual type', () => {
    const gyarados = [Types.Water, Types.Flying];

    expect(getTypeFactor(Types.Electric, gyarados)).toBe(4);
    expect(getTypeFactor(Types.Ground, gyarados)).toBe(0);
    expect(getTypeFactor(Types.Fire, gyarados)).toBe(0.5);
    expect(getTypeFactor(Types.Normal, gyarados)).toBe(1);
  });
});

describe('species abilities', () => {
  it('evolved species learn their pre-evolutions abilities', () => {
    // Vileplume's own set plus Gloom's Stench and Oddish's Run Away
    const vileplume = getSpeciesAbilities(Species.Vileplume);

    expect(vileplume.has(Abilities.EffectSpore)).toBe(true);
    expect(vileplume.has(Abilities.Chlorophyll)).toBe(true);
    expect(vileplume.has(Abilities.Stench)).toBe(true);
    expect(vileplume.has(Abilities.RunAway)).toBe(true);

    // Base species only know their own set
    const oddish = getSpeciesAbilities(Species.Oddish);

    expect(oddish.has(Abilities.Stench)).toBe(false);
    expect(oddish.size).toBe(2);
  });

  it('splits hidden abilities from regular abilities', () => {
    const lapras = getSpeciesData(Species.Lapras);

    expect(lapras.abilities).toEqual([Abilities.WaterAbsorb, Abilities.ShellArmor]);
    expect(lapras.hiddenAbilities).toEqual([Abilities.Hydration, Abilities.FriendGuard]);

    // Species without any leave the field unset
    expect(getSpeciesData(Species.Gastly).hiddenAbilities).toBeUndefined();

    // The ancestry walk still covers hidden abilities
    expect(getSpeciesAbilities(Species.Lapras).has(Abilities.Hydration)).toBe(true);
  });

  it('pools regular and hidden abilities across the line', () => {
    // Vileplume's line shares Chlorophyll; each stage hides its own
    const pools = getSpeciesAbilityPools(Species.Vileplume);

    expect(pools.regular).toEqual([Abilities.Chlorophyll]);
    expect(pools.hidden).toEqual([Abilities.EffectSpore, Abilities.Stench, Abilities.RunAway]);
  });

  it('makes what a stage only inherits rare', () => {
    // Persian is born Limber or Technician; the Pickup it reaches
    // only through Meowth is rolled out of the hidden band
    const persian = getSpeciesAbilityPools(Species.Persian);

    expect(persian.regular).toEqual([Abilities.Limber, Abilities.Technician]);
    expect(persian.hidden).toContain(Abilities.Pickup);

    // An ability the stage lists itself stays ordinary, however far
    // down the line it also appears
    const vileplume = getSpeciesAbilityPools(Species.Vileplume);

    expect(vileplume.regular).toContain(Abilities.Chlorophyll);
    expect(vileplume.hidden).not.toContain(Abilities.Chlorophyll);
  });

  it('never lets a stage reach what only a later stage has', () => {
    // The rule the pools exist to keep: an ability exclusive to an
    // evolution is out of reach of every stage below it
    for (const species of getRegisteredSpecies()) {
      const reachable = getSpeciesAbilities(species);
      let previous = getSpeciesData(species).evolvesFrom;

      while (previous != null) {
        for (const ability of getSpeciesAbilities(previous)) {
          // Everything a pre-evolution reaches, the stage above it
          // reaches too: the walk only ever runs upwards
          expect(reachable.has(ability)).toBe(true);
        }
        previous = getSpeciesData(previous).evolvesFrom;
      }
    }
  });
});

describe('what a family is called', () => {
  it('names every family after a pokemon in it', () => {
    const members = new Map<Families, Species[]>();

    for (const species of getRegisteredSpecies()) {
      const { family } = getSpeciesData(species);

      members.set(family, [...(members.get(family) ?? []), species]);
    }

    for (const [family, lot] of members) {
      const name = getFamilyName(family);
      const named = lot.map((species) => getSpeciesData(species).name);

      // The name is one of the line's own, spelled the way the species
      // is spelled: Mr. Mime and Farfetch'd included
      expect(named, name).toContain(name);
      expect(name.length).toBeGreaterThan(0);
    }
    // And no two lines answer to one name, since a candy jar is read
    // by it
    const names = [...members.keys()].map((family) => getFamilyName(family));

    expect(new Set(names).size).toBe(names.length);
  });

  it('is the pokemon the line is known as, not the one it hatches as', () => {
    // The bug this is written from: the name was the base species, so
    // eight families answered to the baby a later generation put under
    // them and a bag read "Pichu candy" for a Pikachu's
    expect(getFamilyName(getSpeciesData(Species.Pikachu).family)).toBe('Pikachu');
    expect(getFamilyName(getSpeciesData(Species.Pichu).family)).toBe('Pikachu');
    expect(getFamilyName(getSpeciesData(Species.Marill).family)).toBe('Marill');
    expect(getFamilyName(getSpeciesData(Species.Wobbuffet).family)).toBe('Wobbuffet');
    expect(getFamilyName(getSpeciesData(Species.Jynx).family)).toBe('Jynx');
    // Except where the baby is the only name that covers the line: the
    // three Hitmons are siblings rather than stages of each other
    expect(getFamilyName(getSpeciesData(Species.Hitmonlee).family)).toBe('Tyrogue');
    expect(getFamilyName(getSpeciesData(Species.Tyrogue).family)).toBe('Tyrogue');
  });
});

describe('species measurements', () => {
  it('measures every species', () => {
    // Weight-driven moves read these, so a species registered
    // without them would fight as a weightless zero
    for (const species of getRegisteredSpecies()) {
      const data = getSpeciesData(species);

      expect(data.height).toBeGreaterThan(0);
      expect(data.weight).toBeGreaterThan(0);
    }
  });

  it('keeps the sizes each species is known for', () => {
    // The extremes, in meters and kilograms: Onix is the long one,
    // Snorlax the heavy one, and a Gastly is very nearly nothing
    expect(getSpeciesData(Species.Onix).height).toBe(8.8);
    expect(getSpeciesData(Species.Snorlax).weight).toBe(460);
    expect(getSpeciesData(Species.Gastly).weight).toBe(0.1);

    // Evolving is growing: every stage outweighs the one before it
    expect(getSpeciesData(Species.Charmeleon).weight).toBeGreaterThan(
      getSpeciesData(Species.Charmander).weight,
    );
    expect(getSpeciesData(Species.Charizard).weight).toBeGreaterThan(
      getSpeciesData(Species.Charmeleon).weight,
    );
  });
});

describe('species forms', () => {
  it('treats every registered species but the unowns and the worn shapes as a default form', () => {
    // The flag is absent almost everywhere and answers true rather
    // than being written out three hundred times. The variants are
    // the twenty-seven unowns past A, the three skies a Castform
    // wears, the three shapes a Deoxys rearranges into, and the ones
    // that are met rather than worn: a Burmy's other two cloaks with
    // the Wormadam they grow into, and the far shore's shell. A
    // Cherrim's open blossom is worn, the way a Castform's sky is, and
    // so is each of the creation trio's other shape
    const registered = getRegisteredSpecies();
    const variants = new Set<Species>([
      ...UNOWN_FORMS.slice(1),
      ...CASTFORM_FORMS.slice(1),
      ...DEOXYS_FORMS.slice(1),
      ...BURMY_FORMS.slice(1),
      ...WORMADAM_FORMS.slice(1),
      ...SHELLOS_FORMS.slice(1),
      ...GASTRODON_FORMS.slice(1),
      ...BASCULIN_FORMS.slice(1),
      ...CHERRIM_FORMS.slice(1),
      ...DARMANITAN_FORMS.slice(1),
      ...DIALGA_FORMS.slice(1),
      ...PALKIA_FORMS.slice(1),
      ...GIRATINA_FORMS.slice(1),
      ...SHAYMIN_FORMS.slice(1),
      ...KELDEO_FORMS.slice(1),
      ...ROTOM_FORMS.slice(1),
      ...ARCEUS_FORMS.slice(1),
      ...KYUREM_FORMS.slice(1),
      ...TORNADUS_FORMS.slice(1),
      ...THUNDURUS_FORMS.slice(1),
      ...LANDORUS_FORMS.slice(1),
      ...MELOETTA_FORMS.slice(1),
      ...GENESECT_FORMS.slice(1),
      ...DEERLING_FORMS.slice(1),
      ...VIVILLON_FORMS.slice(1),
      ...FLABEBE_FORMS.slice(1),
      ...FLOETTE_FORMS.slice(1),
      ...FLORGES_FORMS.slice(1),
      ...SAWSBUCK_FORMS.slice(1),
      // The true shadows, which are forms of the birds they are the
      // shadow of rather than pokemon of their own
      ...listTrueShadows(),
    ]);

    expect(registered.length).toBeGreaterThan(0);
    for (const species of registered) {
      if (variants.has(species)) {
        expect(getSpeciesData(species).baseForm).toBe(false);
        expect(isBaseForm(species)).toBe(false);
        continue;
      }
      expect(getSpeciesData(species).baseForm).toBeUndefined();
      expect(isBaseForm(species)).toBe(true);
    }
    expect(getBaseForms()).toEqual(registered.filter((species) => !variants.has(species)));
  });

  it('is about the costume rather than the evolution', () => {
    // A Charizard is a base form and so is a Charmander: what makes
    // one of them different is the line it stands in, which
    // `evolvesFrom` answers
    expect(isBaseForm(Species.Charmander)).toBe(true);
    expect(isBaseForm(Species.Charizard)).toBe(true);
    expect(getSpeciesData(Species.Charizard).evolvesFrom).toBe(Species.Charmeleon);

    // A variant says so, and drops out of the base forms with it.
    // Registration is an idempotent overwrite, so the species is put
    // back exactly as it was rather than left in a costume
    const original = getSpeciesData(Species.Charizard);

    try {
      registerSpeciesData(Species.Charizard, { ...original, baseForm: false });
      expect(isBaseForm(Species.Charizard)).toBe(false);
      expect(new Set(getBaseForms()).has(Species.Charizard)).toBe(false);
    } finally {
      registerSpeciesData(Species.Charizard, original);
    }
    expect(isBaseForm(Species.Charizard)).toBe(true);
  });

  it('numbers a form off the species it is a form of', () => {
    // The band keeps `Species === dexNumber` true of every base form
    // and sorts a species' forms straight after it
    expect(Species.Unown).toBe(201);
    expect(speciesDexNumber(Species.Unown)).toBe(201);
    expect(speciesFormIndex(Species.Unown)).toBe(0);

    expect(speciesDexNumber(Species.UnownQuestion)).toBe(201);
    expect(speciesFormIndex(Species.UnownQuestion)).toBe(27);
    expect(getBaseFormSpecies(Species.UnownQuestion)).toBe(Species.Unown);

    // Anything that is not a form answers itself, the three that are
    // drawn like pokemon without being pokemon included
    expect(getBaseFormSpecies(Species.Pikachu)).toBe(Species.Pikachu);
    expect(speciesFormIndex(Species.Missingno)).toBe(0);
    expect(speciesDexNumber(Species.Missingno)).toBe(Species.Missingno);
  });

  it('gathers every shape of one pokemon, its own first', () => {
    expect(getSpeciesForms(Species.Unown)).toEqual(UNOWN_FORMS);
    // Asked of a form rather than of the default, the answer is the
    // same list: they are shapes of one another
    expect(getSpeciesForms(Species.UnownZ)).toEqual(UNOWN_FORMS);

    // A species with no variants is a list of one, so a caller never
    // has to know which kind it is holding
    expect(getSpeciesForms(Species.Pikachu)).toEqual([Species.Pikachu]);
  });

  it('tells a worn shape from a shape that is met', () => {
    // A letter is caught; a sky is put on. Only the second kind is
    // filled in off the pokemon wearing it
    expect(getWornForms(Species.Castform)).toEqual(CASTFORM_FORMS.slice(1));
    expect(getWornForms(Species.Unown)).toEqual([]);
    expect(getWornForms(Species.Pikachu)).toEqual([]);

    for (const species of CASTFORM_FORMS.slice(1)) {
      expect(getSpeciesData(species).worn).toBe(true);
      // Nowhere at all: a sky is reached through Forecast
      expect(getSpeciesData(species).biomes).toEqual([]);
    }
    expect(getSpeciesData(Species.Castform).worn).toBeUndefined();
  });
});

describe('the unowns', () => {
  it('files a form under the region of the species it is a form of', () => {
    expect(getSpeciesRegion(Species.Unown)).toBe(Regions.Johto);
    expect(getSpeciesRegion(Species.UnownExclamation)).toBe(Regions.Johto);
  });

  it('is one pokemon in twenty-eight shapes', () => {
    expect(UNOWN_FORMS.length).toBe(28);

    for (const species of UNOWN_FORMS) {
      const data = getSpeciesData(species);

      expect(data.dexNumber).toBe(201);
      expect(data.family).toBe(Families.Unown);
      expect(data.category).toBe('Symbol Pokemon');
      expect(data.types).toEqual([Types.Psychic]);
      expect(data.stats[Stats.HP]).toBe(48);
      expect(data.stats[Stats.SpecialAttack]).toBe(72);
      // Genderless and unbreedable, so a nest never lays one and a
      // letter is only ever met
      expect(data.genderRatio).toBeUndefined();
      expect(data.eggGroups).toEqual([EggGroups.NoEggsDiscovered]);
      expect(getEggMoves(species)).toEqual([]);
      expect(getLearnableMoves(species)).toEqual([Moves.HiddenPower]);
    }
  });

  it('names each shape after the character it is drawn as', () => {
    expect(unownLetter(Species.Unown)).toBe('A');
    expect(unownLetter(Species.UnownZ)).toBe('Z');
    expect(unownLetter(Species.UnownExclamation)).toBe('!');
    expect(unownLetter(Species.UnownQuestion)).toBe('?');
    expect(unownLetter(Species.Pikachu)).toBeNull();

    // A is the one the dex prints, so it keeps the plain name and the
    // other twenty-seven are marked
    expect(getSpeciesData(Species.Unown).name).toBe('Unown');
    expect(getSpeciesData(Species.UnownQ).name).toBe('Unown Q');
  });

  it('gives each shape an ability of its own, and none of them a boost', () => {
    const signatures = new Set<Abilities>();

    for (const species of UNOWN_FORMS) {
      const data = getSpeciesData(species);

      // The mainline ability is the ordinary roll; the rest are this
      // registry's and are hidden, the way an invented ability is
      expect(data.abilities).toEqual([Abilities.Levitate]);
      expect(data.hiddenAbilities?.length).toBe(3);

      const [signature, ...shared] = data.hiddenAbilities ?? [];

      expect(shared).toEqual([Abilities.MagicGuard, Abilities.Pressure]);
      expect(signatures.has(signature), `${data.name} repeats an ability`).toBe(false);
      signatures.add(signature);
    }
    expect(signatures.size).toBe(28);

    // Every unown reaches four, which is what a species with nothing
    // above or below it owes
    expect(getSpeciesAbilities(Species.UnownE).size).toBe(4);
  });

  it('stands in the prized band of every biome, at equal weight', () => {
    for (const biome of WILD_BIOMES) {
      for (const time of TIMES_OF_DAY) {
        const prized = spawnBand(getSpawnPool(biome, time), 'prized');
        const found = new Map(prized.map((entry) => [entry.species, entry.weight]));

        for (const species of UNOWN_FORMS) {
          expect(found.get(species), `${BIOME_NAMES[biome]} is missing a letter`).toBe(1);
        }
      }
    }
    expect(getSpawnRarity(Species.UnownY)).toBe(SpawnRarity.Prized);
  });

  it('weighs the whole alphabet as one pokemon', () => {
    // Twenty-eight entries and one pokemon: the letters together are
    // drawn as often as the baby standing beside them, so a form set
    // cannot crowd a band out by being long
    const prized = spawnBand(getSpawnPool(Biome.Woodland, TimeOfDay.Morning), 'prized');
    const letters = new Set<Species>(UNOWN_FORMS);
    const alphabet = prized
      .filter((entry) => letters.has(entry.species))
      .reduce((total, entry) => total + entry.weight, 0);

    expect(alphabet).toBe(PRIZED_WEIGHT);

    for (const entry of prized.filter((one) => !letters.has(one.species))) {
      expect(entry.weight).toBe(PRIZED_WEIGHT);
    }
  });

  it('is met rather than hatched', () => {
    // The prized band is left out of the egg pools, so a nest never
    // lays a letter: an unown has no line to walk back along
    const hatchable = new Set(
      getEggPool(Biome.Grassland, TimeOfDay.Morning).map((entry) => entry.species),
    );

    for (const species of UNOWN_FORMS) {
      expect(hatchable.has(species)).toBe(false);
    }
  });
});

describe('fusions', () => {
  it('joins each dragon to the shape it makes, and back again', () => {
    for (const shape of KYUREM_FORMS.slice(1)) {
      const dragon = getFoldedDragon(shape);

      expect(dragon).not.toBeNull();
      expect(isFusedSpecies(shape)).toBe(true);
      // oxlint-disable-next-line typescript/no-non-null-assertion
      expect(getFusedShape(dragon!)).toBe(shape);
    }
    expect(isFusedSpecies(Species.Kyurem)).toBe(false);
    expect(getFoldedDragon(Species.Kyurem)).toBeNull();
  });

  it('puts the splicers on every road into a fusion and out of one', () => {
    const roads: EvolutionData[] = [...(getSpeciesData(Species.Kyurem).evolvesInto ?? [])];

    for (const shape of KYUREM_FORMS.slice(1)) {
      roads.push(...(getSpeciesData(shape).evolvesInto ?? []));
    }

    // Two ways in from the husk, and one way back out of each shape
    expect(roads.length).toBe(4);
    for (const road of roads) {
      expect(road.method).toBe(EvolutionMethod.UsedItem);
      expect(road.item).toBe(Items.DnaSplicers);
    }
  });

  it('gives a fused shape the ability of the dragon inside it', () => {
    expect(getSpeciesData(Species.KyuremBlack).abilities).toEqual([Abilities.Teravolt]);
    expect(getSpeciesData(Species.KyuremWhite).abilities).toEqual([Abilities.Turboblaze]);
    expect(getSpeciesData(Species.Zekrom).abilities).toEqual([Abilities.Teravolt]);
    expect(getSpeciesData(Species.Reshiram).abilities).toEqual([Abilities.Turboblaze]);
  });
});
