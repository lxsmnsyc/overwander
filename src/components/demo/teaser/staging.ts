import { BASE_FRIENDSHIP } from '../../../data/constants/friendship';
import type { CatchSnapshot } from '../../../auth/catch-snapshot';
import { getMaxHealth } from '../../../auth/health';
import type { TeamSnapshotRecord } from '../../../auth/teams';
import AleaRNG from '../../../core/alea';
import { defaultSlots } from '../../../data/constants/slots';
import { MAX_IV, Stats, packIVs } from '../../../data/constants/stats';
import type Biome from '../../../data/ids/biome';
import type { Species } from '../../../data/ids/species';
import { getRentalPool } from '../../../data/overworld/experts/frontier';
import Landmark from '../../../data/overworld/landmark';
import { LAIR_NAMES } from '../../../data/overworld/lair';
import type Weather from '../../../data/overworld/weather';
import { BattleModes } from '../../../battle/core';
import ChunkSnapshot, {
  RAID_INTERVAL,
  type RaidRoll,
  RocketRank,
} from '../../../overworld/chunk-snapshot';
import { getSpeciesData } from '../../../data/species';
import getWorld from '../../../overworld/current';
import {
  deriveAbility,
  deriveGender,
  deriveMoves,
  deriveNature,
  deriveSize,
} from '../../../overworld/encounter';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, createRaidBossSnapshot } from '../../../overworld/raid';
import { type RaidBattle, createRaidBattle } from '../../../overworld/raid-battle';
import { createTrainerBattle } from '../../../overworld/stop-battle';
import { STOP_ALLIANCE } from '../../../overworld/stop/loot';
import {
  createStopParty,
  stopChallenger,
  stopOutfit,
  stopPartyLevels,
} from '../../../overworld/stop';
import { trainerLevels } from '../../../data/overworld/trainers';
import { BIOME_NAMES } from '../../../data/biome/names';
import { worldCell } from '../../../overworld/grid';
import { nearestFreeCell } from '../../../overworld/start';

/** A fight staged off the real world, with what the top bar and field need to draw it */
export interface StagedFight {
  built: RaidBattle;
  title: string;
  biome: Biome;
  weather: Weather;
  /** The player whose side is drawn at the bottom */
  player: string;
}

/** How far the finders search from the origin, in chunks */
const SEARCH_RADIUS = 60;

/** Chunks in widening rings round the origin, so the nearest match is found first */
function* chunksOutward(): Generator<[number, number]> {
  yield [0, 0];
  for (let ring = 1; ring <= SEARCH_RADIUS; ring++) {
    for (let step = -ring; step < ring; step++) {
      yield [step, -ring];
      yield [ring, step];
      yield [-step, ring];
      yield [-ring, -step];
    }
  }
}

/** The first chunk, nearest the origin, whose landmarks include one of these */
export function findLandmark(
  wanted: Set<Landmark>,
  skip = 0,
): { chunkX: number; chunkY: number; cell: number; landmark: Landmark } | null {
  const world = getWorld();
  let passed = 0;

  for (const [chunkX, chunkY] of chunksOutward()) {
    for (const [cell, landmark] of world.getChunk(chunkX, chunkY).getLandmarkCells()) {
      if (wanted.has(landmark)) {
        if (passed === skip) {
          return { chunkX, chunkY, cell, landmark };
        }
        passed++;
      }
    }
  }
  return null;
}

/** A free cell in the nearest chunk of the named biome, past the first `skip` */
export function findBiome(name: string, skip = 0): [number, number] | null {
  const world = getWorld();
  let passed = 0;

  for (const [chunkX, chunkY] of chunksOutward()) {
    const chunk = world.getChunk(chunkX, chunkY);

    if (BIOME_NAMES[chunk.biome] !== name) {
      continue;
    }
    if (passed === skip) {
      const { cellX, cellY } = nearestFreeCell(world, chunkX, chunkY, 8, 8);

      return [worldCell(chunkX, cellX), worldCell(chunkY, cellY)];
    }
    passed++;
  }
  return null;
}

/**
 * One pokemon for a player's party, drawn from the species the game's
 * own opponents draw from: fully grown, obtainable and never a lair
 * resident. Built with the same derive helpers a real encounter uses
 */
function rollMember(random: () => number, level: number): CatchSnapshot {
  const pool = getRentalPool();
  const species: Species = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  const traitValue = Math.floor(random() * 0x1_0000_0000);
  const roll = (): number => Math.floor(random() * (MAX_IV + 1));
  const ivs = packIVs({
    [Stats.HP]: roll(),
    [Stats.Attack]: roll(),
    [Stats.Defense]: roll(),
    [Stats.SpecialAttack]: roll(),
    [Stats.SpecialDefense]: roll(),
    [Stats.Speed]: roll(),
  });
  const effortValues = {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
  const size = deriveSize(species, traitValue);

  return {
    caught: '',
    species,
    level,
    ivs,
    effortValues,
    nature: deriveNature(traitValue),
    gender: deriveGender(species, traitValue),
    height: size.height,
    weight: size.weight,
    shiny: false,
    shadow: false,
    moves: deriveMoves(species, level),
    movePoints: {},
    abilities: [deriveAbility(species, traitValue)],
    items: [],
    slots: defaultSlots(),
    health: getMaxHealth({ species, level, ivs, effortValues }),
    friendship: BASE_FRIENDSHIP,
    statuses: 0,
  };
}

function rollParty(seed: string, size: number, level: number): CatchSnapshot[] {
  const rng = new AleaRNG(`teaser:${seed}`);
  const random = (): number => rng.random();
  const party: CatchSnapshot[] = [];

  for (let member = 0; member < size; member++) {
    party.push(rollMember(random, level));
  }
  return party;
}

/**
 * A fight against a real stop in the world: a gym leader, a trainer or
 * Team Rocket, fielding the party the window rolled for that cell
 */
export function stageStopFight(
  kinds: Set<Landmark>,
  skip: number,
  now: number,
  offset: number,
): StagedFight | null {
  const found = findLandmark(kinds, skip);

  if (found == null) {
    return null;
  }
  const chunk = getWorld().getChunk(found.chunkX, found.chunkY);
  const snapshot = new ChunkSnapshot(chunk, now, offset);
  let stops = snapshot.getTrainerStops();

  if (found.landmark === Landmark.GymLeader) {
    stops = snapshot.getGymStops();
  } else if (found.landmark === Landmark.TeamRocket) {
    stops = snapshot.getRocketStops();
  }
  const spawns = stops.get(found.cell);

  if (spawns == null || spawns.length === 0) {
    return stageStopFight(kinds, skip + 1, now, offset);
  }
  const rank = snapshot.getRocketRank(found.cell) ?? RocketRank.Grunt;
  const legend = snapshot.getLegend(found.cell) != null;
  const duellist = snapshot.getTrainerClass(found.cell) ?? undefined;
  const levels = stopPartyLevels(
    found.landmark,
    rank,
    duellist == null ? undefined : trainerLevels(duellist),
    legend,
  );
  const opponents = createStopParty(
    snapshot,
    spawns,
    found.landmark === Landmark.TeamRocket,
    levels,
    stopOutfit(found.landmark, rank, legend, duellist),
  );
  const player = 'teaser';
  const teams: TeamSnapshotRecord[] = [
    { player: '', alliance: STOP_ALLIANCE, catches: opponents },
    {
      player,
      alliance: PLAYER_ALLIANCE,
      catches: rollParty(`${snapshot.key}:${found.cell}`, opponents.length, levels[1]),
    },
  ];
  const biome = snapshot.biomeAt(found.cell);
  const weather = snapshot.weather;

  return {
    built: createTrainerBattle(
      `teaser:${snapshot.key}:${found.cell}`,
      teams,
      undefined,
      BattleModes.Npc,
      weather,
      biome,
    ),
    title: stopChallenger(snapshot, found.cell)?.name ?? 'Team Rocket',
    biome,
    weather,
    player,
  };
}

/** How far back a named boss is searched for, in raid windows: about a month */
const BOSS_WINDOWS = 240;

/**
 * The nearest lair staging a raid. With a boss named, each lair's past
 * windows are searched too, so the boss is one the world really rolled
 */
function findRaid(
  shadow: boolean,
  now: number,
  offset: number,
  boss?: string,
): { snapshot: ChunkSnapshot; cell: number; roll: RaidRoll } | null {
  const kind = shadow ? Landmark.ShadowLair : Landmark.LegendaryLair;
  const world = getWorld();
  const windows = boss == null ? 1 : BOSS_WINDOWS;

  for (const [chunkX, chunkY] of chunksOutward()) {
    const chunk = world.getChunk(chunkX, chunkY);

    for (const [cell, landmark] of chunk.getLandmarkCells()) {
      if (landmark !== kind) {
        continue;
      }
      for (let window = 0; window < windows; window++) {
        const snapshot = new ChunkSnapshot(chunk, now - window * RAID_INTERVAL, offset);
        const roll = (shadow ? snapshot.getShadowLairs() : snapshot.getLegendaryLairs()).get(cell);

        if (roll != null && (boss == null || getSpeciesData(roll.species).name === boss)) {
          return { snapshot, cell, roll };
        }
      }
    }
  }
  return null;
}

/** How many players a teaser raid fields, each with a full party */
const RAID_PARTIES = 6;
const RAID_PARTY_SIZE = 6;
const RAID_PARTY_LEVEL = 70;

/**
 * A raid on a real lair in the world: the boss this window stages
 * there, against a lobby of players' parties
 */
export function stageRaid(
  shadow: boolean,
  now: number,
  offset: number,
  boss?: string,
): StagedFight | null {
  const found = findRaid(shadow, now, offset, boss);

  if (found == null) {
    return null;
  }
  const { snapshot, cell, roll } = found;
  const teams: TeamSnapshotRecord[] = [
    {
      player: '',
      alliance: BOSS_ALLIANCE,
      catches: [createRaidBossSnapshot(roll.species, roll.traitValue, shadow)],
    },
  ];

  for (let party = 0; party < RAID_PARTIES; party++) {
    teams.push({
      player: `teaser-${party}`,
      alliance: PLAYER_ALLIANCE,
      catches: rollParty(`${snapshot.key}:${cell}:${party}`, RAID_PARTY_SIZE, RAID_PARTY_LEVEL),
    });
  }
  const biome = snapshot.biomeAt(cell);
  const named = roll.lair == null ? null : LAIR_NAMES[roll.lair];

  return {
    built: createRaidBattle(`teaser:${snapshot.key}:${cell}`, teams, undefined, biome),
    title: named == null ? 'Raid Battle' : `Raid Battle: ${named}`,
    biome,
    weather: snapshot.weather,
    player: 'teaser-0',
  };
}
