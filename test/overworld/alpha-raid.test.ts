import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { asCatchSnapshot } from '../../src/auth/catch-snapshot';
import { EffectType } from '../../src/battle/events';
import {
  ALPHA_HEALTH_SCALE,
  ALPHA_STAT_SCALE,
  BOSS_HEALTH_SCALE,
  BOSS_STAT_SCALE,
  PROTECTED_ABILITIES,
} from '../../src/battle/abilities/special';
import type Unit from '../../src/battle/unit';
import registerGameData from '../../src/data';
import { SPECIAL_ABILITIES } from '../../src/data/constants/slots';
import { MAX_IV, STAT_ORDER, Stats, getIV } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { getAbilityData } from '../../src/data/abilities';
import { ALPHA_COPIES, ALPHA_PERFECT_STATS, getAlphaSize } from '../../src/data/overworld/alphas';
import {
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  createRaidBossSnapshot,
  createRaidBossTeam,
} from '../../src/overworld/raid';
import { type RaidBattle, countDefeated, createRaidBattle } from '../../src/overworld/raid-battle';
import deriveEncounter, { EncounterType } from '../../src/overworld/encounter';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import World from '../../src/overworld/world';

beforeAll(() => {
  registerGameData();
  // Starting a fight starts its frame clock, which a test drives by hand
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

interface AlphaRaid extends RaidBattle {
  alpha: Unit;
  player: Unit;
}

const TRAIT = 0x2468ace0;

function alphaRaid(species: Species): AlphaRaid {
  const boss = createRaidBossTeam(species, TRAIT, false, false, false, true);
  const built = createRaidBattle('alpha-seed', [
    { player: '', alliance: BOSS_ALLIANCE, catches: boss },
    {
      player: 'trainer',
      alliance: PLAYER_ALLIANCE,
      catches: [{ ...boss[0], caught: 'mine', abilities: [] }],
    },
  ]);

  built.battle.initialize();
  built.battle.start();

  const alpha = [...(built.units.get(BOSS_ALLIANCE) ?? [])][0];
  const player = [...(built.units.get(PLAYER_ALLIANCE) ?? [])][0];

  return { ...built, alpha, player };
}

/** Everybody on the Alpha's side but the Alpha */
function copiesOf(alpha: Unit): Unit[] {
  return [...alpha.team.units].filter((unit) => unit !== alpha);
}

/** Bring the Alpha down to a share of its HP */
function hitTo(raid: AlphaRaid, share: number): void {
  const hit = { type: EffectType.Move, move: Moves.Tackle, unit: raid.player } as const;
  const target = Math.floor(raid.alpha.checkStat(Stats.HP, 0) * share);

  raid.player.damage(hit, raid.alpha, raid.alpha.health - target, 0);
}

describe('Alpha raids', () => {
  it('stages the Alpha with its copies waiting off the field', () => {
    const { alpha } = alphaRaid(Species.Rattata);

    expect(alpha.hasAbility(Abilities.Boss)).toBe(true);
    expect(alpha.hasAbility(Abilities.Alpha)).toBe(true);
    expect(alpha.team.units.size).toBe(1);
  });

  it('stands an Alpha at its own oversized measurements', () => {
    const [staged] = createRaidBossTeam(Species.Rattata, TRAIT, false, false, false, true);

    expect(staged.height).toBe(getAlphaSize(Species.Rattata).height);
    expect(staged.weight).toBe(getAlphaSize(Species.Rattata).weight);
  });

  it('scales its HP and stats by its own figures, below a boss', () => {
    function fielded(alpha: boolean): Unit {
      const snapshot = createRaidBossSnapshot(Species.Rattata, TRAIT, false, false, false, alpha);
      const { battle, units } = createRaidBattle('scale-seed', [
        { player: '', alliance: BOSS_ALLIANCE, catches: [snapshot] },
      ]);

      battle.initialize();
      battle.start();
      return [...(units.get(BOSS_ALLIANCE) ?? [])][0];
    }

    const boss = fielded(false);
    const alpha = fielded(true);

    expect(ALPHA_HEALTH_SCALE).toBeLessThan(BOSS_HEALTH_SCALE);
    expect(ALPHA_STAT_SCALE).toBeLessThan(BOSS_STAT_SCALE);
    expect(alpha.checkStat(Stats.HP, 0)).toBeCloseTo(
      (boss.checkStat(Stats.HP, 0) / BOSS_HEALTH_SCALE) * ALPHA_HEALTH_SCALE,
    );
    expect(alpha.checkStat(Stats.Attack, 0)).toBeCloseTo(
      (boss.checkStat(Stats.Attack, 0) / BOSS_STAT_SCALE) * ALPHA_STAT_SCALE,
    );
  });

  it('summons six copies at 3/4 HP, plain wild ones of its kind at its level', () => {
    const raid = alphaRaid(Species.Rattata);

    hitTo(raid, 0.74);

    const copies = copiesOf(raid.alpha);

    expect(copies).toHaveLength(ALPHA_COPIES);
    for (const copy of copies) {
      expect(copy.species).toBe(Species.Rattata);
      expect(copy.level).toBe(raid.alpha.level);
      expect(copy.alive).toBe(true);
      expect(copy.caught).toBe('');
      expect(copy.hasAbility(Abilities.Boss)).toBe(false);
      expect(copy.hasAbility(Abilities.Alpha)).toBe(false);
      // Nothing scaled: a copy is far smaller than the Alpha
      expect(copy.checkStat(Stats.HP, 0)).toBeLessThan(raid.alpha.checkStat(Stats.HP, 0) / 50);
    }
    // Each one rolled its own nature and ability rather than the Alpha's
    expect(new Set(copies.map((copy) => copy.nature)).size).toBeGreaterThan(1);
  });

  it('refills to exactly six at 1/2 and 1/4, healing the standing and replacing the fallen', () => {
    const raid = alphaRaid(Species.Rattata);
    const hit = { type: EffectType.Move, move: Moves.Tackle, unit: raid.player } as const;

    hitTo(raid, 0.74);

    const [hurt, fallen, ...rest] = copiesOf(raid.alpha);

    raid.player.damage(hit, hurt, Math.floor(hurt.health / 2), 0);
    raid.player.damage(hit, fallen, fallen.health, 0);
    expect(fallen.alive).toBe(false);

    // A blow that stays above 1/2 summons nobody
    hitTo(raid, 0.6);
    expect(copiesOf(raid.alpha)).toHaveLength(ALPHA_COPIES);
    expect(hurt.health).toBeLessThan(hurt.checkStat(Stats.HP, 0));

    hitTo(raid, 0.49);

    const second = copiesOf(raid.alpha);

    expect(second).toHaveLength(ALPHA_COPIES);
    expect(second).toContain(hurt);
    expect(second).not.toContain(fallen);
    expect(hurt.health).toBe(hurt.checkStat(Stats.HP, 0));
    for (const copy of [...rest, hurt]) {
      expect(second).toContain(copy);
    }
    for (const copy of second) {
      expect(copy.alive).toBe(true);
    }

    // Every copy down, then the last threshold brings back six fresh ones
    for (const copy of second) {
      raid.player.damage(hit, copy, copy.health, 0);
    }
    hitTo(raid, 0.2);

    const third = copiesOf(raid.alpha);

    expect(third).toHaveLength(ALPHA_COPIES);
    for (const copy of third) {
      expect(copy.alive).toBe(true);
      expect(second).not.toContain(copy);
    }

    // Nothing past the last threshold
    hitTo(raid, 0.1);
    expect(copiesOf(raid.alpha)).toEqual(third);
  });

  it('refills once for a blow past two thresholds', () => {
    const raid = alphaRaid(Species.Rattata);
    const summoned: Unit[] = [];

    hitTo(raid, 0.4);
    summoned.push(...copiesOf(raid.alpha));
    expect(summoned).toHaveLength(ALPHA_COPIES);

    // Both 3/4 and 1/2 are spent, so the next refill waits for 1/4
    hitTo(raid, 0.3);
    expect(copiesOf(raid.alpha)).toEqual(summoned);
    hitTo(raid, 0.24);
    expect(copiesOf(raid.alpha)).toHaveLength(ALPHA_COPIES);
  });

  it('sends its copies off when it falls, and the party takes the raid', () => {
    const raid = alphaRaid(Species.Rattata);
    const hit = { type: EffectType.Move, move: Moves.Tackle, unit: raid.player } as const;

    hitTo(raid, 0.5);
    const copies = copiesOf(raid.alpha);

    expect(copies).toHaveLength(ALPHA_COPIES);

    raid.player.damage(hit, raid.alpha, raid.alpha.health, 0);
    expect(raid.alpha.alive).toBe(false);
    expect(copiesOf(raid.alpha)).toEqual([]);

    raid.battle.tick(5000);
    expect(raid.battle.winner?.boss).toBe(false);
    // Only the Alpha counts as beaten, whatever happened to its copies
    expect(countDefeated(raid, 'trainer')).toBe(1);
  });

  it('keeps the copy mark through a stored snapshot', () => {
    const [, copy] = createRaidBossTeam(Species.Rattata, TRAIT, false, false, false, true);
    const read = asCatchSnapshot(JSON.parse(JSON.stringify(copy)));

    expect(read.called).toBe(true);
    expect(read.alphaCopy).toBe(true);
    expect(read.abilities).toHaveLength(1);
  });

  it('is a special mark that nothing can switch off or copy', () => {
    expect(PROTECTED_ABILITIES.has(Abilities.Alpha)).toBe(true);
    expect(SPECIAL_ABILITIES.has(Abilities.Alpha)).toBe(true);
    expect(getAbilityData(Abilities.Alpha).name).toBe('Alpha');

    const raid = alphaRaid(Species.Rattata);

    raid.alpha.disableAbility(Abilities.Alpha);
    expect(raid.alpha.hasAbility(Abilities.Alpha)).toBe(true);
  });

  it('hands over a prize with exactly 3 different stats set to 31 by the Alpha', () => {
    const snapshot = new ChunkSnapshot(new World('alpha-prize').getChunk(0, 0), 0);
    const picks = new Set<string>();

    for (let roll = 0; roll < 40; roll++) {
      // Every value at 0, so nothing but the Alpha's three can reach 31
      const spawn = [Species.Rattata, 0, 0x1234 + roll * 7919] as const;
      const alpha = deriveEncounter(snapshot, [...spawn], undefined, {
        type: EncounterType.AlphaRaid,
      });
      const plain = deriveEncounter(snapshot, [...spawn], undefined, {
        type: EncounterType.MaxRaid,
      });
      const changed: number[] = [];

      for (const stat of STAT_ORDER) {
        if (getIV(alpha.ivs, stat) !== getIV(plain.ivs, stat)) {
          changed.push(stat);
          expect(getIV(alpha.ivs, stat)).toBe(MAX_IV);
        }
      }
      expect(changed).toHaveLength(ALPHA_PERFECT_STATS);
      expect(alpha.ability).toBe(plain.ability);
      picks.add(changed.join(','));
    }
    // Any three, not the same three every time
    expect(picks.size).toBeGreaterThan(5);
  });
});
