import Biome from '../ids/biome';
import { isMythicalSpecies } from '../biome';
import { BIOME_NAMES } from '../biome/names';
import { Species } from '../ids/species';

/**
 * The lairs: the places a legendary is found rather than the
 * legendary itself.
 *
 * A raid landmark used to draw from the biome's legendary pool and
 * take its name from whatever it staged, which meant a chunk could
 * hold "Articuno" twice over and mean two different things by it. A
 * lair is a place instead — Seafoam Islands is Seafoam Islands
 * whoever is in it — so a landmark is staged from the lairs the biome
 * can host, and the lair decides which legendary is at home there.
 *
 * The names are the ones the mainline games gave these places, which
 * is the point: a player who has seen Articuno before knows what a
 * Seafoam Islands lair is without being told.
 */
const enum Lairs {
  SeafoamIslands = 0,
  PowerPlant = 1,
  MtEmber = 2,
  CeruleanCave = 3,
  /**
   * Mew's island. It is never in a biome's list — the world stages no
   * mythical — but a mythical raid called out by a relic still needs
   * a name, and this is the one it has always had
   */
  FarawayIsland = 4,
  /**
   * Where the three beasts were burned and brought back. It is the
   * one lair with more than one resident, which is what the games
   * say: they were made together and set loose together, and no
   * place belongs to any one of them
   */
  BurnedTower = 5,
  WhirlIslands = 6,
  BellTower = 7,
  /**
   * Celebi's shrine. A mythical's lair, so the world never stages it
   */
  IlexForest = 8,
  /**
   * The three sealed chambers, one golem apiece. Unlike the Burned
   * Tower, which holds three, each of these holds exactly one: they
   * were sealed separately and are opened separately
   */
  DesertRuins = 9,
  IslandCave = 10,
  AncientTomb = 11,
  /**
   * The island the eon pair keep to, well out in open water. Like the
   * Burned Tower it holds two, so which of the pair is at home is a
   * roll
   */
  SouthernIsland = 12,
  /**
   * The three the weather trio sleep in: a cavern that floods, one
   * that fills with heat, and the tower the sky is reached from
   */
  MarineCave = 13,
  TerraCave = 14,
  SkyPillar = 15,
  /**
   * Deoxys' island. A mythical's lair, so no biome lists it: the
   * ticket is the only way there
   */
  BirthIsland = 16,
  /**
   * The valley a Jirachi sleeps under, woken by the comet that passes
   * over it. A mythical's lair, so no biome hosts it
   */
  Forina = 17,
  /**
   * The three lakes the trio sleep under, one apiece. Like the sealed
   * chambers and unlike the Burned Tower, each holds exactly one: they
   * were set down in three places and stayed in them
   */
  LakeAcuity = 18,
  LakeVerity = 19,
  LakeValor = 20,
  /**
   * The top of the mountain, where the two that made the world are
   * called down. It holds both, like the Southern Island, so which of
   * them answers is a roll
   */
  SpearPillar = 21,
  /**
   * The cave the third one was banished through. One resident, and
   * the only door to the world behind this one
   */
  TurnbackCave = 22,
  /**
   * The two islands off the same port, one for each half of the moon.
   * Newmoon Island is a mythical's, so no biome lists it: the pass is
   * the only way onto that boat
   */
  FullmoonIsland = 23,
  NewmoonIsland = 24,
  /**
   * The temple that surfaces once and sinks again, and the prince
   * that lives in it. A mythical's lair, so no biome hosts it
   */
  SeaTemple = 25,
  /**
   * The cavern at the top of the volcano, which is not a cave the
   * thing in it lives under but the one it hangs off
   */
  StarkMountain = 26,
  /**
   * The temple in the snow the fourth golem was shut in, above the
   * three it made
   */
  SnowpointTemple = 27,
  /**
   * The meadow at the end of the broken path, which grows back every
   * time somebody thanks it. A mythical's lair, so no biome hosts it
   */
  FlowerParadise = 28,
  /**
   * The stair that opens over the top of the mountain, and what is
   * standing at the top of it. A mythical's lair, so no biome hosts it
   */
  HallOfOrigin = 29,
  /**
   * The three ruins the golems turn up in again in Sinnoh, one apiece.
   * Each keeps its Hoenn chamber too, so either place stages it
   */
  RockPeakRuins = 30,
  IcebergRuins = 31,
  IronRuins = 32,
  /**
   * The rock far out at sea the tower duo meet at, one at its foot and
   * one at its peak, so which of them answers is a roll
   */
  NavelRock = 33,
  /**
   * The tower set into the sea cliffs, where an orb calls down any of
   * the weather trio, so which of them answers is a roll
   */
  EmbeddedTower = 34,
  /**
   * The buried castle under the sand, and the moth the desert once
   * took for the sun still in it
   */
  RelicCastle = 35,
  /**
   * The three chambers the swords keep, one apiece the way the lakes
   * are: the cave one waits in, the hall one is tested in and the
   * clearing one thinks in
   */
  GuidanceChamber = 36,
  TrialChamber = 37,
  RuminationField = 38,
  /**
   * The marsh the colt waits in until the other three have been met.
   * A mythical's lair, so no biome hosts it
   */
  MoorOfIcirrus = 39,
  /**
   * The tower in the snow the two halves of the dragon sleep under,
   * one in each stone, so which of them answers is a roll
   */
  DragonspiralTower = 40,
  /** The crater the husk has been waiting in since it was torn open */
  GiantChasm = 41,
}

export const LAIR_NAMES: Record<Lairs, string> = {
  [Lairs.SeafoamIslands]: 'Seafoam Islands',
  [Lairs.PowerPlant]: 'Power Plant',
  [Lairs.MtEmber]: 'Mt. Ember',
  [Lairs.CeruleanCave]: 'Cerulean Cave',
  [Lairs.FarawayIsland]: 'Faraway Island',
  [Lairs.BurnedTower]: 'Burned Tower',
  [Lairs.WhirlIslands]: 'Whirl Islands',
  [Lairs.BellTower]: 'Bell Tower',
  [Lairs.IlexForest]: 'Ilex Forest',
  [Lairs.DesertRuins]: 'Desert Ruins',
  [Lairs.IslandCave]: 'Island Cave',
  [Lairs.AncientTomb]: 'Ancient Tomb',
  [Lairs.SouthernIsland]: 'Southern Island',
  [Lairs.MarineCave]: 'Marine Cave',
  [Lairs.TerraCave]: 'Terra Cave',
  [Lairs.SkyPillar]: 'Sky Pillar',
  [Lairs.BirthIsland]: 'Birth Island',
  [Lairs.Forina]: 'Forina',
  [Lairs.LakeAcuity]: 'Lake Acuity',
  [Lairs.LakeVerity]: 'Lake Verity',
  [Lairs.LakeValor]: 'Lake Valor',
  [Lairs.SpearPillar]: 'Spear Pillar',
  [Lairs.TurnbackCave]: 'Turnback Cave',
  [Lairs.FullmoonIsland]: 'Fullmoon Island',
  [Lairs.NewmoonIsland]: 'Newmoon Island',
  [Lairs.SeaTemple]: 'Sea Temple',
  [Lairs.StarkMountain]: 'Stark Mountain',
  [Lairs.SnowpointTemple]: 'Snowpoint Temple',
  [Lairs.FlowerParadise]: 'Flower Paradise',
  [Lairs.HallOfOrigin]: 'Hall of Origin',
  [Lairs.RockPeakRuins]: 'Rock Peak Ruins',
  [Lairs.IcebergRuins]: 'Iceberg Ruins',
  [Lairs.IronRuins]: 'Iron Ruins',
  [Lairs.NavelRock]: 'Navel Rock',
  [Lairs.EmbeddedTower]: 'Embedded Tower',
  [Lairs.RelicCastle]: 'Relic Castle',
  [Lairs.GuidanceChamber]: 'Guidance Chamber',
  [Lairs.TrialChamber]: 'Trial Chamber',
  [Lairs.RuminationField]: 'Rumination Field',
  [Lairs.MoorOfIcirrus]: 'Moor of Icirrus',
  [Lairs.DragonspiralTower]: 'Dragonspiral Tower',
  [Lairs.GiantChasm]: 'Giant Chasm',
};

/**
 * Who lives in each one. A lair stages its own residents and no
 * others, which is what makes travelling to a particular lair worth
 * doing. Nearly all of them hold a single legendary; the Burned Tower
 * holds the three beasts, so which one is at home is a roll. A
 * legendary may be at home in more than one lair
 */
export const LAIR_SPECIES: Record<Lairs, Species[]> = {
  [Lairs.SeafoamIslands]: [Species.Articuno],
  [Lairs.PowerPlant]: [Species.Zapdos],
  [Lairs.MtEmber]: [Species.Moltres],
  [Lairs.CeruleanCave]: [Species.Mewtwo],
  [Lairs.FarawayIsland]: [Species.Mew],
  [Lairs.BurnedTower]: [Species.Raikou, Species.Entei, Species.Suicune],
  [Lairs.WhirlIslands]: [Species.Lugia],
  [Lairs.BellTower]: [Species.HoOh],
  [Lairs.IlexForest]: [Species.Celebi],
  [Lairs.DesertRuins]: [Species.Regirock],
  [Lairs.IslandCave]: [Species.Regice],
  [Lairs.AncientTomb]: [Species.Registeel],
  [Lairs.SouthernIsland]: [Species.Latias, Species.Latios],
  [Lairs.MarineCave]: [Species.Kyogre],
  [Lairs.TerraCave]: [Species.Groudon],
  [Lairs.SkyPillar]: [Species.Rayquaza],
  [Lairs.BirthIsland]: [Species.Deoxys],
  [Lairs.Forina]: [Species.Jirachi],
  [Lairs.LakeAcuity]: [Species.Uxie],
  [Lairs.LakeVerity]: [Species.Mesprit],
  [Lairs.LakeValor]: [Species.Azelf],
  [Lairs.SpearPillar]: [Species.Dialga, Species.Palkia],
  [Lairs.TurnbackCave]: [Species.Giratina],
  [Lairs.FullmoonIsland]: [Species.Cresselia],
  [Lairs.NewmoonIsland]: [Species.Darkrai],
  [Lairs.SeaTemple]: [Species.Manaphy],
  [Lairs.StarkMountain]: [Species.Heatran],
  [Lairs.SnowpointTemple]: [Species.Regigigas],
  [Lairs.FlowerParadise]: [Species.Shaymin],
  [Lairs.HallOfOrigin]: [Species.Arceus],
  [Lairs.RockPeakRuins]: [Species.Regirock],
  [Lairs.IcebergRuins]: [Species.Regice],
  [Lairs.IronRuins]: [Species.Registeel],
  [Lairs.NavelRock]: [Species.Lugia, Species.HoOh],
  [Lairs.EmbeddedTower]: [Species.Kyogre, Species.Groudon, Species.Rayquaza],
  [Lairs.RelicCastle]: [Species.Volcarona],
  [Lairs.GuidanceChamber]: [Species.Cobalion],
  [Lairs.TrialChamber]: [Species.Terrakion],
  [Lairs.RuminationField]: [Species.Virizion],
  [Lairs.MoorOfIcirrus]: [Species.Keldeo],
  [Lairs.DragonspiralTower]: [Species.Reshiram, Species.Zekrom],
  [Lairs.GiantChasm]: [Species.Kyurem],
};

/**
 * Every lair there is, in the order they are numbered
 */
export const EVERY_LAIR: Lairs[] = [
  Lairs.SeafoamIslands,
  Lairs.PowerPlant,
  Lairs.MtEmber,
  Lairs.CeruleanCave,
  Lairs.FarawayIsland,
  Lairs.BurnedTower,
  Lairs.WhirlIslands,
  Lairs.BellTower,
  Lairs.IlexForest,
  Lairs.DesertRuins,
  Lairs.IslandCave,
  Lairs.AncientTomb,
  Lairs.SouthernIsland,
  Lairs.MarineCave,
  Lairs.TerraCave,
  Lairs.SkyPillar,
  Lairs.BirthIsland,
  Lairs.Forina,
  Lairs.LakeAcuity,
  Lairs.LakeVerity,
  Lairs.LakeValor,
  Lairs.SpearPillar,
  Lairs.TurnbackCave,
  Lairs.FullmoonIsland,
  Lairs.NewmoonIsland,
  Lairs.SeaTemple,
  Lairs.StarkMountain,
  Lairs.SnowpointTemple,
  Lairs.FlowerParadise,
  Lairs.HallOfOrigin,
  Lairs.RockPeakRuins,
  Lairs.IcebergRuins,
  Lairs.IronRuins,
  Lairs.NavelRock,
  Lairs.EmbeddedTower,
  Lairs.RelicCastle,
  Lairs.GuidanceChamber,
  Lairs.TrialChamber,
  Lairs.RuminationField,
  Lairs.MoorOfIcirrus,
  Lairs.DragonspiralTower,
  Lairs.GiantChasm,
];

/**
 * The lairs the **world** may stage: every one whose residents are
 * legendaries.
 *
 * A mythical's lair is left out, because a relic is the only way to
 * one. It is what keeps a Mew off the end of Giovanni's party, and
 * what a landmark draws from. `EVERY_LAIR` still holds all of them,
 * since a pool that has to keep lair species out has to know about
 * every lair there is
 */
export const EVERY_STAGED_LAIR: Lairs[] = (() => {
  const staged: Lairs[] = [];

  lairs: for (const lair of EVERY_LAIR) {
    for (const species of LAIR_SPECIES[lair]) {
      if (isMythicalSpecies(species)) {
        continue lairs;
      }
    }
    staged.push(lair);
  }
  return staged;
})();

const STAGED_LAIRS = new Set<Lairs>(EVERY_STAGED_LAIR);

/**
 * Which lairs a biome can host. A lair is a place, so it sits where
 * that place would be: the Seafoam Islands are a sea cave in cold
 * water, Mt. Ember is a volcano, Cerulean Cave is deep under a
 * mountain, and the Power Plant is the one building among them,
 * abandoned on flat ground, which is where the plains are. The three
 * sealed chambers sit where their doors were cut: ruins in the sand,
 * a cave in the ice, a tomb under the rock. Their Sinnoh ruins sit on
 * a sandstorm route, a snowbound one and an island mine.
 *
 * The three lakes sit in the country each of them was found in: the
 * cold one in the north, the wooded one and the one on open ground.
 *
 * A biome with no lair stages no legendary lair at all, which is most
 * of them: a legendary the whole world could walk to is not a
 * legendary.
 *
 * A lair is also a wild spawn: a biome that hosts one lists each
 * resident in its special band, mythicals aside
 */
const BIOME_LAIRS: { [key in Biome]?: Lairs[] } = {
  [Biome.DeepOcean]: [Lairs.SeafoamIslands, Lairs.WhirlIslands, Lairs.MarineCave, Lairs.NavelRock],
  [Biome.Ocean]: [
    Lairs.WhirlIslands,
    Lairs.SouthernIsland,
    Lairs.FullmoonIsland,
    Lairs.IronRuins,
    Lairs.SkyPillar,
  ],
  [Biome.Beach]: [Lairs.EmbeddedTower],
  [Biome.PolarOcean]: [Lairs.SeafoamIslands, Lairs.IslandCave],
  [Biome.Glacier]: [
    Lairs.SeafoamIslands,
    Lairs.IslandCave,
    Lairs.SnowpointTemple,
    Lairs.GiantChasm,
  ],
  [Biome.Grassland]: [Lairs.PowerPlant, Lairs.BurnedTower, Lairs.LakeValor],
  [Biome.Bog]: [Lairs.LakeValor, Lairs.TurnbackCave],
  [Biome.TemperateForest]: [Lairs.LakeVerity, Lairs.RuminationField],
  [Biome.Woodland]: [Lairs.BurnedTower, Lairs.LakeVerity, Lairs.RuminationField],
  [Biome.Taiga]: [Lairs.LakeAcuity, Lairs.IcebergRuins, Lairs.DragonspiralTower],
  [Biome.Tundra]: [
    Lairs.LakeAcuity,
    Lairs.SnowpointTemple,
    Lairs.IcebergRuins,
    Lairs.DragonspiralTower,
    Lairs.GiantChasm,
  ],
  [Biome.Steppe]: [Lairs.PowerPlant],
  [Biome.Desert]: [Lairs.MtEmber, Lairs.DesertRuins, Lairs.RockPeakRuins, Lairs.RelicCastle],
  [Biome.Badlands]: [
    Lairs.DesertRuins,
    Lairs.AncientTomb,
    Lairs.TurnbackCave,
    Lairs.RockPeakRuins,
    Lairs.TrialChamber,
  ],
  [Biome.Mountain]: [
    Lairs.MtEmber,
    Lairs.CeruleanCave,
    Lairs.BellTower,
    Lairs.AncientTomb,
    Lairs.GuidanceChamber,
    Lairs.TrialChamber,
  ],
  [Biome.AlpineTundra]: [Lairs.CeruleanCave, Lairs.SpearPillar],
  [Biome.Volcano]: [Lairs.TerraCave, Lairs.StarkMountain],
};

/**
 * The lairs this biome can host, in the order they are drawn from.
 * Filtered rather than trusted: a mythical's lair listed here by
 * mistake would put one on the map, and the relic is the only way to
 * one
 */
export function getBiomeLairs(biome: Biome): Lairs[] {
  const lairs: Lairs[] = [];

  for (const lair of BIOME_LAIRS[biome] ?? []) {
    if (STAGED_LAIRS.has(lair)) {
      lairs.push(lair);
    }
  }
  return lairs;
}

/**
 * Everyone at home in the lair
 */
export function getLairResidents(lair: Lairs): Species[] {
  return LAIR_SPECIES[lair];
}

/**
 * Which of a lair's residents a raid stages, from a roll the whole
 * chunk shares. `allowed` narrows to the ones that can be staged at
 * all, and the caller has already checked that one of them can be
 */
export function pickLairSpecies(
  lair: Lairs,
  allowed: (species: Species) => boolean,
  roll: number,
): Species {
  const residents: Species[] = [];

  for (const species of getLairResidents(lair)) {
    if (allowed(species)) {
      residents.push(species);
    }
  }

  return residents[Math.abs(roll) % residents.length];
}

/**
 * Every lair a species is at home in, in the order they are numbered,
 * and empty for anything that has no place of its own
 */
export function getSpeciesLairs(species: Species): Lairs[] {
  return EVERY_LAIR.filter((lair) => LAIR_SPECIES[lair].includes(species));
}

/**
 * What a raid on this landmark is called.
 *
 * A lair is named after the place: **Seafoam Islands**, shadowed or
 * not — a shadow of the place is still that place, so it is only the
 * name with a word in front of it. A shadow raid that reached for one
 * of the biome's rare species instead stands in no lair at all, so it
 * is named after the ground it is standing on: **Shadow Woodland
 * Lair**
 */
export function getLairTitle(lair: Lairs | null, biome: Biome, shadow: boolean): string {
  const place = lair == null ? `${BIOME_NAMES[biome]} Lair` : LAIR_NAMES[lair];

  return shadow ? `Shadow ${place}` : place;
}

export default Lairs;
