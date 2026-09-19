// The true shadows: what a dark day stages, and nothing else does.

import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns, { spawnBand } from '../../../src/data/biome';
import registerItems from '../../../src/data/items';
import { registerMoves } from '../../../src/data/moves';
import {
  TRUE_SHADOW_BONUS,
  getSpeciesData,
  getTrueShadow,
  getTrueShadowCounterpart,
  isTrueShadow,
  listTrueShadows,
  registerSpecies,
  trueShadowName,
} from '../../../src/data/species';
import { Stats } from '../../../src/data/constants/stats';
import { Species } from '../../../src/data/ids/species';
import Weather from '../../../src/data/overworld/weather';
import Landmark from '../../../src/data/overworld/landmark';
import ChunkSnapshot, {
  RAID_INTERVAL,
  WEATHER_INTERVAL,
} from '../../../src/overworld/chunk-snapshot';
import { PLACEMENT_AREA, centeredCells } from '../../../src/overworld/chunk';
import deriveEncounter, { EncounterType } from '../../../src/overworld/encounter';
import World from '../../../src/overworld/world';

registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

/** A window and chunk whose sky is the one that stages them */
function findDarkDay(
  world: World,
  wants: (chunk: ReturnType<World['getChunk']>) => boolean = () => true,
  opens: (window: number) => boolean = () => true,
): { x: number; y: number; window: number } | null {
  for (let window = 0; window < 4000; window += 1) {
    if (!opens(window)) {
      continue;
    }
    for (let x = 0; x < 16; x += 1) {
      for (let y = 0; y < 16; y += 1) {
        if (world.getWeather(x, y, window) === Weather.DarkDay && wants(world.getChunk(x, y))) {
          return { x, y, window };
        }
      }
    }
  }

  return null;
}

describe('what a true shadow is', () => {
  it('is a form of its counterpart, ten points better everywhere', () => {
    for (const shadow of listTrueShadows()) {
      const counterpart = getTrueShadowCounterpart(shadow);

      expect(counterpart).not.toBeNull();

      const base = getSpeciesData(counterpart ?? Species.Articuno);
      const data = getSpeciesData(shadow);

      expect(data.baseForm).toBe(false);
      expect(data.dexNumber).toBe(base.dexNumber);
      expect(data.types).toEqual(base.types);
      expect(data.name).toBe(trueShadowName(shadow));
      for (const stat of [
        Stats.HP,
        Stats.Attack,
        Stats.Defense,
        Stats.SpecialAttack,
        Stats.SpecialDefense,
        Stats.Speed,
      ]) {
        expect(data.stats[stat]).toBe(base.stats[stat] + TRUE_SHADOW_BONUS);
      }

      // Met under a sky rather than in a country, so no biome lists one
      expect(data.biomes).toEqual([]);
    }
  });

  it('goes by its dex number rather than by the bird it is the shadow of', () => {
    expect(getSpeciesData(Species.ArticunoShadow).name).toBe('XD-144');
    expect(getSpeciesData(Species.ZapdosShadow).name).toBe('XD-145');
    expect(getSpeciesData(Species.MoltresShadow).name).toBe('XD-146');
  });

  it('pairs each bird with its own shadow, and nothing else', () => {
    expect(getTrueShadow(Species.Articuno)).toBe(Species.ArticunoShadow);
    expect(getTrueShadow(Species.Pikachu)).toBeNull();
    expect(isTrueShadow(Species.ArticunoShadow)).toBe(true);
    expect(isTrueShadow(Species.Articuno)).toBe(false);
  });

  it('arrives shadowed whatever it was met in', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const met = deriveEncounter(snapshot, [Species.ArticunoShadow, 1, 1], 'player-uid', {
      type: EncounterType.ShadowRaid,
    });

    expect(met.shadow).toBe(true);

    // Its counterpart under the same meeting is not
    expect(
      deriveEncounter(snapshot, [Species.Articuno, 1, 1], 'player-uid', {
        type: EncounterType.LegendaryRaid,
      }).shadow,
    ).toBe(false);
  });
});

describe('where a true shadow is met', () => {
  it('stands in the special band of a dark day, and in no other sky', () => {
    const world = new World('overworld');
    const dark = findDarkDay(world);

    expect(dark).not.toBeNull();

    const { x, y, window } = dark ?? { x: 0, y: 0, window: 0 };
    const chunk = world.getChunk(x, y);
    const under = new ChunkSnapshot(chunk, window * WEATHER_INTERVAL);

    expect(under.weather).toBe(Weather.DarkDay);

    const cell = centeredCells(PLACEMENT_AREA)[0];
    const staged = new Set(spawnBand(under.getCellPool(cell), 'special').map((e) => e.species));

    for (const shadow of listTrueShadows()) {
      expect(staged.has(shadow)).toBe(true);
    }

    // The same chunk in an hour the sky is ordinary stages none of them
    let plain: ChunkSnapshot | null = null;

    for (let step = 1; step < 200 && plain == null; step += 1) {
      const other = new ChunkSnapshot(chunk, (window + step) * WEATHER_INTERVAL);

      if (other.weather !== Weather.DarkDay) {
        plain = other;
      }
    }
    expect(plain).not.toBeNull();

    if (plain != null) {
      const ordinary = new Set(spawnBand(plain.getCellPool(cell), 'special').map((e) => e.species));

      for (const shadow of listTrueShadows()) {
        expect(ordinary.has(shadow)).toBe(false);
      }
    }
  });

  it('takes over every shadow lair while the dark day lasts', () => {
    const world = new World('overworld');
    const holds = (chunk: ReturnType<World['getChunk']>): boolean => {
      for (const landmark of chunk.getLandmarkCells().values()) {
        if (landmark === Landmark.ShadowLair) {
          return true;
        }
      }

      return false;
    };
    // A raid reads the sky at its own window rather than at the hour,
    // so the hour has to be one a raid window opens on
    const dark = findDarkDay(
      world,
      holds,
      (window) => (window * WEATHER_INTERVAL) % RAID_INTERVAL === 0,
    );

    expect(dark).not.toBeNull();

    const { x, y, window } = dark ?? { x: 0, y: 0, window: 0 };
    const snapshot = new ChunkSnapshot(world.getChunk(x, y), window * WEATHER_INTERVAL);

    expect(snapshot.raidWeather).toBe(Weather.DarkDay);

    const staged = [...snapshot.getShadowLairs().values()];

    expect(staged.length).toBeGreaterThan(0);
    for (const roll of staged) {
      // Guaranteed rather than rolled for: the sky is the whole draw
      expect(isTrueShadow(roll.species)).toBe(true);
      expect(roll.lair).toBeNull();
    }
  });
});
