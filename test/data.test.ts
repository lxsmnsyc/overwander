import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { asBasicSpriteData } from '../src/canvas/basic-sprite';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SpawnRarity,
  TIMES_OF_DAY,
  boostFamilyWeights,
  getEggPool,
  getSpawnPool,
  getSpawnRarity,
  isMythicalSpecies,
  isPrizedSpecies,
  listSpeciesHabitats,
  pickSpawn,
} from '../src/data/biome';
import EggGroups from '../src/data/ids/egg-groups';
import Families from '../src/data/ids/families';
import registerAbilities, { getAbilityData } from '../src/data/abilities';
import Abilities from '../src/data/ids/abilities';
import { TYPE_COLORS, TYPE_NAMES, Types } from '../src/data/constants/types';
import Biome, { AnyTimeOfDay, TimeOfDay, getBiome, isWaterBiome } from '../src/data/ids/biome';
import {
  BALL_ITEMS,
  ItemFlags,
  ItemTypes,
  Items,
  getMachineItem,
  getMachineMove,
  isMachineItem,
} from '../src/data/ids/items';
import {
  MOVE_CATEGORY_COLORS,
  MOVE_CATEGORY_NAMES,
  MoveCategories,
  Moves,
} from '../src/data/ids/moves';
import {
  NON_VOLATILE_MASK,
  NON_VOLATILE_STATUSES,
  StatusFlags,
  Statuses,
  flagStatus,
  packStatuses,
  statusFlag,
  unpackStatuses,
} from '../src/data/ids/status';
import { EvolutionMethod, Species } from '../src/data/ids/species';
import {
  CANDY_PER_LEVEL,
  SHADOW_CANDY_MULTIPLIER,
  SPECIES_DAY_CANDY_BOOST,
  getCandyCost,
  getCatchCandy,
} from '../src/auth/candy';
import registerItems, {
  ITEM_TYPE_NAMES,
  ITEM_TYPE_ORDER,
  getItemData,
  getTeachableMoves,
  listItemsByType,
} from '../src/data/items';
import { WING_STATS, isWing } from '../src/data/items/wings';
import {
  BERRY_BRACE_STAGES,
  BERRY_EFFORT_DROPS,
  BERRY_NATURE_HEALS,
  BERRY_PINCH_STAGES,
  BERRY_RESIST_TYPES,
  BERRY_STATUS_CURES,
  PINCH_BERRIES,
  isBerry,
} from '../src/data/items/berries';
import BERRY_POOL from '../src/data/overworld/berry-pool';
import { getMoveData, getRegisteredMoves, registerMoves } from '../src/data/moves';
import {
  CAST_ANIMATIONS,
  DEFAULT_CAST,
  isCommonCast,
  isLoopingCast,
  pickCast,
} from '../src/data/constants/cast';
import pickStatusCast, { STATUS_CAST } from '../src/data/constants/status-cast';
import AleaRNG from '../src/core/alea';
import type { ItemPoolEntry } from '../src/data/overworld/item-pool';
import {
  ITEM_POOL,
  MAX_KINDS,
  MAX_STACK,
  getItemBand,
  isPreciousItem,
  pickItem,
  pickItems,
} from '../src/data/overworld/item-pool';
import {
  FOSSIL_OFFER_KINDS,
  FOSSIL_REVIVE_LEVEL,
  getFossilPrice,
  rollFossilOffer,
} from '../src/data/overworld/fossil';
import { FOSSIL_SPECIES, isFossil, listFossils } from '../src/data/items/fossils';
import {
  VENDOR_STAPLES,
  VENDOR_STOCK_KINDS,
  getVendorGoods,
  isMarketable,
  sellPrice,
} from '../src/data/overworld/vendor';
import { VALUABLE_SELL, isValuable } from '../src/data/items/valuables';
import { asBoolean } from '../src/auth/__normalize';
import { CANDY_STACKS, ITEM_STACKS, getStack, listStacks } from '../src/auth/stacks';
import {
  MAX_SLOTS,
  SLOT_BITS,
  Slots,
  countAbilitySlots,
  countsAgainstSlots,
  defaultSlots,
  getSlots,
  packSlots,
  withSlots,
} from '../src/data/constants/slots';
import getSigil, { BRAILLE_BASE, SIGIL_CELLS } from '../src/data/constants/sigil';
import { isFavorite, isGuarded } from '../src/auth/caught-record';
import {
  MAX_IV,
  MAX_IV_STARS,
  PERFECT_IVS,
  STAT_ORDER,
  Stats,
  getIV,
  getIVStars,
  packIVs,
  setIV,
  unpackIVs,
} from '../src/data/constants/stats';
import { BOTTLE_CAPS, isBottleCap, isPerfectIVs, polishIVs } from '../src/data/items/bottle-caps';
import { UTILITY_BELT_SLOT, isUtilityBelt } from '../src/data/items/utility-belt';
import { PVP_BATTLE_LIMITS, UNLIMITED_BATTLE_LIMITS } from '../src/data/constants/battle-limits';
import {
  PURIFY_IV_BOOST,
  isPurifiable,
  isPurifyingGem,
  purifyAbilities,
  purifyIVs,
} from '../src/data/items/purifying-gem';
import { CANDY_ITEM_PRICE } from '../src/data/items/candy-items';
import { isPortalKey } from '../src/data/items/portal-key';
import { isHeartScale } from '../src/data/items/heart-scale';
import Landmark, { LANDMARKS, LANDMARK_NAMES } from '../src/data/overworld/landmark';
import Npc, { NPCS, NPC_NAMES, REMINDER_FEE, getRecallableMoves } from '../src/data/overworld/npc';
import { MEDICINES, bitterness, isHerbal, isMedicine, isRevive } from '../src/data/items/medicine';
import { GEMS, GEM_PRICE } from '../src/data/items/gems';
import { FOUND_GEAR, GEAR_PRICE, MARKET_GEAR, isGear } from '../src/data/items/gear';
import { INCENSES, INCENSE_PRICE, INCENSE_TYPES } from '../src/data/items/incenses';
import { BATTLE_ITEMS, BATTLE_ITEM_PRICE, isBattleItem } from '../src/data/items/battle-items';
import { ONE_SHOTS, ONE_SHOT_PRICE, isOneShot } from '../src/data/items/one-shots';
import { DRINKS, isDrink } from '../src/data/items/drinks';
import { isSacredAsh } from '../src/data/items/sacred-ash';
import {
  FOUND_TRINKETS,
  MARKET_TRINKETS,
  TRINKETS,
  TRINKET_PRICE,
  isTrinket,
} from '../src/data/items/trinkets';
import { LUCK_INCENSE_BONUS } from '../src/overworld/items/incenses';
import { AMULET_COIN_BONUS } from '../src/overworld/items/trinkets';
import { ORBS, ORB_PRICE } from '../src/data/items/orbs';
import { PLATES, PLATE_RESALE } from '../src/data/items/plates';
import { RAID_ITEMS, getRaidSpecies } from '../src/data/items/raid-items';
import {
  GENERAL_STAT_BOOSTERS,
  RELIC_STAT_BOOSTERS,
  STAT_BOOSTER_PRICE,
} from '../src/data/items/stat-boosters';
import { TYPE_BOOSTERS, TYPE_BOOSTER_PRICE } from '../src/data/items/type-boosters';
import {
  SPECIES_DAY_WEIGHT_BOOST,
  getAvailableEvolutions,
  getBaseForms,
  getBaseSpecies,
  getConsumedItem,
  getDayOfYear,
  getEggMoves,
  getFeaturedFamily,
  getLevelUpMoves,
  getMovesLearnedAt,
  getRegisteredSpecies,
  getSpeciesAbilities,
  getSpeciesAbilityPools,
  getSpeciesByBiome,
  getSpeciesData,
  isBaseForm,
  isFeaturedSpecies,
  meetsEvolutionCriteria,
  registerSpecies,
} from '../src/data/species';
import { registerSpecies as registerSpeciesData } from '../src/data/species/__create';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

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
    expect(lapras.hiddenAbility).toBe(Abilities.Hydration);

    // Species without one leave the field unset
    expect(getSpeciesData(Species.Gastly).hiddenAbility).toBeUndefined();

    // The ancestry walk still covers hidden abilities
    expect(getSpeciesAbilities(Species.Lapras).has(Abilities.Hydration)).toBe(true);
  });

  it('pools regular and hidden abilities across the line', () => {
    // Vileplume's line shares Chlorophyll; each stage hides its own
    const pools = getSpeciesAbilityPools(Species.Vileplume);

    expect(pools.regular).toEqual([Abilities.Chlorophyll]);
    expect(pools.hidden).toEqual([Abilities.EffectSpore, Abilities.Stench, Abilities.RunAway]);
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
  it('treats every registered species as a default form', () => {
    // Gen 1 has no Alolan anything, so the flag is absent everywhere
    // and answers true rather than being written out a hundred and
    // fifty-one times
    const registered = getRegisteredSpecies();

    expect(registered.length).toBeGreaterThan(0);
    for (const species of registered) {
      expect(getSpeciesData(species).baseForm).toBeUndefined();
      expect(isBaseForm(species)).toBe(true);
    }
    expect(getBaseForms()).toEqual(registered);
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
});

describe('where a species lives', () => {
  it('reads the pools backwards, one entry per biome, hour and band', () => {
    const habitats = listSpeciesHabitats(Species.Rattata);

    expect(habitats.length).toBeGreaterThan(0);

    // Every entry says a place the pool actually lists it in, in the
    // band the pool put it in
    for (const habitat of habitats) {
      const groups = getSpawnPool(habitat.biome, habitat.time);
      const bands: [SpawnRarity, { species: Species }[]][] = [
        [SpawnRarity.Base, groups.base],
        [SpawnRarity.Uncommon, groups.uncommon],
        [SpawnRarity.Rare, groups.rare],
        [SpawnRarity.Prized, groups.prized ?? []],
        [SpawnRarity.Special, groups.special],
      ];

      for (const [rarity, entries] of bands) {
        const listed = entries.some((entry) => entry.species === Species.Rattata);

        expect(listed).toBe(rarity === habitat.rarity);
      }
    }
  });

  it('finds the grassland it is met in all day', () => {
    const grassland = listSpeciesHabitats(Species.Rattata).filter(
      (habitat) => habitat.biome === Biome.Grassland,
    );

    expect(grassland.map((habitat) => habitat.time).sort()).toEqual(
      [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night].sort(),
    );
    for (const habitat of grassland) {
      expect(habitat.rarity).toBe(SpawnRarity.Base);
    }
  });

  it('puts the one-per-world species in the band they are drawn from', () => {
    // Every registered species stands in some pool, a mythical
    // included — what makes one of those rare is the band rather than
    // the absence of a home
    expect(isMythicalSpecies(Species.Mew)).toBe(true);

    const habitats = listSpeciesHabitats(Species.Mew);

    expect(habitats.length).toBeGreaterThan(0);
    for (const habitat of habitats) {
      expect(habitat.rarity).toBe(SpawnRarity.Special);
    }
  });

  it('says the same thing the pools do about every species', () => {
    // Nothing is invented and nothing is dropped: the number of
    // habitat entries is exactly the number of times the registry
    // lists that species anywhere
    const counted = new Map<Species, number>();

    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const time of TIMES_OF_DAY) {
        const groups = getSpawnPool(biome, time);

        for (const band of [
          groups.base,
          groups.uncommon,
          groups.rare,
          groups.prized ?? [],
          groups.special,
        ]) {
          for (const entry of band) {
            counted.set(entry.species, (counted.get(entry.species) ?? 0) + 1);
          }
        }
      }
    }

    for (const species of getRegisteredSpecies()) {
      expect(listSpeciesHabitats(species).length).toBe(counted.get(species) ?? 0);
    }
  });
});

describe('egg moves', () => {
  it('names moves this registry actually holds', () => {
    let carried = 0;

    for (const species of getRegisteredSpecies()) {
      const egg = getEggMoves(species);

      carried += egg.length > 0 ? 1 : 0;
      for (const move of egg) {
        // A later generation's egg move has nothing here to name, so
        // the lists are kept to what a Gen 1 battle can actually cast
        expect(() => getMoveData(move)).not.toThrow();
      }
      // A line's list is a set: inheriting the same move twice is
      // nothing
      expect(new Set(egg).size).toBe(egg.length);
    }

    expect(carried).toBeGreaterThan(0);
  });

  it('gives them to the base stage, and to nothing that cannot breed', () => {
    for (const species of getRegisteredSpecies()) {
      const data = getSpeciesData(species);

      if (getEggMoves(species).length === 0) {
        continue;
      }

      // What hatches is what inherits: an evolution carries what it
      // hatched with rather than a list of its own
      for (const evolution of data.evolvesInto ?? []) {
        expect(getEggMoves(evolution.species)).toEqual([]);
      }
      // Nothing with no eggs to discover inherits anything
      expect(new Set(data.eggGroups).has(EggGroups.NoEggsDiscovered)).toBe(false);
    }
  });

  it('keeps the moves a line is known for passing down', () => {
    // The elemental punches are the classic inheritance: an Abra or a
    // Gastly never learns one on its own
    for (const species of [Species.Abra, Species.Gastly]) {
      const egg = new Set(getEggMoves(species));

      expect(egg.has(Moves.FirePunch)).toBe(true);
      expect(egg.has(Moves.IcePunch)).toBe(true);
      expect(egg.has(Moves.ThunderPunch)).toBe(true);
    }

    // A legendary has nobody to inherit from
    expect(getEggMoves(Species.Mewtwo)).toEqual([]);
    expect(getEggMoves(Species.Articuno)).toEqual([]);
  });
});

describe('the moves nobody knows', () => {
  it('numbers them out of the dex', () => {
    // A move id is a slot in the dex, and these three have no slot:
    // one is what a confused pokemon hits itself with, one is what is
    // left when everything else is shut off, and one is the swing
    // thrown while everything else is cooling. Held past the range, a
    // record carrying a real move can never be read as any of them —
    // the same reason Missingno and the egg are numbered where they
    // are
    expect(Moves.Struggle).toBe(100_000);
    expect(Moves._Confused).toBe(100_001);
    expect(Moves.Attack).toBe(100_002);

    for (const move of getRegisteredMoves()) {
      if (move !== Moves.Struggle && move !== Moves.Attack) {
        expect(move, getMoveData(move).name).toBeLessThan(100_000);
      }
    }
  });

  it('makes the fallback swing feeble and constant', () => {
    const attack = getMoveData(Moves.Attack);

    // A tenth of a real move, so it fills the gaps between cooldowns
    // without ever being worth waiting for
    expect(attack.power).toBe(10);
    // And back about once a second: PP here is how often a move comes
    // round, and the basis it is divided into is 180
    expect(attack.pp).toBe(180);
    // Typeless as registered; what it is actually thrown as is read
    // off the pokemon throwing it
    expect(attack.type).toBe(Types.Unknown);
  });

  it('leaves the moves nobody knows out of every list one can be reached from', () => {
    for (const species of getRegisteredSpecies()) {
      const { learnSet } = getSpeciesData(species);
      const teachable = new Set(learnSet.teachable);
      const named = getSpeciesData(species).name;

      expect(teachable.has(Moves.Struggle), named).toBe(false);
      expect(teachable.has(Moves.Attack), named).toBe(false);
      for (const learned of Object.values(learnSet.level)) {
        expect(new Set(learned).has(Moves.Struggle)).toBe(false);
        expect(new Set(learned).has(Moves.Attack)).toBe(false);
      }
    }

    // And no machine teaches either: machines are derived from what
    // the species can be taught, so the check above is what keeps
    // them out
    expect(new Set(getTeachableMoves()).has(Moves.Struggle)).toBe(false);
    expect(new Set(getTeachableMoves()).has(Moves.Attack)).toBe(false);
  });
});

describe('the moves added back to the dex', () => {
  it('gives Porygon its Conversion and Kadabra its Kinesis', () => {
    // Both were missing, and both are the move the species is known
    // for: Porygon knows Conversion from the moment it is switched on,
    // and Kinesis is the spoon-bending Kadabra is named after
    expect(new Set(getSpeciesData(Species.Porygon).learnSet.level[1]).has(Moves.Conversion)).toBe(
      true,
    );
    expect(new Set(getSpeciesData(Species.Kadabra).learnSet.level[1]).has(Moves.Kinesis)).toBe(
      true,
    );
    // Alakazam keeps what Kadabra learned
    expect(new Set(getSpeciesData(Species.Alakazam).learnSet.level[1]).has(Moves.Kinesis)).toBe(
      true,
    );
  });

  it('teaches Soft-Boiled to Chansey, and to the one who was not supposed to exist', () => {
    const taught = getRegisteredSpecies().filter((species) =>
      new Set(getSpeciesData(species).learnSet.teachable).has(Moves.SoftBoiled),
    );

    expect(new Set(taught)).toEqual(new Set([Species.Chansey, Species.Mew]));
  });

  it('registers all four with data a battle can read', () => {
    for (const move of [Moves.Conversion, Moves.Kinesis, Moves.SoftBoiled, Moves.Struggle]) {
      expect(() => getMoveData(move)).not.toThrow();
    }

    // Struggle is typeless on purpose: `Unknown` is in no column of
    // the chart, so nothing resists it and nothing is immune to it
    expect(getMoveData(Moves.Struggle).type).toBe(Types.Unknown);
    expect(getMoveData(Moves.Struggle).power).toBe(50);
  });
});

describe('move cast animations', () => {
  const named = new Set<string>(CAST_ANIMATIONS);

  it('gives every move a preference that cannot run out', () => {
    const moves = getRegisteredMoves();

    expect(moves.length).toBeGreaterThan(0);

    for (const move of moves) {
      const { name, cast } = getMoveData(move);

      // A move with no preference would fall to the same clip as
      // every other move, which is the state this field exists to
      // leave behind
      expect(cast.length, name).toBeGreaterThan(0);

      for (const animation of cast) {
        expect(named.has(animation), `${name}: ${animation}`).toBe(true);
      }

      // The walk is preferred-first and stops at the first clip the
      // sprite has, so the **last** entry has to be one every sheet
      // carries. Anything else is a move that can fall off the end
      expect(isCommonCast(cast[cast.length - 1]), `${name}: ${cast.join(' → ')}`).toBe(true);

      // Asking for the same clip twice is a typo rather than a
      // preference: the second ask can never be reached
      expect(new Set(cast).size, name).toBe(cast.length);
    }
  });

  it('says which clips repeat rather than filling a window', () => {
    // Standing about, walking, shivering, gathering itself: things a
    // pokemon keeps doing. Stretched to a window they play once, in
    // slow motion
    for (const looping of ['Charge', 'Sleep', 'Hurt', 'Walk', 'Idle', 'Shake', 'Dance', 'Rotate']) {
      expect(isLoopingCast(looping), looping).toBe(true);
    }

    // And the gestures, which are fitted to whatever has to be filled
    for (const once of ['Attack', 'Shoot', 'Strike', 'Slice', 'Swing', 'Double', 'Hop']) {
      expect(isLoopingCast(once), once).toBe(false);
    }
  });

  it('walks the preference against the sprite in hand', () => {
    const punchy = pickCast(['Punch', 'Uppercut', 'Attack'], (name) => name !== 'Punch');

    // The first clip this sheet actually has, not the first named
    expect(pickCast(['Punch', 'Uppercut', 'Attack'], () => true)).toBe('Punch');
    expect(punchy).toBe('Uppercut');
    expect(pickCast(['Punch', 'Uppercut', 'Attack'], (name) => name === 'Attack')).toBe('Attack');

    // A sheet with none of the named clips still has to be given
    // something it can play: the common clip every sheet carries
    expect(pickCast(['Punch', 'Uppercut'], (name) => name === DEFAULT_CAST)).toBe(DEFAULT_CAST);
    expect(isCommonCast(DEFAULT_CAST)).toBe(true);
    // ...and a sheet missing even that falls to the one clip nothing
    // can be without. It should not happen — every sheet has the
    // eleven — but a sprite is a file on disk, and a file can be wrong
    expect(pickCast(['Punch', 'Uppercut'], () => false)).toBe('Idle');
  });
});

describe('status animations', () => {
  const named = new Set<string>(CAST_ANIMATIONS);

  it('gives every drawn status a preference that cannot run out', () => {
    for (const [status, cast] of STATUS_CAST) {
      expect(cast.length, String(status)).toBeGreaterThan(0);

      for (const animation of cast) {
        expect(named.has(animation), `${status}: ${animation}`).toBe(true);
      }

      // The same rule the move casts follow, for the same reason: the
      // walk stops at the first clip the sheet has, so the last entry
      // has to be one every sheet carries
      expect(isCommonCast(cast[cast.length - 1]), `${status}: ${cast.join(' → ')}`).toBe(true);
      expect(new Set(cast).size, String(status)).toBe(cast.length);
    }

    // A status may be drawn one way only. Two entries for the same one
    // would make the second unreachable
    expect(new Set(STATUS_CAST.map(([status]) => status)).size).toBe(STATUS_CAST.length);
  });

  it('draws what is being done to a pokemon standing about', () => {
    const anySheet = (): boolean => true;

    expect(pickStatusCast((status) => status === Statuses.Sleeping, anySheet)).toBe('Sleep');
    expect(pickStatusCast((status) => status === Statuses.Dormant, anySheet)).toBe('Sleep');
    expect(pickStatusCast((status) => status === Statuses.Flinched, anySheet)).toBe('Hurt');

    // The telling clips are the uncommon ones, so a sheet drawn
    // without them still has to say something: a paralyzed pokemon on
    // a sheet with no Shock and no Shake is drawn hurt
    expect(pickStatusCast((status) => status === Statuses.Paralyzed, anySheet)).toBe('Shock');
    expect(
      pickStatusCast(
        (status) => status === Statuses.Paralyzed,
        (name) => name === 'Hurt',
      ),
    ).toBe('Hurt');

    // Nothing worth drawing is not an animation, it is the absence of
    // one: the caller idles
    expect(pickStatusCast(() => false, anySheet)).toBe(null);
  });

  it('draws the status that decides whether it moves at all', () => {
    // Confused and paralyzed at once is drawn paralyzed: confusion
    // costs a pokemon its aim, paralysis costs it the turn
    expect(
      pickStatusCast(
        (status) => status === Statuses.Confused || status === Statuses.Paralyzed,
        () => true,
      ),
    ).toBe('Shock');

    // And a flinch beats everything, because it is the one that is
    // about to end
    expect(
      pickStatusCast(
        (status) => status === Statuses.Flinched || status === Statuses.Sleeping,
        () => true,
      ),
    ).toBe('Hurt');
  });
});

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
});

describe('evolution data', () => {
  it('describes level, stone and trade evolutions', () => {
    expect(getSpeciesData(Species.Bulbasaur).evolvesInto).toEqual([
      { species: Species.Ivysaur, method: EvolutionMethod.Level, level: 16 },
    ]);

    expect(getSpeciesData(Species.Eevee).evolvesInto).toHaveLength(3);
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

  it('offers level evolutions once the threshold is reached', () => {
    const context = { carried: new Set<Items>(), held: new Set<Items>(), traded: false };

    expect(getAvailableEvolutions(Species.Charmander, { ...context, level: 15 })).toEqual([]);
    expect(getAvailableEvolutions(Species.Charmander, { ...context, level: 16 })).toEqual([
      { species: Species.Charmeleon, method: EvolutionMethod.Level, level: 16 },
    ]);
  });

  it('offers stone evolutions only while the stone is carried', () => {
    const context = { level: 50, held: new Set<Items>(), traded: false };

    expect(getAvailableEvolutions(Species.Vulpix, { ...context, carried: new Set() })).toEqual([]);
    expect(
      getAvailableEvolutions(Species.Vulpix, { ...context, carried: new Set([Items.LeafStone]) }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions(Species.Vulpix, { ...context, carried: new Set([Items.FireStone]) }),
    ).toEqual([
      { species: Species.Ninetales, method: EvolutionMethod.UsedItem, item: Items.FireStone },
    ]);
  });

  it('offers nothing at all to a pokemon holding an Everstone', () => {
    const context = { level: 100, carried: new Set([Items.FireStone]), traded: true };

    // Every door at once: the level one, the stone one and the trade
    // one, all of them open, and the stone shuts all three
    expect(
      getAvailableEvolutions(Species.Charmander, { ...context, held: new Set([Items.Everstone]) }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions(Species.Vulpix, { ...context, held: new Set([Items.Everstone]) }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions(Species.Machoke, { ...context, held: new Set([Items.Everstone]) }),
    ).toEqual([]);

    // And holding something else changes nothing
    expect(
      getAvailableEvolutions(Species.Machoke, { ...context, held: new Set([Items.Leftovers]) }),
    ).toEqual([{ species: Species.Machamp, method: EvolutionMethod.Trade }]);
  });

  it('offers trade evolutions only to a pokemon that has changed hands', () => {
    const context = { level: 100, carried: new Set<Items>(), held: new Set<Items>() };

    // A Machoke nobody has traded stays a Machoke however high its
    // level runs — the level is not what the evolution asks for
    expect(getAvailableEvolutions(Species.Machoke, { ...context, traded: false })).toEqual([]);
    expect(getAvailableEvolutions(Species.Machoke, { ...context, traded: true })).toEqual([
      { species: Species.Machamp, method: EvolutionMethod.Trade },
    ]);
    // And the record's own history is what answers, so a fresh catch
    // of the same species is refused beside a traded one
    expect(getAvailableEvolutions(Species.Haunter, { ...context, level: 1, traded: true })).toEqual(
      [{ species: Species.Gengar, method: EvolutionMethod.Trade }],
    );
  });

  it('never offers evolutions it cannot verify', () => {
    // Friendship, weather and party composition have no stored
    // counterpart, so an evolution asking for one is refused rather
    // than waved through — even with everything else in hand
    expect(
      meetsEvolutionCriteria(
        { species: Species.Machamp, method: EvolutionMethod.Trade | EvolutionMethod.Friendship },
        { level: 100, carried: new Set(), held: new Set(), traded: true },
      ),
    ).toBe(false);
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

  it('features the family whose number is the day of the year', () => {
    // Family 0 is Bulbasaur's, so it opens the year; family 1 is
    // Charmander's, and so on
    expect(getFeaturedFamily(YEAR_START)).toBe(Families.Bulbasaur);
    expect(getFeaturedFamily(YEAR_START + DAY)).toBe(Families.Charmander);
    expect(getFeaturedFamily(YEAR_START + Families.Mewtwo * DAY)).toBe(Families.Mewtwo);

    // Family numbers run far short of a year, so most days feature
    // nobody at all
    expect(getFeaturedFamily(YEAR_START + 200 * DAY)).toBeNull();

    // The whole family is featured, not just one stage
    expect(isFeaturedSpecies(Species.Venusaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Bulbasaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Charmander, YEAR_START)).toBe(false);
    expect(isFeaturedSpecies(Species.Bulbasaur, YEAR_START + 200 * DAY)).toBe(false);
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
    expect(getCatchCandy(Species.Ivysaur)).toBe(2);
    expect(getCatchCandy(Species.Venusaur)).toBe(3);
    expect(getCatchCandy(Species.Mewtwo)).toBe(5);
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
    const pool = getSpawnPool(Biome.Grassland, TimeOfDay.Morning);
    const eggs = getEggPool(Biome.Grassland, TimeOfDay.Morning);

    // Everything that hatches is a first stage, and nothing appears
    // twice — that is the whole point of reducing the bands once
    expect(eggs.length).toBeGreaterThan(0);
    expect(new Set(eggs.map((entry) => entry.species)).size).toBe(eggs.length);
    for (const entry of eggs) {
      expect(getSpeciesData(entry.species).evolvesFrom).toBeUndefined();
      expect(getSpawnRarity(entry.species)).not.toBe(SpawnRarity.Special);
    }

    // The weights are the three ordinary bands added up, species by
    // species: a biome where four stages of one line spawn is a biome
    // where that egg is four times as likely
    const expected = new Map<Species, number>();

    for (const band of [pool.base, pool.uncommon, pool.rare]) {
      for (const entry of band) {
        const egg = getBaseSpecies(entry.species);

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
});

describe('item data', () => {
  it('registers every ball a catch can be made with', () => {
    // The catch record stores a ball, and the UI names it through
    // the item registry, so every variant has to be registered
    for (const item of Object.values(BALL_ITEMS)) {
      expect(getItemData(item).type).toBe(ItemTypes.PokeBall);
    }

    expect(getItemData(Items.PokeBall).name).toBe('Poke Ball');
    expect(getItemData(Items.DuskBall).name).toBe('Dusk Ball');

    // A ball is spent by the throw, never held
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Consumable).not.toBe(0);
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Holdable).toBe(0);
  });

  it('generates one machine per teachable move', () => {
    const teachable = getTeachableMoves();

    expect(teachable.length).toBeGreaterThan(10);

    for (const move of teachable) {
      const item = getMachineItem(move);

      expect(isMachineItem(item)).toBe(true);
      expect(getMachineMove(item)).toBe(move);
      expect(getItemData(item).type).toBe(ItemTypes.Machine);
      expect(getItemData(item).name).toBe(`TM ${getMoveData(move).name}`);
    }

    // The hand-written items are not machines
    expect(isMachineItem(Items.MasterBall)).toBe(false);
    expect(getMachineMove(Items.MasterBall)).toBeNull();
  });

  it('keeps machines out of the overworld and in the market', () => {
    // A machine is bought, never found: no band of the pool holds one
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => isMachineItem(entry.item))).toBe(false);
    }

    // Their price follows the move they teach, and selling one back
    // fetches half
    const cheap = getItemData(getMachineItem(Moves.Toxic));
    const solid = getItemData(getMachineItem(Moves.BodySlam));
    const strong = getItemData(getMachineItem(Moves.HyperBeam));

    expect(cheap.buy).toBeLessThan(solid.buy);
    expect(solid.buy).toBeLessThan(strong.buy);
    expect(strong.sell).toBe(strong.buy / 2);

    // Every machine is stocked
    expect(strong.flags & ItemFlags.Marketable).not.toBe(0);
  });

  it('stocks the candy items as ordinary held goods', () => {
    for (const item of [Items.ExpShare, Items.LuckyEgg]) {
      const data = getItemData(item);

      // Both are bought rather than found, held rather than used,
      // and neither is ever spent: what they pay, they pay on every
      // catch for as long as the buddy carries one
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.buy).toBe(CANDY_ITEM_PRICE);
      expect(data.sell).toBeLessThan(data.buy);
    }
    expect(getItemData(Items.ExpShare).name).toBe('Exp. Share');
    expect(getItemData(Items.LuckyEgg).name).toBe('Lucky Egg');

    // Neither is hidden in the world: they are what gold is for
    for (const band of [ITEM_POOL.base, ITEM_POOL.uncommon, ITEM_POOL.rare, ITEM_POOL.special]) {
      expect(band.some((entry) => entry.item === Items.ExpShare)).toBe(false);
      expect(band.some((entry) => entry.item === Items.LuckyEgg)).toBe(false);
    }
  });

  it('stocks the medicine and hides some of it too', () => {
    for (const [item, effect] of MEDICINES) {
      const data = getItemData(item);

      // Used on a pokemon and spent doing it. Nothing here is
      // holdable: a potion cannot be drunk mid-raid, which is what
      // keeps a berry worth carrying
      expect(data.type).toBe(ItemTypes.Medicine);
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      // The one thing gold is always worth spending on
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBeGreaterThan(0);
      expect(data.sell).toBeLessThan(data.buy);
      expect(isMedicine(item)).toBe(true);

      // Every one of them does something: restores, cures or revives
      expect(effect.restore > 0 || effect.cures != null || effect.revives > 0).toBe(true);
      // A revive does nothing but revive
      expect(isRevive(item)).toBe(effect.revives > 0);
      if (effect.revives > 0) {
        expect(effect.restore).toBe(0);
        expect(effect.cures).toBeNull();
      }
    }
    expect(getItemData(Items.MaxRevive).buy).toBeGreaterThan(getItemData(Items.Revive).buy);
    expect(isMedicine(Items.OranBerry)).toBe(false);

    // A potion is an everyday find; what a lost raid is undone with
    // is not
    expect(ITEM_POOL.base.some((entry) => entry.item === Items.Potion)).toBe(true);
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.SuperPotion)).toBe(true);
    for (const item of [Items.MaxPotion, Items.FullRestore, Items.Revive]) {
      expect(ITEM_POOL.rare.some((entry) => entry.item === item)).toBe(true);
      expect(ITEM_POOL.base.some((entry) => entry.item === item)).toBe(false);
    }
    // And the one that undoes a lost party rather than a lost fight
    // sits a band above the rest of them
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.MaxRevive)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.MaxRevive)).toBe(false);
    // None of it is one-per-world class
    for (const item of MEDICINES.keys()) {
      expect(ITEM_POOL.special.some((entry) => entry.item === item)).toBe(false);
    }
  });

  it('buries the fossils and leaves what is in them nowhere else', () => {
    expect(listFossils().length).toBe(FOSSIL_SPECIES.size);
    expect([...FOSSIL_SPECIES.values()]).toEqual([
      Species.Omanyte,
      Species.Kabuto,
      Species.Aerodactyl,
    ]);

    for (const [item, species] of FOSSIL_SPECIES) {
      const data = getItemData(item);

      // Spent opening it, and worth nothing to anybody in between:
      // no vendor stocks one and no vendor takes one, which is what
      // keeps a fossil paced by digging rather than by a purse
      expect(data.type).toBe(ItemTypes.Fossil);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(isMarketable(item)).toBe(false);
      expect(data.buy).toBe(0);
      expect(data.sell).toBe(0);
      expect(isFossil(item)).toBe(true);
      expect(data.name.length).toBeGreaterThan(0);

      // The maniac is the one person who will part with one, and he
      // charges gold for it
      expect(getFossilPrice(item)).toBeGreaterThan(0);

      // What is inside lives nowhere at all: reviving it is the only
      // way any of the three is ever met
      expect(listSpeciesHabitats(species).length).toBe(0);
      expect(getSpeciesData(species).biomes).toEqual([]);
    }

    // ...and neither do the species they grow into
    for (const species of [Species.Omastar, Species.Kabutops]) {
      expect(listSpeciesHabitats(species).length).toBe(0);
    }

    // Nothing else on the shelf is one
    expect(isFossil(Items.Nugget)).toBe(false);

    // All three are prized: reviving one is irreversible and is the
    // only way to the species inside, which is what that band is for.
    // The amber is the thinnest slot of the three, because Aerodactyl
    // is the rarest thing in them
    for (const item of [Items.HelixFossil, Items.DomeFossil, Items.OldAmber]) {
      expect(ITEM_POOL.prized.some((entry) => entry.item === item)).toBe(true);
      expect(getItemBand(item)).toBe('prized');
      expect(isPreciousItem(item)).toBe(true);
    }
    expect(getFossilPrice(Items.OldAmber)).toBeGreaterThan(getFossilPrice(Items.HelixFossil));

    // Whatever comes out arrives at the same level for everybody who
    // carried the same rock in
    expect(FOSSIL_REVIVE_LEVEL).toBeGreaterThan(0);
  });

  it('has the maniac carry two of the three, never the same one twice', () => {
    const rng = new AleaRNG('fossils');
    const pairs = new Set<string>();

    for (let at = 0; at < 50; at++) {
      const offer = rollFossilOffer(() => rng.random());

      expect(offer.length).toBe(FOSSIL_OFFER_KINDS);
      expect(new Set(offer).size).toBe(offer.length);
      for (const item of offer) {
        expect(isFossil(item)).toBe(true);
      }
      pairs.add(JSON.stringify([...offer].sort((left, right) => left - right)));
    }

    // Every pairing of the three turns up, so no fossil is one a
    // player can never be offered
    expect(pairs.size).toBe(3);
  });

  it('lets a vendor carry balls and medicine, and never a Master Ball', () => {
    const goods = new Set(getVendorGoods());

    expect(goods.size).toBeGreaterThan(VENDOR_STOCK_KINDS);
    for (const item of goods) {
      const data = getItemData(item);

      expect(data.type === ItemTypes.PokeBall || data.type === ItemTypes.Medicine).toBe(true);
      expect(isMarketable(item)).toBe(true);
      // Nothing bought from him can be sold back at a profit, which is
      // what keeps a vendor from being a gold press
      expect(data.buy).toBeGreaterThan(0);
      expect(data.sell).toBeLessThan(data.buy);
    }

    // The one ball the registry never priced. It is left out because
    // it has no price rather than because a list says so
    expect(goods.has(Items.MasterBall)).toBe(false);
    expect(isMarketable(Items.MasterBall)).toBe(false);

    // Everything the staples are is something every crate holds
    for (const staple of VENDOR_STAPLES) {
      expect(goods.has(staple)).toBe(true);
    }
  });

  it('sells herbal medicine cheaper than the bottle it competes with', () => {
    // Each herb undercuts its bottled counterpart and does more, and
    // the difference is charged to the pokemon instead
    const cheaper: [herb: Items, bottle: Items][] = [
      [Items.EnergyPowder, Items.SuperPotion],
      [Items.EnergyRoot, Items.HyperPotion],
      [Items.HealPowder, Items.FullHeal],
      [Items.RevivalHerb, Items.MaxRevive],
    ];

    for (const [herb, bottle] of cheaper) {
      expect(isHerbal(herb)).toBe(true);
      expect(isHerbal(bottle)).toBe(false);
      expect(getItemData(herb).buy).toBeLessThan(getItemData(bottle).buy);
      expect(bitterness(herb)).toBeGreaterThan(0);
    }

    // They grow where a walk goes, so the two powders are an everyday
    // find and the root and the herb are not
    for (const item of [Items.EnergyPowder, Items.HealPowder]) {
      expect(ITEM_POOL.base.some((entry) => entry.item === item)).toBe(true);
    }
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.EnergyRoot)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.RevivalHerb)).toBe(true);
  });

  it('packs a battle\u2019s limits the way a catch packs its slots', () => {
    // The two are compared, so they have to be the same shape: the
    // effective room is the smaller of them
    expect(getSlots(PVP_BATTLE_LIMITS, Slots.Ability)).toBe(1);
    expect(getSlots(PVP_BATTLE_LIMITS, Slots.Item)).toBe(1);
    expect(getSlots(PVP_BATTLE_LIMITS, Slots.Move)).toBe(4);

    // A raid adds no ceiling of its own
    for (const kind of [Slots.Ability, Slots.Item, Slots.Move]) {
      expect(getSlots(UNLIMITED_BATTLE_LIMITS, kind)).toBe(MAX_SLOTS);
    }

    // And a scenario is one packed number, which is why it can be
    // stored on the battle record
    const scenario = packSlots(1, 2, 4);

    expect(getSlots(scenario, Slots.Item)).toBe(2);
    expect(getSlots(scenario, Slots.Ability)).toBe(1);
  });

  it('buries the Utility Belt with the things that change a pokemon', () => {
    const data = getItemData(Items.UtilityBelt);
    const prized = new Set(ITEM_POOL.prized.map((entry) => entry.item));

    expect(data.name).toBe('Utility Belt');
    // Used on a pokemon and gone. Never held: a belt in the grip
    // would be a held item taking up the slot it grants
    expect(data.type).toBe(ItemTypes.Training);
    expect(data.flags & ItemFlags.Usable).not.toBe(0);
    expect(data.flags & ItemFlags.Consumable).not.toBe(0);
    expect(data.flags & ItemFlags.Holdable).toBe(0);
    expect(data.flags & ItemFlags.Marketable).toBe(0);
    expect(isUtilityBelt(Items.UtilityBelt)).toBe(true);
    expect(isUtilityBelt(Items.ExpertBelt)).toBe(false);

    // What it widens, and where it is found: the band for things that
    // change a pokemon for good
    expect(UTILITY_BELT_SLOT).toBe(Slots.Item);
    expect(prized.has(Items.UtilityBelt)).toBe(true);
    expect(isPreciousItem(Items.UtilityBelt)).toBe(true);

    // One belt is one slot, and the field's own ceiling is the end of
    // it
    const roomier = withSlots(defaultSlots(), UTILITY_BELT_SLOT, 2);

    expect(getSlots(roomier, Slots.Item)).toBe(2);
    expect(getSlots(withSlots(roomier, UTILITY_BELT_SLOT, MAX_SLOTS + 1), Slots.Item)).toBe(
      MAX_SLOTS,
    );
  });

  it('buries the bottle caps rather than stocking them', () => {
    for (const item of [Items.GoldenBottleCap, Items.BottleCap]) {
      const data = getItemData(item);

      // Spent on a pokemon and gone; never held, never sold, never
      // listed — what a cap is worth is what it does
      expect(data.type).toBe(ItemTypes.Training);
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBe(0);
      expect(isBottleCap(item)).toBe(true);
    }
    expect(getItemData(Items.GoldenBottleCap).name).toBe('Golden Bottle Cap');
    expect(getItemData(Items.BottleCap).name).toBe('Bottle Cap');
    expect(isBottleCap(Items.Nugget)).toBe(false);

    // The golden one perfects everything there is, the plain one a
    // single stat
    expect(BOTTLE_CAPS.get(Items.GoldenBottleCap)).toBe(STAT_ORDER.length);
    expect(BOTTLE_CAPS.get(Items.BottleCap)).toBe(1);

    // A one-per-world find and the band below it, each in one band
    // only: the plain cap fixes one stat and the golden one all six
    expect(ITEM_POOL.special.some((entry) => entry.item === Items.GoldenBottleCap)).toBe(true);
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.BottleCap)).toBe(true);
    for (const band of ['base', 'uncommon', 'rare', 'prized'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.GoldenBottleCap)).toBe(false);
    }
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.BottleCap)).toBe(false);
    }
  });

  it('puts a shadow right with a purifying gem', () => {
    const gem = getItemData(Items.PurifyingGem);

    expect(gem.name).toBe('Purifying Gem');
    expect(gem.type).toBe(ItemTypes.Training);
    expect(gem.flags & ItemFlags.Usable).toBeGreaterThan(0);
    expect(gem.flags & ItemFlags.Consumable).toBeGreaterThan(0);
    // Found, never stocked, and only ever in the prized band: taking
    // a shadow off a pokemon cannot be undone
    expect(gem.buy).toBe(0);
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.PurifyingGem)).toBe(true);
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.PurifyingGem)).toBe(false);
    }
    expect(isPurifyingGem(Items.PurifyingGem)).toBe(true);
    expect(isPurifyingGem(Items.BottleCap)).toBe(false);

    // Only a shadow is worth spending one on
    expect(isPurifiable({ shadow: true })).toBe(true);
    expect(isPurifiable({ shadow: false })).toBe(false);

    // The shadow comes off, which is what puts the candy cost back
    // down
    expect(getCandyCost({ shadow: true })).toBe(CANDY_PER_LEVEL * SHADOW_CANDY_MULTIPLIER);
    expect(getCandyCost({ shadow: false })).toBe(CANDY_PER_LEVEL);

    // The ability is replaced where it stands; the rolled one is left
    // exactly where it was
    expect(purifyAbilities([Abilities.Overgrow, Abilities.Shadow])).toEqual([
      Abilities.Overgrow,
      Abilities.Purified,
    ]);
    expect(getAbilityData(Abilities.Purified).name).toBe('Purified');

    // Two on every stat, and never past the cap
    const values = purifyIVs(
      packIVs({
        [Stats.HP]: 0,
        [Stats.Attack]: 5,
        [Stats.Defense]: 30,
        [Stats.SpecialAttack]: MAX_IV,
        [Stats.SpecialDefense]: 15,
        [Stats.Speed]: 29,
      }),
    );

    expect(getIV(values, Stats.HP)).toBe(PURIFY_IV_BOOST);
    expect(getIV(values, Stats.Attack)).toBe(5 + PURIFY_IV_BOOST);
    expect(getIV(values, Stats.Defense)).toBe(MAX_IV);
    expect(getIV(values, Stats.SpecialAttack)).toBe(MAX_IV);
    expect(getIV(values, Stats.Speed)).toBe(MAX_IV);
    expect(purifyIVs(PERFECT_IVS)).toBe(PERFECT_IVS);
  });

  it('keeps everything a player carries in one bag', () => {
    // Two maps in one document: the items and the candies live beside
    // each other, so a screen showing both reads one document rather
    // than running two queries
    const bag = {
      items: { [Items.Potion]: 3, [Items.UltraBall]: 1 },
      candies: { [Families.Bulbasaur]: 12 },
    };

    expect(getStack(bag, ITEM_STACKS, Items.Potion)).toBe(3);
    expect(getStack(bag, CANDY_STACKS, Families.Bulbasaur)).toBe(12);

    // Each map is read on its own: a candy count is never mistaken
    // for an item count, whatever the two ids happen to be — and
    // Potion's id is not a family anybody has candy of
    expect(getStack(bag, CANDY_STACKS, Items.Potion)).toBe(0);
    expect(getStack(bag, ITEM_STACKS, Families.Bulbasaur)).toBe(0);

    // What is not carried is not there. A key that was never written,
    // a bag that never was, and a count of zero all read the same,
    // and none of them is listed
    expect(getStack(bag, ITEM_STACKS, Items.MasterBall)).toBe(0);
    expect(getStack(undefined, ITEM_STACKS, Items.Potion)).toBe(0);
    expect(getStack({ items: { [Items.Potion]: 0 } }, ITEM_STACKS, Items.Potion)).toBe(0);
    expect(listStacks({ items: { [Items.Potion]: 0 } }, ITEM_STACKS)).toEqual([]);

    // Listed as id-count pairs, which is what every picker wants
    expect(new Map(listStacks(bag, ITEM_STACKS))).toEqual(
      new Map([
        [Items.Potion, 3],
        [Items.UltraBall, 1],
      ]),
    );
    expect(listStacks(bag, CANDY_STACKS)).toEqual([[Families.Bulbasaur, 12]]);

    // And anything that is not a bag at all is an empty one rather
    // than a thrown error
    expect(listStacks({ items: 'nonsense' }, ITEM_STACKS)).toEqual([]);
    expect(listStacks(null, CANDY_STACKS)).toEqual([]);
  });

  it('reads a mark only where it was actually written', () => {
    // Five fields rather than five bits, so each can be asked of the
    // store — and a stored yes is a stored `true`, never a number or
    // a string that happens to be truthy
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean(false)).toBe(false);
    expect(asBoolean(undefined)).toBe(false);
    expect(asBoolean(1)).toBe(false);
    expect(asBoolean('true')).toBe(false);
  });

  it('keeps what the player asked for apart from what the game decided', () => {
    // The two the player sets themselves answer different questions:
    // a favorite is about parting with a pokemon, a lock is about
    // disturbing it, and neither implies the other
    expect(isFavorite({ favorite: true })).toBe(true);
    expect(isGuarded({ guarded: false })).toBe(false);
    expect(isFavorite({ favorite: false })).toBe(false);
    expect(isGuarded({ guarded: true })).toBe(true);
  });

  it('gives every teachable move a machine of its own', () => {
    // The machines are generated from the learn sets rather than
    // written out, so a move any species can be taught has one — and
    // the item id is the move's own, lifted into the reserved range
    const teachable = getTeachableMoves();

    expect(teachable.length).toBeGreaterThan(0);
    for (const move of teachable) {
      const item = getMachineItem(move);

      expect(isMachineItem(item)).toBe(true);
      expect(getMachineMove(item)).toBe(move);
      expect(getItemData(item).name).toBe(`TM ${getMoveData(move).name}`);
      // A machine is used on a pokemon and spent teaching it, which is
      // what makes teaching a decision rather than a menu
      expect(getItemData(item).flags & ItemFlags.Consumable).not.toBe(0);
      expect(getItemData(item).flags & ItemFlags.Usable).not.toBe(0);
    }

    // Nothing hand-written strays into the machine range
    expect(isMachineItem(Items.Potion)).toBe(false);
    expect(getMachineMove(Items.Potion)).toBeNull();
  });

  it('names and colours every type and move kind', () => {
    // Both maps are read by the badges rather than matched on, so a
    // type added without either would draw as a blank chip. The enum
    // is const, so the keys of the name map stand in for it
    const types: Types[] = Object.keys(TYPE_NAMES).map(Number);

    expect(types.length).toBeGreaterThan(17);
    for (const type of types) {
      expect(TYPE_NAMES[type]).not.toBe('');
      expect(TYPE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(TYPE_NAMES[Types.Water]).toBe('Water');

    // The three kinds a move can be, each with a mark of its own —
    // and the word beside it, so nothing rests on the colour alone
    for (const category of [
      MoveCategories.Physical,
      MoveCategories.Special,
      MoveCategories.Status,
    ]) {
      expect(MOVE_CATEGORY_NAMES[category]).not.toBe('');
      expect(MOVE_CATEGORY_COLORS[category]).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(new Set(Object.values(MOVE_CATEGORY_COLORS)).size).toBe(3);
  });

  it('packs how much room a pokemon has into three counts', () => {
    // Stored 0-based, so an unwritten field reads as one of each —
    // which is what the game gave everything before the field existed
    expect(getSlots(0, Slots.Ability)).toBe(1);
    expect(getSlots(0, Slots.Item)).toBe(1);
    expect(getSlots(0, Slots.Move)).toBe(1);

    const usual = packSlots(1, 1, 4);

    expect(getSlots(usual, Slots.Ability)).toBe(1);
    expect(getSlots(usual, Slots.Item)).toBe(1);
    expect(getSlots(usual, Slots.Move)).toBe(4);
    // Three counts, three bits each: the whole field is nine bits
    expect(usual).toBeLessThan(1 << (3 * SLOT_BITS));

    // One count moves without disturbing the two beside it
    const roomier = withSlots(usual, Slots.Item, 2);

    expect(getSlots(roomier, Slots.Item)).toBe(2);
    expect(getSlots(roomier, Slots.Ability)).toBe(1);
    expect(getSlots(roomier, Slots.Move)).toBe(4);

    // And a count outside what three bits hold is brought inside it
    // rather than wrapping into its neighbour
    const clamped = withSlots(usual, Slots.Ability, 99);

    expect(getSlots(clamped, Slots.Ability)).toBe(MAX_SLOTS);
    expect(getSlots(clamped, Slots.Move)).toBe(4);
    expect(getSlots(withSlots(usual, Slots.Move, 0), Slots.Move)).toBe(1);

    // The special tier takes no room at all: a shadow arrives carrying
    // two abilities and still has its one slot free for the one it
    // rolled, purified or not
    expect(getSlots(defaultSlots([Abilities.Overgrow]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots([Abilities.Overgrow, Abilities.Shadow]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots([Abilities.Overgrow, Abilities.Purified]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots([Abilities.Boss, Abilities.Overgrow]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots(), Slots.Move)).toBe(4);

    // What does take room is an ordinary ability, and two of them
    // widen it
    expect(countAbilitySlots([Abilities.Overgrow, Abilities.Shadow, Abilities.Boss])).toBe(1);
    expect(countsAgainstSlots(Abilities.Overgrow)).toBe(true);
    expect(countsAgainstSlots(Abilities.Shadow)).toBe(false);
    expect(getSlots(defaultSlots([Abilities.Overgrow, Abilities.Blaze]), Slots.Ability)).toBe(2);
  });

  it('draws both of a pokemon\u2019s rolls as eight braille cells', () => {
    // Each cell is one byte of the roll, most significant first: the
    // Unicode block puts dot n at bit n − 1 of the offset, so the two
    // 32-bit numbers fit in eight characters with nothing dropped
    expect(getSigil(0, 0)).toBe('\u2800'.repeat(SIGIL_CELLS));
    expect(getSigil(0xff, 0)).toBe('\u2800\u2800\u2800\u28ff\u2800\u2800\u2800\u2800');
    expect(getSigil(0, 0xff)).toBe('\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28ff');
    expect(getSigil(0xffff_ffff, 0xffff_ffff)).toBe('\u28ff'.repeat(SIGIL_CELLS));

    // Every cell is a real braille cell, and the individual value is
    // drawn before the trait value
    const sigil = getSigil(0x0102_0304, 0x0506_0708);

    expect(sigil.length).toBe(SIGIL_CELLS);
    expect([...sigil].map((cell) => cell.codePointAt(0)! - BRAILLE_BASE)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);

    // The same roll always draws the same, and a different roll does
    // not — which is the whole of what a sigil is for
    expect(getSigil(0x0102_0304, 0x0506_0708)).toBe(sigil);
    expect(getSigil(0x0102_0304, 0x0506_0709)).not.toBe(sigil);

    // A roll that arrived as a signed number, or as nothing at all, is
    // still eight cells rather than a thrown error
    expect(getSigil(-1, Number.NaN)).toBe(`${'\u28ff'.repeat(4)}${'\u2800'.repeat(4)}`);
  });

  it('packs the statuses a pokemon carries into one mask', () => {
    const carried = packStatuses([Statuses.Poisoned, Statuses.Burned]);

    // A set of named things is a bitfield: order does not matter,
    // and the same status twice is once
    expect(carried).toBe(packStatuses([Statuses.Burned, Statuses.Poisoned, Statuses.Burned]));
    expect(unpackStatuses(carried)).toEqual([Statuses.Poisoned, Statuses.Burned]);
    expect(packStatuses([])).toBe(0);
    expect(unpackStatuses(0)).toEqual([]);

    // What a fight leaves behind is one AND rather than a filtered
    // list, and a volatile status has no bit to be written with:
    // confusion cannot enter the mask at all
    expect(NON_VOLATILE_MASK & statusFlag(Statuses.Burned)).not.toBe(0);
    expect(statusFlag(Statuses.Confused)).toBe(0);
    expect(packStatuses([Statuses.Confused])).toBe(0);

    // The flags are their own numbering rather than shifts of the
    // battle engine's, so they start at the first bit and stay there
    // however the engine renumbers
    expect(statusFlag(Statuses.Poisoned)).toBe(StatusFlags.Poisoned);
    expect(StatusFlags.Poisoned).toBe(0b1);
    expect(flagStatus(StatusFlags.Frozen)).toBe(Statuses.Frozen);
    expect(NON_VOLATILE_MASK).toBe(0b11_1111);

    // Six flags, one per status, no two sharing a bit
    expect(NON_VOLATILE_STATUSES).toHaveLength(6);
    expect(new Set(NON_VOLATILE_STATUSES.map(statusFlag)).size).toBe(6);
    for (const status of NON_VOLATILE_STATUSES) {
      const flag = statusFlag(status);

      expect(flag & (flag - 1)).toBe(0);
      expect(flagStatus(flag)).toBe(status);
    }
  });

  it('packs the six individual values into one integer', () => {
    const spread = {
      [Stats.HP]: 31,
      [Stats.Attack]: 0,
      [Stats.Defense]: 17,
      [Stats.SpecialAttack]: 4,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 9,
    };
    const packed = packIVs(spread);

    // Thirty bits hold the lot, and every stat comes back the way it
    // went in
    expect(unpackIVs(packed)).toEqual(spread);
    for (const stat of STAT_ORDER) {
      expect(getIV(packed, stat)).toBe(spread[stat]);
    }
    expect(packed).toBeLessThan(2 ** 30);

    // Writing one stat leaves its neighbours alone, and nothing can
    // bleed past five bits
    const raised = setIV(packed, Stats.Attack, MAX_IV);

    expect(getIV(raised, Stats.Attack)).toBe(MAX_IV);
    expect(getIV(raised, Stats.HP)).toBe(31);
    expect(getIV(raised, Stats.Defense)).toBe(17);
    expect(getIV(setIV(packed, Stats.Speed, 99), Stats.Speed)).toBe(MAX_IV);
    expect(getIV(setIV(packed, Stats.Speed, -4), Stats.Speed)).toBe(0);

    // A perfect pokemon is one value, whichever way it is reached
    expect(PERFECT_IVS).toBe(packIVs(unpackIVs(PERFECT_IVS)));
    expect(isPerfectIVs(PERFECT_IVS)).toBe(true);
  });

  it('rates the six values coarsely, for a pokemon being offered', () => {
    const evenly = (value: number): number =>
      packIVs({
        [Stats.HP]: value,
        [Stats.Attack]: value,
        [Stats.Defense]: value,
        [Stats.SpecialAttack]: value,
        [Stats.SpecialDefense]: value,
        [Stats.Speed]: value,
      });

    // One star per MAX_IV points across all six: flawless is six,
    // hopeless is none, and average is half
    expect(getIVStars(PERFECT_IVS)).toBe(MAX_IV_STARS);
    expect(getIVStars(evenly(0))).toBe(0);
    expect(getIVStars(evenly(16))).toBe(3);

    // Lossy on purpose: where the points sit does not change the
    // rating, so a rating says how good rather than which stat
    const lopsided = packIVs({
      [Stats.HP]: MAX_IV,
      [Stats.Attack]: MAX_IV,
      [Stats.Defense]: MAX_IV,
      [Stats.SpecialAttack]: 0,
      [Stats.SpecialDefense]: 0,
      [Stats.Speed]: 0,
    });
    // The same ninety-three points, spread flat instead of stacked
    const spread = packIVs({
      [Stats.HP]: 16,
      [Stats.Attack]: 16,
      [Stats.Defense]: 16,
      [Stats.SpecialAttack]: 15,
      [Stats.SpecialDefense]: 15,
      [Stats.Speed]: 15,
    });

    expect(getIVStars(lopsided)).toBe(getIVStars(spread));
    // And it never overflows the row of stars it is drawn as
    expect(getIVStars(evenly(MAX_IV))).toBeLessThanOrEqual(MAX_IV_STARS);
  });

  it('polishes individual values with a bottle cap', () => {
    const evenly = (value: number): number =>
      packIVs({
        [Stats.HP]: value,
        [Stats.Attack]: value,
        [Stats.Defense]: value,
        [Stats.SpecialAttack]: value,
        [Stats.SpecialDefense]: value,
        [Stats.Speed]: value,
      });

    // A golden cap reaches every stat, whatever the stream says
    const golden = polishIVs(evenly(0), STAT_ORDER.length, () => 0);

    expect(golden).toBe(PERFECT_IVS);
    expect(isPerfectIVs(golden ?? 0)).toBe(true);

    // A plain cap raises exactly one, and leaves the rest as they were
    const plain = polishIVs(evenly(5), 1, () => 0) ?? 0;
    const raised = STAT_ORDER.filter((stat) => getIV(plain, stat) === MAX_IV);

    expect(raised).toHaveLength(1);
    for (const stat of STAT_ORDER) {
      expect(getIV(plain, stat)).toBe(raised[0] === stat ? MAX_IV : 5);
    }

    // Only the stats that need it are drawn from: a cap that could
    // land on a stat already at the cap would be spent on nothing,
    // and would get worse the closer a pokemon came to perfect
    const nearly = setIV(PERFECT_IVS, Stats.Speed, 0);

    for (const roll of [0, 0.5, 0.999]) {
      expect(polishIVs(nearly, 1, () => roll)).toBe(PERFECT_IVS);
    }

    // Nothing left to polish, so there is nothing to spend a cap on
    expect(polishIVs(PERFECT_IVS, STAT_ORDER.length, () => 0)).toBeNull();
    expect(isPerfectIVs(nearly)).toBe(false);
  });

  it('prices the valuables to sell and never to buy', () => {
    const nugget = getItemData(Items.Nugget);

    expect(nugget.type).toBe(ItemTypes.Valuable);
    expect(nugget.sell).toBeGreaterThan(0);
    expect(nugget.buy).toBe(0);

    // A found item carries no market listing, however well it sells
    for (const item of [
      Items.Nugget,
      Items.Pearl,
      Items.BigPearl,
      Items.Stardust,
      Items.StarPiece,
    ]) {
      expect(getItemData(item).flags & ItemFlags.Marketable).toBe(0);
    }
    expect(getItemData(Items.OranBerry).flags & ItemFlags.Marketable).toBe(0);
    expect(getItemData(Items.OranBerry).sell).toBeGreaterThan(0);

    // Balls and stones are what the market stocks
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Marketable).not.toBe(0);
    expect(getItemData(Items.FireStone).buy).toBeGreaterThan(0);

    // The valuables are hidden in the overworld instead, a band
    // below what they are worth: gold trickles rather than drops
    expect(ITEM_POOL.base.some((entry) => entry.item === Items.Pearl)).toBe(true);
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.StarPiece)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.Nugget)).toBe(true);

    // The rarest band stays for what gold cannot buy
    expect(ITEM_POOL.special.map((entry) => entry.item)).toEqual([
      Items.MasterBall,
      Items.ShinyCharm,
      Items.OldSeaMap,
      Items.GoldenBottleCap,
      // The one thing in the band that is only gold, and there because
      // it is more of it than anything else in the game pays
      Items.RelicCrown,
    ]);
  });

  it('runs the valuables up one ladder, priced and placed together', () => {
    // Every valuable is the same kind of thing — gold with a picture
    // on it — so they share a shape: found, never stocked, and worth
    // exactly what a vendor pays
    for (const [item, sell] of VALUABLE_SELL) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Valuable);
      expect(data.sell).toBe(sell);
      expect(data.buy).toBe(0);
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      // A valuable that nothing hid would be a valuable nobody could
      // ever have
      expect(getItemBand(item)).not.toBeNull();
      expect(isValuable(item)).toBe(true);
    }
    expect(isValuable(Items.Potion)).toBe(false);

    // The ladder climbs, and the band each rung is hidden in climbs
    // with it. It is banded by what a find is worth, so a shell off a
    // beach is a common and a crown out of a ruin stands with the
    // Master Ball
    const bands = ['base', 'uncommon', 'rare', 'prized', 'special'];
    const rung = (item: Items): number => bands.indexOf(getItemBand(item) ?? '');

    expect(getItemBand(Items.TinyMushroom)).toBe('base');
    expect(getItemBand(Items.RelicCopper)).toBe('base');
    expect(getItemBand(Items.RelicSilver)).toBe('uncommon');
    expect(getItemBand(Items.BigNugget)).toBe('rare');
    expect(getItemBand(Items.CometShard)).toBe('prized');
    expect(getItemBand(Items.RelicCrown)).toBe('special');

    // Banded by worth throughout: nothing dear is hidden where
    // something cheap is, whichever pair is compared
    const ladder = [...VALUABLE_SELL].sort(([, one], [, other]) => one - other);

    for (const [at, [item, sell]] of ladder.entries()) {
      for (const [dearer, price] of ladder.slice(at + 1)) {
        if (price > sell) {
          expect(
            rung(item),
            `${getItemData(item).name} vs ${getItemData(dearer).name}`,
          ).toBeLessThanOrEqual(rung(dearer));
        }
      }
    }

    // And the dearest of them is the thinnest slot in the rarest
    // band: a Relic Crown is a story rather than an afternoon's income
    const crown = ITEM_POOL.special.find((entry) => entry.item === Items.RelicCrown);

    expect(crown?.weight).toBe(Math.min(...ITEM_POOL.special.map((entry) => entry.weight)));
    for (const entry of ITEM_POOL.special) {
      expect(getItemData(Items.RelicCrown).sell).toBeGreaterThanOrEqual(
        getItemData(entry.item).sell,
      );
    }
  });

  it('lets the vendor buy anything priced, listing or no listing', () => {
    // What `Marketable` says is that the market **lists** it — that it
    // could be in a crate. What he takes off a player's hands is
    // anything with a price on it, which is the only thing a nugget
    // was ever for
    expect(sellPrice(Items.Nugget)).toBe(getItemData(Items.Nugget).sell);
    expect(sellPrice(Items.Nugget)).toBeGreaterThan(0);
    expect(isMarketable(Items.Nugget)).toBe(false);
    expect(sellPrice(Items.OranBerry)).toBeGreaterThan(0);
    expect(sellPrice(Items.UltraBall)).toBeGreaterThan(0);

    // Zero means he will not take it at all: what these are worth is
    // not gold
    expect(sellPrice(Items.HeartScale)).toBe(0);
    expect(sellPrice(Items.PortalKey)).toBe(0);
    expect(sellPrice(Items.SunStone)).toBe(0);
  });

  it('registers the stones and trade items nothing can spend yet', () => {
    // Every line that asks for one belongs to a generation this game
    // has not registered, so they are named, drawn and priceless
    // rather than stocked or buried
    const latent = [
      Items.SunStone,
      Items.ShinyStone,
      Items.DuskStone,
      Items.DawnStone,
      Items.IceStone,
      Items.KingsRock,
      Items.DragonScale,
      Items.UpGrade,
      Items.DubiousDisc,
      Items.Protector,
      Items.Electirizer,
      Items.Magmarizer,
      Items.ReaperCloth,
      Items.RazorClaw,
      Items.RazorFang,
      Items.PrismScale,
      Items.DeepSeaTooth,
      Items.DeepSeaScale,
      Items.Sachet,
      Items.WhippedDream,
    ];

    for (const item of latent) {
      const data = getItemData(item);

      // Spent on a pokemon, the way the five Kanto stones are
      expect(data.type).toBe(ItemTypes.Evolution);
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      // Nothing stocks one, nothing buys one back, and the ground
      // hides none of them
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBe(0);
      expect(getItemBand(item)).toBeNull();
    }
    expect(new Set(getVendorGoods().map((item) => item)).size).toBeGreaterThan(0);
    for (const item of latent) {
      expect(new Set(getVendorGoods()).has(item)).toBe(false);
    }

    // A trade item is used on the pokemon rather than held by it: the
    // mainline reads one during the trade, and here the trade is a
    // condition the record answers on its own
    expect(getItemData(Items.DragonScale).flags & ItemFlags.Holdable).toBe(0);
    expect(getItemData(Items.DragonScale).flags & ItemFlags.Usable).not.toBe(0);

    // The King's Rock is the exception, and is both: the evolution it
    // gates is still out of reach, but what it does in a fight — a
    // chance of leaving whoever was hit reeling — works today
    expect(getItemData(Items.KingsRock).flags & ItemFlags.Holdable).not.toBe(0);
    expect(getItemData(Items.KingsRock).flags & ItemFlags.Usable).not.toBe(0);

    // Metal Coat is not duplicated: the Steel booster already
    // registered is the id an evolution will read
    expect(getItemData(Items.MetalCoat).type).toBe(ItemTypes.Held);
  });

  it('spends a portal key on the crossing', () => {
    const key = getItemData(Items.PortalKey);

    expect(key.name).toBe('Portal Key');
    expect(key.type).toBe(ItemTypes.KeyItem);
    // Used at a portal, and gone when it opens
    expect(key.flags & ItemFlags.Usable).not.toBe(0);
    expect(key.flags & ItemFlags.Consumable).not.toBe(0);
    // Nothing holds one into a fight, and nothing sells one
    expect(key.flags & ItemFlags.Holdable).toBe(0);
    expect(key.flags & ItemFlags.Marketable).toBe(0);
    expect(key.buy).toBe(0);
    expect(key.sell).toBe(0);
    expect(isPortalKey(Items.PortalKey)).toBe(true);
    expect(isPortalKey(Items.OldSeaMap)).toBe(false);

    // A portal is a landmark like any other, and the prized band is
    // the only place its key is found: rarer than a stone, commoner
    // than the things there is one of in the world
    expect(new Set(LANDMARKS).has(Landmark.Portal)).toBe(true);
    expect(LANDMARK_NAMES[Landmark.Portal]).toBe('Portal');
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.PortalKey)).toBe(true);
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.PortalKey)).toBe(false);
    }
  });

  it('keeps the raid items to the special band and out of the market', () => {
    const relic = getItemData(Items.OldSeaMap);

    expect(relic.name).toBe('Old Sea Map');
    expect(relic.type).toBe(ItemTypes.KeyItem);
    // Used to call a mythical, and spent in the calling
    expect(relic.flags & ItemFlags.Usable).not.toBe(0);
    expect(relic.flags & ItemFlags.Consumable).not.toBe(0);
    // Nobody buys or sells one: found in the pool or not at all
    expect(relic.flags & ItemFlags.Marketable).toBe(0);
    expect(relic.buy).toBe(0);
    expect(relic.sell).toBe(0);

    for (const [item, species] of RAID_ITEMS) {
      // Every relic names a mythical, and only the special band
      // carries it
      expect(getRaidSpecies(item)).toBe(species);
      expect(isMythicalSpecies(species)).toBe(true);
      expect(ITEM_POOL.special.some((entry) => entry.item === item)).toBe(true);
      for (const band of ['base', 'uncommon', 'rare'] as const) {
        expect(ITEM_POOL[band].some((entry) => entry.item === item)).toBe(false);
      }
    }

    // A relic that named a legendary would call nothing: the world
    // stages those itself
    expect(getRaidSpecies(Items.MasterBall)).toBeNull();
  });

  it('registers every berry as a held, consumable berry', () => {
    // A berry the tables know about but the registry does not would
    // show in the bag as its own id
    const berries = [
      ...BERRY_STATUS_CURES.keys(),
      ...BERRY_RESIST_TYPES.keys(),
      ...BERRY_PINCH_STAGES.keys(),
      ...BERRY_NATURE_HEALS.keys(),
      ...BERRY_BRACE_STAGES.keys(),
      ...PINCH_BERRIES,
      Items.LeppaBerry,
      Items.OranBerry,
      Items.SitrusBerry,
      Items.EnigmaBerry,
      Items.JabocaBerry,
      Items.RowapBerry,
    ];

    for (const item of berries) {
      const data = getItemData(item);

      expect(isBerry(item)).toBe(true);
      expect(data.type).toBe(ItemTypes.Berry);
      expect(data.name.endsWith('Berry')).toBe(true);
      // Held to trigger on its own, and gone once it has
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      // Found in a patch, never stocked
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
    }
  });

  it('answers every attacking type with one resist berry', () => {
    const answered = [...BERRY_RESIST_TYPES.values()];

    // One berry per type and no type twice, Stellar aside — nothing
    // in this game throws a Stellar move
    expect(new Set(answered).size).toBe(answered.length);
    expect(answered.length).toBe(18);
    expect(new Set(answered).has(Types.Normal)).toBe(true);
  });

  it('grows every berry in a patch somewhere', () => {
    const grown = new Set(
      [...BERRY_POOL.base, ...BERRY_POOL.uncommon, ...BERRY_POOL.rare, ...BERRY_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    // A berry nothing grows is a berry nobody can ever hold: they are
    // not stocked, dropped or given
    for (const item of [
      ...BERRY_STATUS_CURES.keys(),
      ...BERRY_RESIST_TYPES.keys(),
      ...BERRY_PINCH_STAGES.keys(),
      ...BERRY_NATURE_HEALS.keys(),
      ...BERRY_BRACE_STAGES.keys(),
      ...PINCH_BERRIES,
      Items.LeppaBerry,
      Items.OranBerry,
      Items.SitrusBerry,
      Items.EnigmaBerry,
      Items.JabocaBerry,
      Items.RowapBerry,
    ]) {
      expect(grown.has(item)).toBe(true);
    }
  });

  it('registers one wing per stat, and puts them where they can be found', () => {
    const stats = [...WING_STATS.values()];

    expect(new Set(stats).size).toBe(stats.length);
    expect(stats.length).toBe(STAT_ORDER.length);

    const pooled = new Set(
      [...ITEM_POOL.base, ...ITEM_POOL.uncommon, ...ITEM_POOL.rare, ...ITEM_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    for (const item of WING_STATS.keys()) {
      const data = getItemData(item);

      expect(isWing(item)).toBe(true);
      expect(data.type).toBe(ItemTypes.Training);
      expect(data.name.endsWith('Wing')).toBe(true);
      // Spent on a pokemon, and gone once it is
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      // Found on the wind rather than stocked
      expect(data.buy).toBe(0);
      expect(pooled.has(item)).toBe(true);
    }
  });

  it('grows one bitter berry per stat', () => {
    const stats = [...BERRY_EFFORT_DROPS.values()];

    expect(new Set(stats).size).toBe(stats.length);
    expect(stats.length).toBe(STAT_ORDER.length);

    for (const item of BERRY_EFFORT_DROPS.keys()) {
      expect(isBerry(item)).toBe(true);
      expect(getItemData(item).type).toBe(ItemTypes.Berry);
    }
  });

  it('names every kind of item exactly once, in one order', () => {
    // The bag can be narrowed to one kind, and a kind with no name is
    // a shelf the filter cannot offer
    const named = Object.keys(ITEM_TYPE_NAMES).map(Number);

    expect([...ITEM_TYPE_ORDER].sort((left, right) => left - right)).toEqual(
      named.sort((left, right) => left - right),
    );
    expect(new Set(ITEM_TYPE_ORDER).size).toBe(ITEM_TYPE_ORDER.length);

    for (const type of ITEM_TYPE_ORDER) {
      expect(ITEM_TYPE_NAMES[type].length).toBeGreaterThan(0);
    }
  });

  it('registers the Shiny Charm as a holdable key item', () => {
    const charm = getItemData(Items.ShinyCharm);

    expect(charm.name).toBe('Shiny Charm');
    expect(charm.type).toBe(ItemTypes.KeyItem);

    // A buddy holds it; nothing ever consumes it
    expect(charm.flags & ItemFlags.Holdable).not.toBe(0);
    expect(charm.flags & ItemFlags.Consumable).toBe(0);
  });
});

describe('item icons', () => {
  /**
   * The shipped sheets, read once and asked about by every item.
   *
   * They are read off disk rather than mocked because the whole point
   * of the test is that the two halves agree: an item names a picture
   * in `src/data/items`, and the picture either exists under
   * `public/sprites/ui/items` or it does not. Several families derive
   * the name from the item's own — a berry from its name, a machine
   * from its move's type — so a new berry or a new type is exactly
   * the sort of thing that would name a picture nobody drew
   */
  const sheets = new Map<string, Set<string>>();

  function pictures(sheet: string): Set<string> {
    const known = sheets.get(sheet);

    if (known != null) {
      return known;
    }

    let names: Set<string>;

    try {
      const data = asBasicSpriteData(
        JSON.parse(readFileSync(`public/sprites/ui/items/${sheet}/data.json`, 'utf8')),
      );

      names = new Set(data.images.map((image) => image.name.replace(/\.png$/, '')));
    } catch {
      // A sheet that is not there answers as an empty one, so the
      // failure below names the item rather than throwing out of the
      // whole test
      names = new Set();
    }
    sheets.set(sheet, names);
    return names;
  }

  it('gives every registered item a picture that exists', () => {
    const items = ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type));

    expect(items.length).toBeGreaterThan(100);

    for (const item of items) {
      const data = getItemData(item);
      const cut = data.icon.lastIndexOf('/');

      expect(cut, `${data.name} names no sheet`).toBeGreaterThan(0);
      expect(
        pictures(data.icon.slice(0, cut)).has(data.icon.slice(cut + 1)),
        `${data.name} wants ${data.icon}, which is not on the sheet`,
      ).toBe(true);
    }
  });

  it('draws no two items with the same picture', () => {
    const drawn = new Map<string, string>();

    for (const item of ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type))) {
      // The machines are the deliberate exception: a TM is drawn by
      // the type of the move it teaches, so every Normal-type machine
      // is the same picture on purpose and the name on it is the news
      if (isMachineItem(item)) {
        continue;
      }

      const data = getItemData(item);
      const first = drawn.get(data.icon);

      // The bag is a tray of pictures with the name on a card nobody
      // is reading while they scan it, so two items sharing one
      // picture are one item as far as a player can tell. Several
      // items have no art of their own and borrow — that is fine, so
      // long as each borrows something different
      expect(first, `${data.name} is drawn as ${first ?? ''} is: ${data.icon}`).toBeUndefined();
      drawn.set(data.icon, data.name);
    }
  });

  it('has every registered item say what it does', () => {
    const items = ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type));

    for (const item of items) {
      const data = getItemData(item);

      // A blank line is what a table-driven description falls back to
      // when nothing describes the item, so it is the failure worth
      // catching rather than a missing field
      expect(data.description, `${data.name} says nothing about itself`).not.toBe('');
      expect(data.description.endsWith('.'), `${data.name} does not end its line`).toBe(true);
    }
  });

  it('draws a machine in the colours of the move it teaches', () => {
    // The machines are generated rather than written out, so their
    // pictures are too: one per type, and a move of a type nothing
    // has drawn would be a machine with no picture
    for (const move of getTeachableMoves()) {
      expect(getItemData(getMachineItem(move)).icon).toBe(
        `tm/${TYPE_NAMES[getMoveData(move).type].toLowerCase()}`,
      );
    }
  });
});

describe('type-enhancing items', () => {
  it('gives every attacking type one booster', () => {
    const boosted = [...TYPE_BOOSTERS.values()];

    // One item per type, and no type twice
    expect(new Set(boosted).size).toBe(boosted.length);
    // Every type a move can be, except the two that never attack
    for (let type = Types.Normal; type <= Types.Fairy; type++) {
      expect(new Set(boosted).has(type)).toBe(true);
    }
  });

  it('holds them rather than using them, and stocks them', () => {
    for (const item of TYPE_BOOSTERS.keys()) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Nothing consumes one: a Charcoal burns as long as it is held
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      // Bought, not found
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(TYPE_BOOSTER_PRICE);
      expect(data.sell).toBeLessThan(data.buy);
    }

    // They are stocked, never hidden in the ground
    const pooled = new Set(
      [...ITEM_POOL.base, ...ITEM_POOL.uncommon, ...ITEM_POOL.rare, ...ITEM_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    for (const item of TYPE_BOOSTERS.keys()) {
      expect(pooled.has(item)).toBe(false);
    }
  });

  it('gives every attacking type a gem, spent on the hit it lifts', () => {
    // One per attacking type, the same coverage the plain boosters
    // have — the two are the permanent and the one-shot of the same
    // idea
    expect(new Set(GEMS.values()).size).toBe(new Set(TYPE_BOOSTERS.values()).size);

    for (const [item, type] of GEMS) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // The one type item that is spent using it
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.buy).toBe(GEM_PRICE);
      // Cheaper than the booster it out-hits, because it only has the
      // one hit in it
      expect(data.buy).toBeLessThan(TYPE_BOOSTER_PRICE);
      expect(new Set(TYPE_BOOSTERS.values()).has(type)).toBe(true);
    }
  });

  it('buries a plate for every type but Normal', () => {
    const covered = new Set(PLATES.values());

    // Every attacking type has one except Normal, which the tablets
    // never had
    expect(covered.size).toBe(new Set(TYPE_BOOSTERS.values()).size - 1);
    expect(covered.has(Types.Normal)).toBe(false);

    for (const [item, type] of PLATES) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Held for as long as it is carried, and never spent
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      // Dug up rather than bought: no listing, only what a shop will
      // pay to take one off a player's hands
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBe(PLATE_RESALE);
      // Found in the ground, at a thin slot each
      expect(ITEM_POOL.rare.some((entry) => entry.item === item)).toBe(true);
      expect(new Set(TYPE_BOOSTERS.values()).has(type)).toBe(true);
    }

    // Seventeen thin slots together weigh about what one stone does
    const plated = ITEM_POOL.rare
      .filter((entry) => PLATES.has(entry.item))
      .reduce((total, entry) => total + entry.weight, 0);

    expect(plated).toBeLessThanOrEqual(20);
  });

  it('registers the orbs as held costs rather than consumables', () => {
    for (const [item, [name]] of ORBS) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // An orb is never spent: it keeps costing its holder, which is
      // the point of it
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.buy).toBe(ORB_PRICE);
    }
  });

  it('registers every incense as a held, stocked smoke', () => {
    const pooled = new Set(
      [...ITEM_POOL.base, ...ITEM_POOL.uncommon, ...ITEM_POOL.rare, ...ITEM_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    for (const item of INCENSES) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // An incense burns for as long as it is carried
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      // Bought, and cheaper than the plain item it stands beside
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(INCENSE_PRICE);
      expect(data.buy).toBeLessThan(TYPE_BOOSTER_PRICE);
      expect(pooled.has(item)).toBe(false);
    }

    // Five of them lift a type, and two of those lift the same one:
    // the sea and the waves are the same water
    expect(INCENSE_TYPES.get(Items.SeaIncense)).toBe(Types.Water);
    expect(INCENSE_TYPES.get(Items.WaveIncense)).toBe(Types.Water);
    expect(INCENSE_TYPES.get(Items.OddIncense)).toBe(Types.Psychic);

    // The type ones stand apart from the plain boosters, which are
    // still one per attacking type
    for (const item of INCENSE_TYPES.keys()) {
      expect(TYPE_BOOSTERS.has(item)).toBe(false);
    }
  });

  it('stocks the general stat items and hides the relics', () => {
    const pooled = new Set(
      [...ITEM_POOL.base, ...ITEM_POOL.uncommon, ...ITEM_POOL.rare, ...ITEM_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    for (const item of GENERAL_STAT_BOOSTERS.keys()) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Held for as long as it is carried: nothing spends one
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      // Bought, and dear: each is worth half of a stat
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(STAT_BOOSTER_PRICE);
      expect(pooled.has(item)).toBe(false);
    }

    for (const item of RELIC_STAT_BOOSTERS.keys()) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Found rather than stocked: no listing, only a resale price
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
      expect(ITEM_POOL.rare.some((entry) => entry.item === item)).toBe(true);
    }
  });

  it('lists the gear the market carries and hides the rest of it', () => {
    const pooled = new Set(
      [...ITEM_POOL.base, ...ITEM_POOL.uncommon, ...ITEM_POOL.rare, ...ITEM_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    for (const [item, [name]] of MARKET_GEAR) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Gear works for as long as it is carried: nothing spends it
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(GEAR_PRICE);
      expect(isGear(item)).toBe(true);
      expect(pooled.has(item)).toBe(false);
    }

    for (const [item] of FOUND_GEAR) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Found rather than stocked: no listing, only a resale price
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
      expect(isGear(item)).toBe(true);
      expect(pooled.has(item)).toBe(true);
    }

    // The sludge is litter and the two lenses are species relics, so
    // the ground hides them where it hides their own kind
    expect(ITEM_POOL.base.some((entry) => entry.item === Items.BlackSludge)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.LuckyPunch)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.Stick)).toBe(true);
  });

  it('spends a one-shot the way it spends a berry', () => {
    for (const [item, [name]] of ONE_SHOTS) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // The whole difference between these and the gear
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.buy).toBe(ONE_SHOT_PRICE);
      expect(isOneShot(item)).toBe(true);
      expect(isGear(item)).toBe(false);
    }

    // A one-shot is worth less than the gear it sits beside, because
    // a fight where its moment never comes is a fight it sat out
    expect(ONE_SHOT_PRICE).toBeLessThan(GEAR_PRICE);
  });

  it('sells the trinkets at what an incense costs, and never spends one', () => {
    const pooled = new Set(
      [
        ...ITEM_POOL.base,
        ...ITEM_POOL.uncommon,
        ...ITEM_POOL.rare,
        ...ITEM_POOL.prized,
        ...ITEM_POOL.special,
      ].map((entry) => entry.item),
    );

    for (const [item, [name]] of TRINKETS) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Nothing about them is spent: a trinket works for as long as
      // it is carried, like the incense it stands beside
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(isTrinket(item)).toBe(true);
      expect(isGear(item)).toBe(false);
      expect(isOneShot(item)).toBe(false);
    }

    for (const [item] of MARKET_TRINKETS) {
      const data = getItemData(item);

      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(TRINKET_PRICE);
      expect(pooled.has(item)).toBe(false);
    }

    // The two nobody sells are the two the ground hides
    for (const [item] of FOUND_TRINKETS) {
      const data = getItemData(item);

      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
      expect(pooled.has(item)).toBe(true);
    }

    // The listed one is an incense by another name, and is priced as
    // one
    expect(TRINKET_PRICE).toBe(INCENSE_PRICE);
    // The coin pays more than the incense it stands against, which is
    // what being unbuyable is worth
    expect(AMULET_COIN_BONUS).toBeGreaterThan(LUCK_INCENSE_BONUS);
  });

  it('carries the battle items rather than throwing them in', () => {
    for (const item of BATTLE_ITEMS) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Spent the moment they answer something, like a one-shot
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(BATTLE_ITEM_PRICE);
      expect(isBattleItem(item)).toBe(true);
      expect(isOneShot(item)).toBe(false);
    }

    // Cheaper than a one-shot, because each answers one thing only
    expect(BATTLE_ITEM_PRICE).toBeLessThan(ONE_SHOT_PRICE);
    expect(isBattleItem(Items.Leftovers)).toBe(false);
  });

  it('bottles the drinks as held rather than as medicine', () => {
    for (const [item, drink] of DRINKS) {
      const data = getItemData(item);

      expect(data.name).toBe(drink.name);
      // Held, unlike everything else that gives health back over a
      // counter: a potion cannot be carried into a fight
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      expect(isDrink(item)).toBe(true);
      expect(drink.restore).toBeGreaterThan(0);
    }

    // The four a machine sells are listed; the juice is squeezed
    expect(getItemData(Items.Lemonade).buy).toBeGreaterThan(0);
    expect(getItemData(Items.BerryJuice).buy).toBe(0);
    expect(getItemData(Items.BerryJuice).flags & ItemFlags.Marketable).toBe(0);
    expect(getItemData(Items.BerryJuice).sell).toBeGreaterThan(0);

    // A drink pays for being carried: the cheapest bottle gives back
    // more than a Potion does and costs less, and what it charges for
    // instead is the held slot it takes up
    const water = DRINKS.get(Items.FreshWater);

    expect(getItemData(Items.FreshWater).buy).toBeLessThan(getItemData(Items.Potion).buy);
    expect(water?.restore).toBeGreaterThan(MEDICINES.get(Items.Potion)?.restore ?? 0);
  });

  it('hides the Sacred Ash rather than selling it', () => {
    const data = getItemData(Items.SacredAsh);
    const prized = new Set(ITEM_POOL.prized.map((entry) => entry.item));

    expect(isSacredAsh(Items.SacredAsh)).toBe(true);
    expect(data.type).toBe(ItemTypes.Held);
    expect(data.flags & ItemFlags.Holdable).not.toBe(0);
    expect(data.flags & ItemFlags.Consumable).not.toBe(0);
    // Nobody stocks one; a vendor will only take it off your hands
    expect(data.flags & ItemFlags.Marketable).toBe(0);
    expect(data.buy).toBe(0);
    expect(data.sell).toBeGreaterThan(0);

    // A second chance for a whole party, and one nothing else offers
    expect(prized.has(Items.SacredAsh)).toBe(true);
    expect(isPreciousItem(Items.SacredAsh)).toBe(true);
  });

  it('makes the Heart Scale worth nothing but a forgotten move', () => {
    const scale = getItemData(Items.HeartScale);

    expect(isHeartScale(Items.HeartScale)).toBe(true);
    expect(isHeartScale(Items.Nugget)).toBe(false);
    expect(scale.name).toBe('Heart Scale');
    expect(scale.flags & ItemFlags.Consumable).not.toBe(0);
    // Neither side of a vendor's counter takes one: it cannot be
    // bought, and it cannot be turned back into gold. That is what
    // keeps the reminder paced by walking rather than by a purse
    expect(scale.flags & ItemFlags.Marketable).toBe(0);
    expect(isMarketable(Items.HeartScale)).toBe(false);
    expect(scale.buy).toBe(0);
    expect(scale.sell).toBe(0);
    // So the only way to one is the ground
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.HeartScale)).toBe(true);
  });
});

describe('wandering NPCs', () => {
  it('names everyone who wanders', () => {
    expect(new Set(NPCS).size).toBe(NPCS.length);
    for (const npc of NPCS) {
      expect(NPC_NAMES[npc].length).toBeGreaterThan(0);
    }
    expect(new Set(NPCS).has(Npc.MoveReminder)).toBe(true);
    // The one wanderer whose price is not gold
    expect(REMINDER_FEE).toBe(Items.HeartScale);
  });

  it('offers a level its own moves and no others', () => {
    // What a pokemon has just grown into is the entry for that level
    // exactly, in the order the entry lists it
    expect(getMovesLearnedAt(Species.Bulbasaur, 1)).toEqual([Moves.Tackle, Moves.Growl]);
    expect(getMovesLearnedAt(Species.Bulbasaur, 13)).toEqual([Moves.VineWhip]);
    // A level with nothing on it offers nothing — and the level below
    // one is not the level, which is what keeps growing up from being
    // a free Move Reminder
    expect(getMovesLearnedAt(Species.Bulbasaur, 12)).toEqual([]);

    // Every level's own moves are part of what it has learned by then
    for (const level of [1, 7, 13, 20, 27]) {
      const learned = new Set(getLevelUpMoves(Species.Bulbasaur, level));

      for (const move of getMovesLearnedAt(Species.Bulbasaur, level)) {
        expect(learned.has(move)).toBe(true);
      }
    }
  });

  it('gives back the level-up moves a pokemon has lost and nothing else', () => {
    // Everything Bulbasaur has learned by 27, in the order it learned
    // them — the whole list rather than the four it would be carrying
    expect(getLevelUpMoves(Species.Bulbasaur, 27)).toEqual([
      Moves.Tackle,
      Moves.Growl,
      Moves.LeechSeed,
      Moves.VineWhip,
      Moves.PoisonPowder,
      Moves.RazorLeaf,
    ]);
    // Nothing it has not reached yet
    expect(new Set(getLevelUpMoves(Species.Bulbasaur, 27)).has(Moves.Growth)).toBe(false);
    expect(getLevelUpMoves(Species.Bulbasaur, 6)).toEqual([Moves.Tackle, Moves.Growl]);

    // What the reminder can put back is that list minus what it still
    // knows: the four it is carrying are not offered back to it
    const carrying = [Moves.VineWhip, Moves.PoisonPowder, Moves.RazorLeaf, Moves.Growth];

    expect(getRecallableMoves(Species.Bulbasaur, 34, carrying)).toEqual([
      Moves.Tackle,
      Moves.Growl,
      Moves.LeechSeed,
    ]);
    // A pokemon that never dropped anything has nothing to remember
    expect(getRecallableMoves(Species.Bulbasaur, 6, [Moves.Tackle, Moves.Growl])).toEqual([]);
    // And a machine move it forgot stays forgotten: he only ever gives
    // back what levelling gave it
    expect(new Set(getRecallableMoves(Species.Bulbasaur, 48, carrying)).has(Moves.PetalDance)).toBe(
      false,
    );
  });
});

describe('biome data', () => {
  it('classifies climate samples into the nearest biome', () => {
    // Exact target points
    expect(getBiome(-0.9, 0.9, 0.2)).toBe(Biome.Desert);
    expect(getBiome(1, -0.2, -0.8)).toBe(Biome.DeepOcean);
    expect(getBiome(0.9, 0.9, 0.2)).toBe(Biome.TropicalRainforest);
    expect(getBiome(0.2, -0.9, 0.9)).toBe(Biome.Glacier);

    // Off-target samples resolve to the nearest neighbor
    expect(getBiome(-1, 1, 0.1)).toBe(Biome.Desert);
    expect(getBiome(0, -0.7, 0.35)).toBe(Biome.Tundra);
  });

  it('lets elevation decide before anything else does', () => {
    // Below sea level is water whatever the other two axes say: a dry,
    // freezing trench is still a trench
    for (let humidity = -1; humidity <= 1; humidity += 0.25) {
      for (let temperature = -1; temperature <= 1; temperature += 0.25) {
        expect(
          isWaterBiome(getBiome(humidity, temperature, -0.6)),
          `h=${humidity} t=${temperature} is not water`,
        ).toBe(true);
      }
    }
  });

  it('puts the hot and the high together on a volcano', () => {
    expect(getBiome(-0.4, 0.9, 0.8)).toBe(Biome.Volcano);
    // Cold peaks are somebody else's
    expect(getBiome(-0.4, -0.6, 0.85)).toBe(Biome.AlpineTundra);
    // And so is hot ground
    expect(getBiome(-0.9, 0.9, 0.2)).toBe(Biome.Desert);
  });

  it('assigns habitat biomes to species', () => {
    expect(getSpeciesData(Species.Sandshrew).biomes).toEqual([Biome.Desert]);
    expect(getSpeciesData(Species.Lapras).biomes).toEqual([
      Biome.Ocean,
      Biome.DeepOcean,
      Biome.PolarOcean,
    ]);
    expect(getSpeciesData(Species.Articuno).biomes).toContain(Biome.Glacier);

    // Evolution can move a species to new waters
    expect(getSpeciesData(Species.Magikarp).biomes).toContain(Biome.Swamp);
    expect(getSpeciesData(Species.Gyarados).biomes).not.toContain(Biome.Swamp);

    // The gap-filler biomes all have residents
    expect(getSpeciesData(Species.Eevee).biomes).toContain(Biome.Woodland);
    expect(getSpeciesData(Species.Tauros).biomes).toContain(Biome.Steppe);
    expect(getSpeciesData(Species.Paras).biomes).toContain(Biome.MontaneForest);
    expect(getSpeciesData(Species.Seel).biomes).toContain(Biome.PolarOcean);
  });

  it('assigns day-cycle preferences to species', () => {
    // Cave dwellers wake at dusk and avoid daylight entirely
    expect(getSpeciesData(Species.Zubat).activeTimes).toBe(TimeOfDay.Evening | TimeOfDay.Night);
    expect(getSpeciesData(Species.Zubat).activeTimes & TimeOfDay.Day).toBe(0);

    // Crepuscular species span evening into night
    expect(getSpeciesData(Species.Oddish).activeTimes).toBe(TimeOfDay.Evening | TimeOfDay.Night);

    // Diurnal fliers wake with the sun
    expect(getSpeciesData(Species.Pidgey).activeTimes).toBe(TimeOfDay.Morning | TimeOfDay.Day);

    // Time-agnostic species cover the full cycle
    expect(getSpeciesData(Species.Magikarp).activeTimes).toBe(AnyTimeOfDay);
  });

  it('classifies spawn rarity tiers', () => {
    // Unevolved, can still evolve
    expect(getSpawnRarity(Species.Pidgey)).toBe(SpawnRarity.Base);
    expect(getSpawnRarity(Species.Omanyte)).toBe(SpawnRarity.Base);

    // Middle evolutions
    expect(getSpawnRarity(Species.Ivysaur)).toBe(SpawnRarity.Uncommon);
    expect(getSpawnRarity(Species.Haunter)).toBe(SpawnRarity.Uncommon);

    // Fully evolved and single-line
    expect(getSpawnRarity(Species.Pidgeot)).toBe(SpawnRarity.Rare);
    expect(getSpawnRarity(Species.Ditto)).toBe(SpawnRarity.Rare);

    // One-per-world class
    expect(getSpawnRarity(Species.Mew)).toBe(SpawnRarity.Special);

    // The prized band is between the two, and Gen 1 puts nothing in
    // it: the babies and the unowns are a later gen's, and nothing
    // about the shape of a Gen 1 line reads as either
    expect(SpawnRarity.Prized).toBeGreaterThan(SpawnRarity.Rare);
    expect(SpawnRarity.Prized).toBeLessThan(SpawnRarity.Special);
    for (const species of getRegisteredSpecies()) {
      expect(isPrizedSpecies(species)).toBe(false);
      expect(getSpawnRarity(species)).not.toBe(SpawnRarity.Prized);
    }
  });

  it('rolls a spawn through the rarity bands, prized band included', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const groups = {
      base: [{ species: Species.Pidgey, weight: 10 }],
      uncommon: [{ species: Species.Ivysaur, weight: 10 }],
      rare: [{ species: Species.Ditto, weight: 10 }],
      prized: [{ species: Species.Eevee, weight: 10 }],
      special: [{ species: Species.Mew, weight: 10 }],
    };

    // Richest first, each slice as wide as its own odds: special owns
    // the opening 1/4096, prized the 1/512 after it, then rare, then
    // uncommon, and whatever is left falls to base
    expect(pickSpawn(groups, rolls([0]))).toBe(Species.Mew);
    expect(pickSpawn(groups, rolls([1 / 1024, 0]))).toBe(Species.Eevee);
    expect(pickSpawn(groups, rolls([1 / 128, 0]))).toBe(Species.Ditto);
    expect(pickSpawn(groups, rolls([1 / 16, 0]))).toBe(Species.Ivysaur);
    expect(pickSpawn(groups, rolls([0.9, 0]))).toBe(Species.Pidgey);

    // A pool that leaves the band out is every pool in the game
    // today, and its rares are rolled exactly as they were: the
    // prized slice falls to the band below rather than to base
    const { prized, ...without } = groups;

    expect(prized).toHaveLength(1);
    expect(pickSpawn(without, rolls([1 / 1024, 0]))).toBe(Species.Ditto);
    expect(pickSpawn(without, rolls([1 / 128, 0]))).toBe(Species.Ditto);
    expect(pickSpawn(without, rolls([0.9, 0]))).toBe(Species.Pidgey);
  });

  it('groups biome spawn pools by time of day and rarity', () => {
    const morning = getSpawnPool(Biome.Grassland, TimeOfDay.Morning);
    expect(morning.base).toContainEqual({ species: Species.Pidgey, weight: 30 });

    // Sections agree with the rarity classification
    expect(morning.rare.every((entry) => getSpawnRarity(entry.species) === SpawnRarity.Rare)).toBe(
      true,
    );

    // Diurnal fliers sleep through the night; prowlers come out
    const night = getSpawnPool(Biome.Grassland, TimeOfDay.Night);
    expect(night.base.some((entry) => entry.species === Species.Pidgey)).toBe(false);
    expect(night.base.some((entry) => entry.species === Species.Meowth)).toBe(true);

    // Legendaries sit in their own section
    const peak = getSpawnPool(Biome.Mountain, TimeOfDay.Night);
    expect(peak.special.some((entry) => entry.species === Species.Zapdos)).toBe(true);
  });

  it('knows which finds are worth stopping a player over', () => {
    // The band an item is hidden in is what decides whether spending
    // it is asked about twice
    expect(getItemBand(Items.MasterBall)).toBe('special');
    expect(getItemBand(Items.BottleCap)).toBe('prized');
    expect(getItemBand(Items.FireStone)).toBe('rare');
    expect(getItemBand(Items.HeartScale)).toBe('uncommon');
    expect(getItemBand(Items.Potion)).toBe('base');
    // Nothing hides a machine or a berry off a bush
    expect(getItemBand(getMachineItem(Moves.Tackle))).toBeNull();
    expect(getItemBand(Items.OranBerry)).toBeNull();

    // What changes a pokemon for good, or cannot be come by again
    for (const item of [
      Items.GoldenBottleCap,
      Items.MasterBall,
      Items.BottleCap,
      Items.PurifyingGem,
      Items.MaxRevive,
    ]) {
      expect(isPreciousItem(item)).toBe(true);
    }
    // Scarcity alone is not the test: a Full Restore is a rare dig and
    // still only a fight's worth of healing, so it is not asked about
    for (const item of [
      Items.FullRestore,
      Items.MaxPotion,
      Items.Revive,
      Items.Potion,
      Items.Antidote,
      Items.HealthWing,
      Items.PomegBerry,
    ]) {
      expect(isPreciousItem(item)).toBe(false);
    }

    // Every band listing agrees with the pool it was built from
    for (const band of ['base', 'uncommon', 'rare', 'prized', 'special'] as const) {
      for (const entry of ITEM_POOL[band]) {
        expect(getItemBand(entry.item)).toBe(band);
      }
    }
  });

  it('rolls the item pool through the rarity bands', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // Band thresholds mirror the spawn pool's; the special tier now
    // holds the Shiny Charm and the strongest machines alongside the
    // Master Ball, so the within-band draw is taken by weight
    const specialTotal = ITEM_POOL.special.reduce((total, entry) => total + entry.weight, 0);

    expect(pickItem(ITEM_POOL, rolls([0, 0]))).toBe(Items.MasterBall);
    expect(pickItem(ITEM_POOL, rolls([0, 10.5 / specialTotal]))).toBe(Items.ShinyCharm);
    expect(pickItem(ITEM_POOL, rolls([0.01, 0]))).toBe(Items.FireStone);
    expect(pickItem(ITEM_POOL, rolls([0.05, 0]))).toBe(Items.UltraBall);
    expect(pickItem(ITEM_POOL, rolls([0.5, 0]))).toBe(Items.PokeBall);

    // Custom bands replace the defaults: bands summing to 1 shut the
    // base tier out, so even a terrible band roll stays uncommon
    expect(
      pickItem(ITEM_POOL, rolls([0.99, 0]), {
        special: 1 / 64,
        prized: 0,
        rare: 1 / 8,
        uncommon: 1,
      }),
    ).toBe(Items.UltraBall);
  });

  it('digs a stash of several kinds rather than one item', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const inBand = (band: ItemPoolEntry[], item: Items): boolean =>
      band.some((entry) => entry.item === item);

    // The draws land in order: the ceiling, how many kinds, then per
    // kind its band (all but the first, which is the ceiling's), the
    // kind itself, and how many pieces of it
    expect(pickItems(ITEM_POOL, rolls([0.5, 0, 0, 0]))).toEqual([
      { item: Items.PokeBall, amount: 1 },
    ]);

    // Up to MAX_STACK pieces of each, off a draw of their own
    expect(pickItems(ITEM_POOL, rolls([0.5, 0, 0, 0.999]))).toEqual([
      { item: Items.PokeBall, amount: MAX_STACK },
    ]);

    // The opening draw is a ceiling rather than a slot: reaching the
    // rare band guarantees one rare kind and leaves a later kind free
    // to be a rare of its own — two of one rarity, which one-of-each
    // could never produce
    const rich = pickItems(ITEM_POOL, rolls([0.01, 0.5, 0, 0, 0.005, 0.5, 0]));

    expect(rich).toHaveLength(2);
    expect(rich[0].item).toBe(Items.FireStone);
    for (const { item } of rich) {
      expect(inBand(ITEM_POOL.rare, item)).toBe(true);
    }

    // A common ceiling stays common however many kinds it holds:
    // nothing in a stash beats what the opening draw reached
    const plain = pickItems(ITEM_POOL, rolls([0.5, 0.99, 0, 0, 0.001, 0.9, 0, 0.001, 0.4, 0]));

    expect(plain.length).toBeGreaterThan(1);
    for (const { item, amount } of plain) {
      expect(inBand(ITEM_POOL.base, item)).toBe(true);
      expect(amount).toBeLessThanOrEqual(MAX_STACK);
    }

    // Two kinds landing on the same item are one stack, and a stack
    // never exceeds MAX_STACK however they merge
    expect(pickItems(ITEM_POOL, rolls([0.5, 0.5, 0, 0.999, 0.5, 0, 0.999]))).toEqual([
      { item: Items.PokeBall, amount: MAX_STACK },
    ]);

    // A special is a ceiling like any other band: one piece of it,
    // and whatever the kind draw asks for buried alongside
    expect(pickItems(ITEM_POOL, rolls([0, 0, 0, 0, 0]))).toEqual([
      { item: Items.MasterBall, amount: 1 },
    ]);

    // Bands summing to 1 shut the base tier out of a stash the same
    // way they shut it out of a single roll
    const grotto = { special: 1 / 64, prized: 0, rare: 1 / 8, uncommon: 1 };
    const dug = pickItems(ITEM_POOL, rolls([0.99, 0.99, 0, 0, 0.001, 0.5, 0, 0.9, 0.5, 0]), grotto);

    expect(dug.length).toBeGreaterThan(0);
    for (const { item } of dug) {
      expect(inBand(ITEM_POOL.uncommon, item)).toBe(true);
    }
  });

  it('buries the combinations a stash is meant to be able to hold', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const inBand = (band: ItemPoolEntry[], item: Items): boolean =>
      band.some((entry) => entry.item === item);

    // Two rares and a common: the ceiling's own kind, a second that
    // rolled the rare band again, and a third that did not
    const pair = pickItems(ITEM_POOL, rolls([0.01, 0.9, 0, 0, 0.005, 0.2, 0, 0.9, 0, 0]));

    expect(pair).toHaveLength(3);
    expect(inBand(ITEM_POOL.rare, pair[0].item)).toBe(true);
    expect(inBand(ITEM_POOL.rare, pair[1].item)).toBe(true);
    expect(inBand(ITEM_POOL.base, pair[2].item)).toBe(true);

    // A special, a prized and a rare: the special is the ceiling, and
    // what follows it is drawn the way anything under a ceiling is —
    // clamped to the band directly below the special, which is the
    // prized one
    const prize = pickItems(ITEM_POOL, rolls([0.0001, 0, 0.9, 0, 0, 0, 0.005, 0.2, 0]));

    expect(prize).toHaveLength(3);
    expect(inBand(ITEM_POOL.special, prize[0].item)).toBe(true);
    expect(prize[0].amount).toBe(1);
    expect(inBand(ITEM_POOL.prized, prize[1].item)).toBe(true);
    expect(inBand(ITEM_POOL.rare, prize[2].item)).toBe(true);

    // A rare and a common
    const modest = pickItems(ITEM_POOL, rolls([0.01, 0.5, 0, 0, 0.9, 0, 0]));

    expect(modest).toHaveLength(2);
    expect(inBand(ITEM_POOL.rare, modest[0].item)).toBe(true);
    expect(inBand(ITEM_POOL.base, modest[1].item)).toBe(true);

    // Never two specials, however the stream falls: only the opening
    // draw reaches that band, and everything after it is clamped to
    // prized at best
    const specials = new Set(ITEM_POOL.special.map((entry) => entry.item));
    // Odds that make the special band an everyday find, so the sweep
    // is actually testing the rule rather than never reaching it
    const generous = { special: 0.5, prized: 0.1, rare: 0.2, uncommon: 0.15 };
    let carried = 0;

    for (let seed = 0; seed < 2000; seed++) {
      for (const odds of [undefined, generous]) {
        const rng = new AleaRNG(`stash-${seed}-${odds == null ? 'usual' : 'generous'}`);
        const stash = pickItems(ITEM_POOL, () => rng.random(), odds);
        const found = stash.filter((stack) => specials.has(stack.item));

        carried += found.length;
        expect(found.length).toBeLessThanOrEqual(1);
        // And a special that is found is one piece of it
        for (const stack of found) {
          expect(stack.amount).toBe(1);
        }
        expect(stash.length).toBeLessThanOrEqual(MAX_KINDS);
        for (const stack of stash) {
          expect(stack.amount).toBeLessThanOrEqual(MAX_STACK);
        }
      }
    }

    // Half the generous rolls open on one, so the sweep saw plenty
    expect(carried).toBeGreaterThan(500);
  });

  it('rolls spawns through the rarity bands', () => {
    const pool = getSpawnPool(Biome.Mountain, TimeOfDay.Night);
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // A sub-1/4096 band roll lands in the special section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0, 0]))!)).toBe(SpawnRarity.Special);

    // A sub-1/64 band roll lands in the rare section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.01, 0]))!)).toBe(SpawnRarity.Rare);

    // A sub-1/8 band roll lands in the uncommon section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.05, 0]))!)).toBe(SpawnRarity.Uncommon);

    // Everything else lands in the base section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.5, 0]))!)).toBe(SpawnRarity.Base);

    // An empty pool cannot roll
    expect(
      pickSpawn({ base: [], uncommon: [], rare: [], special: [] }, rolls([0.5, 0])),
    ).toBeNull();
  });
});
