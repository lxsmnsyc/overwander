// Wishiwashi through Bounsweet, with Schooling, Water Bubble and Wimp Out.

import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../../../src/core/event-emitter';
import type Battle from '../../../../src/battle/core';
import { BattleEvents, type MoveTarget } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import {
  BUBBLE_WARD_SCALE,
  HEAVY_HOOVES_CAP,
  ORCHID_GUISE_SCALE,
  REGROUP_HEAL_FRACTION,
  TROP_STRIDE_SCALE,
} from '../../../../src/battle/abilities/signature/wishiwashi-to-bounsweet';
import { Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, dealDamage } from './helpers';

/** What the AI asks before it scores a move at all */
function usable(battle: Battle, source: Unit, move: Moves, target: MoveTarget): boolean {
  const event = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target,
    usable: true,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

/** Whether a single-target move at the target would be refused outright */
function immune(source: Unit, target: Unit): boolean {
  return source.checkMoveImmunity(Moves.Tackle, unitTarget(target), Types.Normal);
}

describe('Schooling', () => {
  it('schools from level 20 above 1/4 HP, and scatters below it', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    fish.setSpecies(Species.Wishiwashi);
    fish.setLevel(20);
    fish.setHealth(fish.checkStat(Stats.HP, 0));
    fish.addAbility(Abilities.Schooling);
    fish.enter();
    foe.enter();

    expect(fish.species).toBe(Species.WishiwashiSchool);

    foe.damage(NONE_CAUSE, fish, fish.checkStat(Stats.HP, 0) * 0.8, 0);

    expect(fish.species).toBe(Species.Wishiwashi);

    fish.heal(NONE_CAUSE, fish, fish.checkStat(Stats.HP, 0), 0);

    expect(fish.species).toBe(Species.WishiwashiSchool);
  });

  it('stays alone below level 20', () => {
    const { battle, teamA } = createBattle();
    const fish = createUnit(battle, teamA);

    fish.setSpecies(Species.Wishiwashi);
    fish.setLevel(19);
    fish.setHealth(fish.checkStat(Stats.HP, 0));
    fish.addAbility(Abilities.Schooling);
    fish.enter();

    expect(fish.species).toBe(Species.Wishiwashi);
  });
});

describe('Water Bubble', () => {
  it('halves Fire, refuses a burn and doubles its own Water moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const spider = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    spider.addAbility(Abilities.WaterBubble);

    const fire = [Moves.Ember, 80, Types.Fire, MoveCategories.Special] as const;
    const water = [Moves.WaterGun, 80, Types.Water, MoveCategories.Special] as const;

    expect(dealDamage(foe, spider, ...fire)).toBeLessThan(dealDamage(foe, plain, ...fire) * 0.6);

    spider.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(spider.status[Statuses.Burned]).toBeUndefined();

    const bubbled = dealDamage(spider, foe, ...water);

    foe.setHealth(foe.checkStat(Stats.HP, 0));

    expect(bubbled).toBeGreaterThan(dealDamage(plain, foe, ...water) * 1.8);
  });
});

describe('Wimp Out', () => {
  it('leaves for its strongest teammate when damage takes it under 1/2 HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const switched: [Unit, Unit][] = [];

    battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
      switched.push([event.source, event.target]);
    });

    fish.addAbility(Abilities.WimpOut);
    fish.enter();
    foe.enter();

    // Still above the line, so it stays
    foe.damage(NONE_CAUSE, fish, fish.checkStat(Stats.HP, 0) * 0.3, 0);

    expect(switched).toHaveLength(0);

    foe.damage(NONE_CAUSE, fish, fish.checkStat(Stats.HP, 0) * 0.3, 0);

    expect(switched).toEqual([[fish, mate]]);
  });
});

describe('Regroup', () => {
  it('heals 1/8 of its HP each time it acts while alone', () => {
    const { battle, teamA } = createBattle();
    const fish = createUnit(battle, teamA);
    const max = fish.checkStat(Stats.HP, 0);

    fish.setSpecies(Species.Wishiwashi);
    fish.addAbility(Abilities.Regroup);
    fish.setHealth(max / 2);
    act(battle, fish);

    expect(fish.health).toBeCloseTo(
      max / 2 + fish.checkStat(Stats.HP, 0) * REGROUP_HEAL_FRACTION,
      5,
    );
  });

  it('heals nothing as a school', () => {
    const { battle, teamA } = createBattle();
    const fish = createUnit(battle, teamA);

    fish.setSpecies(Species.WishiwashiSchool);
    fish.addAbility(Abilities.Regroup);
    fish.setHealth(fish.checkStat(Stats.HP, 0) / 2);

    const before = fish.health;

    act(battle, fish);

    expect(fish.health).toBe(before);
  });
});

describe('Heavy Hooves', () => {
  it('reads its own weight into its physical moves, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    const foal = createUnit(battle, teamA);
    const horse = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    foal.setSpecies(Species.Mudbray);
    horse.setSpecies(Species.Mudsdale);
    plain.setSpecies(Species.Mudsdale);
    for (const unit of [foal, horse, plain]) {
      for (const stat of [Stats.Attack, Stats.Defense]) {
        unit.setStat(StatsKind.Base, stat, 100);
      }
    }
    foal.addAbility(Abilities.HeavyHooves);
    horse.addAbility(Abilities.HeavyHooves);

    const blow = [Moves.Tackle, 200, Types.Normal, MoveCategories.Physical] as const;
    const base = dealDamage(plain, foe, ...blow);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    const heavy = dealDamage(horse, foe, ...blow);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    const light = dealDamage(foal, foe, ...blow);

    expect(heavy / base).toBeCloseTo(HEAVY_HOOVES_CAP, 1);
    expect(light).toBeGreaterThan(base);
    expect(light).toBeLessThan(heavy);

    // Special moves are left alone
    foe.setHealth(foe.checkStat(Stats.HP, 0));
    const beam = [Moves.Swift, 200, Types.Normal, MoveCategories.Special] as const;
    const special = dealDamage(horse, foe, ...beam);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    expect(special).toBe(dealDamage(plain, foe, ...beam));
  });
});

describe('Bubble Ward', () => {
  it('shields its teammates from Fire and burns, but not itself or the enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const spider = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    spider.addAbility(Abilities.BubbleWard);

    const fire = [Moves.Ember, 80, Types.Fire, MoveCategories.Special] as const;
    const covered = dealDamage(foe, mate, ...fire);
    const bare = dealDamage(mate, other, ...fire);

    expect(covered / bare).toBeCloseTo(BUBBLE_WARD_SCALE, 1);

    mate.addStatus(Statuses.Burned, NONE_CAUSE);
    spider.addStatus(Statuses.Burned, NONE_CAUSE);
    other.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(mate.status[Statuses.Burned]).toBeUndefined();
    expect(spider.status[Statuses.Burned]).toBeDefined();
    expect(other.status[Statuses.Burned]).toBeDefined();
  });

  it('lets the guard go with the holder', () => {
    const { battle, teamA, teamB } = createBattle();
    const spider = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    const foe = createUnit(battle, teamB);

    spider.addAbility(Abilities.BubbleWard);
    foe.damage(NONE_CAUSE, spider, spider.checkStat(Stats.HP, 0), 0);

    expect(spider.alive).toBe(false);
    mate.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(mate.status[Statuses.Burned]).toBeDefined();
  });
});

describe('Orchid Guise', () => {
  it('cannot be aimed at until its first attack lands, which hits 1.3x', () => {
    const { battle, teamA, teamB } = createBattle();
    const mantis = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mantis.enter();
    plain.enter();
    foe.enter();

    // Plainly in reach before it takes the guise up
    expect(immune(foe, mantis)).toBe(false);

    mantis.addAbility(Abilities.OrchidGuise);

    expect(immune(foe, mantis)).toBe(true);
    expect(usable(battle, foe, Moves.Tackle, unitTarget(mantis))).toBe(false);

    const blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical] as const;
    const base = dealDamage(plain, foe, ...blow);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    const first = dealDamage(mantis, foe, ...blow);

    expect(first / base).toBeCloseTo(ORCHID_GUISE_SCALE, 1);
    expect(immune(foe, mantis)).toBe(false);

    // Every attack after it is an ordinary one
    foe.setHealth(foe.checkStat(Stats.HP, 0));
    expect(dealDamage(mantis, foe, ...blow)).toBe(base);
  });
});

describe('Trop Stride', () => {
  it('powers up its kicks and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const queen = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    const kick = queen.checkMovePower(Moves.TropKick, at) ?? 0;
    const tackle = queen.checkMovePower(Moves.Tackle, at);

    queen.addAbility(Abilities.TropStride);

    expect(queen.checkMovePower(Moves.TropKick, at)).toBeCloseTo(kick * TROP_STRIDE_SCALE, 5);
    expect(queen.checkMovePower(Moves.Tackle, at)).toBe(tackle);
  });
});
