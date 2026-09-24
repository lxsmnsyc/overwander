import AleaRNG from '../../core/alea';
import DungeonKind, { FloorGate } from '../../data/overworld/dungeon';
import {
  FRONTIER_BRAIN_CHARSETS,
  FRONTIER_BRAIN_NAMES,
  FRONTIER_BRAIN_RULES,
  FRONTIER_TEAM_SIZE,
  FrontierRule,
  getRentalPool,
} from '../../data/overworld/experts';
import Landmark from '../../data/overworld/landmark';
import { pickLairSpecies } from '../../data/overworld/lair';
import { EXECUTIVE_CHARSETS } from '../../data/overworld/npc';
import {
  SYNDICATE_BOSS_CHARSETS,
  SYNDICATE_EXECUTIVES,
  SYNDICATE_GRUNT_CHARSETS,
  bossName,
  executiveName,
  gruntName,
} from '../../data/overworld/syndicate';
import { TRAINER_CHARSETS, TrainerClass, trainerNameIn } from '../../data/overworld/trainers';
import type ChunkSnapshot from '../chunk-snapshot';
import {
  type RaidRoll,
  RocketRank,
  type Spawn,
  drawSyndicateParty,
  rentedParty,
} from '../chunk-snapshot';
import { canStageBoss } from '../raid';
import {
  CHAMPION_OUTFIT,
  ELITE_OUTFIT,
  FRONTIER_OUTFIT,
  PLAIN_OUTFIT,
  type StopOutfit,
} from '../stop/outfits';
import {
  EXECUTIVE_PARTY_LEVELS,
  FRONTIER_PARTY_LEVELS,
  GIOVANNI_PARTY_LEVELS,
  type LevelBand,
  ROCKET_PARTY_LEVELS,
} from '../stop/levels';
import { RoomKind } from './floor';
import { type DungeonLayout, generateDungeon } from './layout';

/** Which kind of dungeon a landmark is, or null for anything else */
export function dungeonKindOf(landmark: Landmark | undefined): DungeonKind | null {
  if (landmark === Landmark.Hideout) {
    return DungeonKind.Hideout;
  }
  if (landmark === Landmark.Dungeon) {
    return DungeonKind.Dungeon;
  }
  return landmark === Landmark.FrontierBrain ? DungeonKind.Frontier : null;
}

/** What a run of this dungeon in this window is seeded from */
export function dungeonSeed(snapshot: ChunkSnapshot, cell: number): string {
  return `${snapshot.key}${snapshot.npcTimestamp}dungeon${cell}`;
}

const LAYOUTS = new WeakMap<ChunkSnapshot, Map<number, DungeonLayout | null>>();

/**
 * The window's floors at this cell, or null where the cell holds no
 * dungeon or a Dungeon has no legendary to end in
 */
export function getDungeonLayout(snapshot: ChunkSnapshot, cell: number): DungeonLayout | null {
  let held = LAYOUTS.get(snapshot);

  if (held == null) {
    held = new Map();
    LAYOUTS.set(snapshot, held);
  }
  if (held.has(cell)) {
    return held.get(cell) ?? null;
  }

  const kind = dungeonKindOf(snapshot.chunk.getLandmarkCells().get(cell));
  const quiet =
    kind == null ||
    (kind === DungeonKind.Dungeon && getDungeonLegendary(snapshot, cell) == null) ||
    (kind === DungeonKind.Frontier && snapshot.getFrontierBrain(cell) == null) ||
    (kind !== DungeonKind.Frontier && snapshot.getFightBands(snapshot.biomeAt(cell)) == null);
  const layout = quiet ? null : generateDungeon(kind, dungeonSeed(snapshot, cell));

  held.set(cell, layout);
  return layout;
}

/** Everything a room's fight is staged from */
export interface DungeonFoe {
  party: Spawn[];
  shadow: boolean;
  levels: LevelBand;
  outfit: StopOutfit;
  rules: FrontierRule;
  /** Where a stop would be a rank: what the fight is worth */
  rank: RocketRank;
  name: string;
  sprite: string;
}

/** Whether a room holds somebody to beat */
export function hasFoe(layout: DungeonLayout, floor: number, room: number): boolean {
  const at = layout.floors[floor];
  const kind = at.rooms[room].kind;

  if (kind === RoomKind.Trainer) {
    return true;
  }
  if (kind === RoomKind.Stairs) {
    return at.gate === FloorGate.Guard;
  }
  // A Dungeon's last room is a legendary to meet, not a fight
  return kind === RoomKind.Boss && layout.kind !== DungeonKind.Dungeon;
}

/**
 * A Dungeon horde's level band by floor: a rare spawn's level on the
 * first, and past 70 by the floor before the legendary
 */
function hordeLevels(floor: number): LevelBand {
  return [Math.min(90, 25 + floor * 10), Math.min(95, 35 + floor * 10)];
}

/** The biggest a wild horde comes */
export const HORDE_MAX = 6;

/** How many a hideout grunt fields: one of each of the biome's bands */
export const HIDEOUT_GRUNT_SIZE = 3;

function pickFrom<T>(list: T[], random: () => number): T {
  return list[Math.floor(random() * list.length)];
}

/**
 * Who fights in a room, or null for a room with nobody in it. `gold`
 * is the Brain's second three, the challenger's own question
 */
export function dungeonFoe(
  snapshot: ChunkSnapshot,
  cell: number,
  floor: number,
  room: number,
  gold = false,
): DungeonFoe | null {
  const layout = getDungeonLayout(snapshot, cell);

  if (layout == null || floor >= layout.floors.length || !hasFoe(layout, floor, room)) {
    return null;
  }

  const kind = layout.floors[floor].rooms[room].kind;
  const rng = new AleaRNG(`${dungeonSeed(snapshot, cell)}foe${floor}:${room}`);
  const random = (): number => rng.random();
  const int32 = (): number => rng.int32();

  if (layout.kind === DungeonKind.Frontier) {
    const brain = snapshot.getFrontierBrain(cell);

    if (brain == null) {
      return null;
    }

    const rules = FRONTIER_BRAIN_RULES[brain];

    if (kind === RoomKind.Boss) {
      return {
        party: snapshot.getFrontierStop(cell, gold) ?? [],
        shadow: false,
        levels: FRONTIER_PARTY_LEVELS,
        outfit: FRONTIER_OUTFIT,
        rules,
        rank: RocketRank.Boss,
        name: FRONTIER_BRAIN_NAMES[brain],
        sprite: pickFrom(FRONTIER_BRAIN_CHARSETS[brain], random),
      };
    }

    const sprite = pickFrom(TRAINER_CHARSETS[TrainerClass.AceTrainer], random);
    // The Dome and the Hall answer what the challenger brings, so the
    // house draws those three when the fight starts
    const answers = rules === FrontierRule.Countered || rules === FrontierRule.Singled;

    return {
      party: answers
        ? []
        : rentedParty(
            getRentalPool(),
            FRONTIER_TEAM_SIZE,
            `${dungeonSeed(snapshot, cell)}crate${floor}`,
          ),
      shadow: false,
      levels: FRONTIER_PARTY_LEVELS,
      outfit: FRONTIER_OUTFIT,
      rules,
      rank: RocketRank.Executive,
      name: trainerNameIn(TrainerClass.AceTrainer, sprite),
      sprite,
    };
  }

  const bands = snapshot.getFightBands(snapshot.biomeAt(cell));

  if (bands == null) {
    return null;
  }

  if (layout.kind === DungeonKind.Hideout) {
    const syndicate = snapshot.getSyndicate();

    if (kind === RoomKind.Boss) {
      return {
        party: drawSyndicateParty(RocketRank.Boss, bands, snapshot.biomeAt(cell), random, int32),
        shadow: true,
        levels: GIOVANNI_PARTY_LEVELS,
        outfit: CHAMPION_OUTFIT,
        rules: FrontierRule.None,
        rank: RocketRank.Boss,
        name: bossName(syndicate),
        sprite: pickFrom(SYNDICATE_BOSS_CHARSETS[syndicate], random),
      };
    }
    if (kind === RoomKind.Stairs) {
      const executive = pickFrom(SYNDICATE_EXECUTIVES[syndicate], random);

      return {
        party: drawSyndicateParty(
          RocketRank.Executive,
          bands,
          snapshot.biomeAt(cell),
          random,
          int32,
        ),
        shadow: true,
        levels: EXECUTIVE_PARTY_LEVELS,
        outfit: ELITE_OUTFIT,
        rules: FrontierRule.None,
        rank: RocketRank.Executive,
        name: executiveName(syndicate, executive),
        sprite: pickFrom(EXECUTIVE_CHARSETS[executive], random),
      };
    }
    return {
      party: drawSyndicateParty(
        RocketRank.Grunt,
        bands,
        snapshot.biomeAt(cell),
        random,
        int32,
        HIDEOUT_GRUNT_SIZE,
      ),
      shadow: true,
      levels: ROCKET_PARTY_LEVELS,
      outfit: PLAIN_OUTFIT,
      rules: FrontierRule.None,
      rank: RocketRank.Grunt,
      name: gruntName(syndicate),
      sprite: pickFrom(SYNDICATE_GRUNT_CHARSETS[syndicate], random),
    };
  }

  // A wild horde out of the uncommon and rare bands, fuller on the
  // stairs than in a room
  const [, uncommons, rares] = bands;
  const size = kind === RoomKind.Stairs ? HORDE_MAX : 1 + Math.floor(random() * HORDE_MAX);
  const party: Spawn[] = [];

  for (let at = 0; at < size; at++) {
    const entry = pickFrom(random() < 0.5 ? uncommons : rares, random);

    party.push([entry.species, int32(), int32()]);
  }
  return {
    party,
    shadow: false,
    levels: hordeLevels(floor),
    outfit: PLAIN_OUTFIT,
    rules: FrontierRule.None,
    rank: kind === RoomKind.Stairs ? RocketRank.Executive : RocketRank.Grunt,
    name: '',
    sprite: '',
  };
}

/**
 * The legendary a Dungeon ends in, out of the lairs its biome hosts,
 * or null where it hosts none
 */
export function getDungeonLegendary(snapshot: ChunkSnapshot, cell: number): RaidRoll | null {
  if (dungeonKindOf(snapshot.chunk.getLandmarkCells().get(cell)) !== DungeonKind.Dungeon) {
    return null;
  }

  const lairs = snapshot.getStageableLairs();

  if (lairs.length === 0) {
    return null;
  }

  const rng = new AleaRNG(`${dungeonSeed(snapshot, cell)}legendary`);
  const lair = lairs[Math.floor(rng.random() * lairs.length)];

  return {
    lair,
    species: pickLairSpecies(lair, canStageBoss, rng.int32()),
    traitValue: rng.int32(),
  };
}
