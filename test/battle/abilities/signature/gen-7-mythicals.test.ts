// Magearna, Marshadow, Zeraora and the Meltan line, with Soul-Heart.

import { describe, expect, it } from 'vitest';
import { UMBRAL_STRIKE_SCALE } from '../../../../src/battle/abilities/signature/alola-mythicals';
import { EffectType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import { SpawnRarity, getSpawnRarity } from '../../../../src/data/biome';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import { getRaidSpecies } from '../../../../src/data/items/raid-items';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

const NONE = { type: EffectType.None } as const;

describe('Soul Relay', () => {
  it('takes on what a fallen teammate had raised, and not what it had lost', () => {
    const { battle, teamA, teamB } = createBattle();
    const heart = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    heart.addAbility(Abilities.SoulRelay);
    for (const unit of [heart, mate, foe]) {
      unit.enter();
    }
    mate.addStage(Stages.Attack, 2, NONE);
    mate.addStage(Stages.Speed, -1, NONE);
    mate.setHealth(1);
    dealDamage(foe, mate, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    expect(mate.alive).toBe(false);
    expect(heart.stages[Stages.Attack]).toBe(2);
    expect(heart.stages[Stages.Speed]).toBe(0);
  });
});

describe('Soul-Heart', () => {
  it('raises Special Attack for every other faint on the field', () => {
    const { battle, teamA, teamB } = createBattle();
    const heart = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    heart.addAbility(Abilities.SoulHeart);
    heart.enter();
    foe.enter();
    foe.setHealth(1);
    dealDamage(heart, foe, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    expect(heart.stages[Stages.SpecialAttack]).toBe(1);
  });
});

describe('Umbral Strike', () => {
  it('hits harder only a target with a raised stat', () => {
    const { battle, teamA, teamB } = createBattle();
    const shade = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    shade.addAbility(Abilities.UmbralStrike);

    const tackle = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical] as const;
    const base = dealDamage(plain, foe, ...tackle);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    expect(dealDamage(shade, foe, ...tackle)).toBe(base);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    foe.addStage(Stages.Speed, 1, NONE);
    expect(dealDamage(shade, foe, ...tackle) / base).toBeCloseTo(UMBRAL_STRIKE_SCALE, 1);
  });
});

describe('Ion Field', () => {
  it("turns its enemies' Normal moves Electric, and not its team's", () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    cat.addAbility(Abilities.IonField);
    for (const unit of [cat, mate, foe]) {
      unit.enter();
    }

    expect(foe.checkMoveType(Moves.Tackle, unitTarget(cat))).toBe(Types.Electric);
    expect(mate.checkMoveType(Moves.Tackle, unitTarget(foe))).toBe(Types.Normal);
  });
});

describe('Metal Eater', () => {
  it('is not hurt by a Steel move', () => {
    const { battle, teamA, teamB } = createBattle();
    const nut = createUnit(battle, teamA, [Types.Steel]);
    const foe = createUnit(battle, teamB);

    nut.addAbility(Abilities.MetalEater);

    expect(foe.checkMoveImmunity(Moves.IronHead, unitTarget(nut), Types.Steel)).toBe(true);
  });
});

describe("Alola's mythicals in the world", () => {
  it('stand in the mythical band and answer their relics', () => {
    for (const species of [
      Species.Magearna,
      Species.MagearnaOriginal,
      Species.Marshadow,
      Species.Zeraora,
      Species.Meltan,
    ]) {
      expect(getSpawnRarity(species)).toBe(SpawnRarity.Mythical);
    }
    expect(getRaidSpecies(Items.AncientPokeBall)).toBe(Species.Magearna);
    expect(getRaidSpecies(Items.HerosCharm)).toBe(Species.Marshadow);
    expect(getRaidSpecies(Items.WindmillCharm)).toBe(Species.Zeraora);
    expect(getRaidSpecies(Items.MysteryBox)).toBe(Species.Meltan);
  });
});
