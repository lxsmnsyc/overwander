import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import AleaRNG from '../../../src/core/alea';
import Abilities from '../../../src/data/ids/abilities';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns from '../../../src/data/biome';
import Biome from '../../../src/data/ids/biome';
import Natures from '../../../src/data/ids/natures';
import { Items } from '../../../src/data/ids/items';
import registerItems from '../../../src/data/items';
import { Genders, Species } from '../../../src/data/ids/species';
import { getSpeciesData, registerSpecies } from '../../../src/data/species';
import { CHUNK_CELLS, worldCell } from '../../../src/overworld/chunk';
import { townAt } from '../../../src/overworld/town';
import { SPAWN_COUNT } from '../../../src/overworld/chunk-snapshot';
import pickStartPosition, { START_AREA, pickFreeCell } from '../../../src/overworld/start';
import type { Encounter } from '../../../src/overworld/encounter/shape';
import { EncounterType, SPECIAL_SPAWN_LEVELS } from '../../../src/overworld/encounter';
import { MAX_CATCH_BONUS, SHADOW_CATCH_FACTOR } from '../../../src/overworld/safari';
import { MAX_LEVEL } from '../../../src/data/constants/levels';
import { DARK_DAY_LAMP_CELLS } from '../../../src/data/overworld/weather';
import {
  KINSHIP_CATCH_BOOST,
  LURE_SPAWN_BONUS,
  TRAP_FLEE_FACTOR,
} from '../../../src/overworld/abilities/__create';
import { PUBLISHED_SPAWNS } from '../../../src/auth/snapshots';
import {
  COMPOUND_EYES_HELD_BOOST,
  FLAME_BODY_FACTOR,
  GLUTTONY_FEAST,
  HONEY_STEP_INTERVAL,
  ILLUMINATE_LAMP_CELLS,
  KEEN_CRITICAL_BOOST,
  LEVEL_CEILING_LIFT,
  LEVEL_FLOOR_LIFT,
  PICKUP_STEP_INTERVAL,
  PURIFIED_SHADOW_RELIEF,
  SNIPER_AIMS,
  STENCH_QUIET,
} from '../../../src/overworld/abilities/gen-1';
import { EGG_HATCH_STEPS } from '../../../src/auth/egg';
import type Overworld from '../../../src/overworld/core';
import type { Buddy } from '../../../src/overworld/core';
import { CANDY_ITEM_BONUS } from '../../../src/overworld/items/candy-items';
import { LUCK_INCENSE_BONUS, PURE_INCENSE_QUIET } from '../../../src/overworld/items/incenses';
import { AMULET_COIN_BONUS, CLEANSE_TAG_QUIET } from '../../../src/overworld/items/trinkets';
import { CATCHING_CHARM_BOOST, SHINY_CHARM_BOOST } from '../../../src/overworld/items/key-items';
import createOverworld from '../../../src/overworld/setup';
import World from '../../../src/overworld/world';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

/**
 * A buddy that has the given abilities and nothing else notable: an
 * Adamant male carrying nothing
 */
function buddyWith(abilities: Abilities[]): Buddy {
  return {
    species: Species.Bulbasaur,
    shiny: false,
    abilities,
    items: [],
    nature: Natures.Adamant,
    gender: Genders.Male,
  };
}

/**
 * A meeting standing in front of the player, for the questions asked
 * of one rather than of the chunk that staged it
 */
function metWild(species: Species, shadow = false): Encounter {
  return {
    type: EncounterType.Wild,
    species,
    level: 10,
    individualValue: 0,
    traitValue: 0,
    ivs: 0,
    nature: Natures.Adamant,
    ability: Abilities.Overgrow,
    gender: Genders.Male,
    lair: null,
    shiny: false,
    shadow,
    moves: [],
    items: [],
    timestamp: 0,
    x: 0,
    y: 0,
    biome: Biome.Grassland,
  };
}

describe('world', () => {
  it('starts a player in a free cell of the starting region', () => {
    const world = new World('overworld');
    const start = pickStartPosition(world, 'player-uid');

    // Somewhere in the 1000x1000 square centered on the origin
    expect(start.chunkX).toBeGreaterThanOrEqual(-START_AREA / 2);
    expect(start.chunkX).toBeLessThan(START_AREA / 2);
    expect(start.chunkY).toBeGreaterThanOrEqual(-START_AREA / 2);
    expect(start.chunkY).toBeLessThan(START_AREA / 2);

    // Never on a fixture: nobody opens the game already standing on a
    // raid, and nobody opens it inside a boulder either
    const chunk = world.getChunk(start.chunkX, start.chunkY);

    expect(chunk.getLandmarkAt(start.cellX, start.cellY)).toBeNull();

    // In a town, so a first step is somewhere with a Pokémon Center and a way out
    for (const uid of ['player-uid', 'other-uid', 'third-uid']) {
      const placed = pickStartPosition(world, uid);

      expect(
        townAt(
          world,
          worldCell(placed.chunkX, placed.cellX),
          worldCell(placed.chunkY, placed.cellY),
        ),
      ).not.toBeNull();
    }
    // The same holds wherever anything is put down without walking
    // there, which is what a teleport is
    for (let at = 0; at < 100; at++) {
      const ground = world.getChunk(at - 50, at * 3);
      const where = pickFreeCell(world, at - 50, at * 3, new AleaRNG(`free-${at}`));
      const cell = where.cellY * CHUNK_CELLS + where.cellX;

      expect(ground.getLandmarkCells().has(cell)).toBe(false);
      expect(ground.getDecorationCells().has(cell)).toBe(false);
      expect(ground.getRockCells().has(cell)).toBe(false);
    }

    // The same player lands in the same place every time, and
    // different players spread out
    expect(pickStartPosition(world, 'player-uid')).toEqual(start);
    expect(pickStartPosition(world, 'other-uid')).not.toEqual(start);
  });

  it('publishes room for the lure as well as the ordinary spawns', () => {
    // What a visit writes has to hold the extras, since the window
    // publishes them for everybody and a lure only decides who may
    // reach them. It is one figure, kept beside the publishing
    expect(PUBLISHED_SPAWNS).toBe(SPAWN_COUNT + LURE_SPAWN_BONUS);
  });

  it('draws two more spawns out for a buddy that lures', () => {
    const alone = createOverworld('player-uid', null);

    expect(alone.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT);
    expect(createOverworld('player-uid', buddyWith([])).checkSpawnCount(SPAWN_COUNT)).toBe(
      SPAWN_COUNT,
    );

    // Each of the three lures is worth the same two
    for (const lure of [Abilities.ArenaTrap, Abilities.Illuminate, Abilities.NoGuard]) {
      expect(createOverworld('player-uid', buddyWith([lure])).checkSpawnCount(SPAWN_COUNT)).toBe(
        SPAWN_COUNT + LURE_SPAWN_BONUS,
      );
    }
  });

  it('reaches further into the dark with an Illuminate buddy', () => {
    const alone = createOverworld('player-uid', null);

    expect(alone.checkLampReach(DARK_DAY_LAMP_CELLS)).toBe(DARK_DAY_LAMP_CELLS);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Synchronize])).checkLampReach(
        DARK_DAY_LAMP_CELLS,
      ),
    ).toBe(DARK_DAY_LAMP_CELLS);

    // The lantern is Illuminate's alone: the other two lures draw more
    // out of a chunk and light none of it
    for (const lure of [Abilities.ArenaTrap, Abilities.NoGuard]) {
      expect(
        createOverworld('player-uid', buddyWith([lure])).checkLampReach(DARK_DAY_LAMP_CELLS),
      ).toBe(DARK_DAY_LAMP_CELLS);
    }
    // A lantern is a reach of its own rather than a multiple of the
    // one it replaces: five cells, whatever a player walking alone
    // sees
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Illuminate])).checkLampReach(
        DARK_DAY_LAMP_CELLS,
      ),
    ).toBeCloseTo(ILLUMINATE_LAMP_CELLS);
  });

  it('keeps a chunk quiet for a buddy that smells', () => {
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Stench])).checkSpawnCount(SPAWN_COUNT),
    ).toBe(SPAWN_COUNT - STENCH_QUIET);

    // A lure and a stink cancel as far as they go, and nothing ever
    // quiets a chunk below nothing
    expect(createOverworld('player-uid', buddyWith([Abilities.Stench])).checkSpawnCount(1)).toBe(0);
  });

  it('lifts the band a meeting rolls in, from either end', () => {
    const band: [number, number] = [10, 20];
    const alone = createOverworld('player-uid', null);

    expect(alone.checkEncounterLevels('spawn@0', band)).toEqual(band);

    // Wary keeps the weak away; fierce draws the strong out; a buddy
    // with one of each does both
    expect(
      createOverworld('player-uid', buddyWith([Abilities.KeenEye])).checkEncounterLevels(
        'spawn@0',
        band,
      ),
    ).toEqual([10 + LEVEL_FLOOR_LIFT, 20]);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Hustle])).checkEncounterLevels(
        'spawn@0',
        band,
      ),
    ).toEqual([10, 20 + LEVEL_CEILING_LIFT]);
    expect(
      createOverworld(
        'player-uid',
        buddyWith([Abilities.Intimidate, Abilities.Pressure]),
      ).checkEncounterLevels('spawn@0', band),
    ).toEqual([10 + LEVEL_FLOOR_LIFT, 20 + LEVEL_CEILING_LIFT]);

    // A floor lifted past the ceiling is a band of one level rather
    // than a band that reads backwards
    expect(
      createOverworld('player-uid', buddyWith([Abilities.KeenEye])).checkEncounterLevels(
        'spawn@0',
        [10, 11],
      ),
    ).toEqual([11, 11]);

    // A legendary's band already tops out at the cap, and a lifted
    // ceiling may not carry it past one: the caught rows hold nothing
    // above MAX_LEVEL
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Hustle])).checkEncounterLevels(
        'spawn@0',
        SPECIAL_SPAWN_LEVELS,
      ),
    ).toEqual([SPECIAL_SPAWN_LEVELS[0], MAX_LEVEL]);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Hustle])).checkEncounterLevels('spawn@0', [
        MAX_LEVEL,
        MAX_LEVEL,
      ]),
    ).toEqual([MAX_LEVEL, MAX_LEVEL]);
  });

  it('finds what a meeting is carrying, and says so', () => {
    const alone = createOverworld('player-uid', null);

    expect(alone.checkEncounterHeld('spawn@0')).toBe(1);
    expect(alone.checkRevealsHeld()).toBe(false);

    expect(
      createOverworld('player-uid', buddyWith([Abilities.CompoundEyes])).checkEncounterHeld(
        'spawn@0',
      ),
    ).toBe(COMPOUND_EYES_HELD_BOOST);
    expect(createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkRevealsHeld()).toBe(
      true,
    );
    // Seeing what it holds and drawing more of it out are separate
    // buddies: neither does the other's work
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkEncounterHeld('spawn@0'),
    ).toBe(1);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.CompoundEyes])).checkRevealsHeld(),
    ).toBe(false);
  });

  it('talks an encounter into a nature and a gender', () => {
    const buddy = buddyWith([Abilities.Synchronize, Abilities.CuteCharm]);
    const overworld = createOverworld('player-uid', buddy);
    const spawns = Array.from({ length: 60 }, (_, index) => `sync@0#${index}`);

    const natures = spawns.map((spawn) => overworld.checkEncounterNature(spawn, Natures.Timid));
    const genders = spawns.map((spawn) => overworld.checkEncounterGender(spawn, Genders.Male));

    // Some of each, and never anything but the buddy's nature or the
    // opposite of its gender
    expect(natures.filter((nature) => nature === buddy.nature).length).toBeGreaterThan(0);
    expect(natures.filter((nature) => nature === Natures.Timid).length).toBeGreaterThan(0);
    expect(new Set(natures)).toEqual(new Set([Natures.Timid, buddy.nature]));

    expect(genders.filter((gender) => gender === Genders.Female).length).toBeGreaterThan(0);
    expect(new Set(genders)).toEqual(new Set([Genders.Male, Genders.Female]));

    // A buddy with neither ability changes nothing, and a genderless
    // one has nothing to charm
    const plain = createOverworld('player-uid', buddyWith([Abilities.Overgrow]));

    expect(plain.checkEncounterNature(spawns[0], Natures.Timid)).toBe(Natures.Timid);
    expect(plain.checkEncounterGender(spawns[0], Genders.Male)).toBe(Genders.Male);

    const genderless = createOverworld('player-uid', {
      ...buddy,
      gender: Genders.Genderless,
    });

    expect(genderless.checkEncounterGender(spawns[0], Genders.Male)).toBe(Genders.Male);
    expect(overworld.checkEncounterGender(spawns[0], Genders.Genderless)).toBe(Genders.Genderless);
  });

  it('lifts the shiny odds for a buddy holding the charm', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const charmed = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.ShinyCharm],
    });

    expect(createOverworld('player-uid', null).checkEncounterShiny('spawn#0')).toBe(1);
    expect(plain.checkEncounterShiny('spawn#0')).toBe(1);
    expect(charmed.checkEncounterShiny('spawn#0')).toBe(SHINY_CHARM_BOOST);
  });

  it('lifts every throw for a buddy holding the catching charm', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const charmed = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.CatchingCharm],
    });

    const wild = metWild(Species.Rattata);

    expect(createOverworld('player-uid', null).checkCatchChance('spawn#0', wild)).toBe(1);
    expect(plain.checkCatchChance('spawn#0', wild)).toBe(1);
    expect(charmed.checkCatchChance('spawn#0', wild)).toBe(CATCHING_CHARM_BOOST);
    // The two charms answer different questions, so neither is worth
    // anything on the other's
    expect(charmed.checkEncounterShiny('spawn#0')).toBe(1);
  });

  it('holds a meeting still for a buddy that traps', () => {
    const alone = createOverworld('player-uid', null);
    const wild = metWild(Species.Rattata);

    expect(alone.checkFleeChance('spawn#0', wild)).toBe(1);
    expect(createOverworld('player-uid', buddyWith([])).checkFleeChance('spawn#0', wild)).toBe(1);

    for (const trap of [Abilities.ArenaTrap, Abilities.ShadowTag]) {
      expect(
        createOverworld('player-uid', buddyWith([trap])).checkFleeChance('spawn#0', wild),
      ).toBe(TRAP_FLEE_FACTOR);
    }

    // Arena Trap is a lure as well, and the two answers are separate:
    // neither ability reads on the other's question
    expect(
      createOverworld('player-uid', buddyWith([Abilities.ShadowTag])).checkSpawnCount(SPAWN_COUNT),
    ).toBe(SPAWN_COUNT);
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Illuminate])).checkFleeChance(
        'spawn#0',
        wild,
      ),
    ).toBe(1);
  });

  it('pins down what a Magnet Pull buddy has a hold on, and nothing else', () => {
    const magnetic = createOverworld('player-uid', buddyWith([Abilities.MagnetPull]));

    // Magnemite is a Steel type and Rattata is not, so one of them
    // cannot get away at all and the other leaves when it likes
    expect(magnetic.checkFleeChance('spawn#0', metWild(Species.Magnemite))).toBe(0);
    expect(magnetic.checkFleeChance('spawn#0', metWild(Species.Rattata))).toBe(1);
    expect(
      createOverworld('player-uid', buddyWith([])).checkFleeChance(
        'spawn#0',
        metWild(Species.Magnemite),
      ),
    ).toBe(1);
  });

  it('throws truer at a shadow for a buddy that has been one', () => {
    const purified = createOverworld('player-uid', buddyWith([Abilities.Purified]));
    const plain = createOverworld('player-uid', buddyWith([]));

    expect(purified.checkCatchChance('spawn#0', metWild(Species.Rattata, true))).toBe(
      PURIFIED_SHADOW_RELIEF,
    );
    // Nothing changes for a meeting whose heart was never closed
    expect(purified.checkCatchChance('spawn#0', metWild(Species.Rattata))).toBe(1);
    expect(plain.checkCatchChance('spawn#0', metWild(Species.Rattata, true))).toBe(1);
    // It gives something back, which the old formula stopped doing the
    // day a shadow became a half rather than a third
    expect(PURIFIED_SHADOW_RELIEF).toBeGreaterThan(1);
    // And less than the shadow took, so a shadow stays the harder catch
    expect(PURIFIED_SHADOW_RELIEF * SHADOW_CATCH_FACTOR).toBeLessThan(1);
  });

  it('carries a bagful of treats further, and grows the last one back', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const greedy = createOverworld('player-uid', buddyWith([Abilities.Gluttony]));
    const grower = createOverworld('player-uid', buddyWith([Abilities.Harvest]));

    expect(plain.checkTreats('spawn#0', MAX_CATCH_BONUS)).toEqual({
      cap: MAX_CATCH_BONUS,
      keeps: false,
    });
    expect(greedy.checkTreats('spawn#0', MAX_CATCH_BONUS).cap).toBe(
      MAX_CATCH_BONUS * GLUTTONY_FEAST,
    );
    expect(greedy.checkTreats('spawn#0', MAX_CATCH_BONUS).keeps).toBe(false);
    expect(grower.checkTreats('spawn#0', MAX_CATCH_BONUS)).toEqual({
      cap: MAX_CATCH_BONUS,
      keeps: true,
    });
  });

  it('comes back from the hedges with a Honey Gather buddy', () => {
    const gatherer = createOverworld('player-uid', buddyWith([Abilities.HoneyGather]));
    const far = HONEY_STEP_INTERVAL * 4;

    expect(gatherer.checkWalkPickup('buddy', 0, far).gathered).toBe(4);
    // What grows is not what is dropped: it finds nothing on the
    // ground, the way a Pickup buddy finds nothing on a bush
    expect(gatherer.checkWalkPickup('buddy', 0, far).found).toBe(0);
    expect(gatherer.checkWalkPickup('buddy', 0, HONEY_STEP_INTERVAL - 1).gathered).toBe(0);
  });

  it('reads a meeting for a Forewarn buddy and its pockets for a Pickpocket one', () => {
    const plain = createOverworld('player-uid', buddyWith([]));

    expect(plain.checkRevealsFlight()).toBe(false);
    expect(plain.checkPockets('spawn#0')).toBe(false);
    // The two readers answer alike: out here there is one thing to
    // read about a meeting, and both of them read it
    for (const reader of [Abilities.Forewarn, Abilities.Anticipation]) {
      expect(createOverworld('player-uid', buddyWith([reader])).checkRevealsFlight()).toBe(true);
    }
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Pickpocket])).checkPockets('spawn#0'),
    ).toBe(true);
    // Neither reads on the other's question, nor on Frisk's
    expect(createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkRevealsFlight()).toBe(
      false,
    );
    expect(createOverworld('player-uid', buddyWith([Abilities.Forewarn])).checkRevealsHeld()).toBe(
      false,
    );
  });

  it('lifts a throw at what a buddy shares an element with', () => {
    const water = metWild(Species.Squirtle);
    const plain = metWild(Species.Rattata);

    for (const kin of [Abilities.StormDrain, Abilities.WaterAbsorb]) {
      const buddy = createOverworld('player-uid', buddyWith([kin]));

      expect(buddy.checkCatchChance('spawn#0', water)).toBe(KINSHIP_CATCH_BOOST);
      // Nothing for a meeting that shares nothing with it
      expect(buddy.checkCatchChance('spawn#0', plain)).toBe(1);
      // And it lifts the throw rather than holding the meeting down,
      // which is what separates it from Magnet Pull
      expect(buddy.checkFleeChance('spawn#0', water)).toBe(1);
    }
    expect(
      createOverworld('player-uid', buddyWith([Abilities.SapSipper])).checkCatchChance(
        'spawn#0',
        water,
      ),
    ).toBe(1);
  });

  it('reads what a meeting can do for a Trace buddy', () => {
    expect(createOverworld('player-uid', buddyWith([])).checkRevealsAbility()).toBe(false);
    expect(createOverworld('player-uid', buddyWith([Abilities.Trace])).checkRevealsAbility()).toBe(
      true,
    );
    // Three readers, three separate questions
    expect(createOverworld('player-uid', buddyWith([Abilities.Trace])).checkRevealsHeld()).toBe(
      false,
    );
    expect(createOverworld('player-uid', buddyWith([Abilities.Frisk])).checkRevealsAbility()).toBe(
      false,
    );
  });

  it('sharpens a throw for a buddy that knows where to aim', () => {
    const wild = metWild(Species.Rattata);

    expect(
      createOverworld('player-uid', buddyWith([])).checkCriticalCatch('spawn#0', wild),
    ).toEqual({ boost: 1, aims: 1 });

    // The two are halves rather than copies: Super Luck is how often a
    // throw comes out critical, Sniper is how well the one it gets
    // goes
    expect(
      createOverworld('player-uid', buddyWith([Abilities.SuperLuck])).checkCriticalCatch(
        'spawn#0',
        wild,
      ),
    ).toEqual({ boost: KEEN_CRITICAL_BOOST, aims: 1 });
    expect(
      createOverworld('player-uid', buddyWith([Abilities.Sniper])).checkCriticalCatch(
        'spawn#0',
        wild,
      ),
    ).toEqual({ boost: 1, aims: SNIPER_AIMS });

    // It is its own question: neither of them lifts an ordinary throw
    expect(
      createOverworld('player-uid', buddyWith([Abilities.SuperLuck])).checkCatchChance(
        'spawn#0',
        wild,
      ),
    ).toBe(1);
  });

  it('pays candy for what a buddy is carrying, to the right family', () => {
    // The buddy is a Bulbasaur; the pokemon being caught is not
    const buddyFamily = getSpeciesData(Species.Bulbasaur).family;
    const caughtFamily = getSpeciesData(Species.Rattata).family;

    expect(buddyFamily).not.toBe(caughtFamily);

    const carrying = (item: Items): Overworld =>
      createOverworld('player-uid', { ...buddyWith([]), items: [item] });
    const shared = carrying(Items.ExpShare);
    const lucky = carrying(Items.LuckyEgg);
    let sharedPaid = 0;
    let luckyPaid = 0;
    let plainPaid = 0;

    // Half the catches, so a run of them shows both outcomes; every
    // payment is one candy, and it always goes to the same family
    for (let index = 0; index < 40; index++) {
      const spawn = `spawn#${index}`;

      for (const [family, count] of shared.checkCatchCandy(spawn, caughtFamily)) {
        expect(family).toBe(buddyFamily);
        expect(count).toBe(CANDY_ITEM_BONUS);
        sharedPaid += 1;
      }
      for (const [family, count] of lucky.checkCatchCandy(spawn, caughtFamily)) {
        expect(family).toBe(caughtFamily);
        expect(count).toBe(CANDY_ITEM_BONUS);
        luckyPaid += 1;
      }
      // Carrying nothing pays nothing, and neither does walking alone
      plainPaid += createOverworld('player-uid', buddyWith([])).checkCatchCandy(
        spawn,
        caughtFamily,
      ).size;
      plainPaid += createOverworld('player-uid', null).checkCatchCandy(spawn, caughtFamily).size;
    }

    expect(plainPaid).toBe(0);
    // Neither certain nor never: both land somewhere inside the run
    expect(sharedPaid).toBeGreaterThan(0);
    expect(sharedPaid).toBeLessThan(40);
    expect(luckyPaid).toBeGreaterThan(0);
    expect(luckyPaid).toBeLessThan(40);
  });

  it('pays an Exp. Share buddy of the caught line from both sides', () => {
    // The one case where the two items would meet: the buddy is of
    // the family being caught, so an Exp. Share pays the same stack
    // a Lucky Egg would
    const family = getSpeciesData(Species.Bulbasaur).family;
    const shared = createOverworld('player-uid', { ...buddyWith([]), items: [Items.ExpShare] });

    for (let index = 0; index < 20; index++) {
      const bonus = shared.checkCatchCandy(`spawn#${index}`, family);

      // One item, so one candy at most — never doubled by the two
      // families happening to be the same
      expect([...bonus.values()].every((count) => count === CANDY_ITEM_BONUS)).toBe(true);
      expect(bonus.size).toBeLessThanOrEqual(1);
    }
  });

  it('warms an egg picked up beside a Flame Body or Magma Armor buddy', () => {
    const warm = createOverworld('player-uid', buddyWith([Abilities.FlameBody]));
    const plain = createOverworld('player-uid', buddyWith([Abilities.Overgrow]));

    expect(warm.checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(EGG_HATCH_STEPS * FLAME_BODY_FACTOR);
    // The other warm one is worth exactly the same walk
    expect(
      createOverworld('player-uid', buddyWith([Abilities.MagmaArmor])).checkEggSteps(
        'egg',
        EGG_HATCH_STEPS,
      ),
    ).toBe(EGG_HATCH_STEPS * FLAME_BODY_FACTOR);
    expect(plain.checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(EGG_HATCH_STEPS);
    expect(createOverworld('player-uid', null).checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(
      EGG_HATCH_STEPS,
    );

    // However short the walk gets, there is always one step of it
    expect(warm.checkEggSteps('egg', 1)).toBe(1);
  });

  it('turns something up every so far for a Pickup buddy', () => {
    const finder = createOverworld('player-uid', buddyWith([Abilities.Pickup]));
    const plain = createOverworld('player-uid', buddyWith([Abilities.Overgrow]));
    const far = PICKUP_STEP_INTERVAL * 3;

    expect(finder.checkWalkPickup('buddy', 0, far).found).toBe(3);
    expect(plain.checkWalkPickup('buddy', 0, far).found).toBe(0);
    // Nothing off a bush either: the ground and the hedges are two
    // pools, and Pickup only reads one of them
    expect(finder.checkWalkPickup('buddy', 0, far).gathered).toBe(0);
    // Short of the first mark is nothing at all
    expect(finder.checkWalkPickup('buddy', 0, PICKUP_STEP_INTERVAL - 1).found).toBe(0);

    // It counts marks crossed rather than steps reported, so walking
    // the same distance in handfuls finds exactly as much
    let piecemeal = 0;

    for (let at = 0; at < far; at += 64) {
      piecemeal += finder.checkWalkPickup('buddy', at, Math.min(far, at + 64)).found;
    }
    expect(piecemeal).toBe(3);
  });

  it('doubles a purse and quiets a chunk for a buddy burning incense', () => {
    const plain = createOverworld('player-uid', buddyWith([]));
    const lucky = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.LuckIncense],
    });
    const quiet = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.PureIncense],
    });

    // What the raid owes, and then what the claimant brought along
    expect(plain.checkGoldReward('raid-id', 2000)).toBe(2000);
    expect(lucky.checkGoldReward('raid-id', 2000)).toBe(2000 * LUCK_INCENSE_BONUS);

    // The mirror of a lure: the window rolls what it rolls, and the
    // player carrying one meets fewer of them
    expect(plain.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT);
    expect(quiet.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT - PURE_INCENSE_QUIET);
    // It can never quiet a chunk below nothing
    expect(quiet.checkSpawnCount(1)).toBe(0);

    // A player walking alone carries nothing
    expect(createOverworld('player-uid', null).checkGoldReward('raid-id', 2000)).toBe(2000);
  });

  it('does the same for a buddy wearing a coin or a tag', () => {
    const rich = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.AmuletCoin],
    });
    const tagged = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.CleanseTag],
    });

    expect(rich.checkGoldReward('raid-id', 2000)).toBe(2000 * AMULET_COIN_BONUS);
    expect(tagged.checkSpawnCount(SPAWN_COUNT)).toBe(SPAWN_COUNT - CLEANSE_TAG_QUIET);
    expect(tagged.checkSpawnCount(1)).toBe(0);

    // The coin pays better than the incense it stands against, which
    // is what not being on any shelf is worth
    expect(AMULET_COIN_BONUS).toBeGreaterThan(LUCK_INCENSE_BONUS);

    // And each is asked separately, so a buddy carrying both is paid
    // for both — the way a Shiny Charm stacks with the day's own boost
    const both = createOverworld('player-uid', {
      ...buddyWith([]),
      items: [Items.AmuletCoin, Items.LuckIncense],
    });

    expect(both.checkGoldReward('raid-id', 2000)).toBe(
      2000 * AMULET_COIN_BONUS * LUCK_INCENSE_BONUS,
    );
  });
});
