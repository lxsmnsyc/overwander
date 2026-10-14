import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type CatchSnapshot, asCatchSnapshot } from '../../src/model/catch-snapshot';
import {
  RaidKind,
  type RaidRecord,
  deriveRaidReward,
  rewardLobbyOf,
} from '../../src/model/raid-record';
import registerGameData from '../../src/data';
import { Types } from '../../src/data/constants/types';
import { Species } from '../../src/data/ids/species';
import { getSpeciesData } from '../../src/data/species';
import { TERA_TYPES } from '../../src/data/species/tera-type';
import { getTeraShard } from '../../src/data/items/tera-shards';
import { getTeraRaidType } from '../../src/data/overworld/tera-raids';
import {
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  createRaidBossTeam,
  keepsGigantamaxFactor,
  keptTeraType,
} from '../../src/overworld/raid/index';
import { createRaidBattle } from '../../src/overworld/raid/battle';
import { EncounterType } from '../../src/overworld/encounter';

beforeAll(() => {
  registerGameData();
  // Starting a fight starts its frame clock, which a test drives by hand
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const TRAIT = 0x13579bdf;
const LOBBY = 'seed+0@0$tera12';

function teraBoss(species: Species, tera: Types): CatchSnapshot[] {
  return createRaidBossTeam(species, TRAIT, false, false, false, false, false, tera);
}

describe('a Tera raid boss', () => {
  it('is staged alone, Terastallized into the Tera type it is given', () => {
    const team = teraBoss(Species.Charizard, Types.Water);

    expect(team).toHaveLength(1);
    expect(team[0].terastallized).toBe(true);
    expect(team[0].teraType).toBe(Types.Water);
    expect(team[0].dynamaxed).toBeUndefined();
  });

  it('leaves every other raid boss as it was', () => {
    const [plain] = createRaidBossTeam(Species.Charizard, TRAIT, false, false);

    expect(plain.terastallized).toBeUndefined();
    expect(plain.teraType).toBeUndefined();
  });

  it('keeps the mark through a stored snapshot', () => {
    const [stored] = teraBoss(Species.Charizard, Types.Grass);
    const read = asCatchSnapshot(JSON.parse(JSON.stringify(stored)));

    expect(read.terastallized).toBe(true);
    expect(read.teraType).toBe(Types.Grass);
  });

  it('fights Terastallized from the start, hit as its Tera type alone', () => {
    const boss = teraBoss(Species.Charizard, Types.Water);
    const built = createRaidBattle('tera-seed', [
      { player: '', alliance: BOSS_ALLIANCE, catches: boss },
      {
        player: 'trainer',
        alliance: PLAYER_ALLIANCE,
        catches: [{ ...boss[0], caught: 'mine', abilities: [], terastallized: undefined }],
      },
    ]);

    built.battle.initialize();
    built.battle.start();

    const [unit] = built.units.get(BOSS_ALLIANCE) ?? [];
    const [player] = built.units.get(PLAYER_ALLIANCE) ?? [];

    expect(unit.terastallized).toBe(true);
    expect(unit.teraType).toBe(Types.Water);
    expect([...unit.types]).toEqual([Types.Water]);
    // A party member holding no orb stays as it is
    expect(player.terastallized).toBe(false);
    expect([...player.types]).toEqual(getSpeciesData(Species.Charizard).types);
  });
});

describe('a Tera raid boss Tera type', () => {
  it('is read off the lobby, the same every time', () => {
    expect(getTeraRaidType(Species.Pikachu, LOBBY)).toBe(getTeraRaidType(Species.Pikachu, LOBBY));
  });

  it('is often one of its own types and often any of the 18', () => {
    let own = 0;
    let other = 0;

    for (let at = 0; at < 400; at++) {
      const type = getTeraRaidType(Species.Pikachu, `lobby-${at}`);

      expect(TERA_TYPES).toContain(type);
      if (type === Types.Electric) {
        own++;
      } else {
        other++;
      }
    }
    // Half own by the share, and one in eighteen of the rest by chance
    expect(own / 400).toBeGreaterThan(0.4);
    expect(other / 400).toBeGreaterThan(0.3);
  });

  it('always has a shard to pay out', () => {
    for (const type of TERA_TYPES) {
      expect(getTeraShard(type)).not.toBeNull();
    }
  });
});

describe('a Tera raid prize', () => {
  const raid: RaidRecord = {
    kind: RaidKind.Tera,
    lair: null,
    biome: 0,
    species: Species.Pikachu,
    traitValue: TRAIT,
    host: '',
    teams: [],
    battle: null,
    timestamp: 0,
    offset: 0,
    chunk: { seed: '', x: 0, y: 0 },
    cell: 12,
    cleared: false,
  };

  it('keeps its boss Tera type', () => {
    const [spawn] = deriveRaidReward(raid, LOBBY, 'player');

    expect(rewardLobbyOf(spawn)).toBe(LOBBY);
    expect(keptTeraType({ type: EncounterType.TeraRaid, species: Species.Pikachu, spawn })).toBe(
      getTeraRaidType(Species.Pikachu, LOBBY),
    );
  });

  it('is the only arrival that does', () => {
    const [spawn] = deriveRaidReward(raid, LOBBY, 'player');

    expect(
      keptTeraType({ type: EncounterType.MaxRaid, species: Species.Pikachu, spawn }),
    ).toBeNull();
    expect(
      keptTeraType({ type: EncounterType.TeraRaid, species: Species.Pikachu, spawn: 'wild' }),
    ).toBeNull();
    expect(keepsGigantamaxFactor({ type: EncounterType.TeraRaid, species: Species.Pikachu })).toBe(
      false,
    );
  });
});
