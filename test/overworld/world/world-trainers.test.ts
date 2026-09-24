import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import AleaRNG from '../../../src/core/alea';
import Abilities from '../../../src/data/ids/abilities';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns, { getBiomeRoster, spawnRanks } from '../../../src/data/biome';
import { isCoreRole } from '../../../src/data/species/best-moves';
import { getStoneMega } from '../../../src/data/items/mega-stones';
import {
  CORE_COUNT,
  assignBuildRoles,
  getBestNature,
  getBestParty,
} from '../../../src/data/species/best-build';
import Biome, { getTimeOfDay } from '../../../src/data/ids/biome';
import { EVERY_LAIR, getBiomeLairs, getLairResidents } from '../../../src/data/overworld/lair';
import { Items } from '../../../src/data/ids/items';
import registerItems, { getItemData } from '../../../src/data/items';
import { getExpertHeldItems } from '../../../src/data/items/expert-loadout';
import { Slots, countAbilitySlots, getSlots } from '../../../src/data/constants/slots';
import type { CatchSnapshot } from '../../../src/auth/catch-snapshot';
import { type ItemBand, getItemBand } from '../../../src/data/overworld/item-pool';
import { Species } from '../../../src/data/ids/species';
import { getSpeciesAbilityPools, getSpeciesData, registerSpecies } from '../../../src/data/species';
import { isShiny } from '../../../src/auth/caught-record';
import {
  MAX_EFFORT_PER_STAT,
  MAX_IV,
  PERFECT_IVS,
  STAT_ORDER,
  Stats,
  getIV,
} from '../../../src/data/constants/stats';
import { type StopRecord, deriveStopReward } from '../../../src/auth/stop-record';
import ChunkSnapshot, {
  EXECUTIVE_CHANCE,
  NPC_INTERVAL,
  ROCKET_PARTY_SIZE,
  RocketRank,
  WEATHER_INTERVAL,
} from '../../../src/overworld/chunk-snapshot';
import {
  LEGENDARY_RAID_GOLD,
  MYTHICAL_RAID_GOLD,
  SHADOW_RAID_GOLD,
} from '../../../src/overworld/raid';
import {
  ACE_OUTFIT,
  CHAMPION_GOLD,
  BOSS_OUTFIT,
  CHAMPION_OUTFIT,
  CHAMPION_PARTY_LEVELS,
  ELITE_GOLD,
  ELITE_OUTFIT,
  FRONTIER_OUTFIT,
  ELITE_PARTY_LEVELS,
  GIOVANNI_GOLD,
  GIOVANNI_PARTY_LEVELS,
  GYM_GOLD,
  GYM_OUTFIT,
  GYM_PARTY_LEVELS,
  type GoldBand,
  LEGEND_OUTFIT,
  LEGEND_PARTY_LEVELS,
  PLAIN_OUTFIT,
  ROCKET_GRUNT_GOLD,
  ROCKET_PARTY_LEVELS,
  TYPE_TRAINER_GOLD,
  createStopParty,
  createStopSnapshot,
  polishedStats,
  rocketPartyLevels,
  rollStopGold,
  rollStopLoot,
  stopGoldBand,
  stopOutfit,
  stopPartyLevels,
} from '../../../src/overworld/stop';
import {
  BIOME_ELITE_MEMBERS,
  BIOME_GYM_LEADERS,
  CHAMPION_CHARSETS,
  Champion,
  ELITE_MEMBER_CHARSETS,
  EXPERT_PARTY_SIZE,
  GYM_LEADER_CHARSETS,
  GYM_LEADER_TYPES,
  LEGEND_CHARSETS,
  getEliteMemberRoster,
} from '../../../src/data/overworld/experts';
import {
  ACE_PARTY_SIZE,
  ACE_TRAINER_LEVELS,
  TRAINER_CHARSETS,
  TRAINER_CLASSES,
  TRAINER_NAMES,
  TRAINER_REGIONS,
  TRAINER_TYPES,
  TYPE_TRAINER_LEVELS,
  TYPE_TRAINER_PARTY_MAX,
  TYPE_TRAINER_PARTY_MIN,
  TrainerClass,
  getBiomeTrainers,
  getTrainerPool,
  isAceTrainer,
  isGrownInRegion,
  trainerLevels,
} from '../../../src/data/overworld/trainers';
import Landmark from '../../../src/data/overworld/landmark';
import { SYNDICATE_BOSS_CHARSETS } from '../../../src/data/overworld/syndicate';
import { EXECUTIVE_CHARSETS, EXECUTIVE_NAMES } from '../../../src/data/overworld/npc';
import { favorsEverything } from '../../../src/data/overworld/weather';
import World from '../../../src/overworld/world';
import findChunk from './helpers';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('world', () => {
  it('stands a syndicate grunt on two of each of the biome’s bands', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const stops = snapshot.getRocketStops();
    const pool = getBiomeRoster(chunk.biome, getTimeOfDay(0));

    expect(stops.size).toBeGreaterThan(0);
    for (const [cell, party] of stops) {
      // A stop stands at Team Rocket's own landmark now
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.TeamRocket);

      // Everybody fields six, whatever the rank
      expect(party).toHaveLength(ROCKET_PARTY_SIZE);

      const rank = snapshot.getRocketRank(cell);
      const [young, middle, grown] = spawnRanks(pool);
      const bandOf = (band: typeof pool.base): typeof pool.base =>
        band.length > 0 ? band : [young, middle, grown].flat();
      const drawnFrom = (at: number, band: typeof pool.base): void => {
        expect(new Set(bandOf(band).map((entry) => entry.species)).has(party[at][0])).toBe(true);
      };

      if (rank === RocketRank.Boss) {
        // Five grown ones and a legendary at the end
        for (let at = 0; at < ROCKET_PARTY_SIZE - 1; at++) {
          drawnFrom(at, grown);
        }
        continue;
      }
      if (rank === RocketRank.Executive) {
        // Six grown ones and nothing softer
        for (let at = 0; at < ROCKET_PARTY_SIZE; at++) {
          drawnFrom(at, grown);
        }
        continue;
      }
      // A grunt's six, weakest first: two out of each of the biome's
      // three bands, so the rank that is met most often is the one
      // that reaches the whole pool. A band the window leaves empty
      // borrows from the commonest one that is not
      const bands = [young, young, middle, middle, grown, grown];

      for (const [at, band] of bands.entries()) {
        drawnFrom(at, band);
      }
    }

    // The grunt keeps the cell's own window: they stand as long as any
    // other wanderer, and the next one brings somebody else
    expect(snapshot.npcTimestamp).toBe(0);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL - 1).getRocketStops()).toEqual(stops);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL).getRocketStops()).not.toEqual(stops);
  });

  it('fields a grunt at a fixed level, shadowed, with rolled traits', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const [spawns] = [...snapshot.getRocketStops().values()];
    const party = createStopParty(snapshot, spawns);

    expect(party).toHaveLength(ROCKET_PARTY_SIZE);
    for (const [at, member] of party.entries()) {
      // Every one rolls its level inside the grunt's band whatever
      // its species would have rolled, and every one is a shadow
      expect(member.level).toBeGreaterThanOrEqual(ROCKET_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(ROCKET_PARTY_LEVELS[1]);
      expect(new Set(member.abilities).has(Abilities.Shadow)).toBe(true);
      expect(member.species).toBe(spawns[at][0]);
      // It belongs to no catch record, and never sparkles
      expect(member.caught).toBe('');
      expect(isShiny(member)).toBe(false);
      expect(member.items).toEqual([]);
    }

    // The traits are the spawn's own, so the six are not clones of
    // one build
    expect(new Set(party.map((member) => member.nature)).size).toBeGreaterThanOrEqual(1);
    expect(party.map((member) => member.ivs)).not.toEqual([]);

    // A duelling trainer fields the same pokemon as their ordinary
    // selves: same species and level, nothing shadowed
    const duel = createStopParty(snapshot, spawns, false);

    for (const [at, member] of duel.entries()) {
      expect(member.level).toBeGreaterThanOrEqual(ROCKET_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(ROCKET_PARTY_LEVELS[1]);
      expect(member.species).toBe(spawns[at][0]);
      expect(member.shadow).toBe(false);
      expect(new Set(member.abilities).has(Abilities.Shadow)).toBe(false);
    }
  });

  it('stands duelling trainers at their own landmark', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getTrainerStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const lairSpecies = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));

    for (const [cell, party] of snapshot.getTrainerStops()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.Trainer);

      const trainer = snapshot.getTrainerClass(cell);

      expect(trainer).not.toBeNull();
      if (trainer == null) {
        continue;
      }

      // Whoever is standing there is one this country puts on the
      // road, or the Ace, who belongs to no country
      expect(getBiomeTrainers(chunk.biome)).toContain(trainer);

      // The Ace fields five of anything; a type expert three to five
      // of their own kind, and nothing of the biome's choosing
      const types = new Set(TRAINER_TYPES[trainer]);

      if (isAceTrainer(trainer)) {
        expect(party).toHaveLength(ACE_PARTY_SIZE);
      } else {
        expect(party.length).toBeGreaterThanOrEqual(TYPE_TRAINER_PARTY_MIN);
        expect(party.length).toBeLessThanOrEqual(TYPE_TRAINER_PARTY_MAX);
      }
      for (const [species] of party) {
        // As grown as its own region goes, never a legendary, and of
        // the class' type. A later region often holds the last stage
        // of an older line, and that stage is not this trainer's
        expect(
          isGrownInRegion(species, TRAINER_REGIONS[trainer]),
          getSpeciesData(species).name,
        ).toBe(true);
        expect(lairSpecies.has(species)).toBe(false);
        if (types.size > 0) {
          expect(
            getSpeciesData(species).types.some((one) => types.has(one)),
            getSpeciesData(species).name,
          ).toBe(true);
        }
      }
      // Dressed from their own class' wardrobe rather than the
      // landmark's old one
      expect(TRAINER_CHARSETS[trainer]).toContain(snapshot.getWandererCoats().get(cell));
    }
  });

  it('gives every trainer class a name, a wardrobe and a pool', () => {
    for (const trainer of TRAINER_CLASSES) {
      expect(TRAINER_NAMES[trainer]).not.toBe('');
      expect(TRAINER_CHARSETS[trainer].length).toBeGreaterThan(0);
      expect(getTrainerPool(trainer).length).toBeGreaterThan(0);
      expect(trainerLevels(trainer)).toEqual(
        isAceTrainer(trainer) ? ACE_TRAINER_LEVELS : TYPE_TRAINER_LEVELS,
      );
    }

    // Two trades may want the same type now, so what has to be one
    // class' own is the coat: no sheet is worn twice
    const worn = TRAINER_CLASSES.flatMap((trainer) => TRAINER_CHARSETS[trainer]);

    expect(new Set(worn).size).toBe(worn.length);
    // And only the Aces field everything there is, one to a region
    expect(TRAINER_CLASSES.filter((trainer) => TRAINER_TYPES[trainer].length === 0)).toEqual(
      TRAINER_CLASSES.filter(isAceTrainer),
    );
  });

  it('rolls Giovanni once in a long while, six strong', () => {
    const world = new World('overworld');
    let staged: { snapshot: ChunkSnapshot; cell: number } | null = null;

    // 1/64 a stop a window: a few hundred stop-windows finds him
    for (let x = 0; x < 48 && staged == null; x++) {
      for (let y = 0; y < 8 && staged == null; y++) {
        const chunk = world.getChunk(x, y);

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocket) {
            continue;
          }
          for (let window = 0; window < 16; window++) {
            const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

            if (snapshot.isRocketBoss(cell) && snapshot.getRocketStops().get(cell) != null) {
              staged = { snapshot, cell };
              break;
            }
          }
          if (staged != null) {
            break;
          }
        }
      }
    }

    expect(staged).not.toBeNull();
    if (staged == null) {
      return;
    }

    const party = staged.snapshot.getRocketStops().get(staged.cell) ?? [];
    const legendaries = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));
    const homes = getBiomeLairs(staged.snapshot.chunk.biome);
    const endemic = new Set(homes.flatMap((lair) => getLairResidents(lair)));

    // Six strong: five of the biome's rares, and at the end a
    // legendary that lives here. A biome hosting no lair has none for
    // him to have taken, so the sixth is another rare
    expect(party).toHaveLength(6);
    expect(homes.length > 0 ? endemic.has(party[5][0]) : !legendaries.has(party[5][0])).toBe(true);

    // Dressed as the boss himself
    expect(SYNDICATE_BOSS_CHARSETS[staged.snapshot.getSyndicate()]).toContain(
      staged.snapshot.getWandererCoats().get(staged.cell),
    );

    // Fielded at his own level, all shadows. The band is the stop's to
    // pass now that every rank fields six: nothing about the party
    // says whose it is
    const fielded = createStopParty(
      staged.snapshot,
      party,
      true,
      rocketPartyLevels(RocketRank.Boss),
    );

    for (const member of fielded) {
      expect(member.level).toBeGreaterThanOrEqual(GIOVANNI_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(GIOVANNI_PARTY_LEVELS[1]);
      expect(member.shadow).toBe(true);
    }
  });

  it('never fields Giovanni a legendary the biome cannot host', () => {
    const world = new World('overworld');
    const legendaries = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));
    let bosses = 0;
    let barren = 0;

    for (let x = 0; x < 48; x++) {
      for (let y = 0; y < 8; y++) {
        const chunk = world.getChunk(x, y);
        const homes = getBiomeLairs(chunk.biome);
        const endemic = new Set(homes.flatMap((lair) => getLairResidents(lair)));

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocket) {
            continue;
          }
          for (let window = 0; window < 16; window++) {
            const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

            if (!snapshot.isRocketBoss(cell)) {
              continue;
            }

            const party = snapshot.getRocketStops().get(cell);

            if (party == null) {
              continue;
            }
            bosses += 1;

            const last = party[party.length - 1][0];

            if (homes.length > 0) {
              expect(endemic.has(last)).toBe(true);
              continue;
            }
            // Nowhere here for one to have come from, so the sixth is
            // a rare like the five in front of it
            barren += 1;
            expect(legendaries.has(last)).toBe(false);
          }
        }
      }
    }

    // Both sides of it are actually walked: most biomes host no lair
    expect(bosses).toBeGreaterThan(0);
    expect(barren).toBeGreaterThan(0);
  });

  it('ranks a Team Rocket cell into a grunt, an executive or the boss', () => {
    const world = new World('overworld');
    const seen = new Map<RocketRank, number>();
    let windows = 0;
    let executive: { snapshot: ChunkSnapshot; cell: number } | null = null;

    for (let x = 0; x < 24; x++) {
      for (let y = 0; y < 6; y++) {
        const chunk = world.getChunk(x, y);

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (landmark !== Landmark.TeamRocket) {
            continue;
          }
          for (let window = 0; window < 24; window++) {
            const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);
            const rank = snapshot.getRocketRank(cell);

            expect(rank).not.toBeNull();
            if (rank == null) {
              continue;
            }
            seen.set(rank, (seen.get(rank) ?? 0) + 1);
            windows += 1;

            // The three are one draw, so they cannot overlap: only the
            // boss reads as the boss, and only an executive names one
            expect(snapshot.isRocketBoss(cell)).toBe(rank === RocketRank.Boss);
            expect(snapshot.getRocketExecutive(cell) != null).toBe(rank === RocketRank.Executive);

            if (rank === RocketRank.Executive && executive == null) {
              executive = { snapshot, cell };
            }
          }
        }
      }
    }

    expect(windows).toBeGreaterThan(500);

    // Roughly the stated odds: a grunt most of the time, an executive
    // about one window in eight, the boss far rarer than either
    const share = (rank: RocketRank): number => (seen.get(rank) ?? 0) / windows;

    expect(share(RocketRank.Grunt)).toBeGreaterThan(0.7);
    expect(share(RocketRank.Executive)).toBeGreaterThan(EXECUTIVE_CHANCE / 2);
    expect(share(RocketRank.Executive)).toBeLessThan(EXECUTIVE_CHANCE * 2);
    expect(share(RocketRank.Boss)).toBeLessThan(EXECUTIVE_CHANCE);

    // And an executive stands there as one of the four, dressed as
    // themselves, fielding six of the country's rares at the Elite
    // Four's level
    expect(executive).not.toBeNull();
    if (executive == null) {
      return;
    }

    const who = executive.snapshot.getRocketExecutive(executive.cell);

    expect(who).not.toBeNull();
    if (who == null) {
      return;
    }
    expect(EXECUTIVE_CHARSETS[who]).toContain(
      executive.snapshot.getWandererCoats().get(executive.cell),
    );
    expect(EXECUTIVE_NAMES[who].length).toBeGreaterThan(0);

    const party = executive.snapshot.getRocketStops().get(executive.cell) ?? [];
    const rares = new Set(
      spawnRanks(
        getBiomeRoster(
          executive.snapshot.chunk.biome,
          getTimeOfDay(executive.snapshot.npcTimestamp),
        ),
      )[2].map((entry) => entry.species),
    );

    expect(party).toHaveLength(ROCKET_PARTY_SIZE);
    for (const [species] of party) {
      expect(rares.has(species)).toBe(true);
    }

    const fielded = createStopParty(
      executive.snapshot,
      party,
      true,
      rocketPartyLevels(RocketRank.Executive),
    );

    for (const member of fielded) {
      expect(member.level).toBeGreaterThanOrEqual(ELITE_PARTY_LEVELS[0]);
      expect(member.level).toBeLessThanOrEqual(ELITE_PARTY_LEVELS[1]);
      expect(member.shadow).toBe(true);
    }
  });

  it('fields an expert’s party trained rather than caught', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const [spawns] = [...snapshot.getRocketStops().values()];

    // What each rung fields above what it caught: a gym leader gears
    // its six, the Elite Four and the executives train a second
    // ability into them, and a champion and Giovanni do both twice
    expect(stopOutfit(Landmark.Trainer, RocketRank.Grunt)).toEqual(PLAIN_OUTFIT);
    // An Ace Trainer catches what anybody catches and raises it the
    // way the Elite Four do
    expect(stopOutfit(Landmark.Trainer, RocketRank.Grunt, false, TrainerClass.AceTrainer)).toEqual(
      ACE_OUTFIT,
    );
    expect(ACE_OUTFIT.training).toBe(ELITE_OUTFIT.training);
    expect(
      stopOutfit(Landmark.Trainer, RocketRank.Grunt, false, TrainerClass.JohtoAceTrainer),
    ).toEqual(ACE_OUTFIT);
    expect(stopOutfit(Landmark.Trainer, RocketRank.Grunt, false, TrainerClass.Swimmer)).toEqual(
      PLAIN_OUTFIT,
    );
    expect(stopOutfit(Landmark.TeamRocket, RocketRank.Grunt)).toEqual(PLAIN_OUTFIT);
    expect(stopOutfit(Landmark.GymLeader, RocketRank.Grunt)).toEqual(GYM_OUTFIT);
    expect(stopOutfit(Landmark.EliteFour, RocketRank.Grunt)).toEqual(ELITE_OUTFIT);
    expect(stopOutfit(Landmark.TeamRocket, RocketRank.Executive)).toEqual(ELITE_OUTFIT);
    expect(stopOutfit(Landmark.Champion, RocketRank.Grunt)).toEqual(CHAMPION_OUTFIT);
    expect(stopOutfit(Landmark.TeamRocket, RocketRank.Boss)).toEqual(BOSS_OUTFIT);
    // And the one rung above the league, which is three of everything
    expect(stopOutfit(Landmark.Champion, RocketRank.Grunt, true)).toEqual(LEGEND_OUTFIT);

    const fielded = (outfit: typeof PLAIN_OUTFIT, shadow = false): CatchSnapshot[] =>
      createStopParty(snapshot, spawns, shadow, ELITE_PARTY_LEVELS, outfit);

    // A duelling trainer's six is what a walk would have met
    for (const member of fielded(PLAIN_OUTFIT)) {
      expect(member.abilities).toHaveLength(1);
      expect(member.items).toEqual([]);
      expect(getSlots(member.slots, Slots.Item)).toBe(1);
      expect(getSlots(member.slots, Slots.Ability)).toBe(1);
    }

    for (const member of fielded(GYM_OUTFIT)) {
      expect(member.abilities).toHaveLength(1);
      // One item, and the one that pokemon would want, which is a
      // question about the set it is fielding rather than its species
      expect(member.items).toEqual(
        getExpertHeldItems(member.species, 1, {
          moves: member.moves,
          abilities: member.abilities,
        }),
      );
      expect(getSlots(member.slots, Slots.Item)).toBe(1);
    }

    for (const member of fielded(ELITE_OUTFIT)) {
      // Two abilities, which nothing met in the world ever has, and
      // room counted for both
      expect(member.abilities.length, getSpeciesData(member.species).name).toBe(
        Math.min(
          2,
          new Set([
            ...getSpeciesAbilityPools(member.species).regular,
            ...getSpeciesAbilityPools(member.species).hidden,
          ]).size,
        ),
      );
      expect(getSlots(member.slots, Slots.Ability)).toBe(member.abilities.length);
      expect(member.items).toHaveLength(1);
    }

    for (const member of fielded(CHAMPION_OUTFIT)) {
      expect(member.items).toHaveLength(2);
      expect(new Set(member.items).size).toBe(2);
      // The room is the outfit's, which is what a Utility Belt would
      // otherwise have to buy
      expect(getSlots(member.slots, Slots.Item)).toBe(2);
    }

    // A shadow's own mark rides free of the ability count, so
    // Giovanni's six carry two abilities and the Shadow besides
    for (const member of fielded(CHAMPION_OUTFIT, true)) {
      expect(new Set(member.abilities).has(Abilities.Shadow)).toBe(true);
      expect(countAbilitySlots(member.abilities)).toBeLessThanOrEqual(2);
      expect(getSlots(member.slots, Slots.Ability)).toBe(countAbilitySlots(member.abilities));
    }

    // And a legend's, which is three of each: a species with fewer
    // than three abilities to give carries what it has, and the items
    // never run short
    for (const member of fielded(LEGEND_OUTFIT)) {
      const pool = new Set([
        ...getSpeciesAbilityPools(member.species).regular,
        ...getSpeciesAbilityPools(member.species).hidden,
      ]);

      expect(member.abilities.length, getSpeciesData(member.species).name).toBe(
        Math.min(3, pool.size),
      );
      expect(new Set(member.abilities).size).toBe(member.abilities.length);
      expect(member.items).toHaveLength(3);
      expect(new Set(member.items).size).toBe(3);
      expect(getSlots(member.slots, Slots.Item)).toBe(3);
      expect(getSlots(member.slots, Slots.Ability)).toBe(member.abilities.length);
    }
  });

  it('fields a built party as two cores behind four supports', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }
    const snapshot = new ChunkSnapshot(chunk, 0);
    const spawns = [...snapshot.getRocketStops().values()][0];
    const party = createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, ELITE_OUTFIT);
    const roles = assignBuildRoles(party.map((member) => member.species));
    const composed = getBestParty(
      party.map((member) => member.species),
      ELITE_OUTFIT.abilities,
    );

    expect(roles.filter((role) => isCoreRole(role))).toHaveLength(
      Math.min(CORE_COUNT, party.length),
    );

    for (const [at, member] of party.entries()) {
      // Everything chosen rather than rolled comes off the party's
      // own plan: the jobs, the sky, the abilities, the moves and the
      // nature those moves want
      expect(member.abilities, getSpeciesData(member.species).name).toEqual(composed[at].abilities);
      expect(member.moves).toEqual(composed[at].moves);
      // The one carrying a Mega Stone is natured for the Mega it fights as
      let shape = member.species;

      for (const item of member.items) {
        shape = getStoneMega(item) ?? shape;
      }
      expect(member.nature).toBe(getBestNature(shape, roles[at], member.moves));
    }

    // A rolled party has no jobs to hand out, so nothing about it
    // moves when the builder changes
    const rolled = createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, PLAIN_OUTFIT);

    for (const [at, member] of rolled.entries()) {
      expect(member.nature).toBe(
        createStopSnapshot(snapshot, spawns[at], false, ELITE_PARTY_LEVELS, PLAIN_OUTFIT).nature,
      );
    }
  });

  it('hands one Mega Stone to a core, where the rung fields Megas', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    // Two lines with a Mega: Charizard is the special core, Audino a support
    const spawns: [Species, number, number][] = [
      [Species.Audino, 11, 21],
      [Species.Charizard, 12, 22],
      [Species.Machamp, 13, 23],
      [Species.Blissey, 14, 24],
      [Species.Skarmory, 15, 25],
      [Species.Chansey, 16, 26],
    ];
    const stones = (party: CatchSnapshot[]): number[] => {
      const held: number[] = [];

      for (const [at, member] of party.entries()) {
        for (const item of member.items) {
          if (getStoneMega(item) != null) {
            held.push(at);
          }
        }
      }
      return held;
    };

    for (const outfit of [ACE_OUTFIT, GYM_OUTFIT, ELITE_OUTFIT, CHAMPION_OUTFIT, LEGEND_OUTFIT]) {
      const party = createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, outfit);

      // One stone, since a team Mega Evolves once, and on the core
      expect(stones(party)).toEqual([1]);
      // An outfit with no item to spare still makes room for it
      expect(party[1].items.length).toBe(Math.max(1, outfit.items));
      expect(getSlots(party[1].slots, Slots.Item)).toBe(Math.max(1, outfit.items));
    }

    // A syndicate's boss, a Frontier house and everybody below an ace field none
    for (const outfit of [BOSS_OUTFIT, FRONTIER_OUTFIT, PLAIN_OUTFIT]) {
      expect(stones(createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, outfit))).toEqual(
        [],
      );
    }
  });

  it('raises an expert’s party by its rung', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getRocketStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const [spawns] = [...snapshot.getRocketStops().values()];
    const fielded = (outfit: typeof PLAIN_OUTFIT): CatchSnapshot[] =>
      createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, outfit);
    const rolled = createStopParty(snapshot, spawns, false, ELITE_PARTY_LEVELS, PLAIN_OUTFIT);

    // A duelling trainer's and a grunt's is what the roll gave, with
    // nothing spent on it
    for (const member of rolled) {
      for (const stat of STAT_ORDER) {
        expect(member.effortValues[stat]).toBe(0);
      }
    }

    // A gym leader's is evenly raised and evenly valued, which is
    // below what a lucky roll would have given
    for (const member of fielded(GYM_OUTFIT)) {
      for (const stat of STAT_ORDER) {
        expect(getIV(member.ivs, stat)).toBe(10);
        expect(member.effortValues[stat]).toBe(50);
      }
    }

    for (const [outfit, polished] of [
      [ELITE_OUTFIT, 2],
      [CHAMPION_OUTFIT, 4],
      [LEGEND_OUTFIT, 6],
    ] as const) {
      const party = fielded(outfit);

      for (const [index, member] of party.entries()) {
        const best = new Set(polishedStats(member.species).slice(0, polished));

        for (const stat of STAT_ORDER) {
          if (best.has(stat)) {
            expect(getIV(member.ivs, stat)).toBe(MAX_IV);
            expect(member.effortValues[stat]).toBe(MAX_EFFORT_PER_STAT);
            continue;
          }
          // Everything else is the roll, untouched, and the rung's
          // even share of training on top
          expect(getIV(member.ivs, stat)).toBe(getIV(rolled[index].ivs, stat));
          expect(member.effortValues[stat]).toBe(50);
        }
        // HP and Speed are what every rung above a gym polishes first
        expect(best.has(Stats.HP)).toBe(true);
        expect(best.has(Stats.Speed)).toBe(true);
      }
    }

    // A legend leaves nothing to raise
    for (const member of fielded(LEGEND_OUTFIT)) {
      expect(member.ivs).toBe(PERFECT_IVS);
    }
  });

  it('polishes the side of its own spread a species leans on', () => {
    // Steelix attacks and defends physically; Alakazam does neither
    expect(polishedStats(Species.Steelix).slice(0, 4)).toEqual([
      Stats.HP,
      Stats.Speed,
      Stats.Attack,
      Stats.Defense,
    ]);
    expect(polishedStats(Species.Alakazam).slice(0, 4)).toEqual([
      Stats.HP,
      Stats.Speed,
      Stats.SpecialAttack,
      Stats.SpecialDefense,
    ]);
    // All six, once, however the spread falls
    for (const species of [Species.Steelix, Species.Alakazam, Species.Snorlax]) {
      expect(new Set(polishedStats(species)).size).toBe(STAT_ORDER.length);
    }
  });

  it('rolls a purse in the stop’s own range, the same on every ask', () => {
    for (let winner = 0; winner < 32; winner++) {
      const seed = `stop:purse:player-${winner}`;
      const purse = rollStopGold(seed, ROCKET_GRUNT_GOLD);
      const bounty = rollStopGold(seed, GIOVANNI_GOLD);

      expect(purse).toBeGreaterThanOrEqual(ROCKET_GRUNT_GOLD[0]);
      expect(purse).toBeLessThanOrEqual(ROCKET_GRUNT_GOLD[1]);
      expect(bounty).toBeGreaterThanOrEqual(GIOVANNI_GOLD[0]);
      expect(bounty).toBeLessThanOrEqual(GIOVANNI_GOLD[1]);
      // Seeded: asking again answers the same
      expect(rollStopGold(seed, ROCKET_GRUNT_GOLD)).toBe(purse);
    }
  });

  it('climbs the purse with the rung, and pays the ladder in order', () => {
    const rungs: [name: string, band: GoldBand][] = [
      ['a type expert', stopGoldBand(Landmark.Trainer, RocketRank.Grunt, TrainerClass.BugCatcher)],
      ['a grunt', stopGoldBand(Landmark.TeamRocket, RocketRank.Grunt)],
      ['a gym leader', stopGoldBand(Landmark.GymLeader, RocketRank.Grunt)],
      ['an Ace Trainer', stopGoldBand(Landmark.Trainer, RocketRank.Grunt, TrainerClass.AceTrainer)],
      ['an executive', stopGoldBand(Landmark.TeamRocket, RocketRank.Executive)],
      ['the Elite Four', stopGoldBand(Landmark.EliteFour, RocketRank.Grunt)],
      ['Giovanni', stopGoldBand(Landmark.TeamRocket, RocketRank.Boss)],
      ['the Champion', stopGoldBand(Landmark.Champion, RocketRank.Grunt)],
      ['a legend', stopGoldBand(Landmark.Champion, RocketRank.Grunt, undefined, true)],
    ];

    for (const [at, [name, [floor, ceiling]]] of rungs.entries()) {
      expect(floor, name).toBeLessThan(ceiling);

      if (at === 0) {
        continue;
      }

      const [below, over] = rungs[at - 1][1];

      // No rung pays less than the one under it, floor and ceiling
      // alike
      expect(floor, name).toBeGreaterThanOrEqual(below);
      expect(ceiling, name).toBeGreaterThanOrEqual(over);
    }

    // And the ladder actually climbs: the top of it is worth an order
    // of magnitude more than the bottom
    expect(CHAMPION_GOLD[0]).toBeGreaterThanOrEqual(TYPE_TRAINER_GOLD[1] * 10);

    // Two rungs share a purse, and it is the two that share a level
    // band: a grunt is a thief with a roadside party
    expect(ROCKET_GRUNT_GOLD).toEqual(TYPE_TRAINER_GOLD);
    expect(ROCKET_PARTY_LEVELS).toEqual(TYPE_TRAINER_LEVELS);

    // A nugget off the ground sells for 10,000, so nothing on the
    // ladder may be worth less than tripping over one
    expect(rungs[0][1][1]).toBeGreaterThanOrEqual(getItemData(Items.Nugget).sell);

    // And the raids are read off the same ladder, flat because a raid
    // pays everybody who fought it
    expect(SHADOW_RAID_GOLD).toBeGreaterThan(GYM_GOLD[0]);
    expect(SHADOW_RAID_GOLD).toBeLessThan(GYM_GOLD[1]);
    expect(LEGENDARY_RAID_GOLD).toBeGreaterThan(ELITE_GOLD[0]);
    expect(LEGENDARY_RAID_GOLD).toBeLessThan(ELITE_GOLD[1]);
    // A mythical is the largest purse there is, and still under a
    // champion's middle
    expect(MYTHICAL_RAID_GOLD).toBeGreaterThan(LEGENDARY_RAID_GOLD);
    expect(MYTHICAL_RAID_GOLD).toBeLessThan(CHAMPION_GOLD[1]);
  });

  it('leaves an item behind only on the rungs that have one', () => {
    const rolls = (landmark: Landmark, rank: RocketRank): Items[] => {
      const rng = new AleaRNG(`loot-${landmark}-${rank}`);

      return Array.from({ length: 400 }, () =>
        rollStopLoot(landmark, rank, Biome.Grassland, () => rng.random()),
      ).filter((item): item is Items => item != null);
    };

    // A duelling trainer keeps their party and their pockets, and so
    // do the two lower Team Rocket ranks. The gym leader is not here
    // either: theirs is a machine of their own type
    expect(rollStopLoot(Landmark.Trainer, RocketRank.Grunt, Biome.Grassland, () => 0.5)).toBeNull();
    expect(
      rollStopLoot(Landmark.TeamRocket, RocketRank.Grunt, Biome.Grassland, () => 0.5),
    ).toBeNull();
    expect(
      rollStopLoot(Landmark.GymLeader, RocketRank.Grunt, Biome.Grassland, () => 0.5),
    ).toBeNull();

    const executive = rolls(Landmark.TeamRocket, RocketRank.Executive);
    const elite = rolls(Landmark.EliteFour, RocketRank.Grunt);
    const champion = rolls(Landmark.Champion, RocketRank.Grunt);

    // Every one of them lands something, and never out of the base
    // band: the odds shut it out
    for (const drawn of [executive, elite, champion]) {
      expect(drawn).toHaveLength(400);
      for (const item of drawn) {
        expect(getItemBand(item)).not.toBe('base');
        expect(getItemBand(item)).not.toBe('uncommon');
      }
    }

    const share = (items: Items[], band: ItemBand): number =>
      items.filter((item) => getItemBand(item) === band).length / items.length;

    // A thief carries loot and the league reaches higher, but nobody
    // reaches the special band: a champion's seat can be fought every
    // window, and a Master Ball handed out at that rate is not a find
    // of a lifetime any more
    for (const drawn of [executive, elite, champion]) {
      expect(share(drawn, 'special')).toBe(0);
    }
    expect(share(elite, 'prized')).toBeGreaterThan(share(executive, 'prized'));
    expect(share(champion, 'prized')).toBeGreaterThan(share(elite, 'prized'));

    // The one exception, and the whole reason to walk into a legend:
    // a rare or a special at twenty to one, which is the only draw in
    // the game that reaches the special band
    const rng = new AleaRNG('loot-legend');
    const legend = Array.from({ length: 4200 }, () =>
      rollStopLoot(Landmark.Champion, RocketRank.Grunt, Biome.Grassland, () => rng.random(), true),
    ).filter((item): item is Items => item != null);

    expect(legend).toHaveLength(4200);
    for (const item of legend) {
      expect(['rare', 'special']).toContain(getItemBand(item));
    }
    expect(share(legend, 'special')).toBeGreaterThan(0.02);
    expect(share(legend, 'special')).toBeLessThan(0.08);
  });

  it('puts a legend in the champion’s seat now and then, and always under the rarest sky', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getChampionStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const [cell] = [...new ChunkSnapshot(chunk, 0).getChampionStops().keys()];
    let held = 0;

    // The seat is the champion's most windows: the roll is the same
    // one in sixty-four Giovanni turns up on
    for (let window = 0; window < 640; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

      // Under one of the four skies that favour everything the seat
      // is theirs for certain: those are the rarest weather there is
      if (favorsEverything(snapshot.npcWeather)) {
        expect(snapshot.getLegend(cell)).not.toBeNull();
        continue;
      }
      if (snapshot.getLegend(cell) != null) {
        held++;
      }
    }
    expect(held).toBeGreaterThan(0);
    expect(held).toBeLessThan(64);

    // The seat holds whoever it holds for the whole window, whatever
    // the sky does in the middle of it: weather turns over every hour
    // and the people every three, and a server rebuilding the window
    // from its timestamp has to find the same person standing there
    for (let window = 0; window < 32; window++) {
      const opened = new ChunkSnapshot(chunk, window * NPC_INTERVAL);
      const later = new ChunkSnapshot(chunk, window * NPC_INTERVAL + 2 * WEATHER_INTERVAL);

      expect(later.getLegend(cell)).toBe(opened.getLegend(cell));
    }

    // A cell that is nobody's seat holds no legend either
    const elsewhere = [...chunk.getLandmarkCells()].find(
      ([, landmark]) => landmark !== Landmark.Champion,
    );

    expect(new ChunkSnapshot(chunk, 0).getLegend(elsewhere?.[0] ?? 0)).toBeNull();
  });

  it('keeps one leader to a gym and fields 6 of their type', () => {
    const world = new World('overworld');
    const chunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getGymStops().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);

    for (const [cell, party] of snapshot.getGymStops()) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.GymLeader);
      expect(party).toHaveLength(EXPERT_PARTY_SIZE);

      const leader = snapshot.getGymLeader(cell);

      expect(leader).not.toBeNull();
      if (leader == null) {
        continue;
      }
      // The biome names the candidates, so a badge has a country to
      // be hunted in — and the next window keeps whoever was seated
      expect(BIOME_GYM_LEADERS[chunk.biome]).toContain(leader);
      expect(new ChunkSnapshot(chunk, NPC_INTERVAL).getGymLeader(cell)).toBe(leader);

      // Every fielded species carries the gym's type
      for (const [species] of party) {
        expect(getSpeciesData(species).types).toContain(GYM_LEADER_TYPES[leader]);
      }
      // Dressed as the leader themselves
      expect(GYM_LEADER_CHARSETS[leader]).toContain(snapshot.getWandererCoats().get(cell));
    }
  });

  it('stages the elite and the champion with full parties of their own', () => {
    const world = new World('overworld');
    const eliteChunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getEliteStops().size > 0,
    );

    expect(eliteChunk).not.toBeNull();
    if (eliteChunk != null) {
      const snapshot = new ChunkSnapshot(eliteChunk, 0);

      for (const [cell, party] of snapshot.getEliteStops()) {
        const member = snapshot.getEliteMember(cell);

        expect(party).toHaveLength(EXPERT_PARTY_SIZE);
        expect(member).not.toBeNull();
        if (member == null) {
          continue;
        }
        expect(BIOME_ELITE_MEMBERS[eliteChunk.biome]).toContain(member);

        // Their own pool rather than their type alone: an elite whose
        // type runs to one fully-grown species is widened by kinship
        // or by name, so the party is checked against the pool
        const pool = new Set(getEliteMemberRoster(member));

        for (const [species] of party) {
          expect(pool.has(species), getSpeciesData(species).name).toBe(true);
        }
        expect(ELITE_MEMBER_CHARSETS[member]).toContain(snapshot.getWandererCoats().get(cell));
      }
    }

    const champChunk = findChunk(
      world,
      (candidate) => new ChunkSnapshot(candidate, 0).getChampionStops().size > 0,
    );

    expect(champChunk).not.toBeNull();
    if (champChunk != null) {
      const snapshot = new ChunkSnapshot(champChunk, 0);
      const legendaries = new Set(EVERY_LAIR.flatMap((lair) => getLairResidents(lair)));

      for (const [cell, party] of snapshot.getChampionStops()) {
        expect(party).toHaveLength(EXPERT_PARTY_SIZE);
        // The Champion fields no legendary: those belong to raids
        for (const [species] of party) {
          expect(legendaries.has(species)).toBe(false);
        }
        // The seat is the champion's, but a legend may have it this
        // window, and then the coat standing there is theirs
        const legend = snapshot.getLegend(cell);

        if (legend != null) {
          expect(LEGEND_CHARSETS[legend]).toContain(snapshot.getWandererCoats().get(cell));
          continue;
        }

        const champion = snapshot.getChampion(cell);

        expect(champion).not.toBeNull();
        expect(CHAMPION_CHARSETS[champion ?? Champion.Blue]).toContain(
          snapshot.getWandererCoats().get(cell),
        );
      }
    }
  });

  it('prices every rank of stop by its landmark', () => {
    expect(stopPartyLevels(Landmark.GymLeader, RocketRank.Grunt)).toEqual(GYM_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.EliteFour, RocketRank.Grunt)).toEqual(ELITE_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.Champion, RocketRank.Grunt)).toEqual(CHAMPION_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.Champion, RocketRank.Grunt, undefined, true)).toEqual(
      LEGEND_PARTY_LEVELS,
    );
    // Every rank fields six, so it is the rank rather than the party
    // that says what a Team Rocket cell is worth
    expect(stopPartyLevels(Landmark.TeamRocket, RocketRank.Boss)).toEqual(CHAMPION_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.TeamRocket, RocketRank.Executive)).toEqual(ELITE_PARTY_LEVELS);
    expect(stopPartyLevels(Landmark.TeamRocket, RocketRank.Grunt)).toEqual(TYPE_TRAINER_LEVELS);
    // A duellist's band is their class', which the caller passes in
    expect(stopPartyLevels(Landmark.Trainer, RocketRank.Grunt, ACE_TRAINER_LEVELS)).toEqual(
      ACE_TRAINER_LEVELS,
    );
    expect(stopPartyLevels(Landmark.Trainer, RocketRank.Grunt)).toEqual(ROCKET_PARTY_LEVELS);

    // The purse is read the same way, so a Team Rocket cell is priced
    // by who is standing on it rather than by what they brought
    expect(stopGoldBand(Landmark.TeamRocket, RocketRank.Boss)).toEqual(GIOVANNI_GOLD);
    expect(stopGoldBand(Landmark.TeamRocket, RocketRank.Grunt)).toEqual(ROCKET_GRUNT_GOLD);
    expect(stopGoldBand(Landmark.Champion, RocketRank.Grunt)).toEqual(CHAMPION_GOLD);
    expect(stopGoldBand(Landmark.EliteFour, RocketRank.Grunt)).toEqual(ELITE_GOLD);
    expect(stopGoldBand(Landmark.GymLeader, RocketRank.Grunt)).toEqual(GYM_GOLD);
  });

  it('offers any of the boss’ six as the reward', () => {
    const record: StopRecord = {
      player: 'red',
      party: [
        Species.Magnemite,
        Species.Voltorb,
        Species.Porygon,
        Species.Growlithe,
        Species.Ponyta,
        Species.Mewtwo,
      ].map((species, at) => ({
        species,
        individualValue: at,
        traitValue: at,
      })),
      battle: 'battle-id',
      timestamp: 0,
      offset: 0,
      chunk: { seed: 'overworld0,0', x: 0, y: 0 },
      cell: 60,
      defeated: false,
    };
    const met = new Set<Species>();

    for (let winner = 0; winner < 64; winner++) {
      const [, spawn] = deriveStopReward(record, 'stop-id', `player-${winner}`);

      met.add(spawn[0]);
    }
    // Not the weaker half alone: the back of the party is on offer,
    // the legendary included
    expect(met.size).toBeGreaterThan(3);
    expect(
      [...met].some((species) => record.party.slice(3).some((entry) => entry.species === species)),
    ).toBe(true);
  });

  it('pays a beaten grunt out of the half it was not fighting with', () => {
    const record: StopRecord = {
      player: 'red',
      party: [
        { species: Species.Rattata, individualValue: 1, traitValue: 2 },
        { species: Species.Pidgey, individualValue: 3, traitValue: 4 },
        { species: Species.Ekans, individualValue: 5, traitValue: 6 },
        { species: Species.Kangaskhan, individualValue: 7, traitValue: 8 },
        { species: Species.Lapras, individualValue: 9, traitValue: 10 },
        { species: Species.Snorlax, individualValue: 11, traitValue: 12 },
      ],
      battle: 'battle-id',
      timestamp: 0,
      offset: 0,
      chunk: { seed: 'chunk', x: 0, y: 0 },
      cell: 0,
      defeated: false,
    };

    const offered = new Set<Species>();

    for (const uid of ['red', 'blue', 'green', 'yellow', 'gold', 'silver']) {
      const [id, [species, individualValue, traitValue]] = deriveStopReward(record, 'stop-id', uid);

      offered.add(species);
      expect(id).toBe('stop-id$reward');
      // Each winner meets their own individual of it
      expect(individualValue).not.toBe(traitValue);
    }

    // Every one of the six comes up across enough winners: a grunt
    // puts its whole party up the way the ranks above it do
    expect(offered.size).toBeGreaterThan(1);

    // A player's own reward is the same however often it is derived
    expect(deriveStopReward(record, 'stop-id', 'red')).toEqual(
      deriveStopReward(record, 'stop-id', 'red'),
    );
  });
});
