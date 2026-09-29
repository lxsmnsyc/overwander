// The first Alolan forms, with Surge Surfer, Tangling Hair and Ripen.

import { describe, expect, it } from 'vitest';
import { AttackPriority } from '../../../../src/core/event-emitter';
import { BattleEvents, MoveTargetType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import { unitTarget } from '../../../../src/battle/utils';
import { FROSTFORGED_SCALE } from '../../../../src/battle/abilities/signature/alolan-rattata-to-meowth';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Terrains, Weathers } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical];
const SWIFT: Blow = [Moves.Swift, 80, Types.Normal, MoveCategories.Special];
const EMBER: Blow = [Moves.Ember, 80, Types.Fire, MoveCategories.Special];
const KARATE_CHOP: Blow = [Moves.KarateChop, 80, Types.Fighting, MoveCategories.Physical];

/** Every move a unit is seen casting, as move and target */
function watchCasts(battle: ReturnType<typeof createBattle>['battle']): [Moves, unknown][] {
  const casts: [Moves, unknown][] = [];

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    casts.push([event.move, event.target]);
  });
  return casts;
}

describe('Surge Surfer', () => {
  it('doubles its Speed on Electric Terrain', () => {
    const { battle, teamA } = createBattle();
    const mouse = createUnit(battle, teamA);

    mouse.addAbility(Abilities.SurgeSurfer);

    const speed = mouse.checkStat(Stats.Speed, 0);

    mouse.setTerrain(Terrains.Electric, turns(5));

    expect(mouse.checkStat(Stats.Speed, 0)).toBe(speed * 2);
  });
});

describe('Tangling Hair', () => {
  it('slows whoever lands a contact move on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const mole = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mole.addAbility(Abilities.TanglingHair);

    dealDamage(foe, mole, ...SWIFT);

    expect(foe.stages[Stages.Speed]).toBe(0);

    dealDamage(foe, mole, ...TACKLE);

    expect(foe.stages[Stages.Speed]).toBe(-1);
  });
});

describe('Ripen', () => {
  it('doubles what its own berries give back', () => {
    const { battle, teamA } = createBattle();
    const rat = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);

    rat.addAbility(Abilities.Ripen);
    for (const unit of [rat, plain]) {
      unit.addItem(Items.OranBerry);
      unit.setHealth(50);
    }

    expect(plain.health - 50).toBe(10);
    expect(rat.health - 50).toBe(20);
  });

  it('doubles the stages its own berries raise', () => {
    const { battle, teamA } = createBattle();
    const rat = createUnit(battle, teamA);

    rat.addAbility(Abilities.Ripen);
    rat.addItem(Items.LiechiBerry);
    rat.setHealth(rat.checkStat(Stats.HP, 0) / 4);

    expect(rat.stages[Stages.Attack]).toBe(2);
  });
});

describe('Rich Diet', () => {
  it('raises its Attack a stage for each berry it eats', () => {
    const { battle, teamA } = createBattle();
    const rat = createUnit(battle, teamA);

    rat.addAbility(Abilities.RichDiet);
    rat.addItem(Items.OranBerry);
    rat.setHealth(50);

    expect(rat.items[Items.OranBerry]).toBeUndefined();
    expect(rat.stages[Stages.Attack]).toBe(1);
  });
});

describe('Frostforged', () => {
  it('softens Fire and Fighting moves and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const mouse = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mouse.addAbility(Abilities.Frostforged);

    for (const [blow, scale] of [
      [EMBER, FROSTFORGED_SCALE],
      [KARATE_CHOP, FROSTFORGED_SCALE],
      [TACKLE, 1],
    ] as [Blow, number][]) {
      mouse.setHealth(mouse.checkStat(Stats.HP, 0));
      plain.setHealth(plain.checkStat(Stats.HP, 0));
      expect(dealDamage(foe, mouse, ...blow) / dealDamage(foe, plain, ...blow)).toBeCloseTo(
        scale,
        1,
      );
    }
  });
});

describe('Aurora Crown', () => {
  it('casts Aurora Veil as it arrives, but only under hail or snow', () => {
    const { battle, teamA } = createBattle();
    const fox = createUnit(battle, teamA);
    const casts = watchCasts(battle);

    fox.addAbility(Abilities.AuroraCrown);
    fox.enter();

    expect(casts).toEqual([]);

    fox.leave();
    battle.setWeather(Weathers.Snow);
    fox.enter();

    expect(casts).toEqual([[Moves.AuroraVeil, { type: MoveTargetType.Team, team: teamA }]]);
  });
});

describe('Wire Snare', () => {
  it('binds the first to touch it after each entrance', () => {
    const { battle, teamA, teamB } = createBattle();
    const mole = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const casts = watchCasts(battle);

    pinRandom(battle, 1);
    mole.addAbility(Abilities.WireSnare);
    mole.enter();
    foe.enter();

    dealDamage(foe, mole, ...SWIFT);
    dealDamage(foe, mole, ...TACKLE);
    dealDamage(foe, mole, ...TACKLE);

    expect(casts).toEqual([[Moves.Bind, unitTarget(foe)]]);

    mole.leave();
    mole.enter();
    dealDamage(foe, mole, ...TACKLE);

    expect(casts).toHaveLength(2);
  });
});

describe('Taunting Gaze', () => {
  it('casts Taunt at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const casts = watchCasts(battle);

    foe.enter();
    cat.addAbility(Abilities.TauntingGaze);
    cat.enter();

    expect(casts).toEqual([[Moves.Taunt, unitTarget(foe)]]);
  });
});
