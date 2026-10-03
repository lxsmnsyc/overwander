// Type: Null through Jangmo-o, with RKS System and Dazzling.

import { describe, expect, it } from 'vitest';
import { unitTarget } from '../../../../src/battle/utils';
import {
  GHOST_SHIP_SCALE,
  MEMORY_ECHO_SCALE,
  WAR_CLANGOR_CAP,
} from '../../../../src/battle/abilities/signature/type-null-to-jangmo-o';
import { SpawnRarity, getSpawnRarity } from '../../../../src/data/biome';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import { Statuses, Weathers } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical];
const EMBER: Blow = [Moves.Ember, 80, Types.Fire, MoveCategories.Special];
const BITE: Blow = [Moves.Bite, 60, Types.Dark, MoveCategories.Physical];
const HYPER_VOICE: Blow = [Moves.HyperVoice, 90, Types.Normal, MoveCategories.Special];

describe('RKS System', () => {
  it('takes the type of the Memory it holds, and only with the ability', () => {
    const { battle, teamA } = createBattle();
    const beast = createUnit(battle, teamA);
    const filler = createUnit(battle, teamA);

    for (const unit of [beast, filler]) {
      unit.setSpecies(Species.Silvally);
      unit.addItem(Items.FireMemory);
    }
    beast.addAbility(Abilities.RksSystem);
    filler.addAbility(Abilities.Adaptability);
    beast.enter();
    filler.enter();

    expect(beast.species).toBe(Species.SilvallyFire);
    expect(beast.types.has(Types.Fire)).toBe(true);
    expect(filler.species).toBe(Species.Silvally);
  });

  it('keeps the line out of the ordinary bands', () => {
    expect(getSpawnRarity(Species.TypeNull)).toBe(SpawnRarity.Prized);
    expect(getSpawnRarity(Species.Silvally)).toBe(SpawnRarity.Special);
  });
});

describe('Memory Echo', () => {
  it('hits harder only where the blow is super effective', () => {
    const { battle, teamA, teamB } = createBattle();
    const beast = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const grass = createUnit(battle, teamB, [Types.Grass]);
    const water = createUnit(battle, teamB, [Types.Water]);

    pinRandom(battle, 1);
    beast.addAbility(Abilities.MemoryEcho);

    const base = dealDamage(plain, grass, ...EMBER);

    grass.setHealth(grass.checkStat(Stats.HP, 0));
    expect(dealDamage(beast, grass, ...EMBER) / base).toBeCloseTo(MEMORY_ECHO_SCALE, 1);

    const resisted = dealDamage(plain, water, ...EMBER);

    water.setHealth(water.checkStat(Stats.HP, 0));
    expect(dealDamage(beast, water, ...EMBER)).toBe(resisted);
  });
});

describe('Psychic Gnash', () => {
  it('confuses with its bites when the roll comes up', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    fish.addAbility(Abilities.PsychicGnash);
    pinRandom(battle, 0);

    dealDamage(fish, foe, ...TACKLE);

    expect(foe.status[Statuses.Confused]).toBeUndefined();

    dealDamage(fish, foe, ...BITE);

    expect(foe.status[Statuses.Confused]).toBeDefined();
  });
});

describe('Ghost Ship', () => {
  it('powers up its Ghost and Grass moves in the rain', () => {
    const { battle, teamA, teamB } = createBattle();
    const anchor = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    anchor.addAbility(Abilities.GhostShip);

    const ghost = anchor.checkMovePower(Moves.ShadowBall, at) ?? 0;
    const tackle = anchor.checkMovePower(Moves.Tackle, at);

    battle.setWeather(Weathers.Rain);

    expect(anchor.checkMovePower(Moves.ShadowBall, at)).toBeCloseTo(ghost * GHOST_SHIP_SCALE, 5);
    expect(anchor.checkMovePower(Moves.Tackle, at)).toBe(tackle);
  });
});

describe('War Clangor', () => {
  it('raises its Defense for each sound move it lands, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    const scale = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    scale.addAbility(Abilities.WarClangor);

    dealDamage(scale, foe, ...TACKLE);

    expect(scale.stages[Stages.Defense]).toBe(0);

    for (let times = 0; times < WAR_CLANGOR_CAP + 2; times++) {
      foe.setHealth(foe.checkStat(Stats.HP, 0));
      dealDamage(scale, foe, ...HYPER_VOICE);
    }

    expect(scale.stages[Stages.Defense]).toBe(WAR_CLANGOR_CAP);
  });
});

describe('Dazzling', () => {
  it('turns away an enemy move that cuts the queue', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    fish.addAbility(Abilities.Dazzling);

    expect(foe.checkMoveImmunity(Moves.QuickAttack, unitTarget(fish), Types.Normal)).toBe(true);
    expect(foe.checkMoveImmunity(Moves.Tackle, unitTarget(fish), Types.Normal)).toBe(false);
  });
});
