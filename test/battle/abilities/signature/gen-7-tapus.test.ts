// The Tapus, with Electric, Psychic and Grassy Surge.

import { describe, expect, it } from 'vitest';
import { BLESSING_SCALE } from '../../../../src/battle/abilities/signature/__create';
import turns from '../../../../src/battle/turn';
import { SpawnRarity, getSpawnRarity } from '../../../../src/data/biome';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Species } from '../../../../src/data/ids/species';
import { Terrains } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';

const SURGES = [
  [Abilities.ElectricSurge, Terrains.Electric],
  [Abilities.PsychicSurge, Terrains.Psychic],
  [Abilities.GrassySurge, Terrains.Grassy],
] as const;

describe('the Surges', () => {
  for (const [ability, terrain] of SURGES) {
    it(`lays its terrain as it takes the field (${terrain})`, () => {
      const { battle, teamA, teamB } = createBattle();
      const guardian = createUnit(battle, teamA);
      const foe = createUnit(battle, teamB);

      pinRandom(battle, 1);
      guardian.addAbility(ability);
      foe.enter();

      expect(foe.checkTerrain()).toBe(Terrains.None);

      guardian.enter();
      battle.tick(turns(1));

      expect(foe.checkTerrain()).toBe(terrain);
    });
  }
});

const BLESSINGS = [
  [Abilities.StormBlessing, Abilities.ElectricSurge, Stats.Speed],
  [Abilities.MindBlessing, Abilities.PsychicSurge, Stats.SpecialAttack],
  [Abilities.WildBlessing, Abilities.GrassySurge, Stats.Attack],
  [Abilities.MistBlessing, Abilities.MistySurge, Stats.SpecialDefense],
] as const;

describe('the Blessings', () => {
  for (const [blessing, surge, stat] of BLESSINGS) {
    it(`lifts its own team's stat under its own terrain only (${blessing})`, () => {
      const { battle, teamA, teamB } = createBattle();
      const guardian = createUnit(battle, teamA);
      const layer = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA, [Types.Flying]);
      const foe = createUnit(battle, teamB);

      pinRandom(battle, 1);
      guardian.addAbility(blessing);
      layer.addAbility(surge);
      guardian.enter();
      mate.enter();
      foe.enter();

      const bare = mate.checkStat(stat, 0);
      const foeBare = foe.checkStat(stat, 0);

      layer.enter();
      battle.tick(turns(1));

      // The field is read, so a teammate in the air is blessed too
      expect(mate.checkStat(stat, 0)).toBeCloseTo(bare * BLESSING_SCALE, 5);
      expect(foe.checkStat(stat, 0)).toBe(foeBare);
    });
  }

  it('does nothing under another terrain', () => {
    const { battle, teamA } = createBattle();
    const guardian = createUnit(battle, teamA);
    const layer = createUnit(battle, teamA);

    pinRandom(battle, 1);
    guardian.addAbility(Abilities.StormBlessing);
    layer.addAbility(Abilities.PsychicSurge);
    guardian.enter();

    const bare = guardian.checkStat(Stats.Speed, 0);

    layer.enter();
    battle.tick(turns(1));

    expect(guardian.checkStat(Stats.Speed, 0)).toBe(bare);
  });

  it('blesses a team once however many holders it has', () => {
    const { battle, teamA } = createBattle();
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const layer = createUnit(battle, teamA);

    pinRandom(battle, 1);
    first.addAbility(Abilities.StormBlessing);
    second.addAbility(Abilities.StormBlessing);
    layer.addAbility(Abilities.ElectricSurge);
    first.enter();
    second.enter();

    const bare = second.checkStat(Stats.Speed, 0);

    layer.enter();
    battle.tick(turns(1));

    expect(second.checkStat(Stats.Speed, 0)).toBeCloseTo(bare * BLESSING_SCALE, 5);
  });

  it('keeps the Tapus in the special band', () => {
    for (const species of [
      Species.TapuKoko,
      Species.TapuLele,
      Species.TapuBulu,
      Species.TapuFini,
    ]) {
      expect(getSpawnRarity(species)).toBe(SpawnRarity.Special);
    }
  });
});
